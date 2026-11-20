<script setup lang="ts">
import MarkdownIt from 'markdown-it'

const route = useRoute()
const localePath = useLocalePath()
const { t, d } = useI18n()
const { data: post, error } = await useApi<PostDetail>(() => `/api/posts/${encodeURIComponent(String(route.params.slug))}`)

// 文章不存在时显示 404 页，服务端渲染也返回 404 状态码
if (error.value) throw createError({ ...error.value, fatal: true })
if (!post.value) throw createError({ statusCode: 404, fatal: true })

const markdown = new MarkdownIt({ html: false })

/** 渲染禁用原生 HTML 的 Markdown，并从二、三级标题生成目录。 */
const article = computed(() => {
  const env = {}
  const tokens = markdown.parse(post.value?.content ?? '', env)
  const headings: Array<{ id: string, title: string, level: string }> = []
  tokens.forEach((token, index) => {
    if (token.type !== 'heading_open' || !['h2', 'h3'].includes(token.tag)) return
    const id = `section-${headings.length + 1}`
    token.attrSet('id', id)
    headings.push({ id, title: tokens[index + 1]?.content ?? '', level: token.tag })
  })
  return { html: markdown.renderer.render(tokens, markdown.options, env), headings }
})

useSeoMeta({
  title: () => post.value?.title,
  description: () => post.value?.summary,
  ogType: 'article',
})
</script>

<template>
  <article v-if="post" class="page">
    <nav class="page__meta">
      <NuxtLink :to="localePath('/blog')">{{ t('page.blog') }}</NuxtLink>
      <span aria-hidden="true">/</span>
      <NuxtLink :to="localePath({ path: '/blog', query: { category: post.category.slug } })">{{ post.category.name }}</NuxtLink>
    </nav>
    <h1>{{ post.title }}</h1>
    <div class="page__meta">
      <time :datetime="post.publishedAt">{{ d(new Date(post.publishedAt), { dateStyle: 'medium', timeZone: 'UTC' }) }}</time>
      <span>{{ t('blog.readMinutes', { n: post.readMinutes }) }}</span>
      <span>{{ t('blog.views', { n: post.views }) }}</span>
    </div>
    <img v-if="post.cover" :src="post.cover" alt="" class="page__cover">
    <nav v-if="article.headings.length" class="page__toc" :aria-label="t('blog.toc')">
      <strong>{{ t('blog.toc') }}</strong>
      <a v-for="heading in article.headings" :key="heading.id" :href="'#' + heading.id" :class="{ nested: heading.level === 'h3' }">
        {{ heading.title }}
      </a>
    </nav>
    <div class="page__content" v-html="article.html" />
    <div v-if="post.tags.length" class="page__meta">
      <NuxtLink v-for="tag in post.tags" :key="tag.slug" :to="localePath({ path: '/blog', query: { tag: tag.slug } })">
        #{{ tag.name }}
      </NuxtLink>
    </div>
    <nav v-if="post.prev || post.next" class="page__neighbors">
      <NuxtLink v-if="post.prev" :to="localePath('/blog/' + encodeURIComponent(post.prev.slug))">{{ t('blog.prev') }} {{ post.prev.title }}</NuxtLink>
      <NuxtLink v-if="post.next" :to="localePath('/blog/' + encodeURIComponent(post.next.slug))">{{ t('blog.next') }} {{ post.next.title }}</NuxtLink>
    </nav>
  </article>
</template>

<style scoped lang="scss">
.page {
  max-width: 800px;
  padding: 48px 24px;
  margin: 0 auto;

  &__meta, &__neighbors {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 20px;
    color: var(--text-color-2);
  }

  &__cover {
    width: 100%;
    margin-top: 24px;
    border-radius: 12px;
  }

  &__toc {
    display: grid;
    gap: 8px;
    margin: 24px 0;
    padding: 16px;
    background: var(--action-color);
    border-radius: 8px;

    .nested { padding-inline-start: 16px; }
  }

  &__content {
    margin: 28px 0;
    line-height: 1.8;
    overflow-wrap: anywhere;

    :deep([id]) { scroll-margin-top: 100px; }
    :deep(img) { max-width: 100%; }
    :deep(pre) { overflow-x: auto; padding: 12px; background: var(--action-color); }
  }

  &__neighbors {
    justify-content: space-between;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
  }
}
</style>
