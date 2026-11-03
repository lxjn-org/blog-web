<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()
const { isDark, toggle } = useSiteTheme()

const navItems = computed(() => [
  { to: '/', label: t('nav.home') },
  { to: '/projects', label: t('nav.projects') },
  { to: '/blog', label: t('nav.blog') },
  { to: '/about', label: t('nav.about') },
])

/** 在中文与英文之间切换 */
function switchLocale() {
  const next = locales.value.find(item => item.code !== locale.value)
  if (next) setLocale(next.code)
}
</script>

<template>
  <header class="site-header">
    <NuxtLink :to="localePath('/')" class="site-header__logo">LY</NuxtLink>
    <nav class="site-header__nav">
      <NuxtLink v-for="item in navItems" :key="item.to" :to="localePath(item.to)">
        {{ item.label }}
      </NuxtLink>
    </nav>
    <div class="site-header__actions">
      <n-button quaternary size="small" @click="switchLocale">
        {{ locale === 'en' ? '中' : 'EN' }}
      </n-button>
      <n-button quaternary size="small" @click="toggle">
        {{ isDark ? t('theme.light') : t('theme.dark') }}
      </n-button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.site-header {
  @include glass;

  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 100;
  display: flex;
  gap: 32px;
  align-items: center;
  height: var(--header-height);
  padding: 0 24px;

  &__logo {
    font-size: 20px;
    font-weight: 700;
  }

  &__nav {
    display: flex;
    flex: 1;
    gap: 24px;

    .router-link-exact-active {
      font-weight: 600;
    }
  }

  &__actions {
    display: flex;
    gap: 8px;
  }

  @include mobile {
    gap: 16px;
    padding: 0 16px;

    &__nav {
      gap: 12px;
    }
  }
}
</style>
