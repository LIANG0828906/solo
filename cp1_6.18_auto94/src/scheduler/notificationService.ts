import { useTaskStore } from '../garden/taskStore';

const CHECK_INTERVAL = 60 * 1000;
const WARNING_THRESHOLD = 60 * 60 * 1000;

class NotificationService {
  private intervalId: number | null = null;
  private notifiedTasks: Set<string> = new Set();

  start() {
    if (this.intervalId !== null) {
      return;
    }

    this.requestPermission();
    this.checkTasks();
    this.intervalId = window.setInterval(() => {
      this.checkTasks();
    }, CHECK_INTERVAL);
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private requestPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  private checkTasks() {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    const tasks = useTaskStore.getState().getPendingTasks();
    const now = Date.now();

    tasks.forEach((task) => {
      const timeUntilDeadline = task.deadline - now;

      if (
        timeUntilDeadline > 0 &&
        timeUntilDeadline <= WARNING_THRESHOLD &&
        !this.notifiedTasks.has(task.id)
      ) {
        this.showNotification(task);
        this.notifiedTasks.add(task.id);
      }

      if (timeUntilDeadline > WARNING_THRESHOLD) {
        this.notifiedTasks.delete(task.id);
      }
    });
  }

  private showNotification(task: { id: string; name: string; deadline: number; zoneId?: string }) {
    const minutesLeft = Math.round((task.deadline - Date.now()) / (60 * 1000));
    
    try {
      new Notification('指尖花园 - 任务提醒', {
        body: `任务「${task.name}」将在 ${minutesLeft} 分钟后截止`,
        icon: '/vite.svg',
        tag: `task-${task.id}`,
      });
    } catch (error) {
      console.error('Failed to show notification:', error);
    }
  }

  checkNow() {
    this.checkTasks();
  }
}

export const notificationService = new NotificationService();
