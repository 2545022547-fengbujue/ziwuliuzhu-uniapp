"""生成日期、时辰弹窗专用的水墨背景。

页面竖屏背景为了留白，把山水主体放得很低；直接复用到较矮的弹窗中，
只会露出最底下一小条。这里从原图下半部提取山水，重新排成“上方宣纸、
中下部山水”的比例，让弹窗无需变形拉伸也能清楚看到当前时段景色。
"""

from pathlib import Path

from PIL import Image, ImageOps


ASSET_DIR = Path(__file__).resolve().parents[1] / "src" / "assets" / "ink"
SOURCE_NAMES = (
    "sunrise-morning",
    "forenoon",
    "afternoon",
    "sunset",
    "dusk",
    "night",
)
CANVAS_SIZE = (900, 1040)
SCENE_TOP = 250


def make_picker_background(source_path: Path, target_path: Path):
    source = Image.open(source_path).convert("RGB")
    width, height = source.size

    # 原竖屏图的山水集中在约 54%—96% 高度，裁出这一段作为弹窗主体。
    scene = source.crop((0, int(height * 0.54), width, int(height * 0.97)))
    scene = ImageOps.fit(
        scene,
        (CANVAS_SIZE[0], CANVAS_SIZE[1] - SCENE_TOP),
        method=Image.Resampling.LANCZOS,
        centering=(0.5, 0.5),
    )

    canvas = Image.new("RGB", CANVAS_SIZE, (255, 255, 252))
    canvas.paste(scene, (0, SCENE_TOP))

    # 山水顶缘用宣纸白渐隐，避免出现横向拼接线。
    fade_height = 150
    overlay = Image.new("RGBA", (CANVAS_SIZE[0], fade_height), (255, 255, 252, 0))
    alpha = Image.new("L", (1, fade_height))
    alpha.putdata([round(255 * (1 - y / (fade_height - 1))) for y in range(fade_height)])
    alpha = alpha.resize((CANVAS_SIZE[0], fade_height))
    overlay.putalpha(alpha)
    canvas = canvas.convert("RGBA")
    canvas.alpha_composite(overlay, (0, SCENE_TOP))

    canvas.convert("RGB").save(target_path, quality=88, optimize=True)


def main():
    for name in SOURCE_NAMES:
        make_picker_background(
            ASSET_DIR / f"ink-portrait-{name}.jpg",
            ASSET_DIR / f"ink-picker-{name}.jpg",
        )


if __name__ == "__main__":
    main()
