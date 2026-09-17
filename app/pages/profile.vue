<script setup lang="ts">
import { useProfileFormSchema } from '~/schemas/auth/profile/profile-form-schema'

definePageMeta({ layout: 'dashboard', title: 'user.profile' })

const { t } = useI18n()
const store = useProfileStore()

useHead({ title: () => t('user.profile') })

const schema = computed(() => useProfileFormSchema(t))
const state = reactive({ first_name: '', last_name: '' })

const showChangePassword = ref(false)

const isDirty = computed(() => {
  const p = store.profile
  if (!p) return false
  return state.first_name !== p.firstName
    || state.last_name !== p.lastName
    || store.pendingMediaId != null
})

const isStudent = computed(() => store.profile?.userType === 'student')

watch(() => store.profile, (profile) => {
  if (!profile) return
  state.first_name = profile.firstName
  state.last_name = profile.lastName
}, { immediate: true })

async function onAvatarSelect(file: File) {
  if (!await store.uploadAvatar(file)) {
    useNuxtApp().$appToast.error(t('user.photo_upload_failed'))
  }
}

async function onSubmit() {
  await store.updateProfile({ ...state })
}

onMounted(() => store.fetchProfile())
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <div
      v-if="store.isLoading && !store.profile"
      class="space-y-6"
    >
      <USkeleton class="mx-auto h-24 w-24 rounded-full" />
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <USkeleton
          v-for="n in 4"
          :key="n"
          class="h-10 w-full"
        />
      </div>
    </div>

    <p
      v-else-if="!store.profile"
      class="py-16 text-center text-muted"
    >
      {{ t('user.load_failed') }}
    </p>

    <UForm
      v-else
      :schema="schema"
      :state="state"
      class="space-y-8"
      @submit="onSubmit"
    >
      <div class="space-y-6 rounded-xl border border-default bg-default p-6">
        <SharedDataInputAppAvatarUpload
          :src="store.profile.profilePicture"
          :loading="store.isUploading"
          @select="onAvatarSelect"
        />

        <div class="flex flex-wrap items-center justify-center gap-3">
          <UButton
            type="submit"
            size="lg"
            :disabled="!isDirty"
            :loading="store.isSaving"
          >
            {{ t('user.update_user_data') }}
          </UButton>
          <UButton
            size="lg"
            color="neutral"
            variant="soft"
            @click="showChangePassword = true"
          >
            {{ t('user.change_password') }}
          </UButton>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-x-6 gap-y-4 xl:grid-cols-2">
        <UFormField
          :label="t('user.first_name')"
          name="first_name"
        >
          <UInput
            v-model="state.first_name"
            class="w-full"
            size="lg"
            :placeholder="t('user.pls_first_name')"
          />
        </UFormField>

        <UFormField
          :label="t('user.last_name')"
          name="last_name"
        >
          <UInput
            v-model="state.last_name"
            class="w-full"
            size="lg"
            :placeholder="t('user.pls_last_name')"
          />
        </UFormField>

        <!-- Read-only in the legacy too: changing either needs a separate flow. -->
        <UFormField
          :label="t('user.email')"
          name="email"
        >
          <UInput
            :model-value="store.profile.email"
            class="w-full"
            size="lg"
            type="email"
            disabled
          />
        </UFormField>

        <UFormField
          :label="t('user.mobile')"
          name="mobile"
        >
          <UInput
            :model-value="store.profile.mobile"
            class="w-full"
            size="lg"
            type="tel"
            disabled
          />
        </UFormField>

        <UFormField
          v-if="isStudent"
          :label="t('user.wallet_amount')"
          name="wallet_amount"
        >
          <UInput
            :model-value="store.profile.walletAmount ?? ''"
            class="w-full"
            size="lg"
            disabled
          />
        </UFormField>
      </div>
    </UForm>

    <AuthChangePasswordModal v-model="showChangePassword" />
  </div>
</template>
