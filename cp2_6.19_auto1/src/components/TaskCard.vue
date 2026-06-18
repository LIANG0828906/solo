<template>
  <div
    class="task-card"
    :class="[
      `priority-border-${task.priority}`,
      { 'is-dragging': isDragging, 'is-editing': isEditing, 'is-overdue': isOverdue }
    ]"
    :style="{ animationDelay: `${animationDelay}ms` }"
    draggable="true"
    @dragstart="handleDragStart"
    @dragend="handleDragEnd"
    @click="handleClick"
    @touchstart.passive="handleTouchStart"
    @touchmove.passive="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <div v-if="!isEditing" class="card-content">
      <div class="card-header">
        <span class="priority-badge" :class="`priority-${task.priority}`">
          <span class="priority-dot"></span>
          {{ priorityText }}
        </span>
        <div class="card-actions">
          <span v-if="isOverdue" class="overdue-badge">已逾期</span>
          <button class="delete-btn" @click.stop="handleDelete">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>
      <h3 class="card-title">{{ task.title }}</h3>
      <p class="card-description">{{ task.description }}</p>
      <div class="card-footer">
        <span class="due-date" :class="{ overdue: isOverdue }">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="16" y1="2" x2="16" y2="6"></line>
            <line x1="8" y1="2" x2="8" y2="6"></line>
            <line x1="3" y1="10" x2="21" y2="10"></line>
          </svg>
          {{ formatDate(task.dueDate) }}
        </span>
        <span class="priority-footer-tag" :class="`tag-${task.priority}`">
          {{ priorityLabel }}
        </span>
      </div>
    </div>

    <div v-else class="card-edit-form">
      <input
        ref="titleInputRef"
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
import { ref, computed, watch, nextTick } from 'vue'
import type { Task, Priority } from '../stores/boardStore'
import { useBoardStore } from '../stores/boardStore'

const props = withDefaults(defineProps<{
  task: Task
  animationDelay?: number
}>(), {
  animationDelay: 0,
})

const emit = defineEmits<{
  (e: 'dragStart', taskId: string): void
  (e: 'dragEnd'): void
}>()

const { deleteTask, updateTask } = useBoardStore()

const isDragging = ref(false)
const isEditing = ref(false)
const titleInputRef = ref<HTMLInputElement | null>(null)
const editForm = ref({
  title: props.task.title,
  description: props.task.description,
  priority: props.task.priority,
  dueDate: props.task.dueDate,
})

const priorityText = computed(() => {
  const map: Record<Priority, string> = { high: '高', medium: '中', low: '低' }
  return map[props.task.priority]
})

const priorityLabel = computed(() => {
  const map: Record<Priority, string> = { high: '高优先级', medium: '中优先级', low: '低优先级' }
  return map[props.task.priority]
})

const isOverdue = computed(() => {
  if (props.task.status === 'done') return false
  return new Date(props.task.dueDate) < new Date(new Date().toDateString())
})

watch(() => props.task, (newTask) => {
  editForm.value = {
    title: newTask.title,
    description: newTask.description,
    priority: newTask.priority,
    dueDate: newTask.dueDate,
  }
}, { deep: true })

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return `已逾期${Math.abs(diffDays)}天`
  if (diffDays === 0) return '今天截止'
  if (diffDays === 1) return '明天截止'
  if (diffDays <= 7) return `${diffDays}天后截止`
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

let touchTimer: ReturnType<typeof setTimeout> | null = null

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

const handleTouchStart = () => {
  touchTimer = setTimeout(() => {
    isDragging.value = true
  }, 200)
}

const handleTouchMove = () => {
  if (touchTimer) {
    clearTimeout(touchTimer)
    touchTimer = null
  }
}

const handleTouchEnd = () => {
  if (touchTimer) {
    clearTimeout(touchTimer)
    touchTimer = null
  }
  isDragging.value = false
}

const handleClick = () => {
  if (!isDragging.value) {
    isEditing.value = true
    nextTick(() => {
      titleInputRef.value?.focus()
    })
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
  transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.2s cubic-bezier(0.34, 1.56, 0.64, 1),
              border-color 0.2s ease,
              background 0.2s ease;
  transform-origin: center;
  animation: cardEnter 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) backwards;
  will-change: transform, box-shadow;
  contain: layout style paint;
  border-left: 4px solid transparent;
}

.priority-border-high {
  border-left-color: #f38ba8;
}

.priority-border-medium {
  border-left-color: #f9e2af;
}

.priority-border-low {
  border-left-color: #a6e3a1;
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
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 8px 30px rgba(203, 166, 247, 0.2),
              0 0 0 1px rgba(203, 166, 247, 0.25);
  border-color: rgba(203, 166, 247, 0.35);
}

.task-card:active {
  transform: scale(0.97);
  transition-duration: 0.08s;
}

.task-card.is-dragging {
  opacity: 0.4;
  transform: scale(1.05) rotate(2deg);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
}

.task-card.is-editing {
  animation: bounceIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-color: rgba(203, 166, 247, 0.5);
}

.task-card.is-overdue {
  border-left-color: #f38ba8;
  background: rgba(243, 139, 168, 0.05);
}

@keyframes bounceIn {
  0% { transform: scale(1); }
  40% { transform: scale(1.04); }
  70% { transform: scale(0.98); }
  100% { transform: scale(1); }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  padding: 4px 10px;
  border-radius: 20px;
  letter-spacing: 0.5px;
}

.priority-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  display: inline-block;
}

.priority-high {
  background: rgba(243, 139, 168, 0.2);
  color: #f38ba8;
  border: 1px solid rgba(243, 139, 168, 0.4);
}

.priority-high .priority-dot {
  background: #f38ba8;
  box-shadow: 0 0 6px rgba(243, 139, 168, 0.6);
}

.priority-medium {
  background: rgba(249, 226, 175, 0.2);
  color: #f9e2af;
  border: 1px solid rgba(249, 226, 175, 0.4);
}

.priority-medium .priority-dot {
  background: #f9e2af;
  box-shadow: 0 0 6px rgba(249, 226, 175, 0.6);
}

.priority-low {
  background: rgba(166, 227, 161, 0.2);
  color: #a6e3a1;
  border: 1px solid rgba(166, 227, 161, 0.4);
}

.priority-low .priority-dot {
  background: #a6e3a1;
  box-shadow: 0 0 6px rgba(166, 227, 161, 0.6);
}

.overdue-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(243, 139, 168, 0.2);
  color: #f38ba8;
  border: 1px solid rgba(243, 139, 168, 0.4);
  animation: pulseOverdue 2s infinite;
}

@keyframes pulseOverdue {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
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
  justify-content: space-between;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(203, 166, 247, 0.08);
}

.due-date {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6c7086;
  font-weight: 500;
}

.due-date.overdue {
  color: #f38ba8;
}

.due-date.overdue svg {
  stroke: #f38ba8;
}

.priority-footer-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 4px;
}

.tag-high {
  background: rgba(243, 139, 168, 0.15);
  color: #f38ba8;
}

.tag-medium {
  background: rgba(249, 226, 175, 0.15);
  color: #f9e2af;
}

.tag-low {
  background: rgba(166, 227, 161, 0.15);
  color: #a6e3a1;
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
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
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
  transition: border-color 0.15s ease;
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
