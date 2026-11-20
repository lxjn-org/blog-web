<script setup lang="ts">
import { useMessage } from 'naive-ui'

const { t, locale } = useI18n()
const message = useMessage()
const localePath = useLocalePath()
const { data: site } = await useSiteConfig()
const { data: profile } = await useProfile()
const { data: links } = await useApi<FriendLink[]>('/api/friend-links', { key: 'friend-links' })

const showApply = ref(false)
const friendsRow = ref<HTMLElement>()
const friendsMeasure = ref<HTMLElement>()
const visibleCount = ref<number>()
const expanded = ref(false)
const collapsedRows = 3

/** 计算一组项目在给定宽度和列间距下需要的行数。 */
function countFriendRows(widths: number[], available: number, gap: number) {
  let rows = 1
  let used = 0
  for (const width of widths) {
    const itemWidth = Math.min(width, available)
    if (used && used + gap + itemWidth > available) {
      rows++
      used = itemWidth
    }
    else {
      used += used ? gap + itemWidth : itemWidth
    }
  }
  return rows
}

/** 按折叠行数上限测算可见友链，并为末尾操作预留空间。 */
function fitFriendLinks() {
  if (!friendsRow.value || !friendsMeasure.value) return
  const measure = friendsMeasure.value
  const available = friendsRow.value.getBoundingClientRect().width
  if (!available) return
  const gap = Number.parseFloat(getComputedStyle(measure).columnGap)
  const widths = Array.from(measure.querySelectorAll('[data-friend]'), item => item.getBoundingClientRect().width)
  const apply = measure.querySelector('[data-apply]')
  const more = measure.querySelector('[data-more]')?.getBoundingClientRect().width ?? 0
  const applyWidth = apply?.getBoundingClientRect().width ?? 0
  if (countFriendRows(apply ? [...widths, applyWidth] : widths, available, gap) <= collapsedRows) {
    visibleCount.value = widths.length
    expanded.value = false
    return
  }

  const actionsWidth = more + (apply ? gap + applyWidth : 0)
  let first = 0
  let last = widths.length - 1
  while (first < last) {
    const count = Math.ceil((first + last) / 2)
    if (countFriendRows([...widths.slice(0, count), actionsWidth], available, gap) <= collapsedRows) first = count
    else last = count - 1
  }
  visibleCount.value = first
}

/** 在容器、字体或友链内容改变时重新计算折叠位置。 */
watchPostEffect((onCleanup) => {
  if (!friendsRow.value || !friendsMeasure.value) return
  const observer = new ResizeObserver(fitFriendLinks)
  observer.observe(friendsRow.value)
  observer.observe(friendsMeasure.value)
  onCleanup(() => observer.disconnect())
})

// 链接或语言更新后重新测量，即使整行自然宽度恰好相同。
watch([links, locale, () => site.value?.friendLinkApply.enabled], fitFriendLinks, { flush: 'post' })

/** 展开时显示全部友链，折叠时只显示行数上限内的部分。 */
const visibleLinks = computed(() => (links.value ?? []).slice(0, expanded.value ? undefined : visibleCount.value))
/** 判断是否需要显示展开或收起按钮。 */
const hasExtraLinks = computed(() => visibleCount.value !== undefined && visibleCount.value < (links.value?.length ?? 0))

/** 打开申请弹窗，或提示访客当前无法提交申请。 */
function openApply() {
  if (!site.value?.friendLinkApply.ready) {
    message.info(t('footer.applyUnavailable'))
    return
  }
  showApply.value = true
}

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
        <div
          ref="friendsRow"
          class="site-footer__links site-footer__friends"
          :class="{ 'is-collapsed': !expanded }"
          :style="{ '--collapsed-rows': collapsedRows }"
        >
          <a v-for="link in visibleLinks" :key="link.id" class="f-link" :href="link.url" target="_blank" rel="noopener">
            {{ link.name }}
          </a>
          <div v-if="hasExtraLinks || site?.friendLinkApply.enabled" class="site-footer__links site-footer__friend-actions">
            <button
              v-if="hasExtraLinks"
              class="f-apply f-more"
              type="button"
              :aria-expanded="expanded"
              :aria-label="t(expanded ? 'footer.collapseFriends' : 'footer.moreFriends')"
              :title="t(expanded ? 'footer.collapseFriends' : 'footer.moreFriends')"
              @click="expanded = !expanded"
            >
              {{ t(expanded ? 'footer.collapseFriends' : 'footer.moreFriends') }}
            </button>
            <button v-if="site?.friendLinkApply.enabled" class="f-apply" type="button" @click="openApply">
              <AppIcon name="plus" :size="12" :stroke-width="2.2" />{{ t('footer.apply') }}
            </button>
          </div>
        </div>
        <div class="site-footer__measure" aria-hidden="true">
          <div ref="friendsMeasure" class="site-footer__links site-footer__measure-row">
            <span v-for="link in links" :key="link.id" class="f-link" data-friend>{{ link.name }}</span>
            <span v-if="site?.friendLinkApply.enabled" class="f-apply" data-apply>
              <AppIcon name="plus" :size="12" :stroke-width="2.2" />{{ t('footer.apply') }}
            </span>
            <span class="f-apply" data-more>{{ t('footer.moreFriends') }}</span>
          </div>
        </div>
      </nav>

      <nav class="site-footer__col" :aria-label="t('footer.site')">
        <span class="site-footer__title">{{ t('footer.site') }}</span>
        <div class="site-footer__links">
          <NuxtLink v-for="item in siteLinks" :key="item.to" class="f-link" :to="item.to">{{ item.label }}</NuxtLink>
        </div>
        <a v-if="site?.footer.showAdminEntry" class="f-link f-admin" href="/admin">
          <AppIcon name="lock" :size="12" />{{ t('footer.admin') }}
        </a>
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

    <FriendLinkDialog v-if="site?.friendLinkApply.enabled && site.friendLinkApply.ready" v-model:show="showApply" />
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
      position: relative;
      flex: 3 1 320px;
      min-width: 0;
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

  &__measure {
    position: absolute;
    inset: 0;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
  }

  &__measure-row {
    width: max-content;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  &__friends, &__measure-row {
    --friend-row-height: 20px;
    --friend-row-gap: 8px;
    row-gap: var(--friend-row-gap);
    line-height: var(--friend-row-height);

    > .f-link {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__friends.is-collapsed {
    max-height: calc(var(--collapsed-rows) * (var(--friend-row-height) + var(--friend-row-gap)) - var(--friend-row-gap));
    overflow: hidden;
  }

  &__friend-actions {
    flex: none;
    max-width: 100%;
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
  max-width: 100%;
  font-size: 13px;
  color: var(--text-color-2);
  overflow-wrap: anywhere;

  &:hover {
    color: var(--primary-color);
  }
}

.site-footer__bottom .f-link {
  font-size: inherit;
  color: inherit;
}

.f-apply, .f-admin {
  display: inline-flex;
  gap: 4px;
  align-self: flex-start;
  align-items: center;
}

.f-apply {
  padding: 0;
  font: inherit;
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  background: transparent;
  border: 0;
  white-space: nowrap;
}

.f-more {
  color: var(--text-color-2);

  &:hover {
    color: var(--primary-color);
  }
}
</style>
