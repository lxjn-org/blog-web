<script lang="ts">
interface Turnstile {
  render: (element: HTMLElement, options: {
    sitekey: string
    callback: (token: string) => void
    'expired-callback': () => void
    'error-callback': () => void
  }) => string
  remove: (id: string) => void
}

let pending: Promise<Turnstile> | undefined

/** 加载并复用 Turnstile 脚本，加载失败后允许重新尝试。 */
function loadTurnstile(): Promise<Turnstile> {
  pending ??= new Promise<Turnstile>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    // 脚本载入后读取浏览器提供的组件接口。
    script.onload = () => {
      const api = (window as Window & { turnstile?: Turnstile }).turnstile
      if (api) resolve(api)
      else reject(new Error('Turnstile'))
    }
    // 网络错误时移除脚本，供下次打开弹窗重试。
    script.onerror = () => {
      script.remove()
      reject(new Error('Turnstile'))
    }
    document.head.append(script)
  }).catch((error) => {
    pending = undefined
    throw error
  })
  return pending
}
</script>

<script setup lang="ts">
const { siteKey } = defineProps<{ siteKey: string }>()
const token = defineModel<string>({ required: true })
const emit = defineEmits<{ failed: [] }>()
const element = ref<HTMLElement>()
let api: Turnstile | undefined
let widget: string | undefined

/** 清除已经过期或验证失败的票据。 */
function clearToken() {
  token.value = ''
}

/** 展示验证组件，并将有效票据交给申请表单。 */
onMounted(async () => {
  try {
    api = await loadTurnstile()
    if (!element.value) return
    widget = api.render(element.value, {
      sitekey: siteKey,
      // 将验证成功的票据交给父组件。
      callback: value => { token.value = value },
      'expired-callback': clearToken,
      'error-callback': clearToken,
    })
  }
  catch {
    if (element.value) emit('failed')
  }
})

/** 关闭弹窗或刷新组件时释放验证组件。 */
onBeforeUnmount(() => {
  if (widget !== undefined) api?.remove(widget)
})
</script>

<template>
  <div ref="element" />
</template>
