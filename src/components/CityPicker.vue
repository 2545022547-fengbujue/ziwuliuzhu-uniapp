<template>
  <view v-if="show" class="overlay" @tap="handleOverlayTap">
    <view
      class="popup"
      :class="store.activeUiStyle === 'classic' ? `theme-${store.activeTheme}` : `ui-${store.activeUiStyle}`"
      @tap="handlePopupTap"
    >
      <!-- 头部 -->
      <view class="popup-header">
        <text class="popup-title">真太阳时校正</text>
        <view class="close-btn" @tap="handleCancel">
          <text class="close-icon">✕</text>
        </view>
      </view>

      <!-- 搜索框 -->
      <view class="search-section">
        <text class="search-label">搜索城市：</text>
        <view class="search-input-wrapper" @tap="handleInputTap">
          <input
            :focus="inputFocused"
            :value="searchText"
            @input="onSearchInput"
            @blur="onInputBlur"
            type="text"
            placeholder="输入城市名称、拼音或首字母..."
            class="search-input"
          />
        </view>
      </view>

      <!-- 城市列表标签 -->
      <view class="city-list-header">
        <text class="city-list-label">
          {{ searchText ? `搜索结果（${searchResults.length}个）` : `选择省份/地区` }}
        </text>
      </view>

      <scroll-view scroll-y :show-scrollbar="false" class="popup-body">
        <!-- 提示信息 -->
        <view class="tip-box">
          <view class="tip-content">
            <view class="tip-title-row">
              <text class="tip-icon">🌐</text>
              <text class="tip-title">选择离您最近的城市</text>
            </view>
            <text class="tip-desc">系统将使用城市经度计算真太阳时校正。</text>
            <text class="tip-desc">您的位置信息仅用于本地计算，不会上传到任何服务器。</text>
          </view>
        </view>

        <!-- 搜索模式 -->
        <template v-if="searchText">
          <view
            v-for="city in searchResults"
            :key="city.name"
            class="city-item"
            :class="{ selected: selectedCity === city.name }"
            @tap.stop="selectedCity = city.name"
          >
            <view class="city-item-left">
              <text class="city-abbr">{{ (city.abbr || "").toUpperCase() }}</text>
              <text class="city-name-text">{{ city.name }}</text>
              <text class="city-province">（{{ city.province }}）</text>
            </view>
            <text class="city-longitude">{{ Number(city.longitude || 0).toFixed(2) }}°E</text>
          </view>
          <view v-if="searchResults.length === 0" class="empty-tip">
            <text>未找到匹配的城市</text>
          </view>
        </template>

        <!-- 省份分组模式 -->
        <template v-else>
          <view
            v-for="province in provinces"
            :key="province.name"
            class="province-group"
          >
            <view
              class="province-header"
              @tap.stop="toggleProvince(province.name)"
            >
              <view class="province-left">
                <text class="province-arrow" :class="{ expanded: expandedProvinces.includes(province.name) }">▶</text>
                <text class="province-name-text">{{ province.name }}</text>
              </view>
            </view>
            <view v-if="expandedProvinces.includes(province.name)" class="province-cities">
              <view
                v-for="city in province.cities"
                :key="city.name"
                class="city-item city-item-indented"
                :class="{ selected: selectedCity === city.name }"
                @tap.stop="selectedCity = city.name"
              >
                <view class="city-item-left">
                  <text class="city-abbr">{{ (city.abbr || "").toUpperCase() }}</text>
                  <text class="city-name-text">{{ city.name }}</text>
                </view>
                <text class="city-longitude">{{ Number(city.longitude || 0).toFixed(2) }}°E</text>
              </view>
            </view>
          </view>
        </template>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="popup-footer">
        <view class="btn-cancel" @tap="handleCancel">
          <text class="btn-text">取消</text>
        </view>
        <view class="btn-confirm" :class="{ disabled: !selectedCity }" @tap="handleConfirm">
          <text class="btn-text btn-text-white">确定</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
/**
 * CityPicker - 城市选择弹窗组件
 *
 * 功能：弹窗式城市选择器，支持省份分组展开/收起、搜索城市名称/拼音/首字母
 *
 * 调用方式：
 *   <CityPicker ref="cityPickerRef" />
 *   cityPickerRef.value.open((cityData) => { ... })
 *
 * 已知坑：
 *   - uni-app <input> 在 H5 弹窗中无法聚焦，需要用 :focus 绑定 + nextTick 延迟触发
 *   - 不能用 @tap.stop 阻止事件冒泡，否则 input 也无法交互
 *   - CSS 必须用 px 单位（不用 rpx），否则在部分设备上布局异常
 */
import { ref, computed, nextTick, onUnmounted } from 'vue'
import { CITIES, searchCities, PROVINCE_ORDER } from '@/data/city-coordinates.js'
import { useAppStore } from '@/stores/app.js'

const store = useAppStore()
const show = ref(false)
const selectedCity = ref('')
const searchText = ref('')
const expandedProvinces = ref([])

// 控制 input 聚焦状态（关键：uni-app H5 弹窗中 input 聚焦的唯一可靠方案）
const inputFocused = ref(false)

/**
 * 构建省份分组数据（按硬编码顺序排列）
 *
 * 算法说明：
 * 1. 将 CITIES 数组按 province 字段分组到 map 对象
 * 2. 每个省份内部的城市按拼音排序（如：河北的城市按 baoding, cangzhou... 排序）
 * 3. 省份顺序按 PROVINCE_ORDER 硬编码数组排列（而非动态计算）
 *
 * 为什么使用硬编码排序？
 * - 之前尝试动态排序（按省份名称拼音首字母），在微信开发者工具中排序不稳定
 * - 特别行政区偶尔会排在台湾省之后，而非预期的最后一个位置
 * - 硬编码保证排序始终一致：直辖市优先 → 拼音排序省份 → 特别行政区最后
 *
 * @returns {Array} [{ name: '直辖市', cities: [...] }, { name: '安徽省', cities: [...] }, ...]
 */
function buildProvinces() {
  // 步骤1：按省份分组
  const map = {}
  CITIES.forEach(city => {
    if (!map[city.province]) map[city.province] = []
    map[city.province].push(city)
  })

  // 步骤2：每个省份内部的城市按拼音排序
  // 例：河北省的城市按拼音排序为：保定(baoding)、沧州(cangzhou)、承德(chengde)...
  Object.keys(map).forEach(province => {
    map[province].sort((a, b) => a.pinyin.localeCompare(b.pinyin))
  })

  // 步骤3：按 PROVINCE_ORDER 硬编码顺序排列省份
  // PROVINCE_ORDER 定义：直辖市 → 按拼音排序的省份 → 特别行政区
  // filter：只保留数据中实际存在的省份（防止硬编码数组中有废弃省份名）
  return PROVINCE_ORDER
    .filter(name => map[name]) // 只保留数据中存在的省份
    .map(name => ({ name, cities: map[name] }))
}

// 省份数据缓存（模块级单例，只在首次加载时计算一次，避免每次打开弹窗都重新遍历 348 个城市）
const provincesCache = buildProvinces()
const provinces = ref(provincesCache)

const searchResults = computed(() => {
  if (!searchText.value) return []
  return searchCities(searchText.value)
})

// 防止 overlay 点击穿透
const popupTapped = ref(false)
let tapTimer = null
let focusTimer = null
let openTimer = null
let debounceTimer = null

onUnmounted(() => {
  if (tapTimer) clearTimeout(tapTimer)
  if (focusTimer) clearTimeout(focusTimer)
  if (openTimer) clearTimeout(openTimer)
  if (debounceTimer) clearTimeout(debounceTimer)
})

function handleOverlayTap() {
  // 如果不是点击 popup 内部，则关闭
  if (!popupTapped.value) {
    handleCancel()
  }
  popupTapped.value = false
}

function handlePopupTap() {
  // 标记点击了 popup 内部，阻止 overlay 关闭。
  // 挂在 popup 根节点而不是逐个 @tap.stop 子元素：搜索框、tip 区、分组头部等
  // 区域此前没有标记，点击会冒泡到 overlay 被误判为“点击遮罩”而关闭弹窗。
  // 带 @tap.stop 的子元素不会冒泡到 overlay，行为不受影响。
  popupTapped.value = true
  // 延时重置标记
  tapTimer = setTimeout(() => { popupTapped.value = false }, 100)
}

function handleInputTap() {
  // 手动触发聚焦：先重置再设置
  inputFocused.value = false
  nextTick(() => {
    focusTimer = setTimeout(() => {
      inputFocused.value = true
    }, 50)
  })
}

function onSearchInput(e) {
  const value = e.detail.value
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    searchText.value = value
  }, 300)
}

function onInputBlur() {
  inputFocused.value = false
}

function toggleProvince(name) {
  const idx = expandedProvinces.value.indexOf(name)
  if (idx > -1) {
    expandedProvinces.value.splice(idx, 1)
  } else {
    expandedProvinces.value.push(name)
  }
}

let confirmCallback = null

function open(callback) {
  // 防御重入：清理上一次 open/手动聚焦可能残留的定时器，
  // 避免“快速关闭再打开”后旧 timer 在错误的弹窗生命周期内改写状态。
  if (openTimer) { clearTimeout(openTimer); openTimer = null }
  if (focusTimer) { clearTimeout(focusTimer); focusTimer = null }
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }

  show.value = true
  // 打开时预选 store 中已保存的城市，用户可直接确认；搜索模式会按输入重新选中。
  selectedCity.value = store.selectedCity || ''
  searchText.value = ''
  expandedProvinces.value = []
  inputFocused.value = false
  confirmCallback = callback
  // 延迟聚焦：确保 DOM 渲染完成
  nextTick(() => {
    openTimer = setTimeout(() => {
      inputFocused.value = true
    }, 300)
  })
}

function close() {
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
  if (openTimer) { clearTimeout(openTimer); openTimer = null }
  if (focusTimer) { clearTimeout(focusTimer); focusTimer = null }
  inputFocused.value = false
  show.value = false
  selectedCity.value = ''
  searchText.value = ''
  expandedProvinces.value = []
  confirmCallback = null
}

function handleConfirm() {
  if (!selectedCity.value) return
  const cityData = CITIES.find(c => c.name === selectedCity.value)
  if (cityData && confirmCallback) {
    confirmCallback(cityData)
  }
  close()
}

function handleCancel() {
  close()
}

const isOpen = computed(() => show.value)

defineExpose({ open, close, isOpen })
</script>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup {
  width: 88%;
  max-height: 85vh;
  background: var(--theme-surface);
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px var(--theme-shadow);
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--theme-border);
  flex-shrink: 0;
}

.popup-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--theme-text);
}

.close-btn {
  background: none !important;
  border: none !important;
  width: auto !important;
  height: auto !important;
  border-radius: 0 !important;
  padding: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.close-icon {
  font-size: 18px;
  color: var(--theme-text-secondary);
}

.search-section {
  padding: 12px 20px 8px;
  flex-shrink: 0;
}

.search-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--theme-text);
  margin-bottom: 8px;
}

.search-input-wrapper {
  width: 100%;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  background: var(--theme-surface);
  border: 1px solid var(--theme-border);
  border-radius: 12px;
  font-size: 15px;
  color: var(--theme-text);
  box-sizing: border-box;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.city-list-header {
  padding: 0 20px 4px;
  flex-shrink: 0;
}

.city-list-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--theme-text-secondary);
}

.popup-body {
  flex: 1;
  padding: 0 16px 16px;
  max-height: 50vh;
  width: 100%;
  box-sizing: border-box;
}

/* 隐藏 scroll-view 滚动条（仅H5/App端，微信小程序不支持） */
/* #ifdef H5 */
.popup-body ::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  color: transparent;
}
/* #endif */

/* #ifdef APP-PLUS */
.popup-body ::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
  color: transparent;
}
/* #endif */

.tip-box {
  padding: 14px;
  margin: 8px 0 12px;
  background: var(--theme-surface-muted);
  border: 1px solid var(--theme-border);
  border-radius: 12px;
  box-sizing: border-box;
  width: 100%;
  max-width: 100%;
  overflow: hidden;
}

.tip-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 100%;
  max-width: 100%;
}

.tip-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tip-icon {
  font-size: 18px;
}

.tip-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--theme-text);
}

.tip-desc {
  font-size: 13px;
  color: var(--theme-text-hint);
  line-height: 1.6;
}

.province-group {
  border-bottom: 1px solid var(--theme-border);
}

.province-group:last-child {
  border-bottom: none;
}

.province-header {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  background: var(--theme-surface);
  border-radius: 8px;
}

.province-header:active {
  background: var(--theme-surface-muted);
}

.province-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.province-arrow {
  font-size: 10px;
  color: var(--theme-text-hint);
  transition: transform 0.2s;
}

.province-arrow.expanded {
  transform: rotate(90deg);
}

.province-name-text {
  font-size: 15px;
  font-weight: 500;
  color: var(--theme-text);
}

.province-count {
  font-size: 12px;
  color: var(--theme-text-hint);
}

.province-cities {
  background: var(--theme-surface-muted);
}

.city-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid var(--theme-border);
}

.city-item:last-child {
  border-bottom: none;
}

.city-item:active {
  background: var(--theme-surface-muted);
}

.city-item.selected {
  background: var(--theme-border);
}

.city-item-indented {
  padding-left: 40px;
}

.city-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.city-abbr {
  font-size: 11px;
  color: var(--theme-text-hint);
  width: 30px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 1;
  flex-shrink: 0;
}

.city-name-text {
  font-size: 15px;
  color: var(--theme-text);
}

.city-province {
  font-size: 11px;
  color: var(--theme-text-hint);
}

.city-longitude {
  font-size: 11px;
  color: var(--theme-text-hint);
}

.empty-tip {
  padding: 30px 0;
  text-align: center;
  font-size: 15px;
  color: var(--theme-text-hint);
}

.popup-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid var(--theme-border);
  flex-shrink: 0;
}

.btn-cancel {
  padding: 10px 24px;
  border-radius: 12px;
  background: var(--theme-surface-muted);
}

.btn-cancel:active {
  opacity: 0.7;
}

.btn-confirm {
  padding: 10px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary-dark) 100%);
}

.btn-confirm.disabled {
  opacity: 0.5;
}

.btn-confirm:active {
  opacity: 0.85;
}

.btn-text {
  font-size: 15px;
  color: var(--theme-text-secondary);
  font-weight: 500;
}

.btn-text-white {
  color: #fff;
}
</style>
