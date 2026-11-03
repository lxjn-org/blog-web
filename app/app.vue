<script setup lang="ts">
import { dateEnUS, dateZhCN, enUS, zhCN } from 'naive-ui'

const { locale } = useI18n()
const { isDark, theme, themeOverrides } = useSiteTheme()

// Naive UI 组件内置文案跟随站点语言
const naiveLocale = computed(() => (locale.value === 'en' ? enUS : zhCN))
const naiveDateLocale = computed(() => (locale.value === 'en' ? dateEnUS : dateZhCN))

// <html> 的 lang 与 dark 类在服务端渲染时就输出，避免首屏闪动
useHead({
  htmlAttrs: {
    lang: () => (locale.value === 'en' ? 'en' : 'zh-CN'),
    class: () => (isDark.value ? 'dark' : ''),
  },
})
</script>

<template>
  <n-config-provider
    :theme="theme"
    :theme-overrides="themeOverrides"
    :locale="naiveLocale"
    :date-locale="naiveDateLocale"
  >
    <n-message-provider>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </n-message-provider>
  </n-config-provider>
</template>
