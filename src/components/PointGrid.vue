<template>
  <!--
    穴位网格按钮组（PointGrid）
    渲染一组可点击的穴位按钮（穴名 + 编码 + 五行标签），点击打开穴位详情弹窗。

    抽取动机：ResultPanel 中「合日互用开穴 / 补母泻子开穴 / 普通开穴」三处网格
    模板与样式逐字重复，统一收敛到本组件，业务改动只需改一处。

    Props：
      - points   (Array, 必填): 平铺的穴位对象数组 [{ name, code, wuxing, ... }]
                                （补母泻子需先在外层把 { point } 包装映射为 point 本身）
      - keyPrefix (String, 默认 'pt'): v-for key 前缀，避免同一面板多网格 key 冲突

    样式说明：网格/按钮/五行标签样式在本组件 scoped 内维护；
    主题差异（.ui-ink .point-btn 等）由全局 ui-*.scss 后代选择器覆盖，结构未变仍可命中。
  -->
  <view class="points-grid">
    <view
      v-for="(point, idx) in points"
      :key="`${keyPrefix}-${idx}-${point.code || ''}`"
      class="point-btn"
      :class="{ 'point-btn-code-hidden': !store.showPointCode, 'point-btn-wuxing-hidden': !store.showWuXing }"
      @tap="store.selectPoint(point)"
    >
      <text class="point-name" :class="{ 'name-long': (point.name || '').length >= 3 }">{{ point.name }}</text>
      <text v-if="store.showPointCode" class="point-code">{{ point.code }}</text>
      <view v-if="store.showWuXing && point.wuxing" class="wuxing-tag" :style="getWuxingStyle(point.wuxing)">
        <text class="wuxing-text" :style="{ color: getWuxingColor(point.wuxing) }">{{ point.wuxing }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { useAppStore } from '@/stores/app.js'
import { getWuxingStyle, getWuxingColor } from '@/utils/wuxing.js'

defineProps({
  points: { type: Array, required: true },
  keyPrefix: { type: String, default: 'pt' }
})

const store = useAppStore()
</script>

<style lang="scss" scoped>
/* === 穴位网格 ===
 * 主面板和纵向对比面板统一使用三列，不再让 flex 根据文字宽度自行换行。
 * minmax(0, 1fr) 很重要：允许包含三字穴位名、编码和五行标签的网格项真正收缩，
 * 避免某个按钮的内容宽度把整列撑开，重新形成“2 + 2 + 1”的不规则排列。
 */
.points-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12rpx;
  align-items: stretch;
}

.point-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6rpx;
  width: 100%;
  min-width: 0;
  min-height: 84rpx;
  padding: 12rpx 10rpx;
  box-sizing: border-box;
  overflow: hidden;

  /* ============================================
     主题令牌（渐进式迁移）
     经典四色：不声明下表变量，走回退值（--theme-* 派生）；
     ui-* 主题：只声明变量，不再整块覆盖结构属性（无需 !important，
     自定义属性没有特异性竞争——scoped 基线只消费、不声明同名变量）。
     迁移配方：background→--point-btn-bg；border→--point-btn-border；
     border-radius→--point-btn-radius；box-shadow→--point-btn-shadow；
     backdrop-filter→--point-btn-backdrop；:active 背景→--point-btn-active-bg。
     ============================================ */
  background: var(--point-btn-bg, var(--theme-surface-muted));
  border: var(--point-btn-border, none);
  border-radius: var(--point-btn-radius, 20rpx);
  box-shadow: var(--point-btn-shadow, none);
  backdrop-filter: var(--point-btn-backdrop, none);
  transition: all 0.25s ease;

  &:active {
    transform: scale(0.96);
    opacity: 0.85;
    /* 未声明 active 令牌的主题：按下保持常态背景（与令牌化前行为一致） */
    background: var(--point-btn-active-bg, var(--point-btn-bg, var(--theme-surface-muted)));
  }
}

.point-name {
  flex-shrink: 0;
  font-size: 38rpx;
  font-weight: 700;
  color: var(--theme-primary);
  font-family: 'SimSun', '宋体', 'Noto Serif SC', serif;
  line-height: 1.2;
  white-space: nowrap;
}

// 三字及以上穴名（如三阴交）在默认布局下易把五行属性挤出，缩小字号
.point-name.name-long {
  font-size: 32rpx;
}

// 只关闭穴位编码时：取穴结果字号（用户指定）二字名 42rpx、三字名 36rpx
// 注意：这是「仅关编码、五行仍显示」这一态；编码+五行都关仍走下方 42rpx 规则，不受影响。
.point-btn.point-btn-code-hidden .point-name {
  font-size: 42rpx;
}
.point-btn.point-btn-code-hidden .point-name.name-long {
  font-size: 36rpx;
}

// 不显示五行属性时：二字名放大到 50rpx，三字名放大到 48rpx
.point-btn.point-btn-wuxing-hidden .point-name {
  font-size: 50rpx;
}
.point-btn.point-btn-wuxing-hidden .point-name.name-long {
  font-size: 46rpx;
}

// 编码与五行属性都关闭时，统一放大到 46rpx（二字、三字一致）
.point-btn.point-btn-code-hidden.point-btn-wuxing-hidden .point-name {
  font-size: 42rpx;
}
.point-btn.point-btn-code-hidden.point-btn-wuxing-hidden .point-name.name-long {
  font-size: 42rpx;
}

.point-code {
  min-width: 0;
  font-size: 16rpx;
  color: var(--theme-text-hint);
  line-height: 1.2;
  white-space: nowrap;
}

.wuxing-tag {
  flex-shrink: 0;
  padding: 2rpx 7rpx;
  border-radius: $radius-sm;
}

.wuxing-text {
  font-size: 20rpx;
  font-weight: 500;
  font-family: 'WenYuanSerifSC-Bold', 'WenYuanSerifSC', 'SimSun', 'STSong', 'Songti SC', serif;
}
</style>
