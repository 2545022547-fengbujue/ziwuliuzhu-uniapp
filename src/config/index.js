/**
 * 全局配置模块
 *
 * 集中管理应用级常量，避免硬编码分散在各处。
 * 配置项被 stores/app.js、pages/index/index.vue 等模块引用。
 *
 * 【配置项说明】
 * - name: 应用名称，用于标题栏显示
 * - defaultCity: 真太阳时默认城市（北京为首都，时区中心）
 * - defaultLongitude: 北京经度（东经116.407°），关闭真太阳时时重置
 * - timerInterval: 自动模式定时器间隔（60秒）
 *
 * 【设计依据】
 * - defaultLongitude选择北京经度：
 *   北京位于东八区中央经线（120°E）附近，首都标准经度，
 *   适合作为关闭真太阳时时的默认值，避免用户设置残留。
 *
 * - timerInterval选择60秒：
 *   时辰每2小时切换一次，1分钟检查一次足够准确，
 *   平衡精度与性能，避免频繁刷新消耗资源。
 *
 * 【扩展配置】
 * 新增配置项时请在此处集中定义，并添加用途说明注释。
 *
 * @module config
 * @see stores/app.js - 状态管理引用 timerInterval
 * @see pages/index/index.vue - 首页引用 timerInterval
 */
export const APP_CONFIG = {
  /** 应用名称，用于标题栏和关于页面 */
  name: '子午流注取穴',

  /** 真太阳时默认城市（北京为首都，东八区时区中心） */
  defaultCity: '北京',

  /**
   * 北京经度（°E）
   * 用途：关闭真太阳时时重置为此值，避免用户设置残留
   * 选择北京：东八区中央经线120°E附近，首都标准经度
   */
  defaultLongitude: 116.407,

  /**
   * 自动模式定时器间隔（毫秒）
   * 60000ms = 1分钟
   * 设计依据：时辰每2小时切换，1分钟检查一次足够准确
   */
  timerInterval: 60000,
}
