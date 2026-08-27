// #ifdef MP-WEIXIN
import { kaitiGB2312Base64 } from '@/assets/fonts/mp-font-base64.generated.js'
// #endif

/**
 * 微信小程序端字体加载。
 *
 * 小程序 loadFontFace 需要 data URI；仅加载经典四色「古典宣纸」链的 KaitiGB2312（500KB，低于 1MB 传输限制）。
 * 水墨/水彩主题字体（WenYuanSerifSC 1124KB / LXGWZhenKaiSlabGB 1088KB）小程序端不加载：
 * ① 非经典四色主题小程序端直接排除（项目规矩）；② 超 1MB 会触发 invokeWebviewMethod 数据传输超限报错。
 */
export function loadMiniProgramFonts() {
  // #ifdef MP-WEIXIN
  uni.loadFontFace({
    global: true,
    family: 'KaitiGB2312',
    source: `url("data:font/ttf;charset=utf-8;base64,${kaitiGB2312Base64.trim()}")`,
    fail(err) {
      console.warn('KaitiGB2312 font load failed:', err)
    }
  })
  // #endif
}
