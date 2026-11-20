<template>
  <!--
    DetailThemeDecor - 穴位详情弹窗的主题装饰层（唯一注册处）

    ============================================================
    设计说明（给后来者/AI）
    ============================================================
    1. 背景：此前 watercolor 水洗层、animal 底部场景以
       `v-if="store.activeUiStyle === 'xxx'"` 的形式散落在共享组件
       PointDetail 的模板里——共享组件被迫认识每个具体主题，
       新增/下架主题都要巡视它。收敛后：PointDetail 只挂载本组件，
       主题装饰的新增/删除只改这一个文件 + 对应 ui-*.scss。
    2. variant 说明：
       - overlay   弹窗容器底部的装饰（绝对定位，watercolor 水洗/纸纹）
       - body-tail 弹窗滚动内容末尾的装饰（animal 场景固定在右下角；
                   非 animal 主题回退 80rpx 高度占位，与原布局一致）
    3. 样式约定：装饰的全部规则放在全局 ui-watercolor.scss / ui-animal.scss
       （.ui-*/.theme-* 命名空间内），本组件不携带 <style>，保持纯模板。
    ============================================================
  -->
  <template v-if="variant === 'overlay'">
    <template v-if="store.activeUiStyle === 'watercolor'">
      <view class="watercolor-wash-layer watercolor-wash-primary"></view>
      <view class="watercolor-wash-layer watercolor-wash-secondary"></view>
      <view class="watercolor-paper-texture"></view>
    </template>
  </template>

  <template v-else-if="variant === 'body-tail'">
    <!-- 动物岛主题底部场景：角色固定在详情卡右下角，草地与海浪补足原来的空白。 -->
    <view v-if="store.activeUiStyle === 'animal'" class="animal-detail-scene" aria-hidden="true">
      <view class="animal-scene-cloud cloud-one"></view>
      <view class="animal-scene-cloud cloud-two"></view>
      <view class="animal-scene-sun"></view>
      <view class="animal-scene-tree tree-left"><view class="tree-crown"></view><view class="tree-crown tree-crown-b"></view><text class="tree-trunk"></text></view>
      <view class="animal-scene-tree tree-mid"><view class="tree-crown"></view><view class="tree-crown tree-crown-b"></view><text class="tree-trunk"></text></view>
      <view class="animal-scene-wave wave-back"></view>
      <view class="animal-scene-wave wave-front"></view>
      <view class="animal-scene-grass"></view>
    </view>
    <view v-else style="height: 80rpx;"></view>
  </template>
</template>

<script setup>
import { useAppStore } from '@/stores/app.js'

defineProps({
  /** overlay：弹窗容器装饰层；body-tail：滚动内容末尾装饰 */
  variant: {
    type: String,
    required: true,
    validator: (v) => ['overlay', 'body-tail'].includes(v)
  }
})

const store = useAppStore()
</script>
