#!/usr/bin/env python3
"""验证字体子集、主题文案覆盖和微信小程序 Base64 资源一致性。"""
from __future__ import annotations
import base64
import importlib.util
from pathlib import Path
import sys
from fontTools.ttLib import TTFont
ROOT = Path(__file__).resolve().parents[1]
FONT_DIR = ROOT / "src" / "assets" / "fonts"
REQUIRED_TEXTS = ("莫兰迪奶油", "动物森友会", "复古像素", "双狸迎宾，悠闲岛屿生活", "掌机像素，怀旧冒险")
# 华文行楷（HuawenXingkai）为 H5/App 水墨主展示字体（小程序不打包、无 Base64），仅校验 TTF 与关键文案覆盖。
INK_REQUIRED_TEXTS = ("水墨意境", "墨色入境", "子午流注", "合日互用", "灵龟八法", "飞腾八法", "纳甲法", "经络", "关冲", "真太阳时", "穴位详情")
# 注：敦煌飞天行楷 / 字魂苍劲行楷已于 2026-08-13 按用户要求彻底移除（font-face、链引用、子集 TTF 均删除），
# 此处仅保留当前实际打包的水墨主字体，避免校验脚本引用已删除资源导致回归误报。
APP_ONLY_FONT_JOBS = (("huawen-xingkai-subset.ttf", "华文行楷"),)
FONT_JOBS = (("kaiti-gb2312.ttf", "kaiti-gb2312-base64.txt"), ("wenjinmincho-subset-v6.ttf", "wenjinmincho-subset-v6-base64.txt"), ("WenYuanSerifSC-Bold-subset-v2.ttf", "bold-v2-base64.txt"), ("LXGWZhenKaiSlabGB-subset.ttf", "lxgw-zhenkai-slab-base64.txt"))
def load_builder():
    spec = importlib.util.spec_from_file_location("font_builder", ROOT / "scripts" / "build-font-subsets.py")
    module = importlib.util.module_from_spec(spec)
    assert spec.loader
    spec.loader.exec_module(module)
    return module
def main() -> int:
    chars = set(load_builder().collect_characters())
    required_chars = set("".join(REQUIRED_TEXTS))
    errors = []
    for ttf_name, base64_name in FONT_JOBS:
        ttf_path, base64_path = FONT_DIR / ttf_name, FONT_DIR / base64_name
        try:
            font_bytes = ttf_path.read_bytes(); cmap = TTFont(ttf_path).getBestCmap()
        except Exception as exc:
            errors.append(f"{ttf_name}: 无法解析 ({exc})"); continue
        if ttf_name == "LXGWZhenKaiSlabGB-subset.ttf":
            missing_required = sorted(required_chars - {chr(code) for code in cmap}, key=ord)
            if missing_required: errors.append(f"{ttf_name}: 关键主题文案缺字 {''.join(missing_required)}")
        try:
            encoded = base64.b64decode(base64_path.read_text(encoding="utf-8").strip(), validate=True)
            if encoded != font_bytes: errors.append(f"{base64_name}: 与 {ttf_name} 二进制不一致")
        except Exception as exc: errors.append(f"{base64_name}: Base64 无法解析 ({exc})")
        print(f"{ttf_name}: {len(cmap)} glyph mappings, {len(font_bytes)} bytes")
    ink_required_chars = set("".join(INK_REQUIRED_TEXTS))
    for ttf_name, label in APP_ONLY_FONT_JOBS:
        ttf_path = FONT_DIR / ttf_name
        try:
            font_bytes = ttf_path.read_bytes(); cmap = TTFont(ttf_path).getBestCmap()
        except Exception as exc:
            errors.append(f"{ttf_name}: 无法解析 ({exc})"); continue
        missing = sorted(ink_required_chars - {chr(code) for code in cmap}, key=ord)
        if missing: errors.append(f"{ttf_name}({label}): 水墨关键文案缺字 {''.join(missing)}")
        print(f"{ttf_name}: {len(cmap)} glyph mappings, {len(font_bytes)} bytes")
    if errors:
        print("字体回归失败:"); [print(f"- {error}") for error in errors]; return 1
    print(f"字体回归通过：{len(chars)} 个项目字符，{len(REQUIRED_TEXTS)} 组关键主题文案，{len(INK_REQUIRED_TEXTS)} 组水墨关键文案"); return 0
if __name__ == "__main__": sys.exit(main())
