import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-11-01',
  devtools: { enabled: true },

  modules: ['@nuxtjs/i18n', '@pinia/nuxt'],

  // 服务端运行配置，可由对应的 NUXT_ 环境变量覆盖
  runtimeConfig: {
    // 数据库配置文件路径，默认 data/data.config
    dbConfigPath: '',
    // 自定义启动横幅路径，留空时读取运行目录下的 banner.txt
    bannerPath: '',
    // 友链申请限流的 IP 哈希盐，建议部署时用环境变量覆盖
    ipHashSalt: '',
    // 仅当可信反向代理覆盖转发地址时开启
    trustProxy: false,
    // Turnstile 服务端密钥
    turnstileSecret: '',
  },

  // 生产构建时转译 Naive UI，保证服务端渲染使用同一份 css-render 实例
  build: {
    transpile: process.env.NODE_ENV === 'production' ? ['naive-ui', 'vueuc', '@css-render/vue3-ssr'] : [],
  },

  css: ['~/assets/styles/main.scss'],

  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    },
  },

  i18n: {
    // 中文不带前缀，英文路由带 /en 前缀
    strategy: 'prefix_except_default',
    defaultLocale: 'zh-CN',
    locales: [
      { code: 'zh-CN', language: 'zh-CN', name: '简体中文', file: 'zh-CN.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' },
    ],
    // 语言偏好存 Cookie，仅在访问根路径时按浏览器语言跳转一次
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'locale',
      redirectOn: 'root',
    },
  },

  vite: {
    css: {
      preprocessorOptions: {
        // 每个 SCSS 文件和 <style lang="scss"> 都能直接用 mixins 里的混入
        scss: { additionalData: '@use "~/assets/styles/mixins" as *;\n' },
      },
    },
    plugins: [
      // Naive UI 组件（<n-button> 等）按需自动导入
      Components({ resolvers: [NaiveUiResolver()], dts: false }),
    ],
  },

  // 后端就绪后打开，把 /api/** 代理到真实服务，同时删除 server/api 与 server/mock
  // routeRules: {
  //   '/api/**': { proxy: `${process.env.API_BASE}/api/**` },
  // },
})
