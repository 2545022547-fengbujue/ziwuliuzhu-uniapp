#!/usr/bin/env python3
"""
rebuild_app_vue_fonts.py - 重建 App.vue 的字体加载部分

策略：用 f-string 将 base64 嵌入，双写大括号 {{ }} 转义 Vue 对象语法
"""

import base64
from pathlib import Path

# 配置
PROJECT_DIR = Path("<PROJECT_ROOT>")
APP_VUE_PATH = PROJECT_DIR / "src/App.vue"
FONT_DIR = PROJECT_DIR / "src/assets/fonts"

# 字体文件配置
KAITI_TTF = FONT_DIR / "kaiti-gb2312.ttf"            # 楷体（完整）
SONGTI_TTF = FONT_DIR / "wenjinmincho-subset-v6.ttf" # 宋体常规（裁剪v6，添加"设"字）
BOLD_TTF = FONT_DIR / "WenYuanSerifSC-Bold-subset-v2.ttf"  # 宋体粗体（裁剪）

def generate_base64(ttf_path: Path) -> str:
    """从 TTF 文件生成 base64 字符串"""
    print(f"[INFO] 读取字体文件: {ttf_path}")
    print(f"[INFO] 文件大小: {ttf_path.stat().st_size} bytes")

    with open(ttf_path, "rb") as f:
        font_data = f.read()

    b64 = base64.b64encode(font_data).decode("utf-8")
    print(f"[INFO] base64 长度: {len(b64)} 字符")

    return b64

def rebuild_app_vue():
    """重建 App.vue"""

    print("=" * 60)
    print("重建 App.vue 字体加载脚本")
    print("=" * 60)

    # 检查字体文件
    for ttf in [KAITI_TTF, SONGTI_TTF, BOLD_TTF]:
        if not ttf.exists():
            print(f"[ERROR] 字体文件不存在: {ttf}")
            return False

    # 生成 base64
    print("\n[步骤1] 生成字体 base64")
    kaiti_b64 = generate_base64(KAITI_TTF)
    songti_b64 = generate_base64(SONGTI_TTF)
    bold_b64 = generate_base64(BOLD_TTF)

    # 用 f-string 构建，Vue 的大括号需要双写 {{ }} 来转义
    print("\n[步骤2] 重建 App.vue")

    new_app_vue = f'''<!--
  App.vue - 应用根组件

  uni-app 的根组件仅用于注入全局样式，不包含业务逻辑。
  全局 SCSS 样式通过 @use 引入（含基础重置、中医主题色、字体等）。
-->
<template></template>

<script>
import {{ useAppStore }} from '@/stores/app.js'
import {{ watch }} from 'vue'

export default {{
  onLaunch() {{
    // #ifdef MP-WEIXIN
    // 微信小程序：动态加载楷体字体
    uni.loadFontFace({{
      global: true,
      family: 'KaitiGB2312',
      source: 'url("data:font/ttf;charset=utf-8;base64,{kaiti_b64}")',
      success() {{
        console.log('KaitiGB2312 font loaded')
      }},
      fail(err) {{
        console.warn('KaitiGB2312 font load failed:', err)
      }}
    }})

    // 微信小程序：动态加载文源宋体（常规）
    uni.loadFontFace({{
      global: true,
      family: 'WenYuanSerifSC',
      source: 'url("data:font/ttf;charset=utf-8;base64,{songti_b64}")',
      success() {{
        console.log('WenYuanSerifSC font loaded')
      }},
      fail(err) {{
        console.warn('WenYuanSerifSC font load failed:', err)
      }}
    }})
    // #endif

    // #ifdef APP-PLUS
    // App端：启动时应用主题 tabBar
    const store = useAppStore()
    store.applyThemeChrome()

    // 监听 theme 变化，自动更新 tabBar
    watch(
      () => store.theme,
      (newTheme) => {{
        console.log('[watch] theme changed:', newTheme)
        setTimeout(() => store.applyThemeChrome(), 50)
      }}
    )
    // #endif
  }},
  onShow() {{
    // #ifdef APP-PLUS
    const store = useAppStore()
    store.applyThemeChrome()
    // #endif
  }},
  onHide() {{}}
}}
</script>

<style lang="scss">
@use '@/styles/index.scss';
</style>
'''

    # 保存
    print("\n[步骤3] 保存 App.vue")
    print(f"[INFO] App.vue 新内容大小: {len(new_app_vue)} 字符")

    with open(APP_VUE_PATH, "w", encoding="utf-8") as f:
        f.write(new_app_vue)

    # 验证
    print("\n[步骤4] 验证保存结果")
    with open(APP_VUE_PATH, "r", encoding="utf-8") as f:
        verify_content = f.read()

    checks = [
        ("KaitiGB2312 base64", kaiti_b64),
        ("WenYuanSerifSC base64", songti_b64),
    ]

    all_success = True
    for name, b64 in checks:
        if b64 in verify_content:
            print(f"[SUCCESS] {name} 验证成功")
        else:
            print(f"[ERROR] {name} 验证失败")
            all_success = False

    # 验证结构完整性
    if "onLaunch()" in verify_content and "onShow()" in verify_content:
        print("[SUCCESS] 结构完整性验证成功")
    else:
        print("[ERROR] 结构完整性验证失败")
        all_success = False

    # 验证大括号正确性（双写的 {{ 应该变成单 {）
    if "uni.loadFontFace({" in verify_content:
        print("[SUCCESS] Vue 对象语法验证成功")
    else:
        print("[ERROR] Vue 对象语法验证失败")
        all_success = False

    print("\n" + "=" * 60)
    print("脚本执行完成")
    print("=" * 60)

    return all_success

if __name__ == "__main__":
    success = rebuild_app_vue()
    if not success:
        print("\n[FAILED] 脚本执行失败")
        exit(1)
    else:
        print("\n[DONE] 脚本执行成功")
        exit(0)