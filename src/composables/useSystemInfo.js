import { ref, onMounted } from 'vue'

/**
 * useSystemInfo - 系统信息组合式函数
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
  const statusBarHeight = ref(20)
  const screenWidth = ref(375)
  const screenHeight = ref(667)
  const safeAreaBottom = ref(0)
  const platform = ref('')
  const menuButtonInfo = ref(null)

  onMounted(() => {
    const info = uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
    screenWidth.value = info.screenWidth || 375
    screenHeight.value = info.screenHeight || 667
    platform.value = info.platform || ''

    // 安全区域：兼容不同平台的获取方式
    if (info.safeAreaInsets && info.safeAreaInsets.bottom !== undefined) {
      safeAreaBottom.value = info.safeAreaInsets.bottom
    } else if (info.safeArea && info.safeArea.bottom !== undefined) {
      safeAreaBottom.value = info.screenHeight - info.safeArea.bottom
    }

    // 微信小程序：获取胶囊按钮位置信息（运行时检测，跨平台安全）
    try {
      if (typeof wx !== 'undefined' && wx.getMenuButtonBoundingClientRect) {
        const menuButton = wx.getMenuButtonBoundingClientRect()
        menuButtonInfo.value = {
          ...menuButton,
          screenWidth: info.screenWidth
        }
      }
    } catch (e) {
      // 非小程序环境，忽略
    }
  })

  return {
    statusBarHeight,
    screenWidth,
    screenHeight,
    safeAreaBottom,
    platform,
    menuButtonInfo
  }
}
