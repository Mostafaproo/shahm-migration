<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'instructorAssessments.assignment.reports_title',
  middleware: 'role-guard',
  roles: ['instructor']
})
</script>

<template>
  <InstructorAssessmentReportList kind="assignment" />
</template>
