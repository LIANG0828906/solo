<script setup lang="ts">
import { useTaskStore } from '../stores/task';

const store = useTaskStore();
</script>

<template>
  <div class="task-stats">
    <div class="stat-bar">
      <div class="stat-fill todo" :style="{ width: store.stats.total ? (store.stats.todo / store.stats.total * 100) + '%' : '0%' }"></div>
      <div class="stat-fill progress" :style="{ width: store.stats.total ? (store.stats.inProgress / store.stats.total * 100) + '%' : '0%' }"></div>
      <div class="stat-fill done" :style="{ width: store.stats.total ? (store.stats.done / store.stats.total * 100) + '%' : '0%' }"></div>
    </div>
    <div class="stat-legend">
      <span class="legend-item"><span class="legend-dot dot-todo"></span>待开始 {{ store.stats.todo }}</span>
      <span class="legend-item"><span class="legend-dot dot-progress"></span>进行中 {{ store.stats.inProgress }}</span>
      <span class="legend-item"><span class="legend-dot dot-done"></span>已完成 {{ store.stats.done }}</span>
    </div>
  </div>
</template>

<style scoped>
.task-stats { padding: 12px 16px; }
.stat-bar { height: 6px; background: var(--bg-card); border-radius: 3px; display: flex; overflow: hidden; }
.stat-fill { height: 100%; transition: width 0.3s ease; }
.stat-fill.todo { background: var(--accent-blue); }
.stat-fill.progress { background: var(--accent-amber); }
.stat-fill.done { background: var(--accent-green); }
.stat-legend { display: flex; gap: 12px; margin-top: 8px; flex-wrap: wrap; }
.legend-item { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-secondary); }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }
.dot-todo { background: var(--accent-blue); }
.dot-progress { background: var(--accent-amber); }
.dot-done { background: var(--accent-green); }
</style>
