<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'instructorAssessments.assignment.page_title',
  middleware: 'role-guard',
  roles: ['instructor']
})
</script>

<template>
  <InstructorAssessmentList kind="assignment" />
</template>
