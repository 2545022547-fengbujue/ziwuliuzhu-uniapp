"""Generate App-safe transparent mascot PNGs for the Animal Island theme.

The original component used inline SVG tags. They render correctly in H5 but are
not consistently retained by the uni-app App rendering pipeline on Android.
This script keeps the characters reproducible while producing ordinary PNG
files that the cross-platform ``image`` component can decode reliably.

Run from the repository root:
    python scripts/generate-animal-mascots.py
"""

from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
OUTPUT_DIR = ROOT / "src" / "static" / "themes" / "animal" / "mascots"
CANVAS = 360
SCALE = 2

PALETTES = {
    "rabbit": ("#f7eee0", "#c89d82", "#e7c8ad", "#fff2d4", "#86cce0"),
    "cat": ("#e2a25f", "#76503a", "#fff0d4", "#fff2d4", "#f2bd64"),
    "dog": ("#d9ad72", "#744c34", "#f1d39f", "#fff0cf", "#6fc9a5"),
    "deer": ("#c99369", "#744c3c", "#f3d6a7", "#fff2d4", "#ef9f7f"),
    "squirrel": ("#d47750", "#77402f", "#b95642", "#ffe4bc", "#82b8df"),
    "owl": ("#a78b6a", "#67503d", "#82694f", "#f8e8c5", "#8fc786"),
}


def box(x1, y1, x2, y2):
    """Scale design-space coordinates from 180 to the 360px output canvas."""
    return tuple(int(value * SCALE) for value in (x1, y1, x2, y2))


def point_list(points):
    return [(int(x * SCALE), int(y * SCALE)) for x, y in points]


def draw_mascot(variant):
    main, dark, accent, pale, shirt = PALETTES[variant]
    image = Image.new("RGBA", (CANVAS, CANVAS), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image, "RGBA")

    # Soft ground shadow anchors the character without requiring CSS filters.
    draw.ellipse(box(42, 156, 138, 172), fill=(70, 92, 70, 38))

    # Tail is painted first so the torso naturally overlaps it.
    if variant == "rabbit":
        draw.ellipse(box(128, 118, 158, 150), fill="#fff8e9")
    elif variant in {"cat", "dog", "deer"}:
        draw.ellipse(box(132, 116, 164, 151), fill=main)
        draw.ellipse(box(132, 130, 151, 151), fill=(0, 0, 0, 0))
    elif variant == "squirrel":
        draw.ellipse(box(132, 82, 184, 153), fill=accent)
        draw.ellipse(box(137, 103, 169, 137), fill="#f6d29d")

    # Body, shirt and feet share the same proportions for a coherent character set.
    draw.ellipse(box(44, 86, 138, 170), fill=main)
    draw.rounded_rectangle(box(50, 108, 132, 158), radius=18 * SCALE, fill=shirt)
    draw.arc(box(61, 99, 121, 134), 22, 158, fill=(255, 255, 255, 185), width=5 * SCALE)
    draw.ellipse(box(49, 149, 81, 167), fill=dark)
    draw.ellipse(box(102, 149, 134, 167), fill=dark)

    # Species-specific ears/antlers are deliberately oversized, echoing cozy game mascots.
    if variant == "rabbit":
        draw.ellipse(box(43, 0, 77, 73), fill=main)
        draw.ellipse(box(103, 0, 137, 73), fill=main)
        draw.ellipse(box(53, 8, 68, 58), fill="#f2a9ad")
        draw.ellipse(box(112, 8, 127, 58), fill="#f2a9ad")
    elif variant == "cat":
        draw.polygon(point_list([(45, 60), (49, 18), (83, 48)]), fill=main)
        draw.polygon(point_list([(135, 60), (131, 18), (97, 48)]), fill=main)
        draw.polygon(point_list([(54, 46), (56, 29), (71, 45)]), fill="#f2a9ad")
        draw.polygon(point_list([(126, 46), (124, 29), (109, 45)]), fill="#f2a9ad")
    elif variant == "dog":
        draw.ellipse(box(24, 31, 71, 91), fill=dark)
        draw.ellipse(box(109, 31, 156, 91), fill=dark)
    elif variant == "deer":
        draw.ellipse(box(28, 33, 70, 75), fill=main)
        draw.ellipse(box(110, 33, 152, 75), fill=main)
        antler_width = 6 * SCALE
        draw.line(point_list([(65, 39), (57, 13), (51, 4)]), fill=dark, width=antler_width, joint="curve")
        draw.line(point_list([(64, 31), (77, 16)]), fill=dark, width=antler_width)
        draw.line(point_list([(115, 39), (123, 13), (129, 4)]), fill=dark, width=antler_width, joint="curve")
        draw.line(point_list([(116, 31), (103, 16)]), fill=dark, width=antler_width)
    elif variant == "squirrel":
        draw.polygon(point_list([(47, 57), (35, 19), (77, 54)]), fill=main)
        draw.polygon(point_list([(133, 57), (145, 19), (103, 54)]), fill=main)
    else:
        draw.polygon(point_list([(46, 60), (57, 28), (80, 57)]), fill=dark)
        draw.polygon(point_list([(134, 60), (123, 28), (100, 57)]), fill=dark)

    # Head and face markings.
    draw.ellipse(box(38, 29, 142, 123), fill=main)
    if variant == "owl":
        draw.ellipse(box(41, 42, 95, 103), fill=pale)
        draw.ellipse(box(85, 42, 139, 103), fill=pale)
    elif variant == "cat":
        draw.polygon(point_list([(61, 43), (75, 54), (93, 36), (107, 53), (123, 42), (116, 61), (65, 61)]), fill=accent)
    elif variant == "dog":
        draw.ellipse(box(46, 35, 96, 72), fill=pale)
    elif variant == "deer":
        draw.ellipse(box(59, 37, 121, 60), fill=(255, 242, 212, 145))
    elif variant == "squirrel":
        draw.ellipse(box(59, 44, 121, 111), fill=(255, 228, 188, 185))

    # Eyes, highlights, blush and mouth remain identical to make the random set feel related.
    draw.ellipse(box(64, 64, 78, 84), fill="#493a2d")
    draw.ellipse(box(102, 64, 116, 84), fill="#493a2d")
    draw.ellipse(box(67, 68, 72, 73), fill="white")
    draw.ellipse(box(105, 68, 110, 73), fill="white")
    draw.ellipse(box(49, 83, 67, 93), fill=(238, 155, 148, 120))
    draw.ellipse(box(113, 83, 131, 93), fill=(238, 155, 148, 120))
    if variant == "owl":
        draw.polygon(point_list([(90, 79), (82, 88), (90, 94), (98, 88)]), fill="#efb84d")
        draw.ellipse(box(35, 108, 67, 148), fill=accent)
        draw.ellipse(box(113, 108, 145, 148), fill=accent)
    else:
        draw.ellipse(box(82, 81, 98, 93), fill=dark)
    draw.arc(box(77, 87, 103, 108), 15, 165, fill="#624738", width=3 * SCALE)

    # Small leaf is the shared Animal Island signature and provides a fresh green accent.
    draw.ellipse(box(130, 34, 160, 57), fill="#79bc72")
    draw.line(point_list([(145, 38), (129, 61)]), fill="#3e8b5b", width=3 * SCALE)
    return image


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for variant in PALETTES:
        draw_mascot(variant).save(OUTPUT_DIR / f"{variant}.png", optimize=True)
    print(f"generated {len(PALETTES)} mascot PNGs in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
