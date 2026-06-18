<template>
  <div
    class="task-card"
    :class="{ 'is-dragging': isDragging, 'is-editing': isEditing }"
    :style="{ animationDelay: `${animationDelay}ms` }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
  >
    <div v-if="!isEditing" class="card-content">
      <div class="card-header">
        <span class="priority-badge" :class="`priority-${task.priority}`">
          {{ priorityText }}
        </span>
        <button class="delete-btn" @click.stop="handleDelete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <h3 class="card-title">{{ task.title }}</h3>
      <p class="card-description">{{ task.description }}</p>
      <div class="card-footer">
        <span class="due-date">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          {{ formatDate(task.dueDate) }}
        </span>
      </div>
    </div>

    <div v-else class="card-edit-form">
      <input
        v-model="editForm.title"
        class="edit-input title-input"
        placeholder="任务标题"
        @keyup.enter="saveEdit"
        @keyup.esc="cancelEdit"
        @click.stop
      />
      <textarea
        v-model="editForm.description"
        class="edit-input desc-input"
        placeholder="任务描述"
        @click.stop
      ></textarea>
      <div class="edit-row">
        <select v-model="editForm.priority" class="edit-select" @click.stop>
          <option value="high">高优先级</option>
          <option value="medium">中优先级</option>
          <option value="low">低优先级</option>
        </select>
        <input
          v-model="editForm.dueDate"
          type="date"
          class="edit-date"
          @click.stop
        />
      </div>
      <div class="edit-actions">
        <button class="btn btn-primary" @click.stop="saveEdit">保存</button>
        <button class="btn btn-secondary" @click.stop="cancelEdit">取消</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Task, Priority } from '../stores/boardStore'
import { useBoardStore } from '../stores/boardStore'

const props = defineProps<{
  task: Task
  animationDelay?: number
}>()

const emit = defineEmits<{
  (e: 'dragStart', taskId: string): void
  (e: 'dragEnd'): void
}>()

const { deleteTask, updateTask } = useBoardStore()

const isDragging = ref(false)
const isEditing = ref(false)
const editForm = ref({
  title: props.task.title,
  description: props.task.description,
  priority: props.task.priority,
  dueDate: props.task.dueDate,
})

const priorityText = computed(() => {
  const map: Record<Priority, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }
  return map[props.task.priority]
})

watch(() => props.task, (newTask) => {
  editForm.value = {
    title: newTask.title,
    description: newTask.description,
    priority: newTask.priority,
    dueDate: newTask.dueDate,
  }
})

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

const handleDragStart = (e: DragEvent) => {
  isDragging.value = true
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', props.task.id)
  }
  emit('dragStart', props.task.id)
}

const handleDragEnd = () => {
  isDragging.value = false
  emit('dragEnd')
}

const handleClick = () => {
  if (!isDragging.value) {
    isEditing.value = true
  }
}

const handleDelete = (e: Event) => {
  e.stopPropagation()
  deleteTask(props.task.id)
}

const saveEdit = () => {
  if (editForm.value.title.trim()) {
    updateTask(props.task.id, {
      title: editForm.value.title.trim(),
      description: editForm.value.description.trim(),
      priority: editForm.value.priority as Priority,
      dueDate: editForm.value.dueDate,
    })
    isEditing.value = false
  }
}

const cancelEdit = () => {
  editForm.value = {
    title: props.task.title,
    description: props.task.description,
    priority: props.task.priority,
    dueDate: props.task.dueDate,
  }
  isEditing.value = false
}
</script>

<style scoped>
.task-card {
  background: rgba(49, 50, 68, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(203, 166, 247, 0.15);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-origin: center;
  animation: cardEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  will-change: transform, box-shadow;
}

@keyframes cardEnter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.task-card:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 25px rgba(203, 166, 247, 0.25), 0 0 0 1px rgba(203, 166, 247, 0.3);
  border-color: rgba(203, 166, 247, 0.4);
}

.task-card:active {
  transform: scale(0.98);
  transition-duration: 0.1s;
}

.task-card.is-dragging {
  opacity: 0.5;
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}

.task-card.is-editing {
  animation: bounceIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes bounceIn {
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.priority-badge {
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.priority-high {
  background: linear-gradient(135deg, rgba(243, 139, 168, 0.3), rgba(243, 139, 168, 0.1));
  color: #f38ba8;
  border: 1px solid rgba(243, 139, 168, 0.4);
}

.priority-medium {
  background: linear-gradient(135deg, rgba(249, 226, 175, 0.3), rgba(249, 226, 175, 0.1));
  color: #f9e2af;
  border: 1px solid rgba(249, 226, 175, 0.4);
}

.priority-low {
  background: linear-gradient(135deg, rgba(166, 227, 161, 0.3), rgba(166, 227, 161, 0.1));
  color: #a6e3a1;
  border: 1px solid rgba(166, 227, 161, 0.4);
}

.delete-btn {
  background: transparent;
  border: none;
  color: #7f849c;
  cursor: pointer;
  padding: 4px;
  border-radius: 6px;
  transition: all 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-btn:hover {
  background: rgba(243, 139, 168, 0.2);
  color: #f38ba8;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #cdd6f4;
  margin-bottom: 8px;
  line-height: 1.4;
}

.card-description {
  font-size: 13px;
  color: #9399b2;
  margin-bottom: 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6c7086;
}

.card-edit-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.edit-input {
  background: rgba(30, 30, 46, 0.8);
  border: 1px solid rgba(203, 166, 247, 0.3);
  border-radius: 8px;
  padding: 10px 12px;
  color: #cdd6f4;
  font-size: 14px;
  font-family: inherit;
  transition: all 0.15s ease;
  outline: none;
}

.edit-input:focus {
  border-color: #cba6f7;
  box-shadow: 0 0 0 3px rgba(203, 166, 247, 0.15);
}

.title-input {
  font-weight: 600;
}

.desc-input {
  resize: vertical;
  min-height: 60px;
  max-height: 120px;
}

.edit-row {
  display: flex;
  gap: 10px;
}

.edit-select,
.edit-date {
  flex: 1;
  background: rgba(30, 30, 46, 0.8);
  border: 1px solid rgba(203, 166, 247, 0.3);
  border-radius: 8px;
  padding: 8px 10px;
  color: #cdd6f4;
  font-size: 13px;
  font-family: inherit;
  outline: none;
  cursor: pointer;
}

.edit-select:focus,
.edit-date:focus {
  border-color: #cba6f7;
}

.edit-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
  font-family: inherit;
}

.btn-primary {
  background: linear-gradient(135deg, #cba6f7, #b4befe);
  color: #1e1e2e;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(203, 166, 247, 0.4);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: #cdd6f4;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.15);
}
</style>
