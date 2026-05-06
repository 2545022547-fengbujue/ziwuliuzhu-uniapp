<template>
  <view v-if="show" class="overlay" @tap="handleOverlayTap">
    <view class="popup" @tap="handlePopupTap">
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
          {{ searchText ? `搜索结果（${searchResults.length}个）` : `选择省份/地区（${provinces.length}个）` }}
        </text>
      </view>

      <scroll-view scroll-y class="popup-body">
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
              <text class="city-abbr">{{ city.abbr.toUpperCase() }}</text>
              <text class="city-name-text">{{ city.name }}</text>
              <text class="city-province">（{{ city.province }}）</text>
            </view>
            <text class="city-longitude">{{ city.longitude.toFixed(2) }}°E</text>
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
                <text class="province-count">（{{ province.cities.length }}个）</text>
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
                  <text class="city-abbr">{{ city.abbr.toUpperCase() }}</text>
                  <text class="city-name-text">{{ city.name }}</text>
                </view>
                <text class="city-longitude">{{ city.longitude.toFixed(2) }}°E</text>
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
import { CITIES, searchCities } from '@/data/city-coordinates.js'

const show = ref(false)
const selectedCity = ref('')
const searchText = ref('')
const expandedProvinces = ref([])

// 控制 input 聚焦状态（关键：uni-app H5 弹窗中 input 聚焦的唯一可靠方案）
const inputFocused = ref(false)

// 模块级缓存：省份分组数据在应用生命周期内不会变化
let _provincesCache = null
function buildProvinces() {
  if (_provincesCache) return _provincesCache
  const map = {}
  CITIES.forEach(city => {
    if (!map[city.province]) map[city.province] = []
    map[city.province].push(city)
  })
  _provincesCache = Object.entries(map)
    .map(([name, cities]) => ({
      name,
      cities: cities.sort((a, b) => a.pinyin.localeCompare(b.pinyin))
    }))
    .sort((a, b) => {
      if (a.name === '直辖市') return -1
      if (b.name === '直辖市') return 1
      return a.name.localeCompare(b.name)
    })
  return _provincesCache
}

const provinces = computed(() => buildProvinces())

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

function handlePopupTap(e) {
  // 标记点击了 popup 内部，阻止 overlay 关闭
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
  show.value = true
  selectedCity.value = ''
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

defineExpose({ open, close })
</script>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 200;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
}

.popup {
  width: 88%;
  max-height: 85vh;
  background: #FFFDF5;
  border-radius: 24px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.18);
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(139, 69, 19, 0.1);
  flex-shrink: 0;
}

.popup-title {
  font-size: 18px;
  font-weight: 700;
  color: #2C2C2C;
}

.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(139, 69, 19, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-icon {
  font-size: 16px;
  color: #666;
}

.search-section {
  padding: 12px 20px 8px;
  flex-shrink: 0;
}

.search-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2C2C2C;
  margin-bottom: 8px;
}

.search-input-wrapper {
  width: 100%;
}

.search-input {
  width: 100%;
  height: 44px;
  padding: 0 14px;
  background: #fff;
  border: 1px solid rgba(139, 69, 19, 0.2);
  border-radius: 12px;
  font-size: 15px;
  color: #2C2C2C;
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
  color: #666;
}

.popup-body {
  flex: 1;
  padding: 0 16px 16px;
  max-height: 50vh;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.tip-box {
  padding: 14px;
  margin: 8px 0 12px;
  background: rgba(91, 140, 62, 0.06);
  border: 1px solid rgba(91, 140, 62, 0.12);
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
  color: #2C2C2C;
}

.tip-desc {
  font-size: 13px;
  color: rgba(44, 44, 44, 0.55);
  line-height: 1.6;
}

.province-group {
  border-bottom: 1px solid rgba(139, 69, 19, 0.05);
}

.province-group:last-child {
  border-bottom: none;
}

.province-header {
  padding: 14px 16px;
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 8px;
}

.province-header:active {
  background: rgba(139, 69, 19, 0.05);
}

.province-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.province-arrow {
  font-size: 10px;
  color: #999;
  transition: transform 0.2s;
}

.province-arrow.expanded {
  transform: rotate(90deg);
}

.province-name-text {
  font-size: 15px;
  font-weight: 500;
  color: #2C2C2C;
}

.province-count {
  font-size: 12px;
  color: #999;
}

.province-cities {
  background: rgba(139, 69, 19, 0.02);
}

.city-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 13px 16px;
  border-bottom: 1px solid rgba(139, 69, 19, 0.04);
}

.city-item:last-child {
  border-bottom: none;
}

.city-item:active {
  background: rgba(139, 69, 19, 0.08);
}

.city-item.selected {
  background: rgba(139, 69, 19, 0.12);
}

.city-item-indented {
  padding-left: 40px;
}

.city-item-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.city-abbr {
  font-size: 11px;
  color: #999;
  width: 30px;
}

.city-name-text {
  font-size: 15px;
  color: #2C2C2C;
}

.city-province {
  font-size: 11px;
  color: #999;
}

.city-longitude {
  font-size: 11px;
  color: #999;
}

.empty-tip {
  padding: 30px 0;
  text-align: center;
  font-size: 15px;
  color: #999;
}

.popup-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 14px 20px;
  border-top: 1px solid rgba(139, 69, 19, 0.1);
  flex-shrink: 0;
}

.btn-cancel {
  padding: 10px 24px;
  border-radius: 12px;
  background: #F8F4EF;
}

.btn-cancel:active {
  opacity: 0.7;
}

.btn-confirm {
  padding: 10px 24px;
  border-radius: 12px;
  background: linear-gradient(135deg, #8B4513 0%, #6B3410 100%);
}

.btn-confirm.disabled {
  opacity: 0.5;
}

.btn-confirm:active {
  opacity: 0.85;
}

.btn-text {
  font-size: 15px;
  color: #666;
  font-weight: 500;
}

.btn-text-white {
  color: #fff;
}
</style>
