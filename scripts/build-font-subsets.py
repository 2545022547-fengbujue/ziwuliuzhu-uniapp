#!/usr/bin/env python3
"""根据项目源码实际字符重新生成三套内置字体子集。"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import re
import tempfile
import unicodedata

from fontTools import subset
from fontTools.ttLib import TTFont


PROJECT_ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = PROJECT_ROOT / "src" / "assets" / "fonts"

TEXT_EXTENSIONS = {".vue", ".js", ".ts", ".json", ".scss", ".css", ".html"}

# UI 中可能由运行时拼接、日期格式化或原生组件产生的基础字符。
BASE_CHARACTERS = (
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    "0123456789"
    " ，。！？；：、（）()【】[]《》〈〉“”‘’—…·+-~～/%°.E："
)


def collect_characters() -> str:
    chars = set(BASE_CHARACTERS)
    roots = [PROJECT_ROOT / "src", PROJECT_ROOT / "pages.json", PROJECT_ROOT / "manifest.json"]

    files: list[Path] = []
    for root in roots:
        if root.is_file():
            files.append(root)
        elif root.is_dir():
            files.extend(
                path for path in root.rglob("*")
                if path.is_file() and path.suffix.lower() in TEXT_EXTENSIONS
            )

    for path in files:
        try:
            content = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue
        # 移除代码注释，避免把开发说明中的大量非运行时汉字打进小程序主包。
        content = re.sub(r"/\*.*?\*/", "", content, flags=re.S)
        content = re.sub(r"(^|\s)//.*", r"\1", content)

        visible_parts: list[str] = []
        if path.suffix.lower() == ".vue":
            template = re.search(r"<template>(.*?)</template>", content, flags=re.S)
            if template:
                visible_parts.append(template.group(1))

        # JS/JSON/Vue 中的实际字符串包含页面文案、城市、穴位和算法数据。
        for match in re.finditer(
            r"'(?:\\.|[^'\\])*'|\"(?:\\.|[^\"\\])*\"|`(?:\\.|[^`\\])*`",
            content,
            flags=re.S,
        ):
            visible_parts.append(match.group(0)[1:-1])

        for char in "".join(visible_parts):
            category = unicodedata.category(char)
            if not category.startswith("C") and char not in "\r\n\t":
                chars.add(char)

    return "".join(sorted(chars, key=ord))


def subset_font(source: Path, destination: Path, characters: str) -> tuple[int, int]:
    font = TTFont(source)
    before = len(font.getBestCmap())

    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.name_legacy = True
    options.name_languages = ["*"]
    options.notdef_glyph = True
    options.notdef_outline = True
    options.recommended_glyphs = True
    options.glyph_names = True

    subsetter = subset.Subsetter(options=options)
    subsetter.populate(text=characters)
    subsetter.subset(font)
    after = len(font.getBestCmap())

    destination.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(suffix=".ttf", dir=destination.parent)
    os.close(fd)
    temp_path = Path(temp_name)
    try:
        font.save(temp_path)
        temp_path.replace(destination)
    finally:
        if temp_path.exists():
            temp_path.unlink()

    return before, after


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-dir", type=Path, default=Path(r"<FONT_SOURCE_DIR>"))
    args = parser.parse_args()

    characters = collect_characters()
    # 楷体会用于导航标题、方法标题、穴位名和说明正文。过去只打包一份
    # 415 字的“核心字符表”，真机上其余汉字会逐字回退成宋体，导致同一句
    # 字形、字宽和基线明显不一致。现在与宋体一样按项目实际可见字符裁剪；
    # 原字体不含的字符仍由 CSS fallback 接管。
    kaiti_characters = characters
    char_file = FONT_DIR / "chars_project_complete.txt"
    char_file.write_text(characters, encoding="utf-8")

    jobs = [
        (
            args.source_dir / "WenYuanSerifSC-Medium.ttf",
            FONT_DIR / "wenjinmincho-subset-v6.ttf",
            "文渊宋体 Medium",
            characters,
        ),
        (
            args.source_dir / "WenYuanSerifSC-Bold.ttf",
            FONT_DIR / "WenYuanSerifSC-Bold-subset-v2.ttf",
            "文渊宋体 Bold",
            characters,
        ),
        (
            args.source_dir / "楷体_GB2312.ttf",
            FONT_DIR / "kaiti-gb2312.ttf",
            "楷体 GB2312",
            kaiti_characters,
        ),
        (
            Path(r"<HOME_DIR>\LXGWZhenKaiSlabGB-Regular.ttf"),
            FONT_DIR / "LXGWZhenKaiSlabGB-subset.ttf",
            "LXGW ZhenKai Slab GB",
            characters,
        ),
    ]

    print(f"项目字符集：{len(characters)} 个字符")
    for source, destination, label, job_characters in jobs:
        if not source.exists():
            raise FileNotFoundError(f"缺少完整源字体：{source}")
        before, after = subset_font(source, destination, job_characters)
        print(
            f"{label}: 源字体 {before} 字符 -> 子集 {after} 字符，"
            f"输出 {destination.stat().st_size} bytes"
        )


if __name__ == "__main__":
    main()
