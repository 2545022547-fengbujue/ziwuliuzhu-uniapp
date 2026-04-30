import { ref, onMounted } from 'vue'

export function useSystemInfo() {
  const statusBarHeight = ref(20)
  const screenWidth = ref(375)
  const screenHeight = ref(667)
  const safeAreaBottom = ref(0)
  const platform = ref('')

  onMounted(() => {
    const info = uni.getSystemInfoSync()
    statusBarHeight.value = info.statusBarHeight || 20
    screenWidth.value = info.screenWidth || 375
    screenHeight.value = info.screenHeight || 667
    platform.value = info.platform || ''
    safeAreaBottom.value = info.safeAreaInsets?.bottom || 0
  })

  return {
    statusBarHeight,
    screenWidth,
    screenHeight,
    safeAreaBottom,
    platform
  }
}
