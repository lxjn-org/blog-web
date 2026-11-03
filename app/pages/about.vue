<script setup lang="ts">
const { t } = useI18n()
const { data: profile } = await useApi<Profile>('/api/profile')
const { data: experiences } = await useApi<Experience[]>('/api/experiences')

useSeoMeta({ title: () => t('page.about') })
</script>

<template>
  <div class="page">
    <h1>{{ t('page.about') }}</h1>
    <p>{{ profile?.aboutMd }}</p>
    <n-timeline>
      <n-timeline-item
        v-for="item in experiences"
        :key="item.id"
        :title="`${item.company} · ${item.role}`"
        :time="`${item.startMonth} ~ ${item.endMonth ?? t('common.present')}`"
      />
    </n-timeline>
  </div>
</template>

<style scoped lang="scss">
.page {
  max-width: var(--content-width);
  padding: 48px 24px;
  margin: 0 auto;
}
</style>
