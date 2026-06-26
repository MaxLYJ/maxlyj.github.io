#!/usr/bin/env bash
# Provision Cloudflare R2 image-storage folders per IMAGE_STORAGE_PLAN.md.
# Creates zero-byte .keep objects so each "folder" (key prefix) exists.
#
# Usage (wrangler, default)  [recommended]:
#   npx wrangler login                   # one-time OAuth, opens browser
#   R2_BUCKET=portfolio-images bash scripts/provision-r2-folders.sh
#
#   Alt (non-interactive): a GENERAL Account API token from Account -> API Tokens
#   (NOT R2 -> Manage R2 API Tokens, which are S3-style): 
#   export CLOUDFLARE_API_TOKEN=... CLOUDFLARE_ACCOUNT_ID=...
#
# Usage (R2 S3 API):
#   export AWS_ACCESS_KEY_ID=...
#   export AWS_SECRET_ACCESS_KEY=...
#   R2_BUCKET=<bucket-name> \
#     R2_S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com \
#     MODE=s3 bash scripts/provision-r2-folders.sh
#
# Requires: node (reads slugs from data/taxonomy.json; always present alongside
# wrangler), wrangler (auto-installed via npx) for default mode, or aws CLI for MODE=s3.

set -euo pipefail

BUCKET="${R2_BUCKET:?R2_BUCKET is required (run 'npx wrangler r2 bucket list' to list buckets)}"
MODE="${MODE:-wrangler}"

# Resolve repo root from this script's location (scripts/ -> parent),
# so the script works regardless of the current working directory.
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
TAXONOMY="${REPO_ROOT}/data/taxonomy.json"

# Project slugs — the single source of truth is data/taxonomy.json
# (projects[].slug). Read them at runtime so this script never drifts when
# projects are added or removed.
if [ ! -f "$TAXONOMY" ]; then
  echo "ERROR: taxonomy not found at ${TAXONOMY}" >&2
  exit 1
fi
mapfile -t SLUGS < <(node -e '
  const fs = require("fs");
  const data = JSON.parse(fs.readFileSync(process.argv[1], "utf8"));
  const slugs = (Array.isArray(data.projects) ? data.projects : [])
    .map((p) => p && p.slug)
    .filter((s) => typeof s === "string" && s.length);
  if (!slugs.length) { console.error("No project slugs found in taxonomy."); process.exit(1); }
  process.stdout.write(slugs.join("\n") + "\n");
' "$TAXONOMY")
if [ "${#SLUGS[@]}" -eq 0 ]; then
  echo "ERROR: failed to read slugs from ${TAXONOMY}" >&2
  exit 1
fi

# Folder prefixes to materialize (each becomes a .keep object).
# shared/ folders are structural constants (see IMAGE_STORAGE_PLAN.md §3);
# the project/ tree is derived 1:1 from the slugs above.
PREFIXES=( "shared/brand/" "shared/ui/" )
for slug in "${SLUGS[@]}"; do
  PREFIXES+=(
    "projects/${slug}/"
    "projects/${slug}/featured/"
    "projects/${slug}/blocks/"
  )
done

put_wrangler() {
  local key="$1"
  printf '' | npx --yes wrangler@latest r2 object put "${BUCKET}/${key}.keep" --pipe --remote >/dev/null
}

put_s3() {
  local key="$1"
  aws s3api put-object \
    --bucket "$BUCKET" \
    --endpoint-url "${R2_S3_ENDPOINT:?R2_S3_ENDPOINT is required for MODE=s3}" \
    --key "${key}.keep" >/dev/null
}

put() {
  case "$MODE" in
    s3) put_s3 "$1" ;;
    *)  put_wrangler "$1" ;;
  esac
}

echo "Provisioning ${#PREFIXES[@]} folder placeholders in bucket '${BUCKET}' via ${MODE}..."
for p in "${PREFIXES[@]}"; do
  put "$p"
  echo "  ✓ ${p}.keep"
done
echo "Done."
echo "Verify:  npx wrangler r2 object get '${BUCKET}/projects/<slug>/.keep' --remote --pipe >/dev/null && echo ok"
