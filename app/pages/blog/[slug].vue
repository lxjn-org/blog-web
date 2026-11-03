<script setup lang="ts">
const route = useRoute()
const { data: post, error } = await useApi<PostDetail>(() => `/api/posts/${route.params.slug}`)

// 文章不存在时显示 404 页，服务端渲染也返回 404 状态码
if (error.value || !post.value) {
  throw createError({ statusCode: 404, statusMessage: 'Post Not Found', fatal: true })
}

useSeoMeta({
  title: () => post.value?.title,
  description: () => post.value?.summary,
  ogType: 'article',
})
</script>

<template>
  <article class="page">
    <h1>{{ post?.title }}</h1>
    <!-- 正文 Markdown 渲染后续由 MarkdownView 组件完成，这里先原样显示 -->
    <pre class="page__content">{{ post?.content }}</pre>
  </article>
</template>

<style scoped lang="scss">
.page {
  max-width: 800px;
  padding: 48px 24px;
  margin: 0 auto;

  &__content {
    white-space: pre-wrap;
  }
}
</style>
