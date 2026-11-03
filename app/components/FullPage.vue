<script setup lang="ts">
const props = defineProps<{
  /** 每一屏的名称，用于右侧圆点导航的无障碍标签，数量即屏数 */
  labels: string[]
}>()

/** 当前所在屏，从 0 开始 */
const index = defineModel<number>('index', { default: 0 })

const { t } = useI18n()
const rootRef = ref<HTMLElement | null>(null)

const WHEEL_LOCK_MS = 900
const SWIPE_MIN_PX = 50
let wheelLocked = false
let touchStartY: number | null = null

const last = computed(() => props.labels.length - 1)

/** 跳到第 i 屏，超出范围时取边界值 */
function go(i: number) {
  index.value = Math.max(0, Math.min(last.value, i))
}

/** 手机端退化为普通滚动，此时不拦截滚轮、触摸与键盘 */
function isDisabled() {
  return window.matchMedia('(max-width: 768px)').matches
}

/** 滚轮翻屏：900ms 内只响应一次，忽略触控板的细小抖动 */
function onWheel(e: WheelEvent) {
  if (isDisabled() || wheelLocked || Math.abs(e.deltaY) < 8) return
  wheelLocked = true
  setTimeout(() => { wheelLocked = false }, WHEEL_LOCK_MS)
  go(index.value + (e.deltaY > 0 ? 1 : -1))
}

/** 记录触摸起点，用于平板上的上下滑动翻屏 */
function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0]?.clientY ?? null
}

/** 滑动距离超过阈值时翻屏 */
function onTouchEnd(e: TouchEvent) {
  if (isDisabled() || touchStartY === null) return
  const delta = touchStartY - (e.changedTouches[0]?.clientY ?? touchStartY)
  touchStartY = null
  if (Math.abs(delta) >= SWIPE_MIN_PX) go(index.value + (delta > 0 ? 1 : -1))
}

/** 键盘翻屏：方向键、PageUp/PageDown、Home/End；输入框内不处理 */
function onKeydown(e: KeyboardEvent) {
  if (isDisabled() || e.defaultPrevented) return
  const target = e.target as HTMLElement | null
  if (target?.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return

  const map: Record<string, number> = {
    ArrowDown: index.value + 1,
    PageDown: index.value + 1,
    ArrowUp: index.value - 1,
    PageUp: index.value - 1,
    Home: 0,
    End: last.value,
  }
  const next = map[e.key]
  if (next === undefined) return
  e.preventDefault()
  go(next)
}

/** Tab 聚焦到其他屏里的元素时，切到那一屏，并抵消浏览器自动滚动 */
function onFocusIn(e: FocusEvent) {
  if (isDisabled() || !rootRef.value) return
  const sections = Array.from(rootRef.value.querySelectorAll<HTMLElement>(':scope > .full-page__track > section'))
  const i = sections.findIndex(section => section.contains(e.target as Node))
  rootRef.value.scrollTop = 0
  if (i >= 0) go(i)
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

defineExpose({ go })
</script>

<template>
  <div
    ref="rootRef"
    class="full-page"
    @wheel.passive="onWheel"
    @touchstart.passive="onTouchStart"
    @touchend.passive="onTouchEnd"
    @focusin="onFocusIn"
  >
    <div class="full-page__track" :style="{ transform: `translateY(-${index * 100}vh)` }">
      <slot :go="go" />
    </div>

    <nav class="full-page__nav" :aria-label="t('fullPage.nav')">
      <button class="fp-btn" type="button" :aria-label="t('fullPage.prev')" :disabled="index === 0" @click="go(index - 1)">
        <AppIcon name="chevron-up" :stroke-width="2" />
      </button>
      <button
        v-for="(label, i) in labels"
        :key="label"
        class="fp-dot"
        :class="{ 'is-active': i === index }"
        type="button"
        :aria-label="label"
        :aria-current="i === index ? 'step' : undefined"
        @click="go(i)"
      >
        <span />
      </button>
      <button class="fp-btn" type="button" :aria-label="t('fullPage.next')" :disabled="index === last" @click="go(index + 1)">
        <AppIcon name="chevron-down" :stroke-width="2" />
      </button>
    </nav>
  </div>
</template>

<style scoped lang="scss">
.full-page {
  position: relative;
  height: 100vh;
  overflow: hidden;

  &__track {
    height: 100%;
    transition: transform 0.8s cubic-bezier(0.65, 0, 0.35, 1);
  }

  &__nav {
    position: absolute;
    top: 50%;
    right: 24px;
    z-index: 10;
    display: flex;
    flex-direction: column;
    align-items: center;
    transform: translateY(-50%);
  }

  // 手机端退化为普通滚动
  @include mobile {
    height: auto;
    overflow: visible;

    &__track {
      transform: none !important;
    }

    &__nav {
      display: none;
    }
  }
}

.fp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  color: var(--text-color-2);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 50%;

  &:hover:not(:disabled) {
    color: var(--primary-color);
  }

  &:disabled {
    cursor: default;
    opacity: 0.35;
  }
}

.fp-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 28px;
  padding: 0;
  cursor: pointer;
  background: transparent;
  border: 0;

  span {
    width: 8px;
    height: 8px;
    background: var(--border-color);
    border-radius: 50%;
    transition: all 0.3s;
  }

  &:hover span {
    background: color-mix(in srgb, var(--primary-color) 50%, transparent);
  }

  &.is-active span {
    height: 20px;
    background: var(--primary-color);
    border-radius: 4px;
  }
}
</style>
