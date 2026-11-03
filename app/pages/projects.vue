<script setup lang="ts">
const { t } = useI18n()
const { data: projects } = await useApi<Project[]>('/api/projects')

useSeoMeta({ title: () => t('page.projects') })
</script>

<template>
  <div class="page">
    <h1>{{ t('page.projects') }}</h1>
    <n-grid cols="1 s:2 m:3" responsive="screen" :x-gap="16" :y-gap="16">
      <n-gi v-for="item in projects" :key="item.id">
        <n-card :title="item.name">{{ item.description }}</n-card>
      </n-gi>
    </n-grid>
  </div>
</template>

<style scoped lang="scss">
.page {
  max-width: var(--content-width);
  padding: 48px 24px;
  margin: 0 auto;
}
</style>
