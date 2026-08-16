/**
 * beijing-time.js - 北京墙钟时间工具（时区无关的 UTC+8 时间）
 *
 * ============================================================
 * 背景（给后来者/AI）
 * ============================================================
 * 项目算法（干支、真太阳时、时辰索引）全部基于 JS Date 的"本地时间"读数
 * （getHours/getDate 等）。当设备/浏览器时区 ≠ UTC+8 时（海外用户、模拟器、
 * 服务器），new Date() 返回当地时间，算法会按错误钟点取穴。
 *
 * 方案：getBeijingDate() 把任意 Date 转换为"墙钟读数等于北京时间的 Date"，
 *       所有时间消费点统一走它。转换公式：
 *         北京墙钟 = UTC + 8h = 本地墙钟 + (480 + getTimezoneOffset()) 分钟
 *       在 UTC+8 设备上 getTimezoneOffset() === -480 → 偏移为 0 → 幂等返回原值，
 *       因此现有测试与国内设备行为完全不变。
 *
 * 注意：转换后 Date 的"绝对时间戳"不再代表真实时刻（多了时区偏移），
 *       本应用只消费墙钟读数（getFullYear/getMonth/getDate/getHours），
 *       禁止对这类 Date 做 getTime() 差值运算。
 * ============================================================
 */

/**
 * 返回墙钟读数 = 北京时间的 Date。
 * @param {Date} [date] 任意时刻（默认当前时间）
 * @returns {Date} 墙钟读数等于北京时间的 Date（UTC+8 设备幂等返回原值）
 */
export function getBeijingDate(date = new Date()) {
  const offset = date.getTimezoneOffset() // 分钟：UTC - 本地；北京 = -480
  if (offset === -480) return date // 已是 UTC+8，幂等
  return new Date(date.getTime() + (480 + offset) * 60000)
}
