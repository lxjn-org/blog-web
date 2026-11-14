<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { isDark, toggle } = useSiteTheme()
const { data: profile } = await useProfile()
const fpIndex = useFullPageIndex()

// 手机端首页退化为普通滚动，需要按页面滚动距离判断是否离开第一屏
const scrolled = ref(false)

/** 记录页面是否已向下滚动 */
function onScroll() {
  scrolled.value = window.scrollY > 10
}
onMounted(() => {
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
})
onBeforeUnmount(() => window.removeEventListener('scroll', onScroll))

// 首页第一屏时页头透明，其余情况为实色毛玻璃
const transparent = computed(() => route.meta.fullPage === true && fpIndex.value === 0 && !scrolled.value)

const navItems = computed(() => [
  { key: 'home', to: localePath('/'), label: t('nav.home') },
  { key: 'projects', to: localePath('/projects'), label: t('nav.projects') },
  { key: 'blog', to: localePath('/blog'), label: t('nav.blog') },
  { key: 'about', to: localePath('/about'), label: t('nav.about') },
])

/** 判断导航项是否为当前所在栏目（博客详情也算博客） */
function isActive(to: string) {
  const home = localePath('/')
  return to === home ? route.path === home : route.path.startsWith(to)
}

const localeOptions = computed(() => locales.value.map(item => ({ key: item.code, label: item.name ?? item.code })))

/** 语言下拉菜单选中后切换语言 */
function onSelectLocale(code: string) {
  setLocale(code as typeof locale.value)
}
</script>

<template>
  <header class="site-header" :class="{ 'is-solid': !transparent }">
    <div class="site-header__inner">
      <NuxtLink :to="localePath('/')" class="site-header__brand">{{ profile?.name }}</NuxtLink>

      <nav class="site-header__nav" :aria-label="t('header.mainNav')">
        <NuxtLink
          v-for="item in navItems"
          :key="item.key"
          :to="item.to"
          class="nav-item"
          :class="{ 'is-active': isActive(item.to) }"
          :aria-current="isActive(item.to) ? 'page' : undefined"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </div>

    <!-- 语言 / 明暗切换脱离内容区，固定在页头最右侧 -->
    <div class="site-header__actions">
      <n-dropdown trigger="click" placement="bottom-end" :options="localeOptions" :value="locale" @select="onSelectLocale">
        <button
          class="hdr-btn"
          type="button"
          :title="t('header.switchLang')"
          :aria-label="t('header.switchLang')"
          aria-haspopup="menu"
        >
          <AppIcon name="translate" />
        </button>
      </n-dropdown>
      <button
        class="hdr-btn"
        type="button"
        :title="t('header.switchTheme')"
        :aria-label="t('header.switchTheme')"
        @click="toggle"
      >
        <AppIcon :name="isDark ? 'sun' : 'moon'" />
      </button>
    </div>
  </header>
</template>

<style scoped lang="scss">
.site-header {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  z-index: 100;
  // 右侧操作区（两个图标按钮 + 边距）占用的宽度，内容区右侧据此让位，避免导航与按钮重叠
  --actions-reserve: 108px;

  height: var(--header-height);
  background: transparent;
  transition: background-color 0.3s, box-shadow 0.3s, backdrop-filter 0.3s;

  &.is-solid {
    background: var(--glass-bg-strong);
    box-shadow: 0 1px 0 var(--divider-color), var(--glass-shadow);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
  }

  &__inner {
    display: flex;
    gap: 16px;
    align-items: center;
    max-width: var(--content-width);
    height: 100%;
    padding: 0 24px;
    // 视口不够宽时，右侧多留出操作区的位置，品牌名仍与正文左边对齐
    padding-right: max(24px, calc(var(--actions-reserve) - max(0px, (100vw - var(--content-width)) / 2)));
    margin: 0 auto;
  }

  &__brand {
    flex-grow: 1;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.04em;
    color: var(--text-color-1);

    &:hover {
      color: var(--primary-color);
    }
  }

  &__nav {
    display: flex;
    align-self: stretch;
  }

  &__actions {
    position: absolute;
    top: 0;
    right: 24px;
    display: flex;
    gap: 4px;
    align-items: center;
    height: var(--header-height);
  }

  // 手机端：导航换到第二行，操作区贴在第一行右侧
  @include mobile {
    height: auto;

    &__inner {
      flex-wrap: wrap;
      padding: 8px 8px 0 16px;
    }

    &__brand {
      line-height: 36px;
    }

    &__nav {
      width: 100%;
      height: 44px;
    }

    &__actions {
      top: 8px;
      right: 8px;
      height: 36px;
    }
  }
}

.nav-item {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 16px;
  font-size: 15px;
  color: var(--text-color-2);

  &:hover {
    color: var(--primary-color);
  }

  &.is-active {
    font-weight: 500;
    color: var(--primary-color);

    &::after {
      position: absolute;
      right: 16px;
      bottom: 14px;
      left: 16px;
      height: 2px;
      content: '';
      background: var(--primary-color);
      border-radius: 1px;
    }
  }

  @include mobile {
    padding: 0 10px;

    &.is-active::after {
      right: 10px;
      bottom: 8px;
      left: 10px;
    }
  }
}

.hdr-btn {
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  color: var(--text-color-2);
  cursor: pointer;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 18px;

  &:hover {
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 8%, transparent);
  }
}
</style>
