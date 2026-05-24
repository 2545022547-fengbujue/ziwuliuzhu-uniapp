<template>
  <!--
    TimePicker.vue - 时辰选择面板（H5/App端专用）

    功能：
    - 显示12时辰选项（子丑寅卯辰巳午未申酉戌亥）
    - 每个时辰显示名称和时间段（如"子时（23:00-01:00）"）
    - 选中时辰高亮显示，当前时辰特殊标记

    调用方式：
    <TimePicker :value="selectedHourIndex" @change="onHourChange" @close="showTimePicker = false" />

    条件编译：
    - 仅在 H5 和 App 端使用（微信小程序用原生 picker）
    - 通过 #ifndef MP-WEIXIN 控制是否渲染此组件

    已知坑：
    - 微信小程序不支持 backdrop-filter，需用条件编译排除
    - 暗夜幽光主题选中项需用电蓝色边框提高对比度
  -->
  <view class="time-picker-overlay" @tap="close">
    <view class="time-picker-panel" :class="`theme-${store.activeTheme}`" @tap.stop>
      <!-- 标题 -->
      <view class="picker-title">
        <text>选择时辰</text>
      </view>

      <!-- 时辰列表（可滚动） -->
      <scroll-view scroll-y class="hour-list">
        <view
          v-for="(hour, idx) in hourOptions"
          :key="idx"
          class="hour-item"
          :class="{ selected: idx === selectedIndex }"
          @tap="selectHour(idx)"
        >
          <!-- hour.label 格式："子时（23:00-01:00）" -->
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
/**
 * TimePicker - 时辰选择面板
 *
 * 核心逻辑：
 * 1. 从 date.js 导入 HOUR_OPTIONS（12时辰名称和时间范围）
 * 2. 点击时辰项更新 selectedIndex
 * 3. 确认时返回时辰索引（0-11）给父组件
 *
 * 数据来源：
 * - HOUR_OPTIONS 定义在 src/utils/date.js
 * - 格式：[{ label: '子时（23:00-01:00）', value: 0 }, ...]
 */
import { ref } from 'vue'
import { useAppStore } from '@/stores/app.js'
import { HOUR_OPTIONS } from '@/utils/date.js'

const store = useAppStore()

/**
 * 接收父组件传入的当前时辰索引
 * @param {number} value - 时辰索引 0-11（0=子时, 1=丑时, ..., 11=亥时）
 */
const props = defineProps({
  value: { type: Number, default: 0 }
})

// 事件：change 确认选择时触发，close 关闭面板时触发
const emit = defineEmits(['change', 'close'])

// 从 date.js 导入的12时辰选项数组
const hourOptions = HOUR_OPTIONS

// 当前选中的时辰索引（初始值从 props 传入）
const selectedIndex = ref(props.value)

/**
 * 点击时辰项
 * @param {number} idx - 时辰索引 0-11
 */
function selectHour(idx) {
  selectedIndex.value = idx
}

/**
 * 关闭面板（取消选择）
 */
function close() {
  emit('close')
}

/**
 * 确认选择：返回时辰索引给父组件
 */
function confirm() {
  emit('change', selectedIndex.value)
  emit('close')
}
</script>

<style lang="scss" scoped>
/*
 * TimePicker 样式说明
 *
 * 主题适配：
 * - 通过 :class="`theme-${store.activeTheme}`" 动态切换主题
 * - 默认主题使用 CSS 变量（--theme-*）
 * - 暗夜幽光主题（theme-black）需要特殊处理：
 *   - 毛玻璃效果（微信小程序不支持）
 *   - 选中项使用电蓝色边框提高对比度
 */

/* 全屏遮罩层 */
.time-picker-overlay {
  position: fixed;
  top: 0; left: 0; width: 100%; height: 100%;
  z-index: 500;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 时辰选择面板主体 */
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

/* 标题行 */
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

/* 时辰列表（可滚动，最大高度300px） */
.hour-list {
  flex: 1;
  max-height: 300px;
  padding: 8px 0;
}

/* 单个时辰项 */
.hour-item {
  padding: 12px 16px;
  margin: 4px 0;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;

  /* hover 效果 */
  &:hover {
    background: var(--theme-surface-muted);
  }

  /* 选中时辰：渐变背景 + 白色文本 */
  &.selected {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%);
    .hour-text {
      color: var(--theme-surface);
      font-weight: 600;
    }
  }
}

/* 时辰文本 */
.hour-text {
  font-size: 15px;
  color: var(--theme-text);
}

/* 操作按钮行 */
.action-row {
  display: flex;
  gap: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--theme-border);
}

/* 操作按钮基础样式 */
.action-btn {
  flex: 1;
  padding: 10px;
  border-radius: 12px;
  text-align: center;
  cursor: pointer;

  /* 取消按钮 */
  &.cancel {
    background: var(--theme-surface-muted);
    text { color: var(--theme-text-secondary); }
  }

  /* 确认按钮：渐变背景 */
  &.confirm {
    background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%);
    text { color: var(--theme-surface); font-weight: 600; }
  }
}

/*
 * 暗夜幽光主题特殊样式
 *
 * 特点：
 * - 毛玻璃效果（backdrop-filter）
 * - 选中项使用电蓝色边框（而非渐变背景）提高对比度
 * - 微信小程序不支持 backdrop-filter，需条件编译排除
 */
.theme-black {
  /* #ifndef MP-WEIXIN */
  .time-picker-panel {
    /* 深色半透明背景 + 模糊效果 */
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.35);
  }
  /* #endif */

  /*
   * 选中项样式（暗夜幽光主题专用）
   *
   * 问题背景：默认的渐变背景在深色模式下对比度低，用户难以辨识选中项
   * 解决方案：用电蓝色边框 + 半透明背景替代渐变
   *
   * 样式说明：
   * - background: rgba(0, 128, 255, 0.25) — 电蓝色半透明背景
   * - border: 1px solid rgba(0, 128, 255, 0.6) — 电蓝色边框（更亮）
   * - color: #0080FF — 电蓝色文本（高对比度）
   */
  .hour-item.selected {
    background: rgba(0, 128, 255, 0.25) !important;
    border: 1px solid rgba(0, 128, 255, 0.6) !important;
    .hour-text {
      color: #0080FF !important;
    }
  }

  /* hover 效果：电蓝色半透明 */
  /* #ifndef MP-WEIXIN */
  .hour-item:hover {
    background: rgba(0, 128, 255, 0.15);
  }
  /* #endif */
}
</style>