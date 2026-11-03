<script setup lang="ts">
const { t } = useI18n()
const localePath = useLocalePath()
const { data: site } = await useSiteConfig()
const { data: profile } = await useProfile()
const { data: links } = await useApi<FriendLink[]>('/api/friend-links', { key: 'friend-links' })

const showApply = ref(false)

const siteLinks = computed(() => [
  { to: localePath('/'), label: t('nav.home') },
  { to: localePath('/projects'), label: t('nav.projects') },
  { to: localePath('/blog'), label: t('nav.blog') },
  { to: localePath('/about'), label: t('nav.about') },
])
</script>

<template>
  <footer class="site-footer">
    <div class="site-footer__main container">
      <div class="site-footer__about">
        <span class="site-footer__name">{{ profile?.name }}</span>
        <span class="site-footer__slogan">{{ site?.slogan }}</span>
        <ContactLinks v-if="profile" :contacts="profile.contacts" />
      </div>

      <nav class="site-footer__col site-footer__col--friends" :aria-label="t('footer.friends')">
        <span class="site-footer__title">{{ t('footer.friends') }}</span>
        <div class="site-footer__links">
          <a v-for="link in links" :key="link.id" class="f-link" :href="link.url" target="_blank" rel="noopener">
            {{ link.name }}
          </a>
          <button v-if="site?.friendLinkApply.enabled" class="f-apply" type="button" @click="showApply = true">
            <AppIcon name="plus" :size="12" :stroke-width="2.2" />{{ t('footer.apply') }}
          </button>
        </div>
      </nav>

      <nav class="site-footer__col" :aria-label="t('footer.site')">
        <span class="site-footer__title">{{ t('footer.site') }}</span>
        <div class="site-footer__links">
          <NuxtLink v-for="item in siteLinks" :key="item.to" class="f-link" :to="item.to">{{ item.label }}</NuxtLink>
        </div>
      </nav>
    </div>

    <div class="site-footer__bottom container">
      <span>{{ site?.footer.copyright }}</span>
      <span>
        <template v-if="site?.footer.icp">
          <a class="f-link" href="https://beian.miit.gov.cn" target="_blank" rel="noopener">{{ site.footer.icp }}</a> ·
        </template>
        {{ t('footer.builtWith') }}
      </span>
    </div>

    <FriendLinkDialog v-if="site?.friendLinkApply.enabled" v-model:show="showApply" />
  </footer>
</template>

<style scoped lang="scss">
.site-footer {
  @include glass;

  width: 100%;
  color: var(--text-color-1);
  border-width: 1px 0 0;
  box-shadow: none;

  &__main {
    display: flex;
    flex-wrap: wrap;
    gap: 28px 64px;
    padding-top: 32px;
  }

  &__about {
    display: flex;
    flex: 2 1 280px;
    flex-direction: column;
    gap: 8px;
  }

  &__name {
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 0.04em;
  }

  &__slogan {
    font-size: 13px;
    color: var(--text-color-3);
  }

  &__col {
    display: flex;
    flex: 1 1 140px;
    flex-direction: column;
    gap: 10px;

    &--friends {
      flex: 3 1 320px;
    }
  }

  &__title {
    font-size: 14px;
    font-weight: 600;
  }

  &__links {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    align-items: center;
  }

  &__bottom {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 24px;
    justify-content: space-between;
    padding-top: 16px;
    padding-bottom: 20px;
    margin-top: 24px;
    font-size: 12px;
    color: var(--text-color-3);
    border-top: 1px solid var(--divider-color);
  }
}

.f-link {
  font-size: 13px;
  color: var(--text-color-2);

  &:hover {
    color: var(--primary-color);
  }
}

.site-footer__bottom .f-link {
  font-size: inherit;
  color: inherit;
}

.f-apply {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  padding: 0;
  font: inherit;
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  background: transparent;
  border: 0;

  &:hover {
    text-decoration: underline;
  }
}
</style>
