<script setup lang="ts">
// Ported from the legacy `components/auth/ChangePassword.vue`.
import { useChangePasswordFormSchema } from '~/schemas/auth/profile/change-password-form-schema'

const open = defineModel<boolean>({ required: true })

const { t } = useI18n()
const store = useProfileStore()

const schema = computed(() => useChangePasswordFormSchema(t))

function blankState() {
  return { old_password: '', password: '', password_confirmation: '' }
}
const state = reactive(blankState())

// Legacy resets the form after a successful change; do it on open too so a
// cancelled attempt never leaves the old input lying around.
watch(open, (isOpen) => {
  if (isOpen) Object.assign(state, blankState())
})

async function onSubmit() {
  if (await store.changePassword({ ...state })) {
    Object.assign(state, blankState())
    open.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('user.change_password')"
  >
    <template #body>
      <UForm
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField
          :label="t('user.old_password')"
          name="old_password"
        >
          <UInput
            v-model="state.old_password"
            type="password"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="t('user.new_password')"
          name="password"
        >
          <UInput
            v-model="state.password"
            type="password"
            class="w-full"
          />
        </UFormField>

        <UFormField
          :label="t('user.password_confirmation')"
          name="password_confirmation"
        >
          <UInput
            v-model="state.password_confirmation"
            type="password"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="open = false"
          >
            {{ t('common.cancel') }}
          </UButton>
          <UButton
            type="submit"
            :loading="store.isChangingPassword"
          >
            {{ t('user.change') }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
