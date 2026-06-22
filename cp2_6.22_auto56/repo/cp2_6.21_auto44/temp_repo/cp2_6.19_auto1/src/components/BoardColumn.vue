<template>
  <div
    class="board-column"
    :class="{ 'is-drag-over': isDragOver }"
    @dragover.prevent="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="column-header">
      <h2 class="column-title">
        <span class="column-icon" :class="`icon-${status}`">
          <svg v-if="status === 'todo'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
          <svg v-else-if="status === 'inProgress'" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M12 6v6l4 2"></path>
          </svg>
          <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </span>
        {{ title }}
        <span class="task-count">{{ tasks.length }}</span>
      </h2>
      <button class="add-task-btn" @click="showAddForm = !showAddForm">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    </div>

    <div v-if="showAddForm" class="add-task-form">
      <input
        v-model="newTask.title"
        class="form-input"
        placeholder="任务标题"
        @keyup.enter="addNewTask"
        @keyup.esc="cancelAdd"
      />
      <textarea
        v-model="newTask.description"
        class="form-textarea"
        placeholder="任务描述（可选）"
      ></textarea>
      <div class="form-row">
        <select v-model="newTask.priority" class="form-select">
          <option value="high">高优先级</option>
          <option value="medium">中优先级</option>
          <option value="low">低优先级</option>
        </select>
        <input v-model="newTask.dueDate" type="date" class="form-date" />
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="addNewTask">添加</button>
        <button class="btn btn-secondary" @click="cancelAdd">取消</button>
      </div>
    </div>

    <div
      class="task-list"
      ref="taskListRef"
      @scroll.passive="handleScroll"
    >
      <TransitionGroup name="task-list" tag="div" class="task-list-inner">
        <TaskCard
          v-for="(task, index) in visibleTasks"
          :key="task.id"
          :task="task"
          :animation-delay="index * 20"
          @drag-start="handleCardDragStart"
          @drag-end="handleCardDragEnd"
        />
      </TransitionGroup>

      <div v-if="tasks.length === 0" class="empty-state">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <p>暂无任务</p>
        <span>点击 + 添加新任务</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import TaskCard from './TaskCard.vue'
import type { Task, Priority, TaskStatus } from '../stores/boardStore'
import { useBoardStore } from '../stores/boardStore'

const props = defineProps<{
  title: string
  status: TaskStatus
  tasks: Task[]
}>()

const { addTask, moveTask } = useBoardStore()

const isDragOver = ref(false)
const showAddForm = ref(false)
const newTask = reactive({
  title: '',
  description: '',
  priority: 'medium' as Priority,
  dueDate: new Date().toISOString().split('T')[0],
})

const taskListRef = ref<HTMLElement | null>(null)
const scrollTop = ref(0)
const viewportHeight = ref(600)
const ITEM_HEIGHT = 120
const BUFFER = 5

const visibleTasks = computed(() => {
  if (props.tasks.length <= 30) return props.tasks

  const start = Math.max(0, Math.floor(scrollTop.value / ITEM_HEIGHT) - BUFFER)
  const visibleCount = Math.ceil(viewportHeight.value / ITEM_HEIGHT) + BUFFER * 2
  const end = Math.min(props.tasks.length, start + visibleCount)

  return props.tasks.slice(start, end)
})

const handleScroll = () => {
  if (taskListRef.value) {
    scrollTop.value = taskListRef.value.scrollTop
  }
}

const updateViewport = () => {
  if (taskListRef.value) {
    viewportHeight.value = taskListRef.value.clientHeight
  }
}

let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  updateViewport()
  if (taskListRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateViewport()
    })
    resizeObserver.observe(taskListRef.value)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = 'move'
  }
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false
  if (e.dataTransfer) {
    const taskId = e.dataTransfer.getData('text/plain')
    if (taskId) {
      moveTask(taskId, props.status)
    }
  }
}

const handleCardDragStart = () => {}

const handleCardDragEnd = () => {}

const addNewTask = () => {
  if (newTask.title.trim()) {
    addTask(
      {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: newTask.priority,
        dueDate: newTask.dueDate,
      },
      props.status
    )
    cancelAdd()
  }
}

const cancelAdd = () => {
  showAddForm.value = false
  newTask.title = ''
  newTask.description = ''
  newTask.priority = 'medium'
  newTask.dueDate = new Date().toISOString().split('T')[0]
}
</script>

<style scoped>
.board-column {
  display: flex;
  flex-direction: column;
  background: rgba(24, 24, 37, 0.4);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-radius: 16px;
  padding: 20px;
  min-height: 400px;
  border: 1px solid rgba(203, 166, 247, 0.12);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.03);
  transition: background 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  contain: layout style;
  position: relative;
}

.board-column::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(
    180deg,
    rgba(203, 166, 247, 0.15) 0%,
    rgba(203, 166, 247, 0.03) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.board-column.is-drag-over {
  background: rgba(203, 166, 247, 0.08);
  border-color: rgba(203, 166, 247, 0.5);
  box-shadow: inset 0 0 40px rgba(203, 166, 247, 0.1), 0 0 30px rgba(203, 166, 247, 0.15);
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(203, 166, 247, 0.15);
}

.column-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #cdd6f4;
}

.column-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 10px;
}

.icon-todo {
  background: rgba(147, 153, 178, 0.2);
  color: #9399b2;
}

.icon-inProgress {
  background: rgba(203, 166, 247, 0.2);
  color: #cba6f7;
}

.icon-done {
  background: rgba(166, 227, 161, 0.2);
  color: #a6e3a1;
}

.task-count {
  background: rgba(203, 166, 247, 0.15);
  color: #cba6f7;
  font-size: 12px;
  font-weight: 600;
  padding: 3px 10px;
  border-radius: 20px;
  margin-left: 4px;
}

.add-task-btn {
  background: rgba(203, 166, 247, 0.15);
  border: none;
  color: #cba6f7;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-task-btn:hover {
  background: rgba(203, 166, 247, 0.3);
  transform: scale(1.05);
}

.add-task-form {
  background: rgba(49, 50, 68, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(203, 166, 247, 0.2);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
  animation: formSlideDown 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes formSlideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.form-input,
.form-textarea,
.form-select,
.form-date {
  width: 100%;
  background: rgba(30, 30, 46, 0.8);
  border: 1px solid rgba(203, 166, 247, 0.3);
  border-radius: 8px;
  padding: 10px 12px;
  color: #cdd6f4;
  font-size: 14px;
  font-family: inherit;
  margin-bottom: 10px;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus,
.form-date:focus {
  border-color: #cba6f7;
  box-shadow: 0 0 0 3px rgba(203, 166, 247, 0.15);
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.form-row {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.form-select,
.form-date {
  flex: 1;
  margin-bottom: 0;
  cursor: pointer;
}

.form-actions {
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

.task-list {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  min-height: 100px;
  -webkit-overflow-scrolling: touch;
}

.task-list-inner {
  min-height: 0;
}

.task-list-move,
.task-list-enter-active,
.task-list-leave-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.task-list-enter-from,
.task-list-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.9);
}

.task-list-leave-active {
  position: absolute;
  width: calc(100% - 32px);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #6c7086;
  text-align: center;
}

.empty-state svg {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-state p {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}

.empty-state span {
  font-size: 12px;
  opacity: 0.7;
}

@media (max-width: 900px) {
  .board-column {
    min-height: 250px;
  }
}
</style>
