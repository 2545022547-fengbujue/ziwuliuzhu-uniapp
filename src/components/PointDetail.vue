<template>
  <!-- 空态（防御性：selectPoint 总是先设 point 再 showDetail，正常流程不可达）与正常态共用同一
       overlay/popup 骨架，内部仅按 point 有无切换，避免两套弹窗骨架重复维护。 -->
  <view class="overlay" @tap="handleClose">
    <view
      class="popup"
      :class="[store.activeUiStyle === 'classic' ? `theme-${store.activeTheme}` : `ui-${store.activeUiStyle}`, `watercolor-wash-${watercolorWash}`]"
      @tap.stop
    >
      <view v-if="store.activeUiStyle === 'watercolor'" class="watercolor-wash-layer watercolor-wash-primary"></view>
      <view v-if="store.activeUiStyle === 'watercolor'" class="watercolor-wash-layer watercolor-wash-secondary"></view>
      <view v-if="store.activeUiStyle === 'watercolor'" class="watercolor-paper-texture"></view>

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

          <!-- 动物岛主题底部场景：角色固定在详情卡右下角，草地与海浪补足原来的空白。 -->
          <view v-if="store.activeUiStyle === 'animal'" class="animal-detail-scene" aria-hidden="true">
            <view class="animal-scene-cloud cloud-one"></view>
            <view class="animal-scene-cloud cloud-two"></view>
            <view class="animal-scene-sun"></view>
            <view class="animal-scene-tree tree-left"><view></view><view></view><text></text></view>
            <view class="animal-scene-tree tree-mid"><view></view><view></view><text></text></view>
            <view class="animal-scene-wave wave-back"></view>
            <view class="animal-scene-wave wave-front"></view>
            <view class="animal-scene-grass"></view>
            <view class="animal-mascot-corner">
              <AnimalMascot :variant="animalMascot.id" />
            </view>
          </view>

          <view v-else style="height: 80rpx;"></view>
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
import { getWuxingColor } from '@/utils/wuxing.js'
import AnimalMascot from '@/components/AnimalMascot.vue'

const store = useAppStore()
const point = computed(() => store.selectedPoint)

// 弹窗穴名按字拆分，便于"陵→泉"这一对单独收紧字距，其余字对保持原字距
const nameChars = computed(() => Array.from(point.value?.name || ''))

// 仅在水墨主题、且上一字为"陵"且当前字为"泉"时额外负 margin 收拢该字对；其它情况不加
function pnGapStyle(i, ch) {
  if (store.activeUiStyle === 'ink' && i > 0 && nameChars.value[i - 1] === '陵' && ch === '泉') {
    return 'margin-left:-10rpx'
  }
  return ''
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
 * 动物主题守护角色池。
 *
 * - 组件只在 App/H5 独立外观生效，小程序会回退经典主题，不承担兼容成本；
 * - 随机值在 PointDetail 创建时确定，因此同一次弹窗滚动或响应式重绘不会换角色；
 * - 角色仅作右下角静态装饰，不承载穴位语义，也不加入循环动画，避免干扰正文阅读。
 */
const animalMascots = [
  { id: 'rabbit' },
  { id: 'cat' },
  { id: 'dog' },
  { id: 'deer' },
  { id: 'squirrel' },
  { id: 'owl' }
]
const animalMascot = ref(animalMascots[getSecureRandomIndex(animalMascots.length)])

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
/* ============================================
   PointDetail - 穴位详情弹窗样式

   布局说明：
   - overlay：fixed 全屏遮罩
   - popup：居中弹窗容器，flex column
   - popup-header：顶部固定区域（名称+代码+关闭按钮）
   - popup-body：可滚动内容区（基本信息、定位、操作方法等）

   重要：所有卡片容器必须加 box-sizing: border-box; width: 100%; overflow: hidden
         否则在 uni-app H5 模式下会出现右边截断的问题

   单位：全部使用 rpx（2026-05-25 从 px 迁移，确保与全App一致）
   ============================================ */

/* 宋体字体族：正文区域使用，与标题楷体形成"楷题宋文"传统排版 */
$font-songti: 'WenYuanSerifSC', 'SimSun', 'STSong', 'Songti SC', serif;

/* === 遮罩层 === */
.overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup {
  width: 92%;
  max-height: 85vh;
  background: var(--theme-surface);
  border-radius: 48rpx;
  display: flex;
  flex-direction: column;
  box-shadow: 0 16rpx 60rpx rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 120rpx 40rpx;
}

.empty-text {
  font-size: 28rpx;
  color: var(--theme-text-hint, #999999);
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 48rpx 40rpx;
  border-bottom: 2rpx solid var(--theme-border);
  flex-shrink: 0;
  position: relative;
  min-height: 144rpx;
}

.header-icon-wrap {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: var(--theme-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 2;
}

.header-icon {
  font-size: 40rpx;
}

.header-name-layer {
  position: absolute;
  left: 152rpx;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  z-index: 1;
}

.point-name {
  font-size: 76rpx;
  font-weight: 700;
  color: var(--theme-text);
  font-family: 'KaitiGB2312', 'WenYuanSerifSC', 'KaiTi', '楷体', 'STKaiti', serif;
  line-height: 1.2;
  // 字距改按字拆分的精准方案：仅"陵→泉"一对额外收拢（见 pnGapStyle），其余字对保持原字距；
  // 华文行楷基线偏高所需的 letter-spacing/translateY 微调仅水墨主题需要，已移至 ui-ink.scss 的 .popup .point-name
}

.point-code {
  font-size: 20rpx;
  color: var(--theme-text-hint);
  font-family: monospace;
  letter-spacing: 1rpx;
  transform: translateY(8rpx);
}

.close-btn {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: var(--theme-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.92);
  }
}

.close-icon {
  font-size: 36rpx;
  color: var(--theme-text-secondary);
}

.popup-body {
  flex: 1;
  padding: 0;
  max-height: 65vh;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.popup-body-content {
  width: 100%;
  padding: 40rpx;
  box-sizing: border-box;
}

/* === 动物主题：详情底部岛屿场景与右下角随机守护动物 === */
.animal-detail-scene {
  position: relative;
  height: 300rpx;
  width: 100%;
  margin: 16rpx 0 0;
  overflow: hidden;
}

.animal-mascot-corner {
  position: absolute;
  right: 18rpx;
  bottom: 12rpx;
  z-index: 6;
  display: flex;
  align-items: flex-end;
}

.animal-scene-sun {
  position: absolute;
  top: 30rpx;
  right: 80rpx;
  width: 74rpx;
  height: 74rpx;
  border-radius: 50%;
}

.animal-scene-cloud {
  position: absolute;
  z-index: 1;
  width: 92rpx;
  height: 28rpx;
  border-radius: 999rpx;
}
.animal-scene-cloud::before,
.animal-scene-cloud::after {
  content: '';
  position: absolute;
  bottom: 0;
  border-radius: 50%;
  background: inherit;
}
.animal-scene-cloud::before { left: 16rpx; width: 42rpx; height: 42rpx; }
.animal-scene-cloud::after { right: 12rpx; width: 32rpx; height: 32rpx; }
.cloud-one { top: 42rpx; left: 52rpx; }
.cloud-two { top: 100rpx; left: 230rpx; transform: scale(.72); opacity: .72; }

.animal-scene-tree {
  position: absolute;
  z-index: 3;
  bottom: 64rpx;
  width: 98rpx;
  height: 134rpx;
}
.animal-scene-tree view {
  position: absolute;
  left: 50%;
  width: 86rpx;
  height: 72rpx;
  border-radius: 50%;
  transform: translateX(-50%);
}
.animal-scene-tree view:first-child { top: 0; }
.animal-scene-tree view:nth-child(2) { top: 38rpx; width: 98rpx; }
.animal-scene-tree text {
  position: absolute;
  left: 50%;
  bottom: 0;
  width: 18rpx;
  height: 58rpx;
  transform: translateX(-50%);
}
.tree-left { left: 26rpx; transform: scale(.88); }
.tree-mid { left: 142rpx; bottom: 56rpx; transform: scale(.62); }

.animal-scene-wave {
  position: absolute;
  left: -5%;
  width: 110%;
  border-radius: 50% 50% 0 0;
}
.wave-back { z-index: 2; bottom: 34rpx; height: 112rpx; }
.wave-front { z-index: 4; bottom: -28rpx; height: 94rpx; }
.animal-scene-grass {
  position: absolute;
  left: -4%;
  bottom: 38rpx;
  z-index: 5;
  width: 108%;
  height: 70rpx;
  border-radius: 52% 48% 20% 18%;
}

/* === 信息区块 === */
.info-section {
  margin-bottom: 40rpx;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 24rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: var(--theme-text-secondary);
  font-family: $font-songti;
}

.title-dot {
  width: 8rpx;
  height: 32rpx;
  border-radius: 4rpx;
  background: var(--theme-secondary);
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20rpx;
}

.info-grid-center {
  justify-content: center;
}

.info-grid-center .info-item {
  max-width: 48%;
}

/* 经络框默认加长，方便显示较长经络名 */
.info-item:first-child {
  flex: 1.15;
}

/* 经络6字且有五行时，经络框进一步变宽，五行框变窄 */
.info-grid-meridian-long .info-item:first-child {
  flex: 1.3;
}
.info-grid-meridian-long .info-item:last-child {
  flex: 0.7;
}

.info-item {
  flex: 1;
  min-width: 160rpx;
  padding: 24rpx;
  background: var(--theme-surface-muted);
  border-radius: 24rpx;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.info-label {
  display: block;
  font-size: 24rpx;
  color: var(--theme-text-hint);
  margin-bottom: 8rpx;
  font-family: $font-songti;
}

.info-value {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  color: var(--theme-text);
  word-break: keep-all;
  font-family: 'WenYuanSerifSC-Bold', 'WenYuanSerifSC', 'SimSun', 'STSong', 'Songti SC', serif;
}

.info-value-center {
  text-align: center;
}

// 所属经络 / 穴位类别的值字号放大
.info-value-lg {
  font-size: 40rpx;
}

.wuxing-value {
  font-size: 32rpx;
  font-weight: 700;
}

/* 类别文字较长时，五行属性字号放大 */
.wuxing-value-large {
  font-size: 36rpx;
}

/* === 定位 === */
.location-box {
  padding: 28rpx;
  background: var(--theme-surface-muted);
  border: 2rpx solid var(--theme-border);
  border-radius: 24rpx;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

.location-text {
  font-size: 30rpx;
  color: var(--theme-text-secondary);
  line-height: 2;
  letter-spacing: 1rpx;
  word-break: normal;
  overflow-wrap: break-word;
}

/* === 操作方法 === */
.method-grid {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.method-item {
  padding: 28rpx;
  background: var(--theme-surface-muted);
  border: 2rpx solid var(--theme-border);
  border-radius: 24rpx;
  box-sizing: border-box;
  width: 100%;
}

.method-label {
  display: block;
  font-size: 24rpx;
  color: var(--theme-text-hint);
  margin-bottom: 12rpx;
  font-family: $font-songti;
}

.method-value {
  display: block;
  font-size: 28rpx;
  color: var(--theme-text-secondary);
  line-height: 1.7;
  word-break: break-all;
  text-align: justify;
  font-family: $font-songti;
}

/* === 注意事项 === */
.caution-box {
  padding: 28rpx;
  background: rgba($tcm-red, 0.04);
  border: 2rpx solid rgba($tcm-red, 0.15);
  border-radius: 24rpx;
  box-sizing: border-box;
  width: 100%;
}

.caution-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.caution-icon {
  font-size: 28rpx;
}

.caution-title {
  font-size: 28rpx;
  font-weight: 600;
  color: $tcm-red;
  font-family: $font-songti;
}

.caution-text {
  font-size: 26rpx;
  color: rgba($tcm-red, 0.8);
  line-height: 1.7;
  word-break: break-all;
  text-align: justify;
  font-family: $font-songti;
}

/* === 纳子法补母泻子说明 === */
.nazi-bumu-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 20rpx;
  background: var(--theme-surface-muted);
  border-radius: 28rpx;
  margin-top: $spacing-md;
}

.nazi-bumu-tip-text {
  font-size: 24rpx;
  color: var(--theme-text-hint, #999999);
}
</style>
