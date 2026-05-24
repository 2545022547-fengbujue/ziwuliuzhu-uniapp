<template>
  <view class="time-picker-overlay" @tap="close">
    <view class="time-picker-panel" :class="`theme-${store.activeTheme}`" @tap.stop>
      <!-- 标题 -->
      <view class="picker-title">
        <text>选择时辰</text>
      </view>

      <!-- 时辰列表 -->
      <scroll-view scroll-y class="hour-list">
        <view
          v-for="(hour, idx) in hourOptions"
          :key="idx"
          class="hour-item"
          :class="{ selected: idx === selectedIndex }"
          @tap="selectHour(idx)"
        >
          <text class="hour-text">{{ hour.label }}</text>
        </view>
      </scroll-view>

      <!-- 操作按钮 -->
      <view class="action-row">
        <view class="action-btn cancel" @tap="close">
          <text>取消</text>
        </view>
        <view class="action-btn confirm" @tap="confirm">
          <text>确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { HOUR_OPTIONS } from '@/utils/date.js'

const store = useAppStore()

const props = defineProps({
  value: { type: Number, default: 0 }  // 时辰索引 0-11
})

const emit = defineEmits(['change', 'close'])

const hourOptions = HOUR_OPTIONS
const selectedIndex = ref(props.value)

function selectHour(idx) {
  selectedIndex.value = idx
}

function close() {
  emit('close')
}

function confirm() {
  emit('change', selectedIndex.value)
  emit('close')
}
</script>

<style lang="scss" scoped>
.time-picker-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 500;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.time-picker-panel {
  width: 80%;
  max-width: 320px;
  max-height: 70vh;
  background: var(--theme-surface);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 8px 30px var(--theme-shadow);
  display: flex;
  flex-direction: column;
}

.picker-title {
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--theme-border);
  text {
    font-size: 18px;
    font-weight: 600;
    color: var(--theme-primary);
  }
}

.hour-list {
  flex: 1;
  max-height: 300px;
  padding: 8px 0;
}

.hour-item {
  padding: 12px 16px;
  margin: 4px 0;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: var(--theme-surface-muted);
  }

  &.selected {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%);
    .hour-text {
      color: var(--theme-surface);
      font-weight: 600;
    }
  }
}

.hour-text {
  font-size: 15px;
  color: var(--theme-text);
}

.action-row {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--theme-border);
}

.action-btn {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;

  &.cancel {
    background: var(--theme-surface-muted);
    text { color: var(--theme-text-secondary); }
  }

  &.confirm {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%);
    text { color: var(--theme-surface); font-weight: 600; }
  }
}

/* 深色主题特殊样式 */
.theme-black {
  /* #ifndef MP-WEIXIN */
  .time-picker-panel {
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }
  /* #endif */

  // 选中项高亮：电蓝色边框 + 透明背景
  .hour-item.selected {
    background: rgba(0, 128, 255, 0.25) !important;
    border: 1px solid rgba(0, 128, 255, 0.6) !important;
    .hour-text {
      color: #0080FF !important;
    }
  }

  /* #ifndef MP-WEIXIN */
  .hour-item:hover {
    background: rgba(0, 128, 255, 0.15);
  }
  /* #endif */
}
</style>