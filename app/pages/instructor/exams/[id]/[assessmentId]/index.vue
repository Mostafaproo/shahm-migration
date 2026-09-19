<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'instructorAssessments.exam.edit_title',
  middleware: 'role-guard',
  roles: ['instructor']
})

const route = useRoute()
</script>

<template>
  <InstructorAssessmentForm
    kind="exam"
    :assessment-id="String(route.params.assessmentId)"
  />
</template>
