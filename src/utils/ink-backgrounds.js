/**
 * 水墨选择器背景表。
 *
 * 使用模块导入而不是运行时拼接路径，确保 H5 与 Android App 打包时
 * Vite 都能把图片写入产物并替换为正确地址。
 */
import sunriseMorning from '@/assets/ink/ink-picker-sunrise-morning.jpg'
import forenoon from '@/assets/ink/ink-picker-forenoon.jpg'
import afternoon from '@/assets/ink/ink-picker-afternoon.jpg'
import sunset from '@/assets/ink/ink-picker-sunset.jpg'
import dusk from '@/assets/ink/ink-picker-dusk.jpg'
import night from '@/assets/ink/ink-picker-night.jpg'

const INK_PICKER_BACKGROUNDS = {
  sunrise: sunriseMorning,
  morning: sunriseMorning,
  forenoon,
  noon: forenoon,
  afternoon,
  sunset,
  dusk,
  night
}

export function getInkPickerBackground(period) {
  return INK_PICKER_BACKGROUNDS[period] || night
}
