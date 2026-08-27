"""为九套外观生成统一的 TabBar 图标。

图形含义保持一致：取穴页使用穴位定位标记，设置页使用调节滑杆；
每套外观只改变线条、点睛色与选中态，避免原先只有灰色圆点、难以辨认。
"""

from pathlib import Path

from PIL import Image, ImageDraw


OUTPUT_DIR = Path(__file__).resolve().parents[1] / "src" / "static" / "tabbar"
SCALE = 4
SIZE = 48

PALETTES = {
    "yellow": {"normal": "#9A8F7D", "active": "#8B4513", "soft": "#E7D8C4", "accent": "#C28B52"},
    "black": {"normal": "#9299A3", "active": "#168BFF", "soft": "#18324A", "accent": "#67C7FF"},
    "green": {"normal": "#78908A", "active": "#2F7D73", "soft": "#CFE8DF", "accent": "#789262"},
    "red": {"normal": "#9B8179", "active": "#B83A2E", "soft": "#F1D1C6", "accent": "#C8893D"},
    "modern": {"normal": "#8D94AA", "active": "#4F46E5", "soft": "#DCDDF8", "accent": "#7C74F0"},
    "ink": {"normal": "#777D79", "active": "#20272A", "soft": "#D8DBD7", "accent": "#9B3328"},
    "morandi": {"normal": "#8F8880", "active": "#A98282", "soft": "#E9E0D3", "accent": "#8E9F93"},
    "watercolor": {"normal": "#8195AD", "active": "#4A6FA5", "soft": "#D8E4F0", "accent": "#E8A87C"},
    "animal": {"normal": "#8A7B66", "active": "#19AFA2", "soft": "#DDF3E8", "accent": "#F7CD67"},
    "pixel": {"normal": "#6B5B53", "active": "#5B6EE1", "soft": "#F7E7B7", "accent": "#E76E55"},
}


def p(value):
    return int(value * SCALE)


def new_canvas():
    return Image.new("RGBA", (SIZE * SCALE, SIZE * SCALE), (0, 0, 0, 0))


def finish(image):
    return image.resize((SIZE, SIZE), Image.Resampling.LANCZOS)


def draw_point_icon(colors, active):
    image = new_canvas()
    draw = ImageDraw.Draw(image)
    color = colors["active"] if active else colors["normal"]
    width = p(3)

    if active:
        draw.ellipse((p(10), p(7), p(38), p(35)), fill=colors["soft"])

    # 穴位定位标记：圆润外轮廓 + 中心穴点 + 下方落点。
    draw.ellipse((p(13), p(7), p(35), p(29)), outline=color, width=width)
    draw.ellipse((p(20), p(14), p(28), p(22)), fill=color)
    draw.line([(p(17), p(26)), (p(24), p(39)), (p(31), p(26))], fill=color, width=width, joint="curve")

    if active:
        draw.ellipse((p(33), p(9), p(39), p(15)), fill=colors["accent"])

    return finish(image)


def draw_settings_icon(colors, active):
    image = new_canvas()
    draw = ImageDraw.Draw(image)
    color = colors["active"] if active else colors["normal"]
    width = p(3)

    if active:
        draw.rounded_rectangle((p(7), p(8), p(41), p(40)), radius=p(10), fill=colors["soft"])

    knob_positions = (18, 30, 15)
    for y, knob_x in zip((15, 24, 33), knob_positions):
        draw.line([(p(10), p(y)), (p(38), p(y))], fill=color, width=width)
        draw.ellipse((p(knob_x - 4), p(y - 4), p(knob_x + 4), p(y + 4)), fill="#FFFFFF", outline=color, width=p(2))

    if active:
        draw.ellipse((p(34), p(7), p(40), p(13)), fill=colors["accent"])

    return finish(image)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for theme_id, colors in PALETTES.items():
        draw_point_icon(colors, False).save(OUTPUT_DIR / f"home-{theme_id}.png")
        draw_point_icon(colors, True).save(OUTPUT_DIR / f"home-{theme_id}-active.png")
        draw_settings_icon(colors, False).save(OUTPUT_DIR / f"setting-{theme_id}.png")
        draw_settings_icon(colors, True).save(OUTPUT_DIR / f"setting-{theme_id}-active.png")


if __name__ == "__main__":
    main()
