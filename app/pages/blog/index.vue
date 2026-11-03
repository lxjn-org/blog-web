<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { data: posts } = await useApi<PageResult<PostSummary>>('/api/posts')

useSeoMeta({ title: () => t('page.blog') })
</script>

<template>
  <div class="page">
    <h1>{{ t('page.blog') }}</h1>
    <n-list>
      <n-list-item v-for="post in posts?.list" :key="post.id">
        <NuxtLink :to="localePath(`/blog/${post.slug}`)">
          <n-thing :title="post.title" :description="post.summary" />
        </NuxtLink>
      </n-list-item>
    </n-list>
  </div>
</template>

<style scoped lang="scss">
.page {
  max-width: var(--content-width);
  padding: 48px 24px;
  margin: 0 auto;
}
</style>
