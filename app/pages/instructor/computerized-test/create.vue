<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'instructorExamQuestions.create_title',
  feature: 'computerized_exam',
  middleware: ['feature-guard', 'role-guard'],
  roles: ['instructor']
})
</script>

<template>
  <InstructorExamQuestionForm />
</template>
