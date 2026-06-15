<script setup lang="ts">
import { useTaskStore } from '../stores/task';
import TaskCard from './TaskCard.vue';
import type { TaskStatus } from '@/shared/types';
import { ref } from 'vue';

const store = useTaskStore();
const showForm = ref(false);
const newTitle = ref('');
const newDesc = ref('');
const newPriority = ref<TaskStatus['priority']>('medium');
const newStatus = ref<TaskStatus>('todo');
const newDueDate = ref('');
const newArticleRef = ref<string | null>(null);

const columns: { status: TaskStatus; label: string; icon: string }[] = [
  { status: 'todo', label: '待开始', icon: '○' },
  { status: 'in_progress', label: '进行中', icon: '◐' },
  { status: 'done', label: '已完成', icon: '●' },
];

const emit = defineEmits<{
  select: [id: string];
}>();

function handleCreate() {
  if (!newTitle.value.trim()) return;
  store.create({
    title: newTitle.value.trim(),
    description: newDesc.value.trim(),
    status: newStatus.value,
    priority: newPriority.value,
    dueDate: newDueDate.value || null,
    articleRef: newArticleRef.value,
  });
  newTitle.value = '';
  newDesc.value = '';
  newPriority.value = 'medium';
  newStatus.value = 'todo';
  newDueDate.value = '';
  newArticleRef.value = null;
  showForm.value = false;
}

function getTasks(status: TaskStatus) {
  if (status === 'todo') return store.todoTasks;
  if (status === 'in_progress') return store.inProgressTasks;
  return store.doneTasks;
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
  const col = (e.currentTarget as HTMLElement);
  col.classList.add('drag-over');
}

function onDragLeave(e: DragEvent) {
  (e.currentTarget as HTMLElement).classList.remove('drag-over');
}

function onDrop(e: DragEvent, status: TaskStatus) {
  e.preventDefault();
  (e.currentTarget as HTMLElement).classList.remove('drag-over');
  const taskId = e.dataTransfer?.getData('text/plain');
  if (taskId) {
    store.changeStatus(taskId, status);
  }
}
</script>

<template>
  <div class="task-board">
    <div class="board-header">
      <h2>任务看板</h2>
      <button class="btn-add" @click="showForm = !showForm">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M2 8h12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        新建任务
      </button>
    </div>

    <div v-if="showForm" class="create-form">
      <input v-model="newTitle" placeholder="任务名称" class="form-input" />
      <textarea v-model="newDesc" placeholder="任务描述" class="form-textarea" rows="2"></textarea>
      <div class="form-row">
        <select v-model="newPriority" class="form-select">
          <option value="low">低优先级</option>
          <option value="medium">中优先级</option>
          <option value="high">高优先级</option>
        </select>
        <select v-model="newStatus" class="form-select">
          <option value="todo">待开始</option>
          <option value="in_progress">进行中</option>
          <option value="done">已完成</option>
        </select>
        <input v-model="newDueDate" type="date" class="form-input form-date" />
      </div>
      <div class="form-actions">
        <button class="btn-primary" @click="handleCreate">创建</button>
        <button class="btn-secondary" @click="showForm = false">取消</button>
      </div>
    </div>

    <div class="board-columns">
      <div
        v-for="col in columns"
        :key="col.status"
        class="board-column"
        @dragover="onDragOver"
        @dragleave="onDragLeave"
        @drop="onDrop($event, col.status)"
      >
        <div class="column-header">
          <span class="column-icon">{{ col.icon }}</span>
          <span class="column-label">{{ col.label }}</span>
          <span class="column-count">{{ getTasks(col.status).length }}</span>
        </div>
        <div class="column-body">
          <TaskCard
            v-for="task in getTasks(col.status)"
            :key="task.id"
            :task="task"
            @select="emit('select', $event)"
          />
          <div v-if="getTasks(col.status).length === 0" class="empty-column">
            拖拽任务到此处
          </div>
        </div>
      </div>
    </div>

    <div class="board-stats">
      <div class="stat-item"><span class="stat-value">{{ store.stats.total }}</span><span class="stat-label">总计</span></div>
      <div class="stat-item stat-todo"><span class="stat-value">{{ store.stats.todo }}</span><span class="stat-label">待开始</span></div>
      <div class="stat-item stat-progress"><span class="stat-value">{{ store.stats.inProgress }}</span><span class="stat-label">进行中</span></div>
      <div class="stat-item stat-done"><span class="stat-value">{{ store.stats.done }}</span><span class="stat-label">已完成</span></div>
    </div>
  </div>
</template>

<style scoped>
.task-board { height: 100%; display: flex; flex-direction: column; }
.board-header { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; border-bottom: 1px solid var(--border-color); }
.board-header h2 { font-size: 18px; font-weight: 600; }
.btn-add { display: flex; align-items: center; gap: 6px; padding: 6px 14px; background: var(--accent-amber); color: var(--bg-primary); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; transition: all var(--transition-normal); }
.btn-add:hover { background: #e6991e; transform: translateY(-1px); }

.create-form { padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: var(--bg-secondary); display: flex; flex-direction: column; gap: 10px; }
.form-input, .form-select { padding: 8px 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px; outline: none; transition: border-color var(--transition-fast); }
.form-input:focus, .form-select:focus { border-color: var(--accent-amber); }
.form-select { appearance: none; cursor: pointer; }
.form-textarea { padding: 8px 12px; background: var(--bg-primary); border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: var(--text-primary); font-size: 13px; outline: none; resize: vertical; transition: border-color var(--transition-fast); }
.form-textarea:focus { border-color: var(--accent-amber); }
.form-row { display: flex; gap: 8px; }
.form-date { flex: 1; }
.form-row .form-select { flex: 1; }
.form-actions { display: flex; gap: 8px; }
.btn-primary { padding: 6px 16px; background: var(--accent-amber); color: var(--bg-primary); border-radius: var(--radius-sm); font-size: 13px; font-weight: 500; transition: all var(--transition-normal); }
.btn-primary:hover { background: #e6991e; }
.btn-secondary { padding: 6px 16px; background: var(--bg-card); color: var(--text-secondary); border-radius: var(--radius-sm); font-size: 13px; transition: all var(--transition-normal); }
.btn-secondary:hover { background: var(--bg-card-hover); color: var(--text-primary); }

.board-columns { flex: 1; display: flex; gap: 16px; padding: 16px 20px; overflow: hidden; }
.board-column { flex: 1; display: flex; flex-direction: column; background: var(--bg-secondary); border-radius: var(--radius-lg); overflow: hidden; transition: all var(--transition-fast); min-width: 0; }
.board-column.drag-over { border: 2px dashed var(--accent-amber); background: rgba(245, 166, 35, 0.05); }
.column-header { display: flex; align-items: center; gap: 8px; padding: 12px 14px; border-bottom: 1px solid var(--border-color); }
.column-icon { font-size: 14px; }
.column-label { font-size: 13px; font-weight: 600; flex: 1; }
.column-count { padding: 1px 8px; background: var(--bg-card); border-radius: 10px; font-size: 11px; color: var(--text-secondary); }
.column-body { flex: 1; overflow-y: auto; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
.empty-column { display: flex; align-items: center; justify-content: center; padding: 20px; color: var(--text-secondary); font-size: 12px; border: 1px dashed var(--border-color); border-radius: var(--radius-md); }

.board-stats { display: flex; gap: 12px; padding: 12px 20px; border-top: 1px solid var(--border-color); }
.stat-item { display: flex; align-items: center; gap: 6px; padding: 4px 12px; background: var(--bg-card); border-radius: var(--radius-sm); }
.stat-value { font-size: 14px; font-weight: 700; }
.stat-label { font-size: 11px; color: var(--text-secondary); }
.stat-todo .stat-value { color: var(--accent-blue); }
.stat-progress .stat-value { color: var(--accent-amber); }
.stat-done .stat-value { color: var(--accent-green); }
</style>
