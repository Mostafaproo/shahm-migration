<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'instructorAssessments.exam.create_title',
  middleware: 'role-guard',
  roles: ['instructor']
})
</script>

<template>
  <InstructorAssessmentForm kind="exam" />
</template>
