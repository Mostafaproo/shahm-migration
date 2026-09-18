<script setup lang="ts">
const props = withDefaults(defineProps<{
  max?: number
  name?: string
  disabled?: boolean
}>(), {
  max: 5,
  name: 'rating'
})

const model = defineModel<number>({ required: true })

const hovered = ref(0)

const shown = computed(() => hovered.value || model.value)

const stars = computed(() => Array.from({ length: props.max }, (_, i) => i + 1))
</script>

<template>
  <div
    class="flex items-center gap-1"
    role="radiogroup"
    @mouseleave="hovered = 0"
  >
    <label
      v-for="star in stars"
      :key="star"
      class="cursor-pointer p-0.5"
      :class="disabled && 'cursor-not-allowed opacity-60'"
      @mouseenter="hovered = star"
    >
      <input
        type="radio"
        :name="name"
        :value="star"
        :checked="model === star"
        :disabled="disabled"
        class="sr-only"
        @change="model = star"
      >
      <UIcon
        name="i-lucide-star"
        class="h-8 w-8 transition"
        :class="star <= shown ? 'text-yellow-400' : 'text-muted opacity-40'"
      />
      <span class="sr-only">{{ star }}</span>
    </label>
  </div>
</template>
