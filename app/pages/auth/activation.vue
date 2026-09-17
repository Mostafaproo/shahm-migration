<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const OTP_LENGTH = 4
const RESEND_COOLDOWN_SECONDS = 180

const { t } = useI18n()
const route = useRoute()
const auth = useAuthStore()
const localePath = useLocalePath()
const { $appToast } = useNuxtApp()

const identifier = computed(() => String(route.query.identifier ?? ''))

const otp = ref<number[]>([])
const submitting = ref(false)
const resending = ref(false)

const otpValue = computed(() => otp.value.join(''))
const isComplete = computed(() => otpValue.value.length === OTP_LENGTH)

// --- Resend cooldown
const secondsLeft = ref(RESEND_COOLDOWN_SECONDS)
let ticker: ReturnType<typeof setInterval> | null = null

const formattedTime = computed(() => {
  const minutes = Math.floor(secondsLeft.value / 60)
  const seconds = secondsLeft.value % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

function startCooldown() {
  if (ticker) clearInterval(ticker)
  secondsLeft.value = RESEND_COOLDOWN_SECONDS
  ticker = setInterval(() => {
    if (secondsLeft.value <= 0) {
      if (ticker) clearInterval(ticker)
      ticker = null
      return
    }
    secondsLeft.value -= 1
  }, 1000)
}

// Client-only: a countdown has nothing to render on the server.
onMounted(startCooldown)
onBeforeUnmount(() => {
  if (ticker) clearInterval(ticker)
})

async function onSubmit() {
  if (!isComplete.value || !identifier.value) return
  submitting.value = true
  try {
    const { token, message } = await auth.confirmResetOtp({
      otp: otpValue.value,
      identifier: identifier.value
    })
    if (message) $appToast.success(message)

    // Legacy silently does nothing when the token is missing; say so instead,
    // otherwise the button just stops responding with no explanation.
    if (!token) {
      $appToast.error(t('auth.activation.no_token'))
      return
    }
    await navigateTo(localePath(`/auth/reset-password/${token}`))
  } catch {
    // Backend error already toasted by the http client.
  } finally {
    submitting.value = false
  }
}

async function onResend() {
  if (secondsLeft.value > 0 || !identifier.value) return
  resending.value = true
  try {
    const message = await auth.sendResetCode(identifier.value)
    if (message) $appToast.success(message)
    startCooldown()
  } catch {
    // Backend error already toasted by the http client.
  } finally {
    resending.value = false
  }
}
</script>

<template>
  <UCard :ui="{ body: 'p-8 sm:p-10' }">
    <div class="mb-8 space-y-2 text-center">
      <h1 class="text-xl font-bold">
        {{ t('auth.activation.title') }}
      </h1>
      <p class="text-sm text-muted">
        {{ t('auth.activation.subtitle', { identifier }) }}
      </p>
    </div>

    <UAlert
      v-if="!identifier"
      color="warning"
      variant="subtle"
      icon="i-lucide-info"
      :description="t('auth.activation.missing_identifier')"
      class="mb-6"
    />

    <form
      class="space-y-6"
      @submit.prevent="onSubmit"
    >
      <!-- Codes read left-to-right even in Arabic, hence the forced dir. -->
      <div
        class="flex justify-center"
        dir="ltr"
      >
        <UPinInput
          v-model="otp"
          :length="OTP_LENGTH"
          type="number"
          size="xl"
          otp
          :disabled="!identifier"
        />
      </div>

      <div class="flex items-center justify-between gap-3 text-sm">
        <span
          v-if="secondsLeft > 0"
          class="text-muted"
        >
          {{ t('auth.activation.resend_in', { time: formattedTime }) }}
        </span>
        <UButton
          v-else
          variant="link"
          color="primary"
          class="p-0"
          :loading="resending"
          :disabled="!identifier"
          @click="onResend"
        >
          {{ t('auth.activation.resend') }}
        </UButton>

        <UButton
          type="submit"
          size="lg"
          :loading="submitting"
          :disabled="!isComplete || !identifier"
        >
          {{ t('auth.activation.submit') }}
        </UButton>
      </div>
    </form>
  </UCard>
</template>
