from PIL import Image, ImageDraw

ACCENT = (37, 99, 235, 255)  # #2563eb
MARK = (255, 255, 255, 255)
HIGHLIGHT = (255, 229, 100, 255)  # #ffe564

SIZES = [16, 32, 48, 128]


def make_icon(size: int) -> Image.Image:
    scale = 4
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    radius = int(canvas_size * 0.22)
    draw.rounded_rectangle(
        [0, 0, canvas_size - 1, canvas_size - 1],
        radius=radius,
        fill=ACCENT,
    )

    center = canvas_size / 2
    half = canvas_size * 0.24
    diamond = [
        (center, center - half),
        (center + half, center),
        (center, center + half),
        (center - half, center),
    ]
    draw.polygon(diamond, fill=MARK)

    dot_radius = canvas_size * 0.09
    dot_center = (center + half * 0.85, center + half * 0.85)
    draw.ellipse(
        [
            dot_center[0] - dot_radius,
            dot_center[1] - dot_radius,
            dot_center[0] + dot_radius,
            dot_center[1] + dot_radius,
        ],
        fill=HIGHLIGHT,
    )

    return image.resize((size, size), Image.LANCZOS)


if __name__ == "__main__":
    import os

    out_dir = os.path.join(os.path.dirname(__file__), "..", "public", "icons")
    os.makedirs(out_dir, exist_ok=True)

    for size in SIZES:
        icon = make_icon(size)
        path = os.path.join(out_dir, f"icon{size}.png")
        icon.save(path)
        print(f"wrote {path}")
