import { Task, TaskConflict } from './types';
import { WebSocket } from 'ws';

interface BroadcastFunction {
  (message: object, excludeUserId?: string): void;
}

export class TaskEngine {
  private tasks: Map<string, Task> = new Map();
  private broadcast: BroadcastFunction;

  constructor(broadcast: BroadcastFunction) {
    this.broadcast = broadcast;
    this.initializeSampleData();
  }

  private initializeSampleData(): void {
    const now = Date.now();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const baseTime = startOfDay.getTime();
    const HOUR = 60 * 60 * 1000;

    const sampleTasks: Task[] = [
      {
        id: 'sample-1',
        name: '产品需求评审',
        startTime: baseTime + 9 * HOUR,
        endTime: baseTime + 10 * HOUR,
        priority: 'high',
        completed: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sample-2',
        name: '代码开发',
        startTime: baseTime + 10 * HOUR + 30 * 60 * 1000,
        endTime: baseTime + 12 * HOUR,
        priority: 'medium',
        completed: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sample-3',
        name: '午餐休息',
        startTime: baseTime + 12 * HOUR,
        endTime: baseTime + 13 * HOUR,
        priority: 'low',
        completed: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sample-4',
        name: '团队站会',
        startTime: baseTime + 14 * HOUR,
        endTime: baseTime + 14 * HOUR + 30 * 60 * 1000,
        priority: 'medium',
        completed: false,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'sample-5',
        name: '代码审查',
        startTime: baseTime + 15 * HOUR,
        endTime: baseTime + 16 * HOUR,
        priority: 'high',
        completed: false,
        createdAt: now,
        updatedAt: now
      }
    ];

    sampleTasks.forEach((task) => {
      this.tasks.set(task.id, task);
    });
  }

  getAllTasks(): Task[] {
    return Array.from(this.tasks.values()).sort((a, b) => a.startTime - b.startTime);
  }

  getTask(id: string): Task | undefined {
    return this.tasks.get(id);
  }

  checkForConflict(newTask: Task, excludeId?: string): TaskConflict | null {
    for (const existingTask of this.tasks.values()) {
      if (excludeId && existingTask.id === excludeId) continue;

      const overlaps =
        newTask.startTime < existingTask.endTime &&
        newTask.endTime > existingTask.startTime;

      if (overlaps) {
        return {
          message: `任务"${newTask.name}"与"${existingTask.name}"时间冲突`,
          task1Id: newTask.id,
          task2Id: existingTask.id,
          timestamp: Date.now()
        };
      }
    }
    return null;
  }

  createTask(task: Task): { task: Task; conflict: TaskConflict | null } {
    const conflict = this.checkForConflict(task);

    this.tasks.set(task.id, task);

    if (!conflict) {
      this.broadcast({
        type: 'task_created',
        data: task
      });
    } else {
      this.broadcast({
        type: 'conflict',
        data: conflict
      });
    }

    return { task, conflict };
  }

  updateTask(id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): { task: Task; conflict: TaskConflict | null } | null {
    const existing = this.tasks.get(id);
    if (!existing) return null;

    const updated: Task = {
      ...existing,
      ...updates,
      updatedAt: Date.now()
    };

    const conflict = this.checkForConflict(updated, id);

    this.tasks.set(id, updated);

    if (!conflict) {
      this.broadcast({
        type: 'task_updated',
        data: updated
      });
    } else {
      this.broadcast({
        type: 'conflict',
        data: conflict
      });
    }

    return { task: updated, conflict };
  }

  deleteTask(id: string): boolean {
    const existed = this.tasks.has(id);
    if (existed) {
      this.tasks.delete(id);
      this.broadcast({
        type: 'task_deleted',
        data: id
      });
    }
    return existed;
  }

  getStats() {
    const all = this.getAllTasks();
    const now = Date.now();

    return {
      total: all.length,
      completed: all.filter(t => t.completed).length,
      overdue: all.filter(t => !t.completed && t.endTime < now).length,
      highPriority: all.filter(t => t.priority === 'high' && !t.completed).length
    };
  }
}
