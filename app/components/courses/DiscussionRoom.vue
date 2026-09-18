<script setup lang="ts">
import { discussionActions, isStudentActive, replyActions } from '~/types/courseDiscussion'
import type { Discussion, DiscussionReply } from '~/types/courseDiscussion'

const props = defineProps<{ courseId: string }>()

const store = useCourseDiscussionsStore()
const auth = useAuthStore()
const { t } = useI18n()
const { $appToast: toast } = useNuxtApp()

const rows = computed(() => store.discussions.map(discussion => ({
  discussion,
  canDelete: discussionActions.delete(discussion),
  canUpdate: discussionActions.update(discussion),
  toggleActive: discussionActions.toggleActive(discussion),
  replies: discussion.replies.map(reply => ({
    reply,
    canDelete: replyActions.delete(reply),
    canUpdate: replyActions.update(reply)
  }))
})))

const question = ref('')
const replyDrafts = ref<Record<string, string>>({})
const editDrafts = ref<Record<string, string>>({})

const openEditor = ref<string | null>(null)

function isOpen(key: string): boolean {
  return openEditor.value === key
}

function openReply(discussion: Discussion) {
  const key = `reply:${discussion.id}`
  if (isOpen(key)) return
  replyDrafts.value[discussion.id] = ''
  openEditor.value = key
}

function openEdit(key: string, current: string) {
  editDrafts.value[key] = current
  openEditor.value = key
}

function closeEditor() {
  openEditor.value = null
}

// These two confirmations are i18n strings in the legacy, not server messages,
// so they are toasted here where `t` lives rather than inside the store.
async function submitQuestion() {
  if (!await store.ask(question.value)) return
  question.value = ''
  toast.success(t('discussion.success_discuss'))
}

async function submitReply(discussion: Discussion) {
  const draft = replyDrafts.value[discussion.id] ?? ''
  if (!await store.reply(discussion.id, draft)) return
  replyDrafts.value[discussion.id] = ''
  closeEditor()
  toast.success(t('discussion.success_comment'))
}

async function submitDiscussionEdit(discussion: Discussion) {
  const key = `edit-discussion:${discussion.id}`
  if (await store.editDiscussion(discussion.id, editDrafts.value[key] ?? '')) closeEditor()
}

async function submitReplyEdit(discussion: Discussion, reply: DiscussionReply) {
  const key = `edit-reply:${reply.id}`
  if (await store.editReply(discussion.id, reply.id, editDrafts.value[key] ?? '')) closeEditor()
}

const placeholder = computed(() =>
  store.isEnded ? t('discussion.course_ended') : t('discussion.is_there_question')
)

const blockedReason = computed(() => {
  if (store.isEnded) return t('discussion.course_ended')
  if (!store.isUserActive) return t('discussion.not_active')
  return null
})

watch(() => props.courseId, (id) => {
  question.value = ''
  closeEditor()
  store.fetchList(id)
}, { immediate: true })

onBeforeUnmount(() => store.reset())
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <UAlert
      v-if="blockedReason"
      color="warning"
      variant="subtle"
      icon="i-lucide-info"
      :description="blockedReason"
    />

    <!-- Ask a question -->
    <div class="flex items-start gap-3">
      <UAvatar
        :src="auth.user?.profile_picture ?? undefined"
        :alt="auth.fullName ?? ''"
        size="md"
      />
      <UInput
        v-model="question"
        class="flex-1"
        size="lg"
        :disabled="!store.canPost"
        :placeholder="placeholder"
        @keydown.enter="submitQuestion"
      />
      <UButton
        size="lg"
        :loading="store.isSubmitting"
        :disabled="!store.canPost"
        :title="blockedReason ?? undefined"
        @click="submitQuestion"
      >
        {{ t('discussion.ask_question') }}
      </UButton>
    </div>

    <div
      v-if="store.isLoading && !store.discussions.length"
      class="space-y-3"
    >
      <USkeleton
        v-for="n in 3"
        :key="n"
        class="h-28 w-full rounded-xl"
      />
    </div>

    <div
      v-else-if="rows.length"
      class="space-y-4"
    >
      <article
        v-for="{ discussion, canDelete, canUpdate, toggleActive, replies } in rows"
        :key="discussion.id"
        class="space-y-3 rounded-xl border border-default bg-default p-4"
      >
        <header class="flex items-start justify-between gap-3">
          <div class="flex items-center gap-2">
            <UAvatar
              :src="discussion.author.avatar ?? undefined"
              :alt="discussion.author.name"
              size="sm"
            />
            <span class="font-medium">{{ discussion.author.name }}</span>
          </div>
          <span class="shrink-0 text-xs text-muted">{{ discussion.publishedAt }}</span>
        </header>

        <div
          v-if="isOpen(`edit-discussion:${discussion.id}`)"
          class="flex gap-2"
        >
          <UInput
            v-model="editDrafts[`edit-discussion:${discussion.id}`]"
            class="flex-1"
            :disabled="!store.canPost"
          />
          <UButton
            :loading="store.isBusy(`discussion:${discussion.id}`)"
            @click="submitDiscussionEdit(discussion)"
          >
            {{ t('discussion.submit') }}
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            @click="closeEditor"
          >
            {{ t('discussion.cancel') }}
          </UButton>
        </div>
        <SharedDataDisplayAppLinkifiedText
          v-else
          :text="discussion.body"
          class="text-muted"
        />

        <!-- Row actions come from the backend; no role checks here. -->
        <div class="flex items-center justify-between gap-2 border-t border-default pt-2">
          <UButton
            size="xs"
            color="neutral"
            variant="ghost"
            icon="i-lucide-message-square"
            :disabled="!store.canPost"
            :title="blockedReason ?? undefined"
            @click="openReply(discussion)"
          >
            {{ t('discussion.comment') }}
          </UButton>

          <div class="flex items-center gap-1">
            <USwitch
              v-if="toggleActive"
              :model-value="isStudentActive(toggleActive.label)"
              :title="toggleActive.label"
              size="sm"
              @update:model-value="store.toggleStudentActive(toggleActive.endpointUrl)"
            />
            <UButton
              v-if="canUpdate"
              size="xs"
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              :title="canUpdate.label"
              @click="openEdit(`edit-discussion:${discussion.id}`, discussion.body)"
            />
            <UButton
              v-if="canDelete"
              size="xs"
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              :title="canDelete.label"
              :loading="store.isBusy(`discussion:${discussion.id}`)"
              @click="store.removeDiscussion(discussion.id, canDelete.endpointUrl)"
            />
          </div>
        </div>

        <!-- Reply box -->
        <div
          v-if="isOpen(`reply:${discussion.id}`)"
          class="flex items-center gap-2 ps-6"
        >
          <UAvatar
            :src="auth.user?.profile_picture ?? undefined"
            :alt="auth.fullName ?? ''"
            size="sm"
          />
          <UInput
            v-model="replyDrafts[discussion.id]"
            class="flex-1"
            :disabled="!store.canPost"
            @keydown.enter="submitReply(discussion)"
          />
          <UButton
            :loading="store.isSubmitting"
            :disabled="!store.canPost"
            @click="submitReply(discussion)"
          >
            {{ t('discussion.submit') }}
          </UButton>
        </div>

        <!-- Replies -->
        <div
          v-if="replies.length"
          class="space-y-3 border-s-2 border-default ps-4"
        >
          <div
            v-for="{ reply, canDelete: canDeleteReply, canUpdate: canUpdateReply } in replies"
            :key="reply.id"
            class="space-y-2"
          >
            <header class="flex items-start justify-between gap-3">
              <div class="flex items-center gap-2">
                <UAvatar
                  :src="reply.author.avatar ?? undefined"
                  :alt="reply.author.name"
                  size="xs"
                />
                <span class="text-sm font-medium">{{ reply.author.name }}</span>
              </div>
              <span class="shrink-0 text-xs text-muted">{{ reply.createdAt }}</span>
            </header>

            <div
              v-if="isOpen(`edit-reply:${reply.id}`)"
              class="flex gap-2"
            >
              <UInput
                v-model="editDrafts[`edit-reply:${reply.id}`]"
                class="flex-1"
                size="sm"
                :disabled="!store.canPost"
              />
              <UButton
                size="sm"
                :loading="store.isBusy(`reply:${reply.id}`)"
                @click="submitReplyEdit(discussion, reply)"
              >
                {{ t('discussion.submit') }}
              </UButton>
              <UButton
                size="sm"
                color="neutral"
                variant="ghost"
                @click="closeEditor"
              >
                {{ t('discussion.cancel') }}
              </UButton>
            </div>
            <SharedDataDisplayAppLinkifiedText
              v-else
              :text="reply.comment"
              class="text-sm text-muted"
            />

            <div
              v-if="canUpdateReply || canDeleteReply"
              class="flex items-center justify-end gap-1"
            >
              <UButton
                v-if="canUpdateReply"
                size="xs"
                color="neutral"
                variant="ghost"
                icon="i-lucide-pencil"
                :title="canUpdateReply.label"
                @click="openEdit(`edit-reply:${reply.id}`, reply.comment)"
              />
              <UButton
                v-if="canDeleteReply"
                size="xs"
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                :title="canDeleteReply.label"
                :loading="store.isBusy(`reply:${reply.id}`)"
                @click="store.removeReply(discussion.id, reply.id, canDeleteReply.endpointUrl)"
              />
            </div>
          </div>

          <div
            v-if="discussion.repliesPage < discussion.repliesTotalPages"
            class="flex justify-center"
          >
            <UButton
              size="xs"
              variant="soft"
              :loading="store.isBusy(`replies:${discussion.id}`)"
              @click="store.loadMoreReplies(discussion.id)"
            >
              {{ t('discussion.load_more') }}
            </UButton>
          </div>
        </div>
      </article>

      <div
        v-if="store.hasMore"
        class="flex justify-center pt-2"
      >
        <UButton
          variant="soft"
          :loading="store.isLoading"
          @click="store.loadMore()"
        >
          {{ t('discussion.load_more') }}
        </UButton>
      </div>
    </div>

    <p
      v-else
      class="rounded-xl border border-default bg-default py-16 text-center text-muted"
    >
      {{ t('discussion.no_discussions') }}
    </p>
  </div>
</template>
