/**
 * 全局配置
 *
 * 集中管理应用级常量，避免硬编码分散在各处
 */
export const APP_CONFIG = {
  name: '子午流注取穴',
  defaultCity: '北京',           // 真太阳时默认城市
  defaultLongitude: 116.407,    // 北京经度（°E），关闭真太阳时时重置为此值
  timerInterval: 60000,         // 自动模式定时器间隔（ms），每分钟检查时辰变化
}
