<script setup lang="ts">
import { useMessage } from 'naive-ui'
import type { FormInst, FormRules } from 'naive-ui'

const show = defineModel<boolean>('show', { default: false })

const { t } = useI18n()
const message = useMessage()
const { data: site } = await useSiteConfig()
const { data: profile } = await useProfile()

const formRef = ref<FormInst | null>(null)
const step = ref<'form' | 'done'>('form')
const submitting = ref(false)
const confirmed = ref(false)
const captchaToken = ref('')
const captchaAttempt = ref(0)

/** 提示验证组件加载失败。 */
function reportCaptchaError() {
  message.error(t('friendLink.captchaFailed'))
}

/** 生成空白表单 */
function emptyForm() {
  return { name: '', url: '', avatar: '', description: '', email: '', backlinkUrl: '' }
}
const form = ref(emptyForm())

const URL_RE = /^https?:\/\/\S+$/i

const rules = computed<FormRules>(() => ({
  name: { required: true, max: 30, trigger: 'blur', message: t('friendLink.rule.name') },
  url: { required: true, pattern: URL_RE, trigger: 'blur', message: t('friendLink.rule.url') },
  avatar: { pattern: URL_RE, trigger: 'blur', message: t('friendLink.rule.url') },
  email: { required: true, type: 'email', trigger: 'blur', message: t('friendLink.rule.email') },
  backlinkUrl: { pattern: URL_RE, trigger: 'blur', message: t('friendLink.rule.url') },
}))

// 本站信息，供对方先添加本站
const siteInfo = computed(() => [
  { label: t('friendLink.info.name'), value: site.value?.name ?? '' },
  { label: t('friendLink.info.url'), value: `https://${site.value?.domain ?? ''}` },
  { label: t('friendLink.info.avatar'), value: profile.value?.avatar || '-' },
  { label: t('friendLink.info.description'), value: site.value?.slogan ?? '' },
])

/** 复制本站信息到剪贴板 */
async function copySiteInfo() {
  const text = siteInfo.value.map(item => `${item.label}: ${item.value}`).join('\n')
  try {
    await navigator.clipboard.writeText(text)
    message.success(t('friendLink.copied'))
  }
  catch {
    message.error(t('friendLink.copyFailed'))
  }
}

/** 校验并提交申请；成功后切到“已提交”状态 */
async function submit() {
  try {
    await formRef.value?.validate()
  }
  catch {
    return
  }
  if (!confirmed.value) {
    message.warning(t('friendLink.needConfirm'))
    return
  }

  if (submitting.value || !captchaToken.value) return
  submitting.value = true
  const body: FriendLinkApply = { ...form.value, captchaToken: captchaToken.value }
  const res = await apiRequest<{ id: number, status: 'pending' } | null>('/api/friend-links/apply', { method: 'POST', body })
    .catch(() => ({ code: 50000, message: t('friendLink.failed'), data: null }))
  submitting.value = false
  captchaToken.value = ''

  if (res.code === 0) step.value = 'done'
  else {
    captchaAttempt.value++
    message.error(res.message)
  }
}

/** 关闭弹窗；关闭动画结束后重置表单 */
function close() {
  show.value = false
}

/** 弹窗完全关闭后恢复初始状态 */
function reset() {
  step.value = 'form'
  form.value = emptyForm()
  confirmed.value = false
  captchaToken.value = ''
}
</script>

<template>
  <n-modal
    v-model:show="show"
    preset="card"
    class="fl-dialog"
    :title="step === 'done' ? t('friendLink.doneTitle') : t('friendLink.title')"
    :bordered="false"
    :mask-closable="step === 'done'"
    @after-leave="reset"
  >
    <template v-if="step === 'form'">
      <div class="fl-site">
        <div class="fl-site__head">
          <span>{{ t('friendLink.addUsFirst') }}</span>
          <n-button text type="primary" size="small" @click="copySiteInfo">{{ t('friendLink.copy') }}</n-button>
        </div>
        <div v-for="item in siteInfo" :key="item.label" class="fl-site__kv">
          <span>{{ item.label }}</span><span>{{ item.value }}</span>
        </div>
      </div>

      <n-form ref="formRef" :model="form" :rules="rules" label-placement="top" require-mark-placement="right-hanging">
        <n-grid cols="1 s:2" responsive="screen" :x-gap="16">
          <n-form-item-gi :label="t('friendLink.field.siteName')" path="name">
            <n-input v-model:value="form.name" :maxlength="30" :placeholder="t('friendLink.ph.name')" />
          </n-form-item-gi>
          <n-form-item-gi :label="t('friendLink.field.url')" path="url">
            <n-input v-model:value="form.url" placeholder="https://" />
          </n-form-item-gi>
          <n-form-item-gi :span="2" :label="t('friendLink.field.avatar')" path="avatar">
            <n-input v-model:value="form.avatar" :placeholder="t('friendLink.ph.avatar')" />
          </n-form-item-gi>
          <n-form-item-gi :span="2" :label="t('friendLink.field.description')" path="description">
            <n-input
              v-model:value="form.description"
              type="textarea"
              :rows="2"
              :maxlength="50"
              show-count
              :placeholder="t('friendLink.ph.description')"
            />
          </n-form-item-gi>
          <n-form-item-gi :span="2" :label="t('friendLink.field.email')" path="email">
            <n-input v-model:value="form.email" :placeholder="t('friendLink.ph.email')" />
          </n-form-item-gi>
          <n-form-item-gi :span="2" :label="t('friendLink.field.backlink')" path="backlinkUrl">
            <n-input v-model:value="form.backlinkUrl" :placeholder="t('friendLink.ph.backlink')" />
          </n-form-item-gi>
        </n-grid>
      </n-form>

      <n-checkbox v-model:checked="confirmed">{{ t('friendLink.confirm') }}</n-checkbox>
      <TurnstileWidget v-if="show && site?.captcha.siteKey" :key="captchaAttempt" v-model="captchaToken" :site-key="site.captcha.siteKey" @failed="reportCaptchaError" />
      <p class="fl-note">{{ t('friendLink.note', { days: site?.friendLinkApply.reviewDays ?? 3 }) }}</p>
    </template>

    <div v-else class="fl-done">
      <span class="fl-done__icon"><AppIcon name="check" :size="28" :stroke-width="2.2" /></span>
      <strong>{{ t('friendLink.doneHead') }}</strong>
      <p>{{ t('friendLink.doneText') }}</p>
    </div>

    <template #footer>
      <div class="fl-actions" :class="{ 'is-center': step === 'done' }">
        <template v-if="step === 'form'">
          <n-button @click="close">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" :loading="submitting" :disabled="!captchaToken" @click="submit">{{ t('friendLink.submit') }}</n-button>
        </template>
        <n-button v-else type="primary" @click="close">{{ t('common.gotIt') }}</n-button>
      </div>
    </template>
  </n-modal>
</template>

<style lang="scss">
// n-modal 渲染到 body 下，样式不能用 scoped
.fl-dialog {
  width: calc(100vw - 32px);
  max-width: 560px;
}
</style>

<style scoped lang="scss">
.fl-site {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  margin-bottom: 16px;
  background: var(--action-color);
  border-radius: 8px;

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 13px;
    font-weight: 600;
  }

  &__kv {
    display: flex;
    gap: 10px;
    padding: 3px 0;
    font-size: 12px;

    span:first-child {
      flex-shrink: 0;
      width: 48px;
      color: var(--text-color-3);
    }

    span:last-child {
      word-break: break-all;
    }
  }
}

.fl-note {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.7;
  color: var(--text-color-3);
}

.fl-done {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: 8px 0;
  text-align: center;

  &__icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    color: var(--success-color);
    background: color-mix(in srgb, var(--success-color) 12%, transparent);
    border-radius: 50%;
  }

  strong {
    font-size: 16px;
  }

  p {
    max-width: 320px;
    margin: 0;
    font-size: 13px;
    line-height: 1.8;
    color: var(--text-color-2);
  }
}

.fl-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;

  &.is-center {
    justify-content: center;
  }
}
</style>
