<script setup lang="ts">
withDefaults(defineProps<{
  contacts: Contact[]
  /** circle：首页大号毛玻璃圆形按钮；plain：页足小号图标 */
  variant?: 'circle' | 'plain'
}>(), { variant: 'plain' })

/** 联系方式转成链接地址：邮箱加 mailto，其余原样 */
function hrefOf(item: Contact) {
  return item.type === 'email' && !item.value.startsWith('mailto:') ? `mailto:${item.value}` : item.value
}

/** 外部链接在新窗口打开，站内（如 /rss.xml）与邮箱不需要 */
function isExternal(item: Contact) {
  return /^https?:\/\//.test(item.value)
}
</script>

<template>
  <div class="contacts" :class="`contacts--${variant}`">
    <a
      v-for="item in contacts"
      :key="item.type + item.value"
      class="contacts__item"
      :href="hrefOf(item)"
      :aria-label="item.label"
      :title="item.label"
      :target="isExternal(item) ? '_blank' : undefined"
      :rel="isExternal(item) ? 'noopener' : undefined"
    >
      <AppIcon :name="item.type" :size="variant === 'circle' ? 20 : 18" />
    </a>
  </div>
</template>

<style scoped lang="scss">
.contacts {
  display: flex;
  gap: 8px;

  &__item {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: var(--text-color-2);
    border-radius: 50%;
    transition: color 0.2s, background-color 0.2s;

    &:hover {
      color: var(--primary-color);
    }
  }

  &--circle &__item {
    @include glass;

    width: 44px;
    height: 44px;

    &:hover {
      background: var(--glass-bg-strong);
    }
  }

  &--plain {
    gap: 4px;
    margin-left: -8px;
  }

  &--plain &__item {
    width: 36px;
    height: 36px;

    &:hover {
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    }
  }
}
</style>
