import type { Plant, Task, TaskType } from '../stores/plantStore';

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return formatDate(d);
}

function diffDays(dateStr: string): number {
  const target = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.floor((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export interface OverdueTask extends Task {
  overdueDays: number;
}

export function generateReminders(plants: Plant[]): Array<{ plantId: string; type: TaskType; date: string }> {
  const reminders: Array<{ plantId: string; type: TaskType; date: string }> = [];
  const today = new Date();

  plants.forEach(plant => {
    if (plant.status === 'withered') return;

    const plantDate = new Date(plant.plantDate);
    const daysSincePlant = Math.floor((today.getTime() - plantDate.getTime()) / (1000 * 60 * 60 * 24));

    for (let offset = 0; offset <= 7; offset++) {
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + offset);
      const dayNum = daysSincePlant + offset;
      const dateStr = formatDate(targetDate);

      if (dayNum >= 0 && dayNum <= 14) {
        reminders.push({ plantId: plant.id, type: 'watering', date: dateStr });
      } else if (dayNum > 14 && dayNum % 2 === 0) {
        reminders.push({ plantId: plant.id, type: 'watering', date: dateStr });
      }

      if (dayNum > 0 && dayNum % 7 === 0) {
        reminders.push({ plantId: plant.id, type: 'fertilizing', date: dateStr });
      }

      if (dayNum > 0 && dayNum % 30 === 0) {
        reminders.push({ plantId: plant.id, type: 'pruning', date: dateStr });
      }
    }
  });

  return reminders;
}

export function getOverdueTasks(tasks: Task[]): OverdueTask[] {
  return tasks
    .filter(t => !t.completed)
    .map(t => ({ ...t, overdueDays: -diffDays(t.date) }))
    .filter(t => t.overdueDays > 2)
    .sort((a, b) => b.overdueDays - a.overdueDays);
}

export function getPendingTasks(tasks: Task[]): Task[] {
  return tasks.filter(t => !t.completed && diffDays(t.date) <= 0);
}

export function getTasksForDate(tasks: Task[], dateStr: string): Task[] {
  return tasks.filter(t => t.date === dateStr);
}

export function getCompletedThisMonth(tasks: Task[]): number {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  return tasks.filter(t => {
    if (!t.completed || !t.completedAt) return false;
    const d = new Date(t.completedAt);
    return d.getFullYear() === year && d.getMonth() === month;
  }).length;
}

export function getWitheredCount(plants: Plant[]): number {
  return plants.filter(p => p.status === 'withered').length;
}

export { addDays, diffDays };
