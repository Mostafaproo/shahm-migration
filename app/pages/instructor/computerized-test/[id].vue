<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'instructorExamQuestions.edit_title',
  feature: 'computerized_exam',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['instructor']
})

const route = useRoute()
</script>

<template>
  <InstructorExamQuestionForm :question-id="String(route.params.id)" />
</template>
