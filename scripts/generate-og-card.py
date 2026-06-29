#!/usr/bin/env python3
"""Generate the homepage Open Graph / Twitter social-preview card.

WHY THIS EXISTS
  The homepage og:image / twitter:image pointed at the 185x185 portrait
  (YujiaMaxLiu_Web.jpg) -- below Facebook's 200x200 floor and a non-16:9
  square, so link previews rendered no image or a broken square. This script
  composes a proper 1200x630 card from EXISTING brand assets only:
    - the author's portrait (images/YujiaMaxLiu_Web.jpg) as a circular avatar,
    - the author's logo (images/logo.png) as a brand mark,
    - factual text (name + role) that already appear as the page <title>.
  No new/expressive brand content is authored here; it is layout of existing
  brand elements, consistent with the iter-20 favicon / apple-touch-icon
  generation precedent. The owner may replace images/og-card.png with a
  designed card at any time.

  Re-run after editing any source asset or the copy below; output is
  deterministic (no timestamps / randomness) so it is byte-stable across runs.
"""
import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "images", "og-card.png")

# --- design tokens (mirror style.css :root) -------------------------------
BG = (15, 17, 26)        # --bg #0f111a
BG_HL = (35, 42, 68)     # radial highlight #232a44
TEXT = (239, 242, 255)   # --text #eff2ff
MUTED = (181, 190, 223)  # --muted #b5bedf
ACCENT = (120, 168, 255)  # --accent #78a8ff
ACCENT2 = (162, 139, 255)  # --accent-2 #a28bff

W, H = 1200, 630

FONT_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
FONT_REG = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"


def lerp(a, b, t):
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def radial_bg():
    """Site's `radial-gradient(circle at top right, #232a44 0%, bg 45%)`,
    rendered small then LANCZOS-upscaled (no numpy)."""
    sw, sh = 160, 84
    cx, cy = sw, 0  # top-right corner
    max_d = (sw * sw + sh * sh) ** 0.5
    stop = 0.45 * max_d  # reaches --bg at 45% of farthest-corner
    small = Image.new("RGB", (sw, sh))
    px = small.load()
    for y in range(sh):
        for x in range(sw):
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            t = min(d / stop, 1.0)
            px[x, y] = lerp(BG_HL, BG, t)
    return small.resize((W, H), Image.LANCZOS)


def gradient_rule(draw, xy, w, h):
    """Horizontal accent->accent2 rule."""
    for i in range(w):
        c = lerp(ACCENT, ACCENT2, i / max(w - 1, 1))
        draw.line([(xy[0] + i, xy[1]), (xy[0] + i, xy[1] + h - 1)], fill=c)


def circle_avatar(portrait, size):
    im = Image.open(portrait).convert("RGBA").resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse([0, 0, size - 1, size - 1], fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(im, (0, 0), mask)
    return out


def main():
    canvas = radial_bg().convert("RGBA")
    draw = ImageDraw.Draw(canvas)

    # --- circular portrait avatar with accent ring ------------------------
    avatar_size = 200
    ax, ay = 110, (H - avatar_size) // 2  # vertically centered, left
    ring_pad = 8
        # accent ring
    draw.ellipse(
        [ax - ring_pad, ay - ring_pad,
         ax + avatar_size + ring_pad, ay + avatar_size + ring_pad],
        outline=ACCENT, width=4,
    )
    avatar = circle_avatar(os.path.join(ROOT, "images", "YujiaMaxLiu_Web.jpg"), avatar_size)
    canvas.paste(avatar, (ax, ay), avatar)

    # --- text block -------------------------------------------------------
    tx = ax + avatar_size + 70
    f_name = ImageFont.truetype(FONT_BOLD, 82)
    f_role = ImageFont.truetype(FONT_REG, 40)
    f_tail = ImageFont.truetype(FONT_BOLD, 40)
    f_url = ImageFont.truetype(FONT_REG, 30)

    name = "Yujia Max Liu"
    draw.text((tx, 180), name, font=f_name, fill=TEXT)
    # measure name width to size the rule
    nw = draw.textlength(name, font=f_name)
    gradient_rule(draw, (tx, 180 + 100), int(min(nw, 220)), 6)

    draw.text((tx, 300), "Senior Technical Artist", font=f_role, fill=MUTED)
    draw.text((tx, 352), "3D Technical Art Portfolio", font=f_tail, fill=ACCENT)

    # --- logo brand mark, top-right ---------------------------------------
    logo = Image.open(os.path.join(ROOT, "images", "logo.png")).convert("RGBA")
    lw = 220
    lh = max(1, int(logo.height * (lw / logo.width)))
    logo = logo.resize((lw, lh), Image.LANCZOS)
    lx = W - lw - 90
    ly = 96
    canvas.paste(logo, (lx, ly), logo)

    # --- url footer -------------------------------------------------------
    url = "maxlyj.com"
    uw = draw.textlength(url, font=f_url)
    draw.text((W - uw - 90, H - 60), url, font=f_url, fill=MUTED)

    canvas.convert("RGB").save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT} ({os.path.getsize(OUT)} bytes, {canvas.size})")


if __name__ == "__main__":
    main()
