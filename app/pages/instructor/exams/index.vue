<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'instructorAssessments.exam.page_title',
  middleware: 'role-guard',
  roles: ['instructor']
})
</script>

<template>
  <InstructorAssessmentList kind="exam" />
</template>
