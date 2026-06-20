<script setup lang="ts">
import type { Task, TaskStatus, TaskPriority } from '@/shared/types';
import { useTaskStore } from '../stores/task';

const props = defineProps<{ task: Task }>();
const store = useTaskStore();

const priorityLabel: Record<TaskPriority, string> = { low: '低', medium: '中', high: '高' };
const priorityClass: Record<TaskPriority, string> = { low: 'priority-low', medium: 'priority-medium', high: 'priority-high' };

function onDragStart(e: DragEvent) {
  if (!e.dataTransfer) return;
  e.dataTransfer.setData('text/plain', props.task.id);
  e.dataTransfer.effectAllowed = 'move';
  const target = e.currentTarget as HTMLElement;
  setTimeout(() => { target.classList.add('dragging'); }, 0);
}

function onDragEnd(e: DragEvent) {
  (e.currentTarget as HTMLElement).classList.remove('dragging');
}

function handleDelete() {
  if (confirm('确定删除该任务？')) {
    store.remove(props.task.id);
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function isOverdue(dateStr: string | null) {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}

const emit = defineEmits<{
  select: [id: string];
}>();
</script>

<template>
  <div
    class="task-card"
    :class="[priorityClass[task.priority]]"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
    @click="emit('select', task.id)"
  >
    <div class="priority-bar" :class="'bar-' + task.priority"></div>
    <div class="card-body">
      <div class="card-top">
        <h4 class="task-title">{{ task.title }}</h4>
        <button class="btn-delete" @click.stop="handleDelete" title="删除">
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M5.5 3.5V2.5a1 1 0 011-1h1a1 1 0 011 1v1M3.5 3.5l.5 8a1 1 0 001 1h4a1 1 0 001-1l.5-8" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
        </button>
      </div>
      <p v-if="task.description" class="task-desc">{{ task.description }}</p>
      <div class="card-bottom">
        <span class="priority-badge" :class="'badge-' + task.priority">{{ priorityLabel[task.priority] }}</span>
        <span v-if="task.dueDate" class="due-date" :class="{ overdue: isOverdue(task.dueDate) }">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M5 1v3M11 1v3M2 7h12" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          {{ formatDate(task.dueDate) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.task-card { background: var(--bg-card); border-radius: var(--radius-md); overflow: hidden; cursor: grab; transition: all var(--transition-fast); box-shadow: var(--shadow-card); border: 1px solid transparent; }
.task-card:hover { box-shadow: var(--shadow-elevated); transform: translateY(-2px); border-color: var(--border-color); }
.task-card:active { cursor: grabbing; }
.task-card.dragging { opacity: 0.4; transform: rotate(2deg); }
.priority-bar { height: 3px; }
.bar-high { background: var(--accent-red); }
.bar-medium { background: var(--accent-amber); }
.bar-low { background: var(--accent-blue); }
.card-body { padding: 10px 12px; }
.card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
.task-title { font-size: 13px; font-weight: 600; line-height: 1.4; flex: 1; }
.btn-delete { padding: 2px; color: var(--text-secondary); opacity: 0; transition: all var(--transition-fast); flex-shrink: 0; border-radius: var(--radius-sm); }
.task-card:hover .btn-delete { opacity: 1; }
.btn-delete:hover { color: var(--accent-red); background: rgba(231, 76, 60, 0.15); }
.task-desc { font-size: 11px; color: var(--text-secondary); margin-top: 4px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.card-bottom { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; gap: 6px; }
.priority-badge { padding: 1px 8px; border-radius: 10px; font-size: 10px; font-weight: 500; }
.badge-high { background: rgba(231, 76, 60, 0.15); color: var(--accent-red); }
.badge-medium { background: rgba(245, 166, 35, 0.15); color: var(--accent-amber); }
.badge-low { background: rgba(52, 152, 219, 0.15); color: var(--accent-blue); }
.due-date { display: flex; align-items: center; gap: 3px; font-size: 10px; color: var(--text-secondary); }
.due-date.overdue { color: var(--accent-red); }
</style>
