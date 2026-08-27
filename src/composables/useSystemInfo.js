import { ref } from 'vue'

// 模块级单例：所有调用者共享同一份数据，只在首次调用时获取一次
const statusBarHeight = ref(20)
const screenWidth = ref(375)
const screenHeight = ref(667)
const windowHeight = ref(667)
const safeAreaBottom = ref(0)
const platform = ref('')
const menuButtonInfo = ref(null)
let initialized = false

/**
 * 初始化系统信息（单例模式）
 *
 * 首次调用时获取设备信息，后续调用直接返回缓存数据。
 * 自动适配不同平台API：
 * - 微信小程序：使用新分离API（getWindowInfo/getDeviceInfo/getAppBaseInfo）
 *   避免弃用警告（wx.getSystemInfoSync已弃用）
 * - 其他平台：使用uni-app兼容API（uni.getSystemInfoSync）
 *
 * @private 内部函数，由useSystemInfo调用
 * @returns {void} 无返回值，数据写入模块级 ref 变量
 *
 * @example
 * // 自动在useSystemInfo首次调用时执行
 * const { statusBarHeight, safeAreaBottom } = useSystemInfo()
 */
function initSystemInfo() {
  if (initialized) return
  initialized = true

  // 读取逻辑抽成两个分支函数：微信优先用新分离 API，但旧基础库可能没有这些函数，
  // 一旦缺失或抛错必须回退 uni.getSystemInfoSync()，否则单例会永远停留在默认值。
  const readViaWx = () => {
    const windowInfo = wx.getWindowInfo()
    const deviceInfo = wx.getDeviceInfo()

    statusBarHeight.value = windowInfo.statusBarHeight || 20
    screenWidth.value = windowInfo.screenWidth || 375
    screenHeight.value = windowInfo.screenHeight || 667
    windowHeight.value = windowInfo.windowHeight || windowInfo.screenHeight || 667
    platform.value = deviceInfo.platform || ''

    if (windowInfo.safeAreaInsets && windowInfo.safeAreaInsets.bottom !== undefined) {
      safeAreaBottom.value = windowInfo.safeAreaInsets.bottom
    } else if (windowInfo.safeArea && windowInfo.safeArea.bottom !== undefined) {
      safeAreaBottom.value = windowInfo.screenHeight - windowInfo.safeArea.bottom
    }
  }

  const readViaUni = () => {
    // 优先使用分拆 API（getWindowInfo/getDeviceInfo，uni-app 文档推荐，查询更轻量）：
    // getSystemInfoSync 涉及信息多、耗时长，仅作为旧环境回退。
    if (typeof uni.getWindowInfo === 'function' && typeof uni.getDeviceInfo === 'function') {
      try {
        const windowInfo = uni.getWindowInfo()
        const deviceInfo = uni.getDeviceInfo()
        statusBarHeight.value = windowInfo.statusBarHeight || 20
        screenWidth.value = windowInfo.screenWidth || 375
        screenHeight.value = windowInfo.screenHeight || 667
        windowHeight.value = windowInfo.windowHeight || windowInfo.screenHeight || 667
        platform.value = deviceInfo.platform || ''

        if (windowInfo.safeAreaInsets && windowInfo.safeAreaInsets.bottom !== undefined) {
          safeAreaBottom.value = windowInfo.safeAreaInsets.bottom
        } else if (windowInfo.safeArea && windowInfo.safeArea.bottom !== undefined) {
          safeAreaBottom.value = windowInfo.screenHeight - windowInfo.safeArea.bottom
        }
        return
      } catch (e) {
        console.warn('[系统信息] 分拆 API 读取失败，回退 getSystemInfoSync', e)
      }
    }
    const systemInfo = uni.getSystemInfoSync()
    statusBarHeight.value = systemInfo.statusBarHeight || 20
    screenWidth.value = systemInfo.screenWidth || 375
    screenHeight.value = systemInfo.screenHeight || 667
    windowHeight.value = systemInfo.windowHeight || systemInfo.screenHeight || 667
    platform.value = systemInfo.platform || ''

    if (systemInfo.safeAreaInsets && systemInfo.safeAreaInsets.bottom !== undefined) {
      safeAreaBottom.value = systemInfo.safeAreaInsets.bottom
    } else if (systemInfo.safeArea && systemInfo.safeArea.bottom !== undefined) {
      safeAreaBottom.value = systemInfo.screenHeight - systemInfo.safeArea.bottom
    }
  }

  try {
    // 微信小程序：只用新分离 API（getWindowInfo/getDeviceInfo），避免 wx.getSystemInfoSync 弃用警告。
    // 旧基础库缺失新 API 时保持默认值，绝不回退 uni.getSystemInfoSync（内部走 wx.getSystemInfoSync）。
    if (typeof wx !== 'undefined') {
      if (typeof wx.getWindowInfo === 'function' && typeof wx.getDeviceInfo === 'function') {
        try {
          readViaWx()
        } catch (e) {
          console.warn('[系统信息] 微信新分离 API 读取失败，保持默认值', e)
        }
      }
    } else {
      readViaUni()
    }
  } catch (e) {
    console.error('[系统信息获取失败]', e)
  }

  // 微信小程序：获取胶囊按钮位置信息（运行时检测，跨平台安全）
  try {
    if (typeof wx !== 'undefined' && wx.getMenuButtonBoundingClientRect) {
      const menuButton = wx.getMenuButtonBoundingClientRect()
      menuButtonInfo.value = {
        ...menuButton,
        screenWidth: screenWidth.value  // 使用模块级变量，两个分支都可用
      }
    }
  } catch (e) {
    // 非小程序环境，忽略
  }
}

/**
 * useSystemInfo - 系统信息组合式函数（单例模式）
 *
 * 功能：
 *   - 获取状态栏高度、屏幕尺寸、安全区域等信息
 *   - 微信小程序中获取胶囊按钮位置信息（用于自定义导航栏适配）
 *
 * 返回值：
 *   - statusBarHeight: 状态栏高度（px）
 *   - screenWidth: 屏幕宽度（px）
 *   - screenHeight: 屏幕高度（px）
 *   - safeAreaBottom: 底部安全区域高度（px）
 *   - platform: 平台标识
 *   - menuButtonInfo: 微信小程序胶囊按钮信息（仅小程序端有值，其他平台为 null）
 */
export function useSystemInfo() {
  initSystemInfo()

  return {
    statusBarHeight,
    screenWidth,
    screenHeight,
    windowHeight,
    safeAreaBottom,
    platform,
    menuButtonInfo
  }
}
