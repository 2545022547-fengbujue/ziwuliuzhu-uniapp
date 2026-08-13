<template>
  <!--
    ThemeSwitch - 主题化开关（原生 switch 与水墨自定义开关的统一抽象）

    ============================================================
    设计说明（给后来者/AI）
    ============================================================
    1. 背景：设置页 6 处开关行中，水墨(ink)主题使用自定义 .ink-switch（view 实现，
       样式在 ui-ink.scss 的 .ui-ink 命名空间内），其余主题使用原生 <switch>。
       此前每套设置页组件都要分别写两套开关，随 SettingLayout 收敛统一为本组件。
    2. 行为：无论哪种形态，对外统一 emit('change', { detail: { value } })，
       与原生 switch 的事件形状一致，父组件（onSolarTimeToggle 等）无需区分来源。
       - 原生 switch：透传 @change
       - ink 自定义开关：点击时以当前 checked 取反构造事件
    3. 形态判定：内部按 store.activeUiStyle === 'ink' 决定，复用注入的 setting.store，
       不在父组件重复判断主题类型（收敛点）。
    ============================================================
  -->
  <switch
    v-if="!isInk"
    :checked="checked"
    @change="onNativeChange"
    :color="setting.store.themeSwitchColor"
  />
  <view
    v-else
    class="ink-switch"
    :class="{ active: checked }"
    @tap="onInkTap"
  >
    <view class="ink-switch-track"></view>
    <view class="ink-switch-knob"></view>
  </view>
</template>

<script setup>
import { computed } from 'vue'
import { useSetting } from '@/composables/useSettingPage.js'

const props = defineProps({
  checked: { type: Boolean, default: false }
})
const emit = defineEmits(['change'])

const setting = useSetting()
const isInk = computed(() => setting.store.activeUiStyle === 'ink')

/** 原生 switch 事件透传 */
function onNativeChange(e) {
  emit('change', e)
}

/** 水墨自定义开关：点击取反，构造与原生一致的事件对象 */
function onInkTap() {
  emit('change', { detail: { value: !props.checked } })
}
</script>
