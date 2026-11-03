<script setup lang="ts">
import { useThemeVars } from 'naive-ui'

/** 需要暴露给 SCSS 的 Naive 主题变量（驼峰名 → --kebab-case） */
const KEYS = [
  'primaryColor',
  'primaryColorHover',
  'primaryColorPressed',
  'successColor',
  'warningColor',
  'errorColor',
  'textColor1',
  'textColor2',
  'textColor3',
  'borderColor',
  'dividerColor',
  'actionColor',
  'hoverColor',
  'cardColor',
  'bodyColor',
  'fontFamily',
  'borderRadius',
  'boxShadow1',
  'boxShadow2',
] as const

const vars = useThemeVars()

/** 驼峰转短横线：textColor1 → text-color-1 */
function kebab(key: string) {
  return key.replace(/([A-Z])/g, '-$1').replace(/(\d+)/g, '-$1').toLowerCase()
}

// 写到 :root，弹窗等挂到 body 下的内容也能用；服务端渲染时随 <head> 输出
const css = computed(() => `:root{${KEYS.map(key => `--${kebab(key)}:${vars.value[key]};`).join('')}}`)

useHead({ style: [{ key: 'naive-theme-vars', textContent: css }] })
</script>

<template>
  <slot />
</template>
