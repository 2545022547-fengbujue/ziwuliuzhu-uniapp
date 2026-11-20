<template>
  <!-- 空态（防御性：selectPoint 总是先设 point 再 showDetail，正常流程不可达）与正常态共用同一
       overlay/popup 骨架，内部仅按 point 有无切换，避免两套弹窗骨架重复维护。 -->
  <view class="overlay" @tap="handleClose">
    <view
      class="popup"
      :class="[...rootClasses, `watercolor-wash-${watercolorWash}`]"
      @tap.stop
    >
      <DetailThemeDecor variant="overlay" />

      <template v-if="point">
        <!-- 头部 -->
        <view class="popup-header">
          <view class="header-icon-wrap">
            <text class="header-icon">📍</text>
          </view>
          <!-- close-btn 保持 44px 左右触控面积；各主题只改视觉，不缩小可点击区域。 -->
          <view class="close-btn" role="button" aria-label="关闭穴位详情" @tap="handleClose">
            <text class="close-icon">✕</text>
          </view>
          <!-- 穴位名称+编码：绝对定位，独立于图标和关闭按钮 -->
          <view class="header-name-layer">
            <text class="point-name" :class="{ 'point-name-code-hidden': !store.showPointCode }"><text
              v-for="(ch, i) in nameChars"
              :key="i"
              :style="pnGapStyle(i, ch)"
            >{{ ch }}</text></text>
            <text v-if="store.showPointCode" class="point-code">{{ point?.code }}</text>
          </view>
        </view>

        <scroll-view scroll-y class="popup-body">
          <view class="popup-body-content">
            <!-- 基本信息 -->
            <view class="info-section">
              <view class="section-title">
                <view class="title-dot"></view>
                <text>基本信息</text>
              </view>
              <view class="info-grid" :class="{ 'info-grid-center': (!point?.wuxing || !store.showWuXing), 'info-grid-meridian-long': isMeridianLong }">
                <view class="info-item">
                  <text class="info-label">所属经络</text>
                  <text class="info-value info-value-center" :class="{ 'info-value-lg': !store.showWuXing || !point?.wuxing }">{{ point?.meridian || '-' }}</text>
                </view>
                <view class="info-item">
                  <text class="info-label">穴位类别</text>
                  <text class="info-value info-value-center" :class="{ 'info-value-lg': !store.showWuXing || !point?.wuxing }">{{ formatCategory(point?.category) || '-' }}</text>
                </view>
                <view v-if="point?.wuxing && store.showWuXing" class="info-item">
                  <text class="info-label">五行属性</text>
                  <text class="info-value info-value-center wuxing-value" :class="{ 'wuxing-value-large': isCategoryLong }" :style="{ color: getWuxingColor(point?.wuxing) }">
                    {{ point.wuxing }}
                  </text>
                </view>
              </view>
            </view>

            <!-- 定位 -->
            <view class="info-section">
              <view class="section-title">
                <view class="title-dot"></view>
                <text>定位</text>
              </view>
              <view class="location-box">
                <text class="location-text">{{ point?.location || '暂无定位信息' }}</text>
              </view>
            </view>

            <!-- 操作方法 -->
            <view class="info-section" v-if="point?.needling || point?.moxibustion">
              <view class="section-title">
                <view class="title-dot"></view>
                <text>操作方法</text>
              </view>
              <view class="method-grid">
                <view v-if="point?.needling" class="method-item">
                  <text class="method-label">🪡 针刺</text>
                  <text class="method-value">{{ point.needling }}</text>
                </view>
                <view v-if="point?.moxibustion" class="method-item">
                  <text class="method-label">🔥 艾灸</text>
                  <text class="method-value">{{ point.moxibustion }}</text>
                </view>
              </view>
            </view>

            <!-- 注意事项 -->
            <view v-if="point?.contraindications" class="caution-box">
              <view class="caution-header">
                <text class="caution-icon">⚠️</text>
                <text class="caution-title">注意事项</text>
              </view>
              <text class="caution-text">{{ point.contraindications }}</text>
            </view>

            <!-- 纳子法补母泻子说明（仅在补母泻子法模式下点击母穴/子穴时显示） -->
            <view v-if="naziBumuTip" class="nazi-bumu-tip">
              <text class="nazi-bumu-tip-text">{{ naziBumuTip }}</text>
            </view>
          </view>

          <DetailThemeDecor variant="body-tail" />
        </scroll-view>
      </template>

      <!-- 空态（防御性）：point 为 null 时展示，与正常态共用关闭按钮 -->
      <template v-else>
        <!-- 统一保留文字叉号作为非水墨主题的可见图形；水墨主题通过 CSS 双笔画重绘，避免字体基线偏移。 -->
        <view class="popup-header">
          <view class="close-btn" role="button" aria-label="关闭穴位详情" @tap="handleClose">
            <text class="close-icon">✕</text>
          </view>
        </view>
        <view class="empty-state">
          <text class="empty-text">穴位信息加载失败</text>
        </view>
      </template>
    </view>
  </view>
</template>


<script setup>
/**
 * PointDetail - 穴位详情弹窗
 *
 * 功能：显示穴位完整信息（经络、五行、定位、操作方法、注意事项）
 *
 * 调用方式：通过 store 控制
 *   store.openDetail(point)  // point 是穴位对象
 *   store.closeDetail()
 *
 * 已知坑：
 *   - 弹窗背景框右边截断：所有卡片需加 box-sizing: border-box; width: 100%; overflow: hidden
 *   - 定位文字换行不美观：用 word-break: normal; overflow-wrap: break-word 避免中途断行
 *   - Android 无原生楷体：已打包内置 kaiti-gb2312.ttf（子集化122KB），通过 @font-face 加载
 *     App端用 #ifdef APP-PLUS，微信小程序用 font-loader.js 加载生成的 base64 模块。详见 index.scss。
 *     font-family fallback 'KaiTi', '楷体', 'STKaiti' 只是兜底，非主方案。
 *   - 单位统一使用 rpx（2026-05-25 从 px 迁移，确保全App单位一致）
 */
import { computed, ref } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { useRootClasses } from '@/composables/useRootClasses.js'
import { getWuxingColor } from '@/utils/wuxing.js'
import { nameGapStyle } from '@/utils/point-name-glyphs.js'
import DetailThemeDecor from '@/components/DetailThemeDecor.vue'

const store = useAppStore()
// 弹窗根 class 与布局同源推导；弹窗无 ink-bg 变量消费规则，显式关闭
const rootClasses = useRootClasses({ inkBackground: false })
const point = computed(() => store.selectedPoint)

// 弹窗穴名按字拆分，便于"陵→泉"这一对单独收紧字距，其余字对保持原字距
const nameChars = computed(() => Array.from(point.value?.name || ''))

// 穴位名逐字间距：按主题字形规则表派发（当前仅 ink「陵泉」收紧），规则见
// utils/point-name-glyphs.js —— 共享组件不感知具体主题的字形癖好。
function pnGapStyle(i, ch) {
  return nameGapStyle(store.activeUiStyle, nameChars.value[i - 1], ch)
}
const watercolorWashes = ['mist', 'peach', 'ocean', 'rose', 'golden', 'shore']

function getSecureRandomIndex(length) {
  // 防御：length 非法（0/负数/非数）时直接返回 0，避免除零产生 NaN 污染调用方
  if (!Number.isInteger(length) || length <= 0) return 0
  const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined

  if (cryptoApi?.getRandomValues) {
    const range = 0x100000000
    const unbiasedLimit = range - (range % length)
    const randomValue = new Uint32Array(1)

    try {
      do {
        cryptoApi.getRandomValues(randomValue)
      } while (randomValue[0] >= unbiasedLimit)
      return randomValue[0] % length
    } catch (e) {
      // 部分 App WebView 暴露 crypto.getRandomValues 但调用会抛错；
      // 落入下方兼容回退，而不是让整个穴位详情弹窗渲染失败。
      console.warn('[PointDetail] Web Crypto 不可用，使用时间种子回退', e)
    }
  }

  // 部分小程序/App WebView 不提供 Web Crypto；混合高精度时间作为兼容回退。
  const highResolutionTime = typeof performance !== 'undefined'
    ? Math.floor(performance.now() * 1000)
    : 0
  let seed = (Date.now() ^ highResolutionTime ^ Math.floor(Math.random() * 0xFFFFFFFF)) >>> 0
  seed ^= seed << 13
  seed ^= seed >>> 17
  seed ^= seed << 5
  return (seed >>> 0) % length
}

const watercolorWash = ref(watercolorWashes[getSecureRandomIndex(watercolorWashes.length)])

/**
 * 不在详情弹窗生命周期中调用 uni.hideTabBar / uni.showTabBar。
 *
 * App 原生 TabBar 与 WebView 并非同一渲染层，部分 Android 设备会在弹窗动画
 * 已经开始后才完成 hideTabBar，表现为“弹窗先出现，底栏过一会儿才突然消失”，
 * 容易被误认为动画卡顿。详情遮罩本身已能阻止页面内容交互，因此保持 TabBar
 * 状态不变，避免原生异步显隐破坏动画的连续性。
 */

// 纳子法补母泻子说明文字
const naziBumuTip = computed(() => {
  const t = point.value?.naziType
  if (!t) return ''
  if (t === '母穴（补）') return '此穴为母穴，经脉虚证在经气方衰时取此行补法'
  if (t === '子穴（泻）') return '此穴为子穴，经脉实证在当前时辰取此行泻法'
  return ''
})

// 穴位类别文字是否较长（超过6个字符会换行成两行）
const isCategoryLong = computed(() => {
  const category = point.value?.category || ''
  return category.replace(/、/g, ' ').length > 6
})

// 经络名是否为6字且有五行属性（此时经络框变宽，五行框变窄）
const isMeridianLong = computed(() => {
  const meridian = point.value?.meridian || ''
  return meridian.length === 6 && point.value?.wuxing && store.showWuXing
})

/**
 * 格式化穴位类别
 * 顿号统一改为空格分隔（"井穴、输穴" → "井穴 输穴"）
 */
function formatCategory(category) {
  if (!category) return ''
  return category.replace(/、/g, ' ')
}

function handleClose() {
  store.closeDetail()
}
</script>

<style lang="scss" scoped>
/* 样式主体见同目录 point-detail-base.scss（与 views/_shared/home-base.scss 同模式，
   经典基线；主题覆盖位于全局 ui-*.scss / themes.scss 命名空间）。 */
@use './point-detail-base.scss' as *;
</style>
