/**
 * 日期工具模块
 *
 * 提供日期格式化、时辰索引计算等基础工具函数
 * 被 index.vue（定时器）、app.js（时间状态）、setting.vue 等模块引用
 */

/**
 * 格式化日期为 YYYY-MM-DD
 * @param {Date} date - 日期对象
 * @returns {string} 格式化后的日期字符串
 */
export function formatDate(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/**
 * 获取时辰索引 (0-11)
 * 子时(23-1) = 0, 丑时(1-3) = 1, ...
 */
export function getHourIndexFromDate(date) {
  const hour = date.getHours()
  if (hour >= 23 || hour < 1) return 0
  if (hour >= 1 && hour < 3) return 1
  if (hour >= 3 && hour < 5) return 2
  if (hour >= 5 && hour < 7) return 3
  if (hour >= 7 && hour < 9) return 4
  if (hour >= 9 && hour < 11) return 5
  if (hour >= 11 && hour < 13) return 6
  if (hour >= 13 && hour < 15) return 7
  if (hour >= 15 && hour < 17) return 8
  if (hour >= 17 && hour < 19) return 9
  if (hour >= 19 && hour < 21) return 10
  if (hour >= 21 && hour < 23) return 11
  return 0
}

/**
 * 时辰起始小时数
 * 子时23点、丑时1点、寅时3点...亥时21点
 */
export const SHICHEN_START_HOURS = [23, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21]

/**
 * 时辰选项列表
 */
export const HOUR_OPTIONS = [
  { label: '子时（23:00~01:00）', value: 0 },
  { label: '丑时（01:00~03:00）', value: 1 },
  { label: '寅时（03:00~05:00）', value: 2 },
  { label: '卯时（05:00~07:00）', value: 3 },
  { label: '辰时（07:00~09:00）', value: 4 },
  { label: '巳时（09:00~11:00）', value: 5 },
  { label: '午时（11:00~13:00）', value: 6 },
  { label: '未时（13:00~15:00）', value: 7 },
  { label: '申时（15:00~17:00）', value: 8 },
  { label: '酉时（17:00~19:00）', value: 9 },
  { label: '戌时（19:00~21:00）', value: 10 },
  { label: '亥时（21:00~23:00）', value: 11 }
]
