import { create } from 'zustand';
import {
  initTasks as initTasksStore,
  createTask as createTaskStore,
  updateTask as updateTaskStore,
  saveTasks,
} from './data/taskStore';
import type { Task, TaskCategory } from './data/taskStore';
import {
  initNotifications as initNotificationsStore,
  createNotification as createNotifStore,
  markAsRead as markReadStore,
  markAllAsRead as markAllReadStore,
  saveNotifications,
} from './data/notificationStore';
import type { Notification } from './data/notificationStore';
import {
  transferPoints,
  calculateLevel,
  updateReputation,
  canAfford,
} from './logic/pointCalculator';
import type { User } from './logic/pointCalculator';

interface PublishTaskData {
  title: string;
  description: string;
  reward: number;
  category: TaskCategory;
}

interface PointsChange {
  old: number;
  new: number;
  timestamp?: number;
}

interface StoreState {
  tasks: Task[];
  currentUser: User;
  notifications: Notification[];
  lastPointsChange: PointsChange | null;
  _initialized: boolean;
  initialized: boolean;
  init: () => void;
  initialize: () => void;
  publishTask: (data: PublishTaskData | string, description?: string, reward?: number, category?: TaskCategory) => boolean | Task | null;
  claimTask: (taskId: string, claimant?: User) => boolean;
  completeTask: (taskId: string) => boolean;
  markCompleted: (taskId: string) => boolean;
  rateAndFinalize: (taskId: string, rating: number) => boolean;
  clearPointsAnimation: () => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
}

const initialUser: User = {
  id: 'user-1',
  nickname: '社区好邻居',
  avatar: '',
  points: 500,
  level: 2,
  completedCount: 5,
  avgRating: 4.5,
};

export const useAppStore = create<StoreState>((set, get) => ({
  tasks: [],
  currentUser: initialUser,
  notifications: [],
  lastPointsChange: null,
  _initialized: false,
  initialized: false,

  init: () => {
    const s = get();
    if (s._initialized) return;
    const tasks = initTasksStore();
    const notifications = initNotificationsStore();
    set({ tasks, notifications, _initialized: true, initialized: true });
  },

  initialize: () => {
    get().init();
  },

  publishTask: (data: PublishTaskData | string, description?: string, reward?: number, category?: TaskCategory) => {
    let title: string;
    let desc: string;
    let rwd: number;
    let cat: TaskCategory;
    let isObjectCall = false;

    if (typeof data === 'object' && data !== null) {
      const d = data as PublishTaskData;
      title = d.title;
      desc = d.description;
      rwd = d.reward;
      cat = d.category;
      isObjectCall = true;
    } else if (typeof data === 'string' && description !== undefined && reward !== undefined && category !== undefined) {
      title = data;
      desc = description;
      rwd = reward;
      cat = category;
    } else {
      return isObjectCall ? false : null;
    }

    const { currentUser } = get();

    if (!title.trim() || title.length > 200) return isObjectCall ? false : null;
    if (!desc.trim() || desc.length > 500) return isObjectCall ? false : null;
    if (!Number.isInteger(rwd) || rwd < 1 || rwd > 999) return isObjectCall ? false : null;
    if (!cat) return isObjectCall ? false : null;
    if (!canAfford(currentUser, rwd)) return isObjectCall ? false : null;

    const newTask = createTaskStore({
      title: title.trim(),
      description: desc.trim(),
      reward: rwd,
      category: cat,
      publisherId: currentUser.id,
      publisherName: currentUser.nickname,
    });

    const oldPoints = currentUser.points;
    const newPoints = currentUser.points - rwd;

    set((state) => ({
      tasks: [newTask, ...state.tasks],
      currentUser: {
        ...state.currentUser,
        points: newPoints,
      },
      lastPointsChange: { old: oldPoints, new: newPoints, timestamp: Date.now() },
    }));

    return isObjectCall ? true : newTask;
  },

  claimTask: ((taskId: string, claimant?: User) => {
    const { tasks, currentUser } = get();
    const task = tasks.find((t) => t.id === taskId);
    const actualClaimant = claimant ?? currentUser;

    if (!task || task.status !== 'open' || task.publisherId === actualClaimant.id) {
      return false;
    }

    const updated = updateTaskStore(taskId, {
      status: 'claimed',
      claimantId: actualClaimant.id,
      claimantName: actualClaimant.nickname,
      claimedAt: new Date(),
    });

    if (!updated) return false;

    const notif = createNotifStore({
      userId: task.publisherId,
      type: 'claimed',
      content: `您发布的"${task.title}"任务已被邻居"${actualClaimant.nickname}"认领。`,
      taskId,
    });

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      notifications: [notif, ...state.notifications],
    }));

    return true;
  }) as StoreState['claimTask'],

  completeTask: (taskId: string) => {
    const { tasks, currentUser } = get();
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status !== 'claimed' || task.claimantId !== currentUser.id) return false;

    const updated = updateTaskStore(taskId, {
      status: 'completed',
      completedAt: new Date(),
    });

    if (!updated) return false;

    const notif = createNotifStore({
      userId: task.publisherId,
      type: 'completed',
      content: `您发布的"${task.title}"任务已被"${task.claimantName}"完成，快去评价吧！`,
      taskId,
    });

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updated : t)),
      notifications: [notif, ...state.notifications],
    }));

    return true;
  },

  markCompleted: (taskId: string) => {
    return get().completeTask(taskId);
  },

  rateAndFinalize: (taskId: string, rating: number) => {
    const { tasks, currentUser } = get();
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status !== 'completed') return false;
    if (task.publisherId !== currentUser.id) return false;
    if (![1, 2, 3, 4, 5].includes(rating)) return false;

    const updated = updateTaskStore(taskId, {
      status: 'reviewed',
      rating,
    });

    if (!updated) return false;

    const oldPoints = currentUser.points;
    const newPublisherPoints = currentUser.points - task.reward;

    const claimantUser: User = {
      id: task.claimantId!,
      nickname: task.claimantName!,
      avatar: '',
      points: 0,
      level: 1,
      completedCount: 0,
      avgRating: 0,
    };

    const { claimant: claimantAfterTransfer } = transferPoints(currentUser, claimantUser, task.reward);
    const repResult = updateReputation(
      { ...claimantUser, points: claimantAfterTransfer.points },
      rating
    );
    // repResult 本身就是 User 类型

    const notif = createNotifStore({
      userId: task.claimantId!,
      type: 'reviewed',
      content: `您完成的"${task.title}"任务获得了${rating}星好评，${task.reward}积分已到账！`,
      taskId,
    });

    const newTasks = tasks.map((t) => (t.id === taskId ? updated : t));
    const allNotifs = [notif, ...get().notifications];
    saveTasks(newTasks);
    saveNotifications(allNotifs);

    set((state) => {
      const newCurrentUser = state.currentUser.id === task.claimantId
        ? {
            ...repResult,
            points: state.currentUser.points + task.reward,
          }
        : { ...state.currentUser, points: newPublisherPoints };

      return {
        tasks: newTasks,
        currentUser: newCurrentUser,
        notifications: allNotifs,
        lastPointsChange: { old: oldPoints, new: newPublisherPoints, timestamp: Date.now() },
      };
    });

    return true;
  },

  clearPointsAnimation: () => {
    set({ lastPointsChange: null });
  },

  markNotificationRead: (id: string) => {
    markReadStore(id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  markAllNotificationsRead: () => {
    markAllReadStore(get().currentUser.id);
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.userId === state.currentUser.id ? { ...n, read: true } : n
      ),
    }));
  },
}));

useAppStore.getState().initialize();

export const useStore = useAppStore;

export type { Task, TaskCategory, User, Notification, PublishTaskData };
