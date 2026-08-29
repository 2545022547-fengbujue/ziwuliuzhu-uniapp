/**
 * useRootClasses - 主题根 class 自动推导（HomeLayout / SettingLayout 共用）
 *
 * ============================================================
 * 设计说明（给后来者/AI）
 * ============================================================
 * 1. 背景：此前 HomeLayout 与 SettingLayout 各自维护一份 rootClasses computed
 *    （根元素 class 绑定），逻辑完全相同、易分叉。抽取后两处共用一份实现，
 *    主题根类名的规则收敛为唯一事实来源。
 * 2. 规则（与壳层 v-if 分发、config/themes.js 的 id 体系对齐）：
 *    - activeUiStyle === 'classic' → theme-<activeTheme>
 *      例：theme-yellow / theme-black / theme-green / theme-red
 *      （对应 src/styles/themes.scss 的 .theme-* 变量块）
 *    - 其它 → ui-<activeUiStyle>，对应 src/styles/ui-<id>.scss 的 .ui-<id> 命名空间
 *    - activeUiStyle === 'ink' 时额外追加 ink-bg-<inkBackgroundPeriod>
 *      （水墨时段背景，见 ui-ink.scss 的 .ui-ink.ink-bg-* 系列）
 * 3. 返回值：computed<string[]>，可直接绑定到根元素 :class。
 * 4. 依赖：读取 store.activeUiStyle / activeTheme / inkBackgroundPeriod，
 *    三者均由 store 提供非法值兜底（见 app.js 内注释），故本函数无需重复防御。
 * ============================================================
 */
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.ts'

export function useRootClasses() {
  const store = useAppStore()

  return computed(() => {
    const list = []
    const style = store.activeUiStyle
    if (style === 'classic') {
      list.push(`theme-${store.activeTheme}`)
    } else {
      list.push(`ui-${style}`)
      if (style === 'ink') {
        list.push(`ink-bg-${store.inkBackgroundPeriod}`)
      }
    }
    return list
  })
}
