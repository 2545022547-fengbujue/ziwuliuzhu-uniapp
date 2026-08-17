<template>
  <view class="theme-transition" :class="[`transition-${theme}`, { closing }]" aria-hidden="true">
    <view v-if="theme === 'animal'" class="animal-transition-stage">
      <view class="animal-transition-sun"></view>
      <view class="animal-transition-cloud cloud-a"></view>
      <view class="animal-transition-cloud cloud-b"></view>
      <view class="animal-transition-island"></view>
      <view class="animal-transition-wave wave-a"></view>
      <view class="animal-transition-wave wave-b"></view>
      <image class="animal-transition-friends" src="/static/themes/animal/animal-friends.png" mode="widthFix" />
      <view class="animal-transition-copy">
        <text class="animal-transition-title">欢迎来到动物岛</text>
        <view class="animal-loading-dots"><text></text><text></text><text></text></view>
      </view>
    </view>

    <view v-else class="ink-transition-stage">
      <view class="ink-bloom bloom-one"></view>
      <view class="ink-bloom bloom-two"></view>
      <view class="ink-mountain mountain-back"></view>
      <view class="ink-mountain mountain-front"></view>
      <view class="ink-loading-mark">
        <view class="ink-ring"></view>
        <text>墨</text>
      </view>
      <view class="ink-brush-line"></view>
      <text class="ink-transition-title">墨色入境</text>
      <text class="ink-transition-subtitle">一纸山水，静候片刻</text>
    </view>
  </view>
</template>

<script setup>
/**
 * ThemeTransitionOverlay - 独立外观切换遮罩。
 *
 * 使用范围：仅由设置页在切换到 animal / ink 时短暂挂载。
 * 生命周期由父组件的三个定时器控制：先显示遮罩，再切换底层主题，最后淡出并卸载。
 * 组件本身不读取 Store，避免遮罩与主题状态互相驱动形成循环；也不处理点击，显示期间统一拦截底层操作。
 *
 * props.theme：决定动物岛欢迎场景或水墨入境场景。
 * props.closing：父组件开始收尾时置 true，只负责透明度淡出，不立刻销毁 DOM。
 */
defineProps({
  theme: { type: String, default: 'animal' },
  closing: { type: Boolean, default: false }
})
</script>

<style lang="scss" scoped>
/*
 * z-index 5000 高于项目内所有业务弹窗和 TabBar。
 * closing 阶段关闭 pointer-events，既让淡出自然完成，也避免透明遮罩继续吞掉点击。
 */
.theme-transition {
  position: fixed;
  inset: 0;
  z-index: 5000;
  overflow: hidden;
  pointer-events: auto;
  opacity: 1;
  transition: opacity .32s ease;
}

.theme-transition.closing {
  opacity: 0;
  pointer-events: none;
}

.animal-transition-stage,
.ink-transition-stage {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Animal Island Loading 的小岛、海浪和轻快分段节奏。 */
.animal-transition-stage {
  background: linear-gradient(180deg, #C8EEE8 0%, #EAF4D8 58%, #9BD184 59%, #79BD78 100%);
}

.animal-transition-sun {
  position: absolute;
  top: 14%;
  right: 16%;
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: #F7CD67;
  box-shadow: 0 0 0 24rpx rgba(247,205,103,.18);
  animation: animal-sun-arrive .65s cubic-bezier(.2,1.35,.35,1) both;
}

.animal-transition-cloud {
  position: absolute;
  width: 148rpx;
  height: 44rpx;
  border-radius: 999rpx;
  background: rgba(255,252,237,.92);
  animation: animal-cloud-drift 2.8s ease-in-out infinite alternate;
}
.animal-transition-cloud::before,
.animal-transition-cloud::after {
  content: '';
  position: absolute;
  bottom: 0;
  border-radius: 50%;
  background: inherit;
}
.animal-transition-cloud::before { left: 22rpx; width: 64rpx; height: 64rpx; }
.animal-transition-cloud::after { right: 18rpx; width: 52rpx; height: 52rpx; }
.cloud-a { top: 22%; left: 10%; }
.cloud-b { top: 31%; right: 9%; transform: scale(.72); animation-delay: -.8s; }

.animal-transition-island {
  position: absolute;
  left: 50%;
  top: 51%;
  width: 520rpx;
  height: 190rpx;
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #8AC68A;
  box-shadow: inset 0 -42rpx 0 #D6AE74, 0 18rpx 0 rgba(90,128,79,.15);
  animation: animal-island-rise .72s cubic-bezier(.2,1.25,.35,1) both;
}

.animal-transition-friends {
  position: absolute;
  left: 50%;
  top: 47%;
  z-index: 4;
  width: 390rpx;
  transform: translate(-50%, -50%);
  filter: drop-shadow(0 12rpx 8rpx rgba(84,67,44,.16));
  animation: animal-friends-arrive .72s .15s cubic-bezier(.2,1.3,.35,1) both;
}

.animal-transition-wave {
  position: absolute;
  left: -8%;
  width: 116%;
  border-radius: 50% 50% 0 0;
  animation: animal-wave 2.2s ease-in-out infinite alternate;
}
.wave-a { bottom: 5%; height: 24%; background: rgba(120,205,217,.72); }
.wave-b { bottom: -7%; height: 20%; background: rgba(83,184,199,.82); animation-delay: -.7s; }

.animal-transition-copy {
  position: absolute;
  left: 0;
  right: 0;
  top: 69%;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 22rpx;
}
.animal-transition-title {
  color: #725D42;
  font-size: 38rpx;
  font-weight: 800;
  letter-spacing: 4rpx;
  font-family: 'Arial Rounded MT Bold', 'PingFang SC', sans-serif;
}
.animal-loading-dots { display: flex; gap: 14rpx; }
.animal-loading-dots text {
  width: 18rpx;
  height: 18rpx;
  border-radius: 50%;
  background: #19AFA2;
  animation: animal-dot .72s ease-in-out infinite alternate;
}
.animal-loading-dots text:nth-child(2) { animation-delay: .16s; background: #F7CD67; }
.animal-loading-dots text:nth-child(3) { animation-delay: .32s; background: #82D5BB; }

/* Shuimo UI 的呼吸式加载标记，叠加墨迹扩散与落笔。 */
.ink-transition-stage {
  background:
    radial-gradient(circle at 50% 44%, rgba(255,255,252,.97), rgba(247,244,235,.96) 48%, rgba(224,222,211,.98) 100%);
}
.ink-bloom {
  position: absolute;
  border-radius: 50%;
  filter: blur(10rpx);
  background: radial-gradient(circle, rgba(21,25,25,.48) 0%, rgba(42,48,47,.20) 42%, transparent 70%);
  animation: ink-bloom-spread 1.35s ease-out both;
}
.bloom-one { width: 620rpx; height: 620rpx; left: -180rpx; top: -160rpx; }
.bloom-two { width: 540rpx; height: 540rpx; right: -190rpx; bottom: -130rpx; animation-delay: .18s; }

.ink-loading-mark {
  position: relative;
  z-index: 4;
  width: 168rpx;
  height: 168rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: ink-heart-beat 1.4s linear infinite alternate;
}
.ink-loading-mark text {
  position: relative;
  z-index: 2;
  color: #F8F6EF;
  font-size: 66rpx;
  font-family: 'LXGWZhenKaiSlabGB', 'KaitiGB2312', serif;
}
.ink-ring {
  position: absolute;
  inset: 0;
  border-radius: 47% 53% 51% 49%;
  background: #202728;
  box-shadow: 12rpx 8rpx 0 rgba(65,73,70,.16);
  animation: ink-ring-turn 3.2s linear infinite;
}

.ink-brush-line {
  position: absolute;
  z-index: 3;
  top: calc(50% + 122rpx);
  left: 50%;
  width: 310rpx;
  height: 18rpx;
  transform: translateX(-50%) scaleX(0);
  transform-origin: left center;
  background: linear-gradient(90deg, transparent, #272D2D 8%, #272D2D 82%, transparent);
  clip-path: polygon(0 44%, 7% 22%, 86% 0, 100% 55%, 88% 76%, 8% 100%);
  animation: ink-brush-write .8s .32s ease-out forwards;
}
.ink-transition-title,
.ink-transition-subtitle {
  position: absolute;
  z-index: 4;
  left: 0;
  right: 0;
  text-align: center;
  font-family: 'LXGWZhenKaiSlabGB', 'KaitiGB2312', serif;
}
.ink-transition-title { top: calc(50% + 162rpx); color: #202728; font-size: 42rpx; letter-spacing: 12rpx; }
.ink-transition-subtitle { top: calc(50% + 226rpx); color: #737A76; font-size: 24rpx; letter-spacing: 4rpx; }

.ink-mountain {
  position: absolute;
  left: -8%;
  width: 116%;
  bottom: 0;
  opacity: .28;
  transform-origin: bottom;
  animation: ink-mountain-rise .9s ease-out both;
}
.mountain-back {
  height: 32%;
  background: #6F7772;
  clip-path: polygon(0 100%,0 73%,10% 55%,18% 68%,31% 25%,42% 61%,54% 41%,68% 72%,81% 35%,91% 60%,100% 48%,100% 100%);
}
.mountain-front {
  height: 22%;
  background: #303635;
  clip-path: polygon(0 100%,0 65%,15% 50%,25% 72%,38% 34%,54% 74%,67% 47%,80% 70%,92% 39%,100% 62%,100% 100%);
  animation-delay: .14s;
}

@keyframes animal-sun-arrive { from { opacity: 0; transform: scale(.45); } to { opacity: 1; transform: scale(1); } }
@keyframes animal-cloud-drift { from { margin-left: -10rpx; } to { margin-left: 12rpx; } }
@keyframes animal-island-rise { from { opacity: 0; transform: translate(-50%,-30%) scale(.72); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
@keyframes animal-friends-arrive { from { opacity: 0; transform: translate(-50%,-30%) scale(.72); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
@keyframes animal-wave { from { transform: translateX(-12rpx); } to { transform: translateX(12rpx); } }
@keyframes animal-dot { from { transform: translateY(0) scale(.8); opacity: .55; } to { transform: translateY(-12rpx) scale(1); opacity: 1; } }
@keyframes ink-bloom-spread { from { opacity: 0; transform: scale(.25); } to { opacity: 1; transform: scale(1); } }
@keyframes ink-heart-beat { 0% { transform: scale(1); } 40% { transform: scale(.9); } 100% { transform: scale(1); } }
@keyframes ink-ring-turn { to { transform: rotate(360deg); } }
@keyframes ink-brush-write { to { transform: translateX(-50%) scaleX(1); } }
@keyframes ink-mountain-rise { from { opacity: 0; transform: scaleY(.45); } to { opacity: .28; transform: scaleY(1); } }

/* 仅 H5：prefers-reduced-motion 是浏览器无障碍媒体特性，小程序 WXSS 不支持
   通配符选择器 *（官方编译器报 unexpected token *），且该特性在小程序端不生效 */
/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .theme-transition * { animation-duration: .01ms !important; animation-iteration-count: 1 !important; }
}
/* #endif */
</style>
