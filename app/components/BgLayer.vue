<script setup lang="ts">
const { data: site } = await useSiteConfig()

const mode = computed(() => site.value?.background.mode ?? 'plain')

// 背景图模式：图片 + 浅色蒙层，蒙层不透明度来自后台配置
const imageStyle = computed(() => {
  const bg = site.value?.background
  if (bg?.mode !== 'image' || !bg.image) return undefined
  return { backgroundImage: `url(${JSON.stringify(bg.image)})`, '--veil-opacity': String(bg.overlay) }
})
</script>

<template>
  <div class="bg-layer" :class="`bg-layer--${mode}`" :style="imageStyle" aria-hidden="true" />
</template>

<style scoped lang="scss">
// 固定在最底层的全站背景：plain 纯色 / glow 光晕 / image 背景图
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: var(--site-bg);
  pointer-events: none;

  &--glow {
    background:
      radial-gradient(640px circle at 10% 55%, var(--glow-1), transparent 70%),
      radial-gradient(600px circle at 90% 70%, var(--glow-2), transparent 70%),
      var(--site-bg);
  }

  &--image {
    background-position: center;
    background-size: cover;

    &::after {
      position: absolute;
      inset: 0;
      content: '';
      background: var(--image-veil);
      opacity: var(--veil-opacity, 0.7);
    }
  }
}
</style>
