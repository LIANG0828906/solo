import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Task, TaskStatus } from '@/shared/types';
import { taskApi } from '@/shared/api';

export const useTaskStore = defineStore('task', () => {
  const tasks = ref<Task[]>(taskApi.getAll());

  const todoTasks = computed(() => tasks.value.filter(t => t.status === 'todo'));
  const inProgressTasks = computed(() => tasks.value.filter(t => t.status === 'in_progress'));
  const doneTasks = computed(() => tasks.value.filter(t => t.status === 'done'));

  const stats = computed(() => ({
    total: tasks.value.length,
    todo: todoTasks.value.length,
    inProgress: inProgressTasks.value.length,
    done: doneTasks.value.length,
  }));

  function load() {
    tasks.value = taskApi.getAll();
  }

  function create(data: { title: string; description: string; status: TaskStatus; priority: string; dueDate: string | null; articleRef: string | null }) {
    const task = taskApi.create(data as Omit<Task, 'id' | 'createdAt'>);
    tasks.value.push(task);
    return task;
  }

  function update(id: string, data: Partial<Task>) {
    const result = taskApi.update(id, data);
    if (result) {
      const idx = tasks.value.findIndex(t => t.id === id);
      if (idx !== -1) tasks.value[idx] = result;
    }
    return result;
  }

  function remove(id: string) {
    const success = taskApi.delete(id);
    if (success) {
      tasks.value = tasks.value.filter(t => t.id !== id);
    }
    return success;
  }

  function changeStatus(id: string, status: TaskStatus) {
    return update(id, { status });
  }

  function clearArticleRef(articleId: string) {
    tasks.value.forEach(t => {
      if (t.articleRef === articleId) {
        update(t.id, { articleRef: null });
      }
    });
  }

  return { tasks, todoTasks, inProgressTasks, doneTasks, stats, load, create, update, remove, changeStatus, clearArticleRef };
});
