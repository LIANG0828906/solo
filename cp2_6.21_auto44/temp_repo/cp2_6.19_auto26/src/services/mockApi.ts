import { useAppStore, type Task, type Sprint } from '@/store/useAppStore'

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export async function getTasks(): Promise<Task[]> {
  await delay(Math.random() * 300 + 200)
  return useAppStore.getState().tasks
}

export async function createTask(task: Omit<Task, 'id' | 'createdAt' | 'completedAt'>): Promise<Task> {
  await delay(Math.random() * 300 + 200)
  useAppStore.getState().addTask(task)
  const created = useAppStore.getState().tasks.find(t => t.title === task.title && t.assignee === task.assignee)
  return created!
}

export async function updateTask(id: string, updates: Partial<Task>): Promise<Task> {
  await delay(Math.random() * 200 + 100)
  useAppStore.getState().updateTask(id, updates)
  const updated = useAppStore.getState().tasks.find(t => t.id === id)
  return updated!
}

export async function deleteTask(id: string): Promise<{ success: boolean }> {
  await delay(Math.random() * 200 + 100)
  useAppStore.getState().deleteTask(id)
  return { success: true }
}

export async function getSprints(): Promise<Sprint[]> {
  await delay(Math.random() * 300 + 200)
  return useAppStore.getState().sprints
}

export async function createSprint(sprint: Omit<Sprint, 'id' | 'taskIds'>): Promise<Sprint> {
  await delay(Math.random() * 300 + 200)
  useAppStore.getState().addSprint(sprint)
  const created = useAppStore.getState().sprints.find(s => s.name === sprint.name)
  return created!
}

export async function updateSprint(id: string, updates: Partial<Sprint>): Promise<Sprint> {
  await delay(Math.random() * 200 + 100)
  useAppStore.getState().updateSprint(id, updates)
  const updated = useAppStore.getState().sprints.find(s => s.id === id)
  return updated!
}

export async function deleteSprint(id: string): Promise<{ success: boolean }> {
  await delay(Math.random() * 200 + 100)
  useAppStore.getState().deleteSprint(id)
  return { success: true }
}

export async function addTaskToSprint(sprintId: string, taskId: string): Promise<Sprint> {
  await delay(Math.random() * 150 + 50)
  useAppStore.getState().addTaskToSprint(sprintId, taskId)
  const updated = useAppStore.getState().sprints.find(s => s.id === sprintId)
  return updated!
}

export async function removeTaskFromSprint(sprintId: string, taskId: string): Promise<Sprint> {
  await delay(Math.random() * 150 + 50)
  useAppStore.getState().removeTaskFromSprint(sprintId, taskId)
  const updated = useAppStore.getState().sprints.find(s => s.id === sprintId)
  return updated!
}
