interface Task {
  id: string;
  roomId: string;
  name: string;
  assignee: string;
  note: string;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  completed: boolean;
}

interface Conflict {
  taskId1: string;
  taskId2: string;
  overlapStart: string;
  overlapEnd: string;
}

function validateTimeline(tasks: Task[]): Conflict[] {
  const conflicts: Conflict[] = [];
  for (let i = 0; i < tasks.length; i++) {
    for (let j = i + 1; j < tasks.length; j++) {
      const a = tasks[i];
      const b = tasks[j];
      const aStart = new Date(a.plannedStart).getTime();
      const aEnd = new Date(a.plannedEnd).getTime();
      const bStart = new Date(b.plannedStart).getTime();
      const bEnd = new Date(b.plannedEnd).getTime();
      if (aStart < bEnd && bStart < aEnd) {
        const overlapStart = new Date(Math.max(aStart, bStart));
        const overlapEnd = new Date(Math.min(aEnd, bEnd));
        conflicts.push({
          taskId1: a.id,
          taskId2: b.id,
          overlapStart: overlapStart.toISOString().split('T')[0],
          overlapEnd: overlapEnd.toISOString().split('T')[0],
        });
      }
    }
  }
  return conflicts;
}

function updateTask(tasks: Task[], taskId: string, updates: Partial<Task>): Task[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
}

function calculateTaskPosition(
  task: Task,
  timelineStart: Date,
  timelineEnd: Date,
  containerWidth: number
): { left: number; width: number } {
  const totalMs = timelineEnd.getTime() - timelineStart.getTime();
  if (totalMs <= 0) return { left: 0, width: 0 };
  const taskStart = new Date(task.plannedStart).getTime();
  const taskEnd = new Date(task.plannedEnd).getTime();
  const left = ((taskStart - timelineStart.getTime()) / totalMs) * containerWidth;
  const width = ((taskEnd - taskStart) / totalMs) * containerWidth;
  return { left, width };
}

function formatDateForGantt(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function getDaysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export { validateTimeline, updateTask, calculateTaskPosition, formatDateForGantt, getDaysBetween };
export type { Task, Conflict };
