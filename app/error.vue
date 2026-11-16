<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const locale = useCookie('locale')
const isEnglish = computed(() => locale.value === 'en')

// 数据库不可用（useApi 将 code 50000 映射为 503）时展示维护文案
const isMaintenance = computed(() => props.error.statusCode === 503)

const copy = computed(() => {
  const en = isEnglish.value
  if (isMaintenance.value) {
    return {
      title: en ? 'Site Under Maintenance' : '网站维护中',
      desc: en
        ? 'The site is temporarily unavailable. Please check back shortly.'
        : '数据库暂时不可用，我们正在努力恢复服务，请稍后再来。',
      action: en ? 'Refresh' : '刷新重试',
    }
  }
  if (props.error.statusCode === 404) {
    return {
      title: en ? 'Page Not Found' : '页面不存在',
      desc: en
        ? 'The page you are looking for does not exist or has been removed.'
        : '你访问的页面不存在或已被移除。',
      action: en ? 'Back Home' : '返回首页',
    }
  }
  return {
    title: en ? 'Something Went Wrong' : '出错了',
    desc: en
      ? 'An unexpected error occurred. Please try again later.'
      : '服务器开小差了，请稍后再试。',
    action: en ? 'Back Home' : '返回首页',
  }
})

function handleAction() {
  if (isMaintenance.value) {
    location.reload()
    return
  }
  clearError({ redirect: '/' })
}
</script>

<template>
  <div class="error-page">
    <div class="error-card">
      <div class="error-code">{{ error.statusCode }}</div>
      <h1 class="error-title">{{ copy.title }}</h1>
      <p class="error-desc">{{ copy.desc }}</p>
      <button type="button" class="error-action" @click="handleAction">
        {{ copy.action }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--site-bg, #f7f8fa);
  color: #303133;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", Arial, sans-serif;
}

.error-card {
  max-width: 440px;
  width: 100%;
  padding: 44px 36px;
  text-align: center;
  background: var(--glass-bg-strong, rgba(255, 255, 255, 0.86));
  border: 1px solid var(--glass-border, rgba(228, 231, 237, 0.8));
  border-radius: 8px;
  box-shadow: var(--glass-shadow, 0 2px 12px rgba(0, 0, 0, 0.06));
}

.error-code {
  font-size: 44px;
  font-weight: 700;
  line-height: 1;
  color: var(--primary-color, #409eff);
  margin-bottom: 16px;
}

.error-title {
  margin: 0 0 12px;
  font-size: 20px;
  font-weight: 600;
}

.error-desc {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: #606266;
}

.error-action {
  margin-top: 26px;
  padding: 9px 30px;
  font-size: 14px;
  cursor: pointer;
  color: #fff;
  background: var(--primary-color, #409eff);
  border: none;
  border-radius: 3px;
}

.error-action:hover {
  background: var(--primary-color-hover, #79bbff);
}

html.dark .error-page {
  color: #e8e8ea;
}

html.dark .error-desc {
  color: #9a9aa0;
}
</style>
