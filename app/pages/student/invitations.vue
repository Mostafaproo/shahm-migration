<script setup lang="ts">
// Parent invitations — ported from the legacy `pages/student/invitations`.
// Four tabs: linked parents, sent, received, and "add a parent". Each tab
// fetches its own relation, exactly like the legacy's `currentIndex` watcher.
//
// The legacy deep-links straight to the received tab via
// `?activeTab=accept_invitation` (the link inside the invitation email), so
// that is honoured here too.
import { INVITATION_RELATIONS } from '~/types/invitation'
import type { InvitationRelation } from '~/types/invitation'

definePageMeta({
  layout: 'dashboard',
  title: 'invitations.page_title',
  // Sold per tenant — see middleware/feature-guard.ts.
  middleware: 'feature-guard',
  feature: 'invitations'
})

type Tab = 'parents' | 'sent' | 'received' | 'add'

const store = useInvitationsStore()
const route = useRoute()
const { t } = useI18n()

const TABS: { value: Tab, label: string }[] = [
  { value: 'parents', label: 'invitations.tabs.parents' },
  { value: 'sent', label: 'invitations.tabs.sent' },
  { value: 'received', label: 'invitations.tabs.received' },
  { value: 'add', label: 'invitations.tabs.add' }
]

const RELATION_BY_TAB: Partial<Record<Tab, InvitationRelation>> = {
  parents: INVITATION_RELATIONS.parents,
  sent: INVITATION_RELATIONS.sent,
  received: INVITATION_RELATIONS.received
}

const tab = ref<Tab>(
  route.query.activeTab === 'accept_invitation' ? 'received' : 'parents'
)

// --- confirmations
const confirm = ref<{ action: 'remove' | 'cancel' | 'refuse', id: string } | null>(null)

const confirmText = computed(() => {
  switch (confirm.value?.action) {
    case 'remove': return t('invitations.confirm_remove_parent')
    case 'cancel': return t('invitations.confirm_cancel')
    case 'refuse': return t('invitations.confirm_refuse')
    default: return ''
  }
})

async function runConfirmed() {
  const pending = confirm.value
  if (!pending) return
  confirm.value = null

  if (pending.action === 'remove') await store.removeParent(pending.id)
  else if (pending.action === 'cancel') await store.cancelInvitation(pending.id)
  else await store.changeStatus(pending.id, 'refused')
}

// --- invite form
const inviteOpen = ref(false)
const inviteEmail = ref('')

async function submitInvite() {
  if (!inviteEmail.value.trim()) return
  if (await store.sendInvitation(inviteEmail.value.trim())) {
    inviteEmail.value = ''
    inviteOpen.value = false
    // Legacy jumps to the sent tab so the new invitation is visible.
    tab.value = 'sent'
  }
}

async function onAccept(id: string) {
  // Legacy switches to the parents tab on accept — that's where they land.
  if (await store.changeStatus(id, 'accepted')) tab.value = 'parents'
}

watch(tab, (next) => {
  const relation = RELATION_BY_TAB[next]
  if (relation) store.fetchRelation(relation)
}, { immediate: true })
</script>

<template>
  <div class="space-y-5">
    <div class="flex justify-center">
      <div class="flex max-w-full gap-1 overflow-x-auto rounded-full bg-elevated p-1">
        <button
          v-for="item in TABS"
          :key="item.value"
          type="button"
          class="shrink-0 rounded-full px-5 py-2 text-sm font-medium transition"
          :class="tab === item.value
            ? 'bg-default text-default shadow-sm'
            : 'text-muted hover:text-default'"
          @click="tab = item.value"
        >
          {{ t(item.label) }}
        </button>
      </div>
    </div>

    <div
      v-if="store.isLoading && tab !== 'add'"
      class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
    >
      <USkeleton
        v-for="n in 6"
        :key="n"
        class="h-32 w-full rounded-xl"
      />
    </div>

    <!-- أولياء الأمور -->
    <template v-else-if="tab === 'parents'">
      <div
        v-if="store.parents.length"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="parent in store.parents"
          :key="parent.id"
          class="flex flex-col items-center gap-3 rounded-xl border border-default bg-default p-5"
        >
          <UAvatar
            :src="parent.avatar ?? undefined"
            :alt="parent.name"
            size="xl"
          />
          <p class="text-center font-medium">
            {{ parent.name }}
          </p>
          <UButton
            color="error"
            variant="soft"
            size="sm"
            :loading="store.isBusy(`remove:${parent.id}`)"
            @click="confirm = { action: 'remove', id: parent.id }"
          >
            {{ t('invitations.remove') }}
          </UButton>
        </div>
      </div>
      <p
        v-else
        class="rounded-xl border border-default bg-default py-16 text-center text-muted"
      >
        {{ t('invitations.no_parents') }}
      </p>
    </template>

    <!-- الدعوات المرسلة -->
    <template v-else-if="tab === 'sent'">
      <div
        v-if="store.sent.length"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="item in store.sent"
          :key="item.id"
          class="flex flex-col items-center gap-3 rounded-xl border border-default bg-default p-5"
        >
          <UAvatar
            :src="item.person.avatar ?? undefined"
            :alt="item.person.name"
            size="xl"
          />
          <p class="text-center font-medium">
            {{ item.person.name }}
          </p>
          <div class="flex w-full flex-col gap-2">
            <UButton
              block
              size="sm"
              :loading="store.isBusy(`resend:${item.id}`)"
              @click="store.resendInvitation(item.id)"
            >
              {{ t('invitations.resend') }}
            </UButton>
            <UButton
              block
              color="error"
              variant="soft"
              size="sm"
              :loading="store.isBusy(`cancel:${item.id}`)"
              @click="confirm = { action: 'cancel', id: item.id }"
            >
              {{ t('invitations.cancel') }}
            </UButton>
          </div>
        </div>
      </div>
      <p
        v-else
        class="rounded-xl border border-default bg-default py-16 text-center text-muted"
      >
        {{ t('invitations.no_sent') }}
      </p>
    </template>

    <!-- الدعوات الواردة -->
    <template v-else-if="tab === 'received'">
      <div
        v-if="store.received.length"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <div
          v-for="item in store.received"
          :key="item.id"
          class="flex flex-col items-center gap-3 rounded-xl border border-default bg-default p-5"
        >
          <UAvatar
            :src="item.person.avatar ?? undefined"
            :alt="item.person.name"
            size="xl"
          />
          <p class="text-center font-medium">
            {{ item.person.name }}
          </p>
          <div class="flex w-full flex-col gap-2">
            <UButton
              block
              size="sm"
              :loading="store.isBusy(`accepted:${item.id}`)"
              @click="onAccept(item.id)"
            >
              {{ t('invitations.accept') }}
            </UButton>
            <UButton
              block
              color="error"
              variant="soft"
              size="sm"
              :loading="store.isBusy(`refused:${item.id}`)"
              @click="confirm = { action: 'refuse', id: item.id }"
            >
              {{ t('invitations.refuse') }}
            </UButton>
          </div>
        </div>
      </div>
      <p
        v-else
        class="rounded-xl border border-default bg-default py-16 text-center text-muted"
      >
        {{ t('invitations.no_received') }}
      </p>
    </template>

    <!-- إضافة ولي أمر -->
    <div
      v-else
      class="flex flex-col items-center gap-4 rounded-xl border border-default bg-default py-16"
    >
      <UIcon
        name="i-lucide-user-plus"
        class="h-16 w-16 text-primary"
      />
      <UButton
        size="lg"
        @click="inviteOpen = true"
      >
        {{ t('invitations.click_to_add') }}
      </UButton>
    </div>

    <!-- Invite form -->
    <UModal
      v-model:open="inviteOpen"
      :title="t('invitations.click_to_add')"
    >
      <template #body>
        <form
          class="space-y-4"
          @submit.prevent="submitInvite"
        >
          <UFormField
            :label="t('invitations.parent_email')"
            name="email"
          >
            <UInput
              v-model="inviteEmail"
              type="email"
              class="w-full"
              size="lg"
              autocomplete="email"
              :placeholder="t('invitations.parent_email')"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              @click="inviteOpen = false"
            >
              {{ t('common.cancel') }}
            </UButton>
            <UButton
              type="submit"
              :loading="store.isBusy('send')"
              :disabled="!inviteEmail.trim()"
            >
              {{ t('invitations.send') }}
            </UButton>
          </div>
        </form>
      </template>
    </UModal>

    <!-- Shared confirmation, standing in for the legacy's three near-identical
         GenericConfirmModal instances. -->
    <UModal
      :open="!!confirm"
      :title="t('invitations.confirm_title')"
      @update:open="value => !value && (confirm = null)"
    >
      <template #body>
        <p class="text-muted">
          {{ confirmText }}
        </p>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="confirm = null"
          >
            {{ t('common.cancel') }}
          </UButton>
          <UButton
            color="error"
            @click="runConfirmed"
          >
            {{ t('invitations.confirm') }}
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
