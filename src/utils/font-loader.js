// #ifdef MP-WEIXIN
import {
  kaitiGB2312Base64,
  wenYuanSerifBase64,
  lxgwZhenKaiSlabBase64
} from '@/assets/fonts/mp-font-base64.generated.js'
// #endif

/**
 * 微信小程序端字体加载。
 *
 * 小程序 loadFontFace 仍需要 data URI；base64 内容由脚本从 TTF 生成到
 * src/assets/fonts/mp-font-base64.generated.js，避免把巨型字符串直接写进 App.vue。
 */
export function loadMiniProgramFonts() {
  // #ifdef MP-WEIXIN
  const fonts = [
    { family: 'KaitiGB2312', base64: kaitiGB2312Base64 },
    { family: 'WenYuanSerifSC', base64: wenYuanSerifBase64 },
    { family: 'LXGWZhenKaiSlabGB', base64: lxgwZhenKaiSlabBase64 }
  ]

  fonts.forEach(({ family, base64 }) => {
    uni.loadFontFace({
      global: true,
      family,
      source: `url("data:font/ttf;charset=utf-8;base64,${base64.trim()}")`,
      fail(err) {
        console.warn(`${family} font load failed:`, err)
      }
    })
  })
  // #endif
}
