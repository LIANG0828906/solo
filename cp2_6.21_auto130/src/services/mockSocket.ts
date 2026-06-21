import type { User, MealPlanEntry, Comment } from '@/state/appStore';

type ToastType = 'info' | 'success' | 'warning';

type WsEventMap = {
  'meal-plan:updated': { entry: MealPlanEntry | null; action: 'add' | 'remove' | 'move'; by: User };
  'shopping-list:checked': { ingredientId: string; purchased: boolean; by: User };
  'comment:new': { comment: Comment };
  'room:join': { userId: string; nickname: string };
  'toast:notify': { message: string; type: ToastType };
};

export type WsEventName = keyof WsEventMap;

export type WsHandler<K extends WsEventName> = (payload: WsEventMap[K]) => void;

const MOCK_USERS: User[] = [
  { id: 'user-2', nickname: '美食家老王', avatarUrl: '' },
  { id: 'user-3', nickname: '健康达人', avatarUrl: '' },
  { id: 'user-4', nickname: '烘焙小白', avatarUrl: '' },
];

class MockSocket {
  private handlers: Map<string, Set<Function>> = new Map();
  private connected = false;
  private timers: NodeJS.Timeout[] = [];

  connect() {
    if (this.connected) return;
    this.connected = true;
    setTimeout(() => {
      this.emit('room:join', { userId: 'user-1', nickname: '小厨娘' });
    }, 300);

    this.startSimulatedEvents();
  }

  disconnect() {
    this.connected = false;
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }

  isConnected() {
    return this.connected;
  }

  on<K extends WsEventName>(event: K, handler: WsHandler<K>) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler);
  }

  off<K extends WsEventName>(event: K, handler: WsHandler<K>) {
    this.handlers.get(event)?.delete(handler);
  }

  emit<K extends WsEventName>(event: K, payload: WsEventMap[K]) {
    this.handlers.get(event)?.forEach((h) => {
      try {
        h(payload);
      } catch (e) {
        console.error('[MockSocket] handler error for', event, e);
      }
    });
  }

  private startSimulatedEvents() {
    const notify = (delay: number, cb: () => void) => {
      const t = setTimeout(() => {
        if (this.connected) cb();
      }, delay);
      this.timers.push(t);
    };

    notify(6000, () => {
      const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
      this.emit('toast:notify', {
        message: `${user.nickname} 加入了房间`,
        type: 'info' as ToastType,
      });
    });

    notify(15000, () => {
      const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
      this.emit('toast:notify', {
        message: `${user.nickname} 开始编辑菜单规划`,
        type: 'info' as ToastType,
      });
    });

    notify(25000, () => {
      const user = MOCK_USERS[Math.floor(Math.random() * MOCK_USERS.length)];
      this.emit('toast:notify', {
        message: `${user.nickname} 添加了一道新食谱`,
        type: 'success' as ToastType,
      });
    });
  }
}

export const mockSocket = new MockSocket();
