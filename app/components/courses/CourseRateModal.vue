<script setup lang="ts">
const props = defineProps<{ courseId: string }>()

const open = defineModel<boolean>({ required: true })

const store = useStudentCourseDetailStore()
const auth = useAuthStore()
const { t } = useI18n()

const rating = ref(0)
const comment = ref('')

watch(open, (isOpen) => {
  if (isOpen) {
    rating.value = 0
    comment.value = ''
  }
})

async function onSubmit() {
  if (!rating.value) return
  if (await store.rateCourse(props.courseId, { rating: rating.value, comment: comment.value })) {
    open.value = false
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    :title="t('courses.leave_rate')"
  >
    <template #body>
      <div class="space-y-5">
        <div class="flex flex-col items-center gap-2 text-center">
          <UAvatar
            :src="auth.user?.profile_picture ?? undefined"
            :alt="auth.fullName ?? ''"
            size="xl"
          />
          <p class="font-bold">
            {{ auth.fullName }}
          </p>
        </div>

        <div class="flex justify-center">
          <SharedDataInputAppStarRating
            v-model="rating"
            :disabled="store.isRating"
          />
        </div>

        <UTextarea
          v-model="comment"
          :rows="3"
          class="w-full"
          :disabled="store.isRating"
          :placeholder="t('courses.leave_comment')"
        />
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-2">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="store.isRating"
          @click="open = false"
        >
          {{ t('common.cancel') }}
        </UButton>
        <UButton
          :loading="store.isRating"
          :disabled="!rating"
          @click="onSubmit"
        >
          {{ t('courses.post_rate') }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
