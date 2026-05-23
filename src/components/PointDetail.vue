<template>
  <view v-if="!point" class="overlay" @tap="handleClose">
    <view class="popup" @tap.stop>
      <view class="popup-header">
        <view class="close-btn" @tap="handleClose">
          <text class="close-icon">✕</text>
        </view>
      </view>
      <view class="empty-state">
        <text class="empty-text">穴位信息加载失败</text>
      </view>
    </view>
  </view>
  <view v-else class="overlay" @tap="handleClose">
    <view class="popup" @tap.stop>
      <!-- 头部 -->
      <view class="popup-header">
        <view class="header-icon-wrap">
          <text class="header-icon">📍</text>
        </view>
        <view class="close-btn" @tap="handleClose">
          <text class="close-icon">✕</text>
        </view>
        <!-- 穴位名称+编码：绝对定位，独立于图标和关闭按钮 -->
        <view class="header-name-layer">
          <text class="point-name">{{ point?.name }}</text>
          <text class="point-code">{{ point?.code }}</text>
        </view>
      </view>

      <scroll-view scroll-y class="popup-body">
        <!-- 基本信息 -->
        <view class="info-section">
          <view class="section-title">
            <view class="title-dot"></view>
            <text>基本信息</text>
          </view>
          <view class="info-grid" :class="{ 'info-grid-center': !point?.wuxing }">
            <view class="info-item">
              <text class="info-label">所属经络</text>
              <text class="info-value info-value-center" :class="{ 'info-value-bold': isCategoryLong }">{{ point?.meridian || '-' }}</text>
            </view>
            <view class="info-item">
              <text class="info-label">穴位类别</text>
              <text class="info-value info-value-center info-value-large">{{ formatCategory(point?.category, point?.wuxing) || '-' }}</text>
            </view>
            <view v-if="point?.wuxing" class="info-item">
              <text class="info-label">五行属性</text>
              <text class="info-value info-value-center wuxing-value" :class="{ 'info-value-small': isCategoryLong }" :style="{ color: getWuxingColor(point?.wuxing) }">
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

        <view style="height: 40rpx;"></view>
      </scroll-view>
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
 *   - 安卓不支持 KaiTi 字体：需加 'STKaiti', '楷体' 作为 fallback
 */
import { computed } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { getWuxingColor } from '@/utils/wuxing.js'

const store = useAppStore()
const point = computed(() => store.selectedPoint)

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

/**
 * 格式化穴位类别
 * 顿号统一改为空格分隔（"井穴、输穴" → "井穴 输穴"）
 */
function formatCategory(category, wuxing) {
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
   ============================================ */

/* CSS 必须用 px 单位（不用 rpx），否则在部分设备上弹窗布局异常（与 CityPicker 同理） */

/* 宋体字体族：正文区域使用，与标题楷体形成"楷题宋文"传统排版 */
$font-songti: 'WenYuanSerifSC', 'SimSun', 'STSong', 'Songti SC', serif;

/* === 遮罩层 === */
.overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 200;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup {
  width: 92%;
  max-height: 85vh;
  background: var(--theme-surface);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
}

.empty-text {
  font-size: 14px;
  color: $tcm-text-hint;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 20px;
  border-bottom: 1px solid var(--theme-border);
  flex-shrink: 0;
  position: relative;
  min-height: 72px;
}

.header-icon-wrap {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--theme-border);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 2;
}

.header-icon {
  font-size: 20px;
}

.header-name-layer {
  position: absolute;
  left: 76px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: baseline;
  gap: 6px;
  z-index: 1;
}

.point-name {
  font-size: 38px;
  font-weight: 700;
  color: var(--theme-text);
  font-family: 'KaitiGB2312', 'KaiTi', '楷体', 'STKaiti', serif;
  line-height: 1.2;
}

.point-code {
  font-size: 10px;
  color: var(--theme-text-hint);
  font-family: monospace;
  letter-spacing: 0.5px;
  transform: translateY(4px);
}

.close-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--theme-surface-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.close-icon {
  font-size: 18px;
  color: var(--theme-text-secondary);
}

.popup-body {
  flex: 1;
  padding: 20px;
  max-height: 65vh;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

/* === 信息区块 === */
.info-section {
  margin-bottom: 20px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: var(--theme-text-secondary);
  font-family: $font-songti;
}

.title-dot {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  background: var(--theme-secondary);
}

.info-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.info-grid-center {
  justify-content: center;
}

.info-grid-center .info-item {
  max-width: 48%;
}

.info-item {
  flex: 1;
  min-width: 80px;
  padding: 12px;
  background: var(--theme-surface-muted);
  border-radius: 12px;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.info-label {
  display: block;
  font-size: 12px;
  color: var(--theme-text-hint);
  margin-bottom: 4px;
  font-family: $font-songti;
}

.info-value {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-text);
  word-break: keep-all;
  font-family: 'WenYuanSerifSC-Bold', 'WenYuanSerifSC', 'SimSun', 'STSong', 'Songti SC', serif;
}

.info-value-bold {
  font-weight: 700;
  font-size: 16px;
}

.info-value-large {
  font-size: 15px;
}

.info-value-small {
  font-size: 13px;
}

.info-value-center {
  text-align: center;
}

.wuxing-value {
  font-size: 20px;
  font-weight: 700;
}

/* === 定位 === */
.location-box {
  padding: 14px;
  background: var(--theme-surface-muted);
  border: 1px solid var(--theme-border);
  border-radius: 12px;
  box-sizing: border-box;
  width: 100%;
  overflow: hidden;
}

.location-text {
  font-size: 15px;
  color: var(--theme-text-secondary);
  line-height: 2;
  letter-spacing: 0.5px;
  word-break: normal;
  overflow-wrap: break-word;
}

/* === 操作方法 === */
.method-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.method-item {
  padding: 14px;
  background: var(--theme-surface-muted);
  border: 1px solid var(--theme-border);
  border-radius: 12px;
  box-sizing: border-box;
  width: 100%;
}

.method-label {
  display: block;
  font-size: 12px;
  color: var(--theme-text-hint);
  margin-bottom: 6px;
  font-family: $font-songti;
}

.method-value {
  display: block;
  font-size: 14px;
  color: var(--theme-text-secondary);
  line-height: 1.7;
  word-break: break-all;
  text-align: justify;
  font-family: $font-songti;
}

/* === 注意事项 === */
.caution-box {
  padding: 14px;
  background: rgba(211, 47, 47, 0.04);
  border: 1px solid rgba(211, 47, 47, 0.15);
  border-radius: 12px;
  box-sizing: border-box;
  width: 100%;
}

.caution-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.caution-icon {
  font-size: 14px;
}

.caution-title {
  font-size: 14px;
  font-weight: 600;
  color: #D32F2F;
  font-family: $font-songti;
}

.caution-text {
  font-size: 13px;
  color: rgba(211, 47, 47, 0.8);
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
  gap: 8rpx;
  padding: 20rpx;
  background: rgba($tcm-text, 0.04);
  border-radius: 14rpx;
  margin-top: $spacing-md;
}

.nazi-bumu-tip-text {
  font-size: 24rpx;
  color: $tcm-text-hint;
}
</style>
