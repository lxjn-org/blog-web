<script setup lang="ts">
const { data: site } = await useApi<SiteConfig>('/api/site')
const { data: links } = await useApi<FriendLink[]>('/api/friend-links')
</script>

<template>
  <footer class="site-footer">
    <div v-if="links?.length" class="site-footer__links">
      <a v-for="link in links" :key="link.id" :href="link.url" target="_blank" rel="noopener">
        {{ link.name }}
      </a>
    </div>
    <p class="site-footer__copyright">{{ site?.footer.copyright }}</p>
  </footer>
</template>

<style scoped lang="scss">
.site-footer {
  padding: 24px;
  font-size: 13px;
  text-align: center;
  opacity: 0.8;

  &__links {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    justify-content: center;
    margin-bottom: 8px;
  }

  &__copyright {
    margin: 0;
  }
}
</style>
