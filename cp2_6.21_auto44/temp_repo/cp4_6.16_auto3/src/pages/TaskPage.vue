<script setup lang="ts">
import { TaskBoard } from '@/modules/task';

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<template>
  <div class="task-page">
    <TaskBoard @select="emit('select', $event)" />
  </div>
</template>

<style scoped>
.task-page { height: 100%; }
</style>
