<script setup lang="ts">
import { useLoginFormSchema } from '~/schemas/auth/login/login-form-schema'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const auth = useAuthStore()
const localePath = useLocalePath()

const schema = computed(() => useLoginFormSchema(t))
const state = reactive({ identifier: '', password: '' })
const rememberMe = ref(true)
const showPassword = ref(false)

const submitting = ref(false)
const errorMessage = ref<string | null>(null)

async function onSubmit() {
  submitting.value = true
  errorMessage.value = null
  try {
    const ok = await auth.login({
      ...state,
      userType: 'student',
      rememberMe: rememberMe.value
    })
    if (!ok) errorMessage.value = t('auth.login.error')
  } catch {
    errorMessage.value = t('auth.login.error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UCard :ui="{ body: 'p-8 sm:p-10' }">
    <div class="mb-8 space-y-2 text-center">
      <h1 class="text-xl font-bold">
        {{ $t('auth.login.title') }}
      </h1>
      <p class="text-sm text-muted">
        {{ $t('auth.login.subtitle') }}
      </p>
    </div>

    <AuthTabs
      active="login"
      class="mb-8"
    />

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
    >
      <UFormField
        :label="$t('auth.login.identifier')"
        name="identifier"
      >
        <UInput
          v-model="state.identifier"
          class="w-full"
          size="lg"
          icon="i-lucide-mail"
          :placeholder="$t('auth.login.identifier_placeholder')"
        />
      </UFormField>

      <UFormField
        :label="$t('auth.login.password')"
        name="password"
      >
        <UInput
          v-model="state.password"
          class="w-full"
          size="lg"
          icon="i-lucide-lock"
          :type="showPassword ? 'text' : 'password'"
          :placeholder="$t('auth.login.password_placeholder')"
        >
          <template #trailing>
            <UButton
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              color="neutral"
              variant="link"
              size="sm"
              :aria-label="showPassword ? 'Hide password' : 'Show password'"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <div class="flex items-center justify-between text-sm">
        <NuxtLink
          :to="localePath('/auth/forget-password')"
          class="text-muted hover:text-primary"
        >
          {{ $t('auth.login.forgot_password') }}
        </NuxtLink>
        <UCheckbox
          v-model="rememberMe"
          :label="$t('auth.login.remember_me')"
        />
      </div>

      <UAlert
        v-if="errorMessage"
        color="error"
        variant="subtle"
        :title="errorMessage"
      />

      <UButton
        type="submit"
        block
        size="lg"
        :loading="submitting"
        trailing-icon="i-lucide-arrow-left"
      >
        {{ $t('auth.login.submit') }}
      </UButton>
    </UForm>
  </UCard>
</template>
