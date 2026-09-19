<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'instructorHomeworks.create_title',
  middleware: 'role-guard',
  roles: ['instructor']
})
</script>

<template>
  <InstructorHomeworkForm />
</template>
