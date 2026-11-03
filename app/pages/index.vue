<script setup lang="ts">
const { data: site } = await useApi<SiteConfig>('/api/site')
const { data: profile } = await useApi<Profile>('/api/profile')
const { data: skills } = await useApi<HomeSkill[]>('/api/skills', { query: { home: 1 } })

useSeoMeta({
  title: () => site.value?.name,
  description: () => site.value?.slogan,
})
</script>

<template>
  <div class="page">
    <h1>{{ profile?.name }} · {{ profile?.title }}</h1>
    <p>{{ profile?.homeIntro }}</p>
    <n-space>
      <n-tag v-for="skill in skills" :key="skill.name" type="info">{{ skill.name }}</n-tag>
    </n-space>
  </div>
</template>

<style scoped lang="scss">
.page {
  max-width: var(--content-width);
  padding: 48px 24px;
  margin: 0 auto;
}
</style>
