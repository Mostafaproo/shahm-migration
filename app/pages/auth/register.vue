<script setup lang="ts">
import { useRegisterFormSchema } from '~/schemas/auth/register/register-form-schema'

definePageMeta({ layout: 'auth' })

const { t } = useI18n()
const auth = useAuthStore()
const localePath = useLocalePath()

const schema = computed(() => useRegisterFormSchema(t))
const state = reactive({
  first_name: '',
  mobile: '',
  password: '',
  password_confirmation: '',
  termsAndConditions: false
})
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

const submitting = ref(false)
const errorMessage = ref<string | null>(null)

async function onSubmit() {
  submitting.value = true
  errorMessage.value = null
  try {
    await auth.register({ ...state, userType: 'student' })
    await navigateTo(
      localePath({
        path: '/auth/registration-activation',
        query: { identifier: state.mobile }
      })
    )
  } catch {
    errorMessage.value = t('auth.register.error')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <UCard :ui="{ body: 'p-8 sm:p-10' }">
    <div class="mb-8 space-y-2 text-center">
      <h1 class="text-xl font-bold">
        {{ $t('auth.register.title') }}
      </h1>
      <p class="text-sm text-muted">
        {{ $t('auth.register.subtitle') }}
      </p>
    </div>

    <AuthTabs
      active="register"
      class="mb-8"
    />

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
    >
      <UFormField
        :label="$t('auth.register.name')"
        name="first_name"
      >
        <UInput
          v-model="state.first_name"
          class="w-full"
          size="lg"
          icon="i-lucide-user"
          :placeholder="$t('auth.register.name_placeholder')"
        />
      </UFormField>

      <UFormField
        :label="$t('auth.register.mobile')"
        name="mobile"
      >
        <UInput
          v-model="state.mobile"
          class="w-full"
          size="lg"
          icon="i-lucide-phone"
          :placeholder="$t('auth.register.mobile_placeholder')"
        />
      </UFormField>

      <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <UFormField
          :label="$t('auth.register.password')"
          name="password"
        >
          <UInput
            v-model="state.password"
            class="w-full"
            size="lg"
            :type="showPassword ? 'text' : 'password'"
            :placeholder="$t('auth.register.password')"
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

        <UFormField
          :label="$t('auth.register.password_confirmation')"
          name="password_confirmation"
        >
          <UInput
            v-model="state.password_confirmation"
            class="w-full"
            size="lg"
            :type="showPasswordConfirmation ? 'text' : 'password'"
            :placeholder="$t('auth.register.password_confirmation')"
          >
            <template #trailing>
              <UButton
                :icon="showPasswordConfirmation ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                color="neutral"
                variant="link"
                size="sm"
                :aria-label="showPasswordConfirmation ? 'Hide password' : 'Show password'"
                @click="showPasswordConfirmation = !showPasswordConfirmation"
              />
            </template>
          </UInput>
        </UFormField>
      </div>

      <UFormField name="termsAndConditions">
        <UCheckbox v-model="state.termsAndConditions">
          <template #label>
            {{ $t('auth.register.terms_prefix') }}
            <NuxtLink
              :to="localePath('/privacy-policy')"
              class="text-primary hover:underline"
            >
              {{ $t('auth.register.terms_link') }}
            </NuxtLink>
          </template>
        </UCheckbox>
      </UFormField>

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
        {{ $t('auth.register.submit') }}
      </UButton>

      <p class="text-center text-sm text-muted">
        {{ $t('auth.register.already_have_account') }}
        <NuxtLink
          :to="localePath('/auth/login')"
          class="font-medium text-primary hover:underline"
        >
          {{ $t('auth.tabs.login') }}
        </NuxtLink>
      </p>
    </UForm>
  </UCard>
</template>
