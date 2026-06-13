import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskCreateInput, TaskUpdateInput } from '../src/types/index.js';

let tasks: Task[] = [];

export function getAllTasks(): Task[] {
  return [...tasks];
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((task) => task.id === id);
}

export function createTask(input: TaskCreateInput): Task {
  const newTask: Task = {
    id: uuidv4(),
    title: input.title,
    description: input.description,
    estimatedHours: input.estimatedHours,
    assignees: input.assignees ?? [],
    timeSpent: 0,
    isRunning: false,
    createdAt: Date.now(),
    position: tasks.length,
  };
  tasks.push(newTask);
  return newTask;
}

export function updateTask(id: string, input: TaskUpdateInput): Task | null {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return null;

  const existing = tasks[index];
  const updated: Task = {
    ...existing,
    ...(input.title !== undefined ? { title: input.title } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
    ...(input.estimatedHours !== undefined ? { estimatedHours: input.estimatedHours } : {}),
    ...(input.assignees !== undefined
      ? { assignees: Array.isArray(input.assignees) ? input.assignees : [input.assignees] }
      : {}),
  };
  tasks[index] = updated;
  return updated;
}

export function updateTimeSpent(taskId: string, timeSpent: number): Task | null {
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return null;

  tasks[index] = {
    ...tasks[index],
    timeSpent,
  };
  return tasks[index];
}

export function setTaskRunning(taskId: string, isRunning: boolean): Task | null {
  const index = tasks.findIndex((task) => task.id === taskId);
  if (index === -1) return null;

  tasks[index] = {
    ...tasks[index],
    isRunning,
  };
  return tasks[index];
}

export function deleteTask(id: string): boolean {
  const index = tasks.findIndex((task) => task.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  for (let i = index; i < tasks.length; i++) {
    tasks[i] = { ...tasks[i], position: i };
  }
  return true;
}

export interface ExportData {
  tasks: Task[];
  exportedAt: number;
  version: string;
}

export function exportData(): ExportData {
  return {
    tasks: getAllTasks(),
    exportedAt: Date.now(),
    version: '1.0.0',
  };
}
