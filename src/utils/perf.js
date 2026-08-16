/**
 * src/utils/perf.js - 轻量性能观测工具（主题切换 / 页面渲染）
 *
 * 用途（工程级性能审查）：
 *   量化「主题切换毫秒级」目标的关键耗时：切换命令 → 异步 chunk 解析 → 新主题
 *   Layout 挂载完成。埋点见 useSettingPage.selectAppearance 与 Home/SettingLayout。
 *
 * 设计约束：
 *   - mark() 始终执行（performance.mark 开销微秒级，可忽略）
 *   - measure() 仅非生产环境输出 console，生产零日志
 *   - 无 performance API 的环境（部分小程序 WebView）自动降级 no-op
 *   - 暴露 window.__perf 便于浏览器 console 手动观测（__perf.measure('a','b','标签')）
 */
const hasPerf = typeof performance !== 'undefined' && typeof performance.mark === 'function'
const isProd = typeof process !== 'undefined' && process.env && process.env.NODE_ENV === 'production'
const canLog = !isProd

/** 打点（始终执行；同名 mark 可重复，measure 取最近一次） */
export function mark(name) {
  if (hasPerf) performance.mark(name)
}

/**
 * 统计 startMark → endMark 的耗时并输出 console。
 * @param {string} startMark 起点打点名
 * @param {string} endMark 终点打点名（需先 mark）
 * @param {string} label 输出标签（如「切主题到 ink」）
 * @returns {number|null} 耗时 ms；环境不支持或打点缺失返回 null
 */
export function measure(startMark, endMark, label) {
  // 生产环境直接跳过：既不 console，也不调用 performance.measure，
  // 避免为“不会有观察者”的埋点付出任何计算成本。
  if (!hasPerf || !canLog) return null
  try {
    const m = performance.measure(label, startMark, endMark)
    console.info(`[perf] ${label}: ${m.duration.toFixed(1)}ms`)
    return m.duration
  } catch (e) {
    // start/end mark 缺失（如首次挂载无切换动作）时静默跳过
    return null
  }
}

// 浏览器调试入口（仅开发环境）：console 里敲 __perf.measure('a', 'b', '自定义') 即可。
// 生产环境不挂载，避免把内部埋点命名空间暴露给线上用户/第三方脚本。
if (typeof window !== 'undefined' && !isProd) {
  window.__perf = { mark, measure }
}
