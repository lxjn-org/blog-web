<template>
  <div class="layout">
    <SiteHeader />
    <main class="layout__main">
      <slot />
    </main>
    <SiteFooter />
  </div>
</template>

<style scoped lang="scss">
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;

  &__main {
    flex: 1;
    padding-top: var(--header-height);

    // 手机端页头换成两行，约 104px
    @include mobile {
      padding-top: 104px;
    }
  }
}
</style>
