import { darkTheme } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'

export type ThemeMode = 'light' | 'dark'

/** 亮色与暗色共用的主色（Element 蓝） */
const primary = {
  primaryColor: '#409EFF',
  primaryColorHover: '#66B1FF',
  primaryColorPressed: '#3A8EE6',
  primaryColorSuppl: '#66B1FF',
}

/** 亮色主题覆盖 */
const lightOverrides: GlobalThemeOverrides = {
  common: { ...primary, borderRadius: '8px' },
}

/** 暗色主题覆盖，先只统一主色，后续再细调 */
const darkOverrides: GlobalThemeOverrides = {
  common: { ...primary, borderRadius: '8px' },
}

/**
 * 站点主题：模式存 Cookie，服务端渲染时就能拿到，避免首屏闪动；
 * 同时给 <html> 加上 dark 类，供自定义 CSS 变量切换深色值。
 */
export function useSiteTheme() {
  const mode = useCookie<ThemeMode>('theme', { default: () => 'light', maxAge: 60 * 60 * 24 * 365 })

  const isDark = computed(() => mode.value === 'dark')
  const theme = computed(() => (isDark.value ? darkTheme : null))
  const themeOverrides = computed(() => (isDark.value ? darkOverrides : lightOverrides))

  /** 在亮色与暗色之间切换 */
  function toggle() {
    mode.value = isDark.value ? 'light' : 'dark'
  }

  return { mode, isDark, theme, themeOverrides, toggle }
}
