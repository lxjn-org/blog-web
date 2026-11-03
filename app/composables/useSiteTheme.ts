import { darkTheme } from 'naive-ui'
import type { GlobalThemeOverrides } from 'naive-ui'

export type ThemeMode = 'light' | 'dark'

/** 亮色与暗色共用的主色（Element 蓝）、圆角与字体 */
const shared: GlobalThemeOverrides['common'] = {
  primaryColor: '#409EFF',
  primaryColorHover: '#79BBFF',
  primaryColorPressed: '#3A8EE6',
  primaryColorSuppl: '#79BBFF',
  borderRadius: '3px',
  fontSize: '14px',
  fontFamily: '"Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif',
}

/** 亮色主题覆盖：文字与边框沿用设计稿的 Element 色阶 */
const lightOverrides: GlobalThemeOverrides = {
  common: {
    ...shared,
    textColor1: '#303133',
    textColor2: '#606266',
    textColor3: '#73767A',
    borderColor: '#DCDFE6',
    dividerColor: '#EBEEF5',
  },
}

/** 暗色主题覆盖，先只统一主色，后续再细调 */
const darkOverrides: GlobalThemeOverrides = {
  common: { ...shared },
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
