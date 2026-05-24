#!/usr/bin/env python3
"""
replace_font_base64.py - 替换 App.vue 中的字体 base64 字符串

用法：python replace_font_base64.py

脚本会：
1. 从裁剪后的 TTF 文件重新生成 base64
2. 用正则表达式匹配 App.vue 中的旧 base64
3. 替换为新 base64 并保存
"""

import base64
import re
import os
from pathlib import Path

# 配置
PROJECT_DIR = Path("<PROJECT_ROOT>")
APP_VUE_PATH = PROJECT_DIR / "src/App.vue"
FONT_DIR = PROJECT_DIR / "src/assets/fonts"

# 字体配置
REGULAR_TTF = FONT_DIR / "wenjinmincho-subset-v4.ttf"  # 常规体裁剪版
BOLD_TTF = FONT_DIR / "WenYuanSerifSC-Bold-subset-v2.ttf"  # 粗体裁剪版

def generate_base64(ttf_path: Path) -> str:
    """从 TTF 文件生成 base64 字符串"""
    print(f"[INFO] 读取字体文件: {ttf_path}")
    print(f"[INFO] 文件大小: {ttf_path.stat().st_size} bytes")

    with open(ttf_path, "rb") as f:
        font_data = f.read()

    b64 = base64.b64encode(font_data).decode("utf-8")
    print(f"[INFO] base64 长度: {len(b64)} 字符")
    print(f"[INFO] base64 前50字符: {b64[:50]}...")

    return b64

def replace_base64_in_app_vue():
    """替换 App.vue 中的字体 base64"""

    print("=" * 60)
    print("替换 App.vue 字体 base64 脚本")
    print("=" * 60)

    # 检查字体文件存在
    if not REGULAR_TTF.exists():
        print(f"[ERROR] 常规体字体文件不存在: {REGULAR_TTF}")
        return False
    if not BOLD_TTF.exists():
        print(f"[ERROR] 粗体字体文件不存在: {BOLD_TTF}")
        return False

    # 生成新的 base64
    print("\n[步骤1] 生成常规体 base64")
    regular_b64 = generate_base64(REGULAR_TTF)

    print("\n[步骤2] 生成粗体 base64")
    bold_b64 = generate_base64(BOLD_TTF)

    # 读取 App.vue（作为纯文本，避开 Vue 编译器问题）
    print("\n[步骤3] 读取 App.vue")
    print(f"[INFO] 文件路径: {APP_VUE_PATH}")

    with open(APP_VUE_PATH, "r", encoding="utf-8") as f:
        content = f.read()

    file_size = len(content)
    print(f"[INFO] App.vue 总字符数: {file_size}")

    # 匹配常规体 base64 的正则
    # 格式: source: 'url("data:font/ttf;charset=utf-8;base64,XXXXX")'
    # 注意：需要匹配到正确的字体 family 名称

    print("\n[步骤4] 查找并替换常规体 base64")

    # 正则匹配 WenYuanSerifSC 字体（常规体）
    # 格式：family: 'WenYuanSerifSC', source: 'url("data:font/ttf;charset=utf-8;base64,...")'
    regular_pattern = re.compile(
        r"family:\s*['\"]WenYuanSerifSC['\"],\s*"
        r"source:\s*['\"]url\(['\"]data:font/ttf;charset=utf-8;base64,([A-Za-z0-9+/=]+)['\"]\)['\"]",
        re.DOTALL
    )

    regular_match = regular_pattern.search(content)
    if regular_match:
        old_regular_b64 = regular_match.group(1)
        print(f"[INFO] 找到常规体 base64，长度: {len(old_regular_b64)}")
        print(f"[INFO] 旧 base64 前50字符: {old_regular_b64[:50]}...")
        print(f"[INFO] 匹配位置: {regular_match.start()} - {regular_match.end()}")

        # 替换
        new_regular_source = f"family: 'WenYuanSerifSC', source: 'url(\"data:font/ttf;charset=utf-8;base64,{regular_b64}\")'"
        content = content[:regular_match.start()] + new_regular_source + content[regular_match.end():]
        print(f"[INFO] 常规体 base64 已替换")
    else:
        print("[WARN] 未找到常规体 base64 匹配，尝试更宽松的匹配...")

        # 更宽松的匹配：只匹配 source 字段中的 base64
        loose_pattern = re.compile(
            r"source:\s*['\"]url\(['\"]data:font/ttf;charset=utf-8;base64,([A-Za-z0-9+/=]{10000,})['\"]\)",
            re.DOTALL
        )
        loose_match = loose_pattern.search(content)
        if loose_match:
            old_b64 = loose_match.group(1)
            print(f"[INFO] 找到长 base64，长度: {len(old_b64)}")
            # 替换
            new_source = f"source: 'url(\"data:font/ttf;charset=utf-8;base64,{regular_b64}\")'"
            content = content[:loose_match.start()] + new_source + content[loose_match.end():]
            print(f"[INFO] base64 已替换")
        else:
            print("[ERROR] 无法找到任何 base64 匹配")
            return False

    # 查找粗体 base64
    print("\n[步骤5] 查找并替换粗体 base64")

    bold_pattern = re.compile(
        r"family:\s*['\"]WenYuanSerifSC-Bold['\"],\s*"
        r"source:\s*['\"]url\(['\"]data:font/ttf;charset=utf-8;base64,([A-Za-z0-9+/=]+)['\"]\)['\"]",
        re.DOTALL
    )

    bold_match = bold_pattern.search(content)
    if bold_match:
        old_bold_b64 = bold_match.group(1)
        print(f"[INFO] 找到粗体 base64，长度: {len(old_bold_b64)}")
        print(f"[INFO] 旧粗体 base64 前50字符: {old_bold_b64[:50]}...")

        # 替换
        new_bold_source = f"family: 'WenYuanSerifSC-Bold', source: 'url(\"data:font/ttf;charset=utf-8;base64,{bold_b64}\")'"
        content = content[:bold_match.start()] + new_bold_source + content[bold_match.end():]
        print(f"[INFO] 粗体 base64 已替换")
    else:
        print("[WARN] 未找到粗体 base64，可能 App.vue 中没有粗体字体")

    # 保存 App.vue
    print("\n[步骤6] 保存 App.vue")
    with open(APP_VUE_PATH, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"[INFO] App.vue 已保存，新大小: {len(content)} 字符")

    # 验证保存结果
    print("\n[步骤7] 验证保存结果")
    with open(APP_VUE_PATH, "r", encoding="utf-8") as f:
        verify_content = f.read()

    if regular_b64 in verify_content:
        print("[SUCCESS] 常规体 base64 验证成功")
    else:
        print("[ERROR] 常规体 base64 验证失败")

    if bold_b64 in verify_content:
        print("[SUCCESS] 粗体 base64 验证成功")
    elif bold_match:  # 如果之前找到了粗体但验证失败
        print("[ERROR] 粗体 base64 验证失败")
    else:
        print("[INFO] App.vue 中无粗体字体配置")

    print("\n" + "=" * 60)
    print("脚本执行完成")
    print("=" * 60)

    return True

if __name__ == "__main__":
    success = replace_base64_in_app_vue()
    if not success:
        print("\n[FAILED] 脚本执行失败，请检查日志")
        exit(1)
    else:
        print("\n[DONE] 脚本执行成功")
        exit(0)