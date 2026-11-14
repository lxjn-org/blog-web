<script setup lang="ts">
import type { LocationQueryRaw } from 'vue-router'

const PAGE_SIZE = 10

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const router = useRouter()
const { data: site } = await useSiteConfig()
const { data: profile } = await useProfile()

/** 取 URL 里的单个查询参数，数组时取第一个，缺省为空串 */
function queryOf(key: string) {
  const value = route.query[key]
  return String((Array.isArray(value) ? value[0] : value) ?? '')
}

// 筛选条件全部放在 URL 上，刷新、分享、前进后退都能还原
const filters = computed(() => ({
  q: queryOf('q'),
  category: queryOf('category'),
  tag: queryOf('tag'),
  page: Math.max(1, Number.parseInt(queryOf('page'), 10) || 1),
}))

const apiQuery = computed(() => ({
  q: filters.value.q || undefined,
  category: filters.value.category || undefined,
  tag: filters.value.tag || undefined,
  page: filters.value.page,
  size: PAGE_SIZE,
}))

const { data: posts } = await useApi<PageResult<PostSummary>>('/api/posts', { query: apiQuery })
const { data: categories } = await useApi<TaxonomyCount[]>('/api/categories', { key: 'categories' })
const { data: tags } = await useApi<TaxonomyCount[]>('/api/tags', { key: 'tags' })

const pageCount = computed(() => Math.max(1, Math.ceil((posts.value?.total ?? 0) / PAGE_SIZE)))
// “全部”分类的数量为各分类文章数之和
const totalCount = computed(() => (categories.value ?? []).reduce((sum, item) => sum + item.count, 0))
// 头像为空时显示名字首字
const avatarText = computed(() => profile.value?.name.slice(0, 1) ?? '')

/** 生成带筛选条件的博客列表地址；传入的条件覆盖当前条件，空值会被去掉，未指定页码时回到第一页 */
function listLink(patch: Partial<Record<'q' | 'category' | 'tag', string>> & { page?: number } = {}) {
  const next = { ...filters.value, page: 1, ...patch }
  const query: LocationQueryRaw = {}
  if (next.q) query.q = next.q
  if (next.category) query.category = next.category
  if (next.tag) query.tag = next.tag
  if (next.page > 1) query.page = next.page
  return { path: localePath('/blog'), query }
}

/** 标签链接：再次点击已选中的标签则取消筛选 */
function tagLink(slug: string) {
  return listLink({ tag: filters.value.tag === slug ? '' : slug })
}

/** 取日期部分（YYYY-MM-DD），直接截取接口返回的字符串，避免服务端与浏览器时区不同导致显示不一致 */
function formatDate(iso: string) {
  return iso.slice(0, 10)
}

// 搜索框内容；输入停顿 300ms 后才写入 URL 触发请求
const keyword = ref(filters.value.q)
let searchTimer: ReturnType<typeof setTimeout> | undefined

/** 把搜索词写入 URL（替换当前历史记录，避免每次输入都产生一条后退记录） */
function applySearch() {
  clearTimeout(searchTimer)
  const q = keyword.value.trim()
  if (q !== filters.value.q) router.replace(listLink({ q }))
}

/** 搜索框输入时防抖触发搜索 */
function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(applySearch, 300)
}

/** 翻页：写入 URL 并回到页面顶部 */
function onPageChange(page: number) {
  router.push(listLink({ page }))
  window.scrollTo({ top: 0 })
}

// 前进后退或点击筛选改变 URL 时，同步搜索框内容
watch(() => filters.value.q, (q) => {
  if (q !== keyword.value.trim()) keyword.value = q
})
onBeforeUnmount(() => clearTimeout(searchTimer))

useSeoMeta({
  title: () => t('page.blog'),
  description: () => t('blog.subtitle'),
})
</script>

<template>
  <div class="blog container">
    <div class="blog__head">
      <div class="blog__heading">
        <h1>{{ t('page.blog') }}</h1>
        <p>{{ t('blog.subtitle') }}</p>
      </div>
      <n-input
        v-model:value="keyword"
        class="blog__search"
        size="large"
        clearable
        :placeholder="t('blog.searchPlaceholder')"
        :input-props="{ 'type': 'search', 'aria-label': t('blog.search') }"
        @input="onSearchInput"
        @clear="applySearch"
        @keyup.enter="applySearch"
      >
        <template #prefix>
          <AppIcon name="search" :size="16" :stroke-width="2" />
        </template>
      </n-input>
    </div>

    <div class="blog__body">
      <div class="blog__main">
        <div class="card post-list">
          <NuxtLink
            v-for="post in posts?.list"
            :key="post.id"
            class="post-row"
            :to="localePath(`/blog/${post.slug}`)"
          >
            <div class="post-row__text">
              <span class="post-row__title">
                <n-tag v-if="post.isTop" size="small" type="primary" :bordered="false">{{ t('blog.top') }}</n-tag>
                {{ post.title }}
              </span>
              <span class="post-row__summary">{{ post.summary }}</span>
              <span class="post-row__meta">
                <time :datetime="post.publishedAt">{{ formatDate(post.publishedAt) }}</time>
                <n-tag size="small">{{ post.category.name }}</n-tag>
                <span>{{ t('blog.readMinutes', { n: post.readMinutes }) }}</span>
              </span>
            </div>
            <img v-if="post.cover" class="post-row__cover" :src="post.cover" alt="" loading="lazy">
          </NuxtLink>
          <n-empty v-if="!posts?.list.length" class="post-list__empty" :description="t('blog.empty')" />
        </div>

        <nav v-if="posts?.total" class="blog__pager" :aria-label="t('blog.pagination')">
          <n-pagination :page="filters.page" :page-count="pageCount" @update:page="onPageChange" />
        </nav>
      </div>

      <aside class="blog__aside">
        <div class="card author">
          <div class="author__avatar">
            <img v-if="profile?.avatar" :src="profile.avatar" :alt="profile.name">
            <span v-else aria-hidden="true">{{ avatarText }}</span>
          </div>
          <span class="author__name">{{ profile?.name }}</span>
          <span class="author__sign">{{ site?.slogan }}</span>
        </div>

        <div class="card cats">
          <h2>{{ t('blog.categories') }}</h2>
          <NuxtLink class="cat-row" :class="{ 'is-active': !filters.category }" :to="listLink({ category: '' })">
            <span>{{ t('blog.all') }}</span>
            <span class="cat-row__count">{{ totalCount }}</span>
          </NuxtLink>
          <NuxtLink
            v-for="item in categories"
            :key="item.slug"
            class="cat-row"
            :class="{ 'is-active': filters.category === item.slug }"
            :to="listLink({ category: item.slug })"
          >
            <span>{{ item.name }}</span>
            <span class="cat-row__count">{{ item.count }}</span>
          </NuxtLink>
        </div>

        <div v-if="tags?.length" class="card tags">
          <h2>{{ t('blog.tags') }}</h2>
          <div class="tags__list">
            <NuxtLink
              v-for="item in tags"
              :key="item.slug"
              class="tag-link"
              :class="{ 'is-active': filters.tag === item.slug }"
              :to="tagLink(item.slug)"
            >
              {{ item.name }}
            </NuxtLink>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.blog {
  display: flex;
  flex-direction: column;
  gap: 28px;
  padding-top: 48px;
  padding-bottom: 80px;

  &__head {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: flex-end;
    justify-content: space-between;
  }

  &__heading {
    display: flex;
    flex-direction: column;
    gap: 8px;

    h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 600;
      line-height: 1.3;
      color: var(--text-color-1);
    }

    p {
      margin: 0;
      font-size: 15px;
      color: var(--text-color-2);
    }
  }

  &__search {
    width: 320px;
    max-width: 100%;
  }

  &__body {
    display: flex;
    flex-wrap: wrap;
    gap: 24px;
    align-items: flex-start;
  }

  // 主栏优先占满，放不下时侧栏整体换到下一行
  &__main {
    display: flex;
    flex: 999 1 560px;
    flex-direction: column;
    gap: 24px;
    min-width: 0;
  }

  &__aside {
    display: flex;
    flex: 1 1 280px;
    flex-direction: column;
    gap: 20px;
    min-width: 0;
  }

  &__pager {
    display: flex;
    justify-content: center;
  }
}

.card {
  @include glass;

  overflow: hidden;
  border-radius: var(--border-radius);

  h2 {
    margin: 0;
    font-size: 15px;
    font-weight: 600;
    color: var(--text-color-1);
  }
}

.post-list__empty {
  padding: 56px 24px;
}

.post-row {
  display: flex;
  gap: 20px;
  padding: 24px;
  border-bottom: 1px solid var(--divider-color);
  transition: background-color 0.2s;

  &:last-child {
    border-bottom: 0;
  }

  &:hover {
    background: var(--action-color);

    .post-row__title {
      color: var(--primary-color);
    }
  }

  &__text {
    display: flex;
    flex-grow: 1;
    flex-direction: column;
    gap: 8px;
    min-width: 0;
  }

  &__title {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 17px;
    font-weight: 600;
    color: var(--text-color-1);
    transition: color 0.2s;
  }

  // 摘要最多两行，超出省略
  &__summary {
    display: -webkit-box;
    overflow: hidden;
    line-height: 1.7;
    color: var(--text-color-2);
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: center;
    font-size: 13px;
    color: var(--text-color-3);
  }

  &__cover {
    flex-shrink: 0;
    width: 160px;
    height: 100px;
    object-fit: cover;
    border-radius: var(--border-radius);

    @include mobile {
      display: none;
    }
  }

  @include mobile {
    padding: 20px 16px;
  }
}

.author {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  padding: 24px;
  text-align: center;

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    overflow: hidden;
    font-size: 28px;
    font-weight: 700;
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 10%, var(--glass-bg-strong));
    border-radius: 50%;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  &__name {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-color-1);
  }

  &__sign {
    font-size: 13px;
    color: var(--text-color-3);
  }
}

.cats {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 16px 12px;

  h2 {
    margin: 0 12px 8px;
  }
}

.cat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 40px;
  padding: 0 12px;
  color: var(--text-color-2);
  border-radius: var(--border-radius);

  &:hover {
    color: var(--primary-color);
    background: var(--action-color);
  }

  &.is-active {
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
  }

  &__count {
    font-size: 12px;
    color: var(--text-color-3);
  }
}

.tags {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;

  &__list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
}

.tag-link {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 9px;
  font-size: 12px;
  color: var(--text-color-2);
  white-space: nowrap;
  background: var(--action-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);

  &:hover,
  &.is-active {
    color: var(--primary-color);
    background: color-mix(in srgb, var(--primary-color) 10%, transparent);
    border-color: color-mix(in srgb, var(--primary-color) 30%, transparent);
  }
}
</style>
