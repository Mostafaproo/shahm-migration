<script setup lang="ts">
// Step 3 of 3 — ported from the legacy `pages/auth/reset-password/_token.vue`.
// The token comes from step 2's confirm response. On success the legacy sends
// the user back to the login tab, which is what happens here too.
import { useResetPasswordFormSchema } from '~/schemas/auth/password-reset/reset-password-form-schema'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const localePath = useLocalePath()
const { $appToast } = useNuxtApp()

const schema = computed(() => useResetPasswordFormSchema(t))
const state = reactive({ password: '', password_confirmation: '' })

const showPassword = ref(false)
const showConfirmation = ref(false)
const submitting = ref(false)

async function onSubmit() {
  submitting.value = true
  try {
    const message = await auth.resetPassword({
      token: String(route.params.token),
      password: state.password,
      password_confirmation: state.password_confirmation
    })
    if (message) $appToast.success(message)
    await navigateTo(localePath('/auth/login'))
  } catch {
    // Backend error already toasted by the http client.
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UCard :ui="{ body: 'p-8 sm:p-10' }">
    <div class="mb-8 space-y-2 text-center">
      <h1 class="text-xl font-bold">
        {{ t('auth.reset.title') }}
      </h1>
      <p class="text-sm text-muted">
        {{ t('auth.reset.subtitle') }}
      </p>
    </div>

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
    >
      <UFormField
        :label="t('user.new_password')"
        name="password"
      >
        <UInput
          v-model="state.password"
          class="w-full"
          size="lg"
          autocomplete="new-password"
          :type="showPassword ? 'text' : 'password'"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="t('user.new_password')"
              @click="showPassword = !showPassword"
            />
          </template>
        </UInput>
      </UFormField>

      <UFormField
        :label="t('user.password_confirmation')"
        name="password_confirmation"
      >
        <UInput
          v-model="state.password_confirmation"
          class="w-full"
          size="lg"
          autocomplete="new-password"
          :type="showConfirmation ? 'text' : 'password'"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showConfirmation ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="t('user.password_confirmation')"
              @click="showConfirmation = !showConfirmation"
            />
          </template>
        </UInput>
      </UFormField>

      <UButton
        type="submit"
        block
        size="lg"
        :loading="submitting"
      >
        {{ t('auth.reset.submit') }}
      </UButton>
    </UForm>
  </UCard>
</template>
