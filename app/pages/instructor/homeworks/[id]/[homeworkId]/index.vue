<script setup lang="ts">
definePageMeta({
  layout: 'dashboard',
  title: 'instructorHomeworks.edit_title',
  middleware: 'role-guard',
  roles: ['instructor']
})

const route = useRoute()
</script>

<template>
  <InstructorHomeworkForm :homework-id="String(route.params.homeworkId)" />
</template>
