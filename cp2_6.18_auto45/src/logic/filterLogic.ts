import type { Task, TaskCategory, TaskStatus } from '../data/taskStore';

export function filterByCategory(
  tasks: Task[],
  category: TaskCategory | 'all' | '全部'
): Task[] {
  if (category === 'all' || category === '全部') return tasks;
  return tasks.filter((task) => task.category === category);
}

export function filterByKeyword(
  tasks: Task[],
  keyword: string
): Task[] {
  if (!keyword || keyword.trim() === '') return tasks;
  const lowerKeyword = keyword.toLowerCase();
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(lowerKeyword) ||
      task.description.toLowerCase().includes(lowerKeyword)
  );
}

export function filterByStatus(
  tasks: Task[],
  status: TaskStatus | TaskStatus[]
): Task[] {
  const statuses = Array.isArray(status) ? status : [status];
  return tasks.filter((task) => statuses.includes(task.status));
}

type UserRole = 'publisher' | 'claimant';

export function filterByUser(
  tasks: Task[],
  userId: string,
  role: UserRole
): Task[] {
  if (role === 'publisher') {
    return tasks.filter((task) => task.publisherId === userId);
  }
  return tasks.filter((task) => task.claimantId === userId);
}
