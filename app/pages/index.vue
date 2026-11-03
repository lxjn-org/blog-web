<script setup lang="ts">
definePageMeta({ layout: 'home', fullPage: true })

const { t } = useI18n()
const localePath = useLocalePath()
const { data: site } = await useSiteConfig()
const { data: profile } = await useProfile()
const { data: projects } = await useApi<Project[]>('/api/projects', { key: 'projects-featured', query: { featured: 1 } })
const { data: skills } = await useApi<HomeSkill[]>('/api/skills', { key: 'skills-home', query: { home: 1 } })

const fpIndex = useFullPageIndex()
// 离开首页时回到第一屏，避免下次进入时页头状态错乱
onBeforeUnmount(() => { fpIndex.value = 0 })

const sectionLabels = computed(() => [t('home.intro'), t('home.featured'), t('home.stack')])

// 头像为空时显示名字首字
const avatarText = computed(() => profile.value?.name.slice(0, 1) ?? '')

useSeoMeta({
  title: () => site.value?.name,
  description: () => profile.value?.homeIntro ?? site.value?.slogan,
  ogTitle: () => site.value?.name,
  ogDescription: () => profile.value?.homeIntro ?? site.value?.slogan,
  ogType: 'website',
})
</script>

<template>
  <FullPage v-model:index="fpIndex" :labels="sectionLabels">
    <template #default="{ go }">
      <!-- 第一屏：个人介绍 -->
      <section class="fp-section" :aria-label="t('home.intro')">
        <div class="intro">
          <div class="intro__avatar">
            <img v-if="profile?.avatar" :src="profile.avatar" :alt="profile.name">
            <span v-else aria-hidden="true">{{ avatarText }}</span>
          </div>
          <h1 class="intro__name">{{ profile?.name }}</h1>
          <p class="intro__title">{{ profile?.title }}</p>
          <p class="intro__desc">{{ profile?.homeIntro }}</p>
          <ContactLinks v-if="profile" class="intro__contacts" :contacts="profile.contacts" variant="circle" />
        </div>
        <button class="scroll-hint" type="button" @click="go(1)">
          {{ t('home.scrollHint') }}
          <AppIcon name="chevron-down" :stroke-width="2" />
        </button>
      </section>

      <!-- 第二屏：精选项目 -->
      <section class="fp-section" :aria-label="t('home.featured')">
        <div class="block">
          <div class="block__head">
            <h2>{{ t('home.featured') }}</h2>
            <p>{{ t('home.featuredDesc') }}</p>
          </div>
          <div class="project-grid">
            <NuxtLink v-for="item in projects" :key="item.id" class="project-card" :to="localePath('/projects')">
              <span class="project-card__icon"><AppIcon :name="item.icon" :size="22" /></span>
              <span class="project-card__name">{{ item.name }}</span>
              <span class="project-card__desc">{{ item.description }}</span>
              <span class="project-card__tags">
                <n-tag v-for="tag in item.techTags" :key="tag" size="small" :bordered="false">{{ tag }}</n-tag>
              </span>
            </NuxtLink>
          </div>
          <NuxtLink class="more-link" :to="localePath('/projects')">
            {{ t('home.viewAllProjects') }}
            <AppIcon name="arrow-right" :size="14" :stroke-width="2" />
          </NuxtLink>
        </div>
      </section>

      <!-- 第三屏：技术栈 + 页足 -->
      <section class="fp-section fp-section--last" :aria-label="t('home.stack')">
        <div class="fp-section__body">
          <div class="block">
            <div class="block__head">
              <h2>{{ t('home.stack') }}</h2>
              <p>{{ t('home.stackDesc') }}</p>
            </div>
            <div class="skill-grid">
              <div v-for="item in skills" :key="item.name" class="skill-card">
                <span class="skill-card__mark" aria-hidden="true">{{ item.mark }}</span>
                <span class="skill-card__name">{{ item.name }}</span>
                <span class="skill-card__cat">{{ item.category }}</span>
              </div>
            </div>
          </div>
        </div>
        <SiteFooter />
      </section>
    </template>
  </FullPage>
</template>

<style scoped lang="scss">
.fp-section {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: var(--header-height) 24px 0;

  &--last {
    justify-content: stretch;
    padding: var(--header-height) 0 0;
  }

  &__body {
    display: flex;
    flex-grow: 1;
    align-items: center;
    justify-content: center;
    width: 100%;
    padding: 32px 24px;
  }

  // 手机端：每屏至少一屏高，内容超出时自然撑开
  @include mobile {
    height: auto;
    min-height: 100vh;
    padding: 96px 16px 56px;

    &--last {
      padding: 96px 0 0;
    }

    &__body {
      padding: 0 16px 56px;
    }
  }
}

.intro {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: center;
  max-width: 560px;
  text-align: center;

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 128px;
    height: 128px;
    margin-bottom: 8px;
    overflow: hidden;
    font-size: 48px;
    font-weight: 700;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 10%, var(--glass-bg-strong));
    border: 4px solid var(--glass-bg-strong);
    border-radius: 50%;
    box-shadow: 0 8px 28px color-mix(in srgb, var(--primary-color) 22%, transparent);

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__name {
    margin: 0;
    font-size: 40px;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: 0.02em;
  }

  &__title {
    margin: 0;
    font-size: 18px;
    color: var(--text-color-2);
  }

  &__desc {
    margin: 0;
    line-height: 1.8;
    color: var(--text-color-3);
  }

  &__contacts {
    margin-top: 8px;
  }
}

.scroll-hint {
  position: absolute;
  bottom: 28px;
  left: 50%;
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  align-items: center;
  padding: 8px 16px;
  font: inherit;
  font-size: 12px;
  color: var(--text-color-3);
  cursor: pointer;
  background: transparent;
  border: 0;
  transform: translateX(-50%);

  &:hover {
    color: var(--primary-color);
  }

  @include mobile {
    display: none;
  }
}

.block {
  display: flex;
  flex-direction: column;
  gap: 32px;
  align-items: center;
  width: 100%;
  max-width: 1080px;

  &__head {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    text-align: center;

    h2 {
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }

    p {
      margin: 0;
      color: var(--text-color-3);
    }
  }
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;
  width: 100%;

  @include mobile {
    grid-template-columns: minmax(0, 1fr);
  }
}

.project-card {
  @include glass;
  @include card-hover;

  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border-radius: 3px;

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    border-radius: 8px;
  }

  &__name {
    font-size: 17px;
    font-weight: 600;
  }

  &__desc {
    flex-grow: 1;
    line-height: 1.7;
    color: var(--text-color-2);
  }

  &__tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }
}

.more-link {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  color: var(--text-color-2);

  &:hover {
    color: var(--primary-color);
  }
}

.skill-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  width: 100%;

  @include mobile {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.skill-card {
  @include glass;
  @include card-hover;

  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
  padding: 20px 16px;
  text-align: center;
  border-radius: 3px;

  &__mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    font-weight: 700;
    background: color-mix(in srgb, var(--text-color-1) 6%, transparent);
    border-radius: 8px;
  }

  &__name {
    font-size: 15px;
    font-weight: 600;
  }

  &__cat {
    font-size: 12px;
    color: var(--text-color-3);
  }
}
</style>
