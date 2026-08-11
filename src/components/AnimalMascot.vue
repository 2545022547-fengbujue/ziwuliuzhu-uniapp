<template>
  <view class="mascot-shell" :class="`mascot-${variant}`" aria-hidden="true">
    <svg class="mascot-svg" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">
      <ellipse class="mascot-shadow" cx="90" cy="164" rx="48" ry="8" />

      <!-- 尾巴放在身体后面，各动物使用不同轮廓。 -->
      <g class="mascot-tail">
        <path v-if="variant === 'rabbit'" d="M137 122c24-4 25 27 3 28-17 1-19-24-3-28Z" fill="#fff8e9" />
        <path v-else-if="variant === 'cat'" d="M137 122c30-20 37 23 11 31-10 3-15-4-10-11 14-17 7-20-1-20Z" fill="var(--fur-main)" />
        <path v-else-if="variant === 'dog'" d="M139 122c25-13 33 20 12 29-10 4-18-4-12-12 11-10 8-14 0-17Z" fill="var(--fur-main)" />
        <path v-else-if="variant === 'deer'" d="M139 126c20-10 28 12 13 22-9 6-17-2-11-10 6-5 5-9-2-12Z" fill="var(--fur-main)" />
        <path v-else-if="variant === 'squirrel'" d="M137 133c0-39 41-48 47-14 5 27-24 43-42 29 23-2 29-22 16-27-9-3-15 4-21 12Z" fill="var(--fur-accent)" />
      </g>

      <g class="mascot-body">
        <ellipse cx="91" cy="128" rx="47" ry="42" fill="var(--fur-main)" />
        <path d="M50 119c8-17 24-27 41-27 20 0 36 10 44 27l-7 35H57l-7-35Z" fill="var(--shirt)" />
        <path d="M63 116c17 10 39 10 56 0" fill="none" stroke="rgba(255,255,255,.72)" stroke-width="6" stroke-linecap="round" stroke-dasharray="8 10" />
        <ellipse cx="65" cy="158" rx="16" ry="9" fill="var(--fur-dark)" />
        <ellipse cx="118" cy="158" rx="16" ry="9" fill="var(--fur-dark)" />
      </g>

      <g class="mascot-ears">
        <template v-if="variant === 'rabbit'">
          <ellipse cx="61" cy="35" rx="17" ry="39" fill="var(--fur-main)" transform="rotate(-12 61 35)" />
          <ellipse cx="119" cy="35" rx="17" ry="39" fill="var(--fur-main)" transform="rotate(12 119 35)" />
          <ellipse cx="61" cy="37" rx="7" ry="26" fill="#f2a9ad" transform="rotate(-12 61 37)" />
          <ellipse cx="119" cy="37" rx="7" ry="26" fill="#f2a9ad" transform="rotate(12 119 37)" />
        </template>
        <template v-else-if="variant === 'cat'">
          <path d="M47 61 49 19l34 29Z" fill="var(--fur-main)" />
          <path d="m133 61-2-42-34 29Z" fill="var(--fur-main)" />
          <path d="M55 46 56 29l14 15Z" fill="#f2a9ad" />
          <path d="m125 46-1-17-14 15Z" fill="#f2a9ad" />
        </template>
        <template v-else-if="variant === 'dog'">
          <path d="M53 51C30 38 28 75 54 83l17-28Z" fill="var(--fur-dark)" />
          <path d="M127 51c23-13 25 24-1 32l-17-28Z" fill="var(--fur-dark)" />
        </template>
        <template v-else-if="variant === 'deer'">
          <path d="M49 50C25 36 27 75 58 72Z" fill="var(--fur-main)" />
          <path d="M131 50c24-14 22 25-9 22Z" fill="var(--fur-main)" />
          <path d="M65 34 57 13m8 21 12-17m38 17 8-21m-8 21-12-17" fill="none" stroke="var(--fur-dark)" stroke-width="7" stroke-linecap="round" />
        </template>
        <template v-else-if="variant === 'squirrel'">
          <path d="M48 55C30 32 33 18 58 32l17 24Z" fill="var(--fur-main)" />
          <path d="M132 55c18-23 15-37-10-23l-17 24Z" fill="var(--fur-main)" />
        </template>
        <template v-else>
          <path d="M47 58 57 29l22 27Z" fill="var(--fur-dark)" />
          <path d="m133 58-10-29-22 27Z" fill="var(--fur-dark)" />
        </template>
      </g>

      <g class="mascot-head">
        <ellipse cx="90" cy="76" rx="52" ry="47" fill="var(--fur-main)" />
        <ellipse v-if="variant === 'owl'" cx="68" cy="73" rx="27" ry="30" fill="var(--face-pale)" />
        <ellipse v-if="variant === 'owl'" cx="112" cy="73" rx="27" ry="30" fill="var(--face-pale)" />
        <path v-if="variant === 'cat'" d="M64 40c14 11 22 8 30-4 5 12 15 16 28 7-4 12-15 18-29 18-15 0-24-7-29-21Z" fill="var(--fur-accent)" />
        <path v-if="variant === 'dog'" d="M53 59c11-23 25-30 42-28-4 15-15 26-42 28Z" fill="var(--face-pale)" opacity=".82" />
        <path v-if="variant === 'deer'" d="M61 45c17-8 40-8 58 0-6 9-17 14-29 14S68 54 61 45Z" fill="var(--face-pale)" opacity=".54" />
        <ellipse v-if="variant === 'squirrel'" cx="90" cy="77" rx="31" ry="33" fill="var(--face-pale)" opacity=".72" />

        <g class="mascot-eyes">
          <ellipse class="mascot-eye" cx="71" cy="74" rx="7" ry="10" fill="#493a2d" />
          <ellipse class="mascot-eye" cx="109" cy="74" rx="7" ry="10" fill="#493a2d" />
          <circle cx="69" cy="71" r="2.2" fill="#fff" />
          <circle cx="107" cy="71" r="2.2" fill="#fff" />
        </g>
        <ellipse cx="58" cy="88" rx="9" ry="5" fill="#ee9b94" opacity=".48" />
        <ellipse cx="122" cy="88" rx="9" ry="5" fill="#ee9b94" opacity=".48" />
        <path v-if="variant === 'owl'" d="m90 80-8 8 8 5 8-5-8-8Z" fill="#efb84d" />
        <ellipse v-else cx="90" cy="87" rx="8" ry="6" fill="var(--fur-dark)" />
        <path d="M80 97c6 8 14 8 20 0" fill="none" stroke="#624738" stroke-width="4" stroke-linecap="round" />
      </g>

      <g v-if="variant === 'owl'" class="mascot-wings">
        <path d="M48 111c-20 11-12 36 13 35l8-29Z" fill="var(--fur-accent)" />
        <path d="M132 111c20 11 12 36-13 35l-8-29Z" fill="var(--fur-accent)" />
      </g>

      <path class="mascot-leaf" d="M136 39c14-11 26-5 23 7-3 13-20 16-31 8 8-1 12-6 8-15Z" fill="#79bc72" />
      <path class="mascot-leaf" d="M143 38c-3 8-7 15-14 22" fill="none" stroke="#3e8b5b" stroke-width="3" stroke-linecap="round" />
    </svg>
  </view>
</template>

<script setup>
/**
 * AnimalMascot - 动物岛穴位详情的静态守护角色。
 *
 * 六种角色共用同一套 180×180 SVG 骨架，通过条件路径和 CSS 变量改变耳朵、尾巴、脸部与服装。
 * 这样只需一个组件即可保持线宽、投影和占位尺寸一致，也避免为每个角色额外打包位图。
 * 角色不接收穴位数据、不显示文字、不响应点击，并明确不使用动画；variant 只负责选择外观。
 */
defineProps({
  variant: { type: String, default: 'rabbit' }
})
</script>

<style lang="scss" scoped>
.mascot-shell {
  --fur-main: #d8b485;
  --fur-dark: #77523b;
  --fur-accent: #bc815e;
  --face-pale: #fff2d4;
  --shirt: #69cdb3;
  width: 174rpx;
  height: 174rpx;
}

.mascot-rabbit { --fur-main: #f7eee0; --fur-dark: #c89d82; --fur-accent: #e7c8ad; --shirt: #86cce0; }
.mascot-cat { --fur-main: #e2a25f; --fur-dark: #76503a; --fur-accent: #fff0d4; --shirt: #f2bd64; }
.mascot-dog { --fur-main: #d9ad72; --fur-dark: #744c34; --fur-accent: #f1d39f; --face-pale: #fff0cf; --shirt: #6fc9a5; }
.mascot-deer { --fur-main: #c99369; --fur-dark: #744c3c; --fur-accent: #f3d6a7; --shirt: #ef9f7f; }
.mascot-squirrel { --fur-main: #d47750; --fur-dark: #77402f; --fur-accent: #b95642; --face-pale: #ffe4bc; --shirt: #82b8df; }
.mascot-owl { --fur-main: #a78b6a; --fur-dark: #67503d; --fur-accent: #82694f; --face-pale: #f8e8c5; --shirt: #8fc786; }

.mascot-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  filter: drop-shadow(0 7rpx 5rpx rgba(80, 61, 42, .16));
}

.mascot-shadow { fill: rgba(70, 92, 70, .16); }
</style>
