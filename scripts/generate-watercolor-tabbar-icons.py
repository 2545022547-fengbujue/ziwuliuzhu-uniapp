from pathlib import Path

from PIL import Image, ImageDraw


OUTPUT_DIR = Path(__file__).resolve().parents[1] / "src" / "static" / "tabbar"
SCALE = 4
SIZE = 48


def scaled(points):
    return [(int(x * SCALE), int(y * SCALE)) for x, y in points]


def draw_home(active):
    image = Image.new("RGBA", (SIZE * SCALE, SIZE * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    line = "#4A6FA5" if active else "#8A9DB3"
    fill = (133, 205, 202, 42) if active else (0, 0, 0, 0)
    width = 3 * SCALE

    draw.polygon(scaled([(10, 23), (24, 10), (38, 23), (35, 23), (35, 39), (13, 39), (13, 23)]), fill=fill)
    draw.line(scaled([(9, 23), (24, 9), (39, 23)]), fill=line, width=width, joint="curve")
    draw.line(scaled([(13, 22), (13, 39), (35, 39), (35, 22)]), fill=line, width=width, joint="curve")
    draw.line(scaled([(21, 39), (21, 29), (27, 29), (27, 39)]), fill=line, width=width, joint="curve")

    if active:
        draw.ellipse((31 * SCALE, 10 * SCALE, 37 * SCALE, 16 * SCALE), fill="#E8A87C")

    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def draw_settings(active):
    image = Image.new("RGBA", (SIZE * SCALE, SIZE * SCALE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    line = "#4A6FA5" if active else "#8A9DB3"
    knob = "#85CDCA" if active else "#8A9DB3"
    width = 3 * SCALE

    for y in (15, 24, 33):
        draw.line(scaled([(10, y), (38, y)]), fill=line, width=width)

    knob_x = (19, 30, 16)
    for x, y in zip(knob_x, (15, 24, 33)):
        radius = 4 * SCALE
        center_x = x * SCALE
        center_y = y * SCALE
        draw.ellipse(
            (center_x - radius, center_y - radius, center_x + radius, center_y + radius),
            fill="#FAF8F5",
            outline=knob,
            width=2 * SCALE,
        )

    if active:
        draw.ellipse((34 * SCALE, 7 * SCALE, 39 * SCALE, 12 * SCALE), fill="#C38D94")

    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    draw_home(False).save(OUTPUT_DIR / "home-watercolor.png")
    draw_home(True).save(OUTPUT_DIR / "home-watercolor-active.png")
    draw_settings(False).save(OUTPUT_DIR / "setting-watercolor.png")
    draw_settings(True).save(OUTPUT_DIR / "setting-watercolor-active.png")


if __name__ == "__main__":
    main()
