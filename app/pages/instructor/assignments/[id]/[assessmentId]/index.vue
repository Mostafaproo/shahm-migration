<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'instructorAssessments.assignment.edit_title',
  middleware: 'role-guard',
  roles: ['instructor']
})

const route = useRoute()
</script>

<template>
  <InstructorAssessmentForm
    kind="assignment"
    :assessment-id="String(route.params.assessmentId)"
  />
</template>
