#!/usr/bin/env python3
"""Generate PDFCraft app icon - a modern PDF document with craft/book motif."""

from PIL import Image, ImageDraw, ImageFont
import math
import os

SIZE = 1024
OUTPUT = os.path.join(os.path.dirname(__file__), '..', 'src-tauri', 'icons', 'icon.png')


def draw_rounded_rect(draw, xy, radius, fill=None, outline=None, width=1):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    r = radius
    # Corners
    draw.pieslice([x0, y0, x0 + 2*r, y0 + 2*r], 180, 270, fill=fill, outline=outline, width=width)
    draw.pieslice([x1 - 2*r, y0, x1, y0 + 2*r], 270, 360, fill=fill, outline=outline, width=width)
    draw.pieslice([x0, y1 - 2*r, x0 + 2*r, y1], 90, 180, fill=fill, outline=outline, width=width)
    draw.pieslice([x1 - 2*r, y1 - 2*r, x1, y1], 0, 90, fill=fill, outline=outline, width=width)
    # Rectangles to fill
    draw.rectangle([x0 + r, y0, x1 - r, y1], fill=fill)
    draw.rectangle([x0, y0 + r, x0 + r, y1 - r], fill=fill)
    draw.rectangle([x1 - r, y0 + r, x1, y1 - r], fill=fill)


def create_icon():
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # === Background: rounded square with gradient-like effect ===
    # Main background - deep blue
    bg_color = (30, 64, 175)  # Blue-700
    draw_rounded_rect(draw, (0, 0, SIZE, SIZE), 180, fill=bg_color)

    # Subtle gradient overlay (lighter at top)
    for i in range(SIZE // 3):
        alpha = int(40 * (1 - i / (SIZE // 3)))
        draw.rectangle([0, i, SIZE, i + 1], fill=(255, 255, 255, alpha))

    # === Document shape (white page with folded corner) ===
    page_left = 200
    page_top = 120
    page_right = 760
    page_bottom = 860
    fold_size = 100

    # Page body
    page_points = [
        (page_left, page_top),
        (page_right - fold_size, page_top),
        (page_right, page_top + fold_size),
        (page_right, page_bottom),
        (page_left, page_bottom),
    ]
    draw.polygon(page_points, fill=(255, 255, 255, 240))

    # Folded corner
    fold_points = [
        (page_right - fold_size, page_top),
        (page_right - fold_size, page_top + fold_size),
        (page_right, page_top + fold_size),
    ]
    draw.polygon(fold_points, fill=(200, 210, 230, 200))

    # Fold edge line
    draw.line(
        [(page_right - fold_size, page_top), (page_right - fold_size, page_top + fold_size),
         (page_right, page_top + fold_size)],
        fill=(150, 170, 200, 180), width=3
    )

    # === PDF text lines (simulated content) ===
    line_color = (180, 190, 210, 200)
    line_y_start = 300
    line_gap = 50
    for i in range(8):
        y = line_y_start + i * line_gap
        # Vary line widths to look like text
        widths = [0.85, 0.70, 0.90, 0.60, 0.80, 0.75, 0.55, 0.65]
        line_w = int((page_right - page_left - 100) * widths[i])
        draw.rounded_rectangle(
            [page_left + 50, y, page_left + 50 + line_w, y + 18],
            radius=9,
            fill=line_color
        )

    # === "PDF" badge at top-left of page ===
    badge_x = page_left - 20
    badge_y = page_top + 30
    badge_w = 160
    badge_h = 65
    # Red badge
    draw_rounded_rect(draw, (badge_x, badge_y, badge_x + badge_w, badge_y + badge_h), 14,
                      fill=(220, 38, 38))

    # PDF text on badge
    try:
        font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 40)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype("/System/Library/Fonts/SFNSMono.ttf", 40)
        except (OSError, IOError):
            font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), "PDF", font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = badge_x + (badge_w - tw) // 2
    ty = badge_y + (badge_h - th) // 2 - 4
    draw.text((tx, ty), "PDF", fill=(255, 255, 255), font=font)

    # === Arrow / conversion symbol ===
    # Right-pointing arrow in the lower-right area
    arrow_cx = 680
    arrow_cy = 750
    arrow_color = (34, 197, 94)  # Green-500

    # Arrow body
    draw.rounded_rectangle(
        [arrow_cx - 80, arrow_cy - 15, arrow_cx + 30, arrow_cy + 15],
        radius=8,
        fill=arrow_color
    )
    # Arrow head
    arrow_head = [
        (arrow_cx + 25, arrow_cy - 40),
        (arrow_cx + 80, arrow_cy),
        (arrow_cx + 25, arrow_cy + 40),
    ]
    draw.polygon(arrow_head, fill=arrow_color)

    # === Book icon (small, bottom-right corner) ===
    bx = 750
    by = 700
    book_color = (251, 191, 36)  # Amber-400

    # Book spine
    draw.rounded_rectangle([bx, by, bx + 70, by + 95], radius=8, fill=book_color)
    # Book pages (slightly offset)
    draw.rounded_rectangle([bx + 8, by + 5, bx + 65, by + 90], radius=5,
                           fill=(255, 255, 255, 200))
    # Spine line
    draw.line([(bx + 20, by + 10), (bx + 20, by + 85)], fill=book_color, width=4)

    # === Save ===
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    img.save(OUTPUT, 'PNG')
    print(f"Icon saved to {OUTPUT} ({SIZE}x{SIZE})")
    return OUTPUT


if __name__ == '__main__':
    create_icon()
