interface Room {
  id: string;
  name: string;
  status: 'not_started' | 'in_progress' | 'completed';
  totalBudget: number;
  spent: number;
  thumbnail: string;
  order: number;
  updatedAt: string;
}

interface BudgetCategory {
  id: string;
  roomId: string;
  name: string;
  allocated: number;
  spent: number;
  items: BudgetItem[];
}

interface BudgetItem {
  id: string;
  categoryId: string;
  amount: number;
  date: string;
  note: string;
  receipt: string;
}

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

interface Material {
  id: string;
  roomId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  link: string;
  purchased: boolean;
  category: string;
}

const BASE_URL = '/api';
const CACHE_TTL = 30000;
const THROTTLE_MS = 300;

class ApiService {
  private cache = new Map<string, { data: unknown; timestamp: number }>();
  private pendingRequests = new Map<string, { timestamp: number; promise: Promise<unknown> }>();

  private getFromCache(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  private invalidateCache(prefix: string): void {
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
      }
    }
  }

  private getThrottleKey(url: string, options?: RequestInit): string {
    return `${url}:${options?.method || 'GET'}:${options?.body || ''}`;
  }

  private async request<T>(url: string, options?: RequestInit): Promise<T> {
    const throttleKey = this.getThrottleKey(url, options);
    const pending = this.pendingRequests.get(throttleKey);
    if (pending && Date.now() - pending.timestamp < THROTTLE_MS) {
      return pending.promise as Promise<T>;
    }

    const isGet = !options?.method || options.method === 'GET';
    if (isGet) {
      const cached = this.getFromCache(url);
      if (cached !== null) return cached as T;
    }

    const promise = fetch(`${BASE_URL}${url}`, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`API Error: ${res.status} ${res.statusText}`);
        }
        if (res.status === 204) return undefined as T;
        return res.json();
      })
      .then((data) => {
        if (isGet) {
          this.setCache(url, data);
        }
        this.pendingRequests.delete(throttleKey);
        return data as T;
      })
      .catch((err) => {
        this.pendingRequests.delete(throttleKey);
        throw err;
      });

    this.pendingRequests.set(throttleKey, { timestamp: Date.now(), promise });
    return promise;
  }

  async getRooms(): Promise<Room[]> {
    return this.request<Room[]>('/rooms');
  }

  async createRoom(data: Partial<Room>): Promise<Room> {
    const result = await this.request<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.invalidateCache('/rooms');
    return result;
  }

  async reorderRooms(order: { id: string; order: number }[]): Promise<void> {
    await this.request<void>('/rooms/reorder', {
      method: 'POST',
      body: JSON.stringify({ order }),
    });
    this.invalidateCache('/rooms');
  }

  async getBudget(roomId: string): Promise<BudgetCategory[]> {
    return this.request<BudgetCategory[]>(`/rooms/${roomId}/budget`);
  }

  async addBudgetItem(
    roomId: string,
    data: { categoryId: string; amount: number; date: string; note: string; receipt: string }
  ): Promise<BudgetItem> {
    const result = await this.request<BudgetItem>(`/rooms/${roomId}/budget/items`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.invalidateCache(`/rooms/${roomId}/budget`);
    this.invalidateCache('/rooms');
    return result;
  }

  async updateBudgetItem(roomId: string, itemId: string, data: Partial<BudgetItem>): Promise<BudgetItem> {
    const result = await this.request<BudgetItem>(`/rooms/${roomId}/budget/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    this.invalidateCache(`/rooms/${roomId}/budget`);
    this.invalidateCache('/rooms');
    return result;
  }

  async deleteBudgetItem(roomId: string, itemId: string): Promise<void> {
    await this.request<void>(`/rooms/${roomId}/budget/items/${itemId}`, {
      method: 'DELETE',
    });
    this.invalidateCache(`/rooms/${roomId}/budget`);
    this.invalidateCache('/rooms');
  }

  async getTasks(roomId: string): Promise<Task[]> {
    return this.request<Task[]>(`/rooms/${roomId}/tasks`);
  }

  async addTask(roomId: string, data: Partial<Task>): Promise<Task> {
    const result = await this.request<Task>(`/rooms/${roomId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.invalidateCache(`/rooms/${roomId}/tasks`);
    return result;
  }

  async updateTask(roomId: string, taskId: string, data: Partial<Task>): Promise<Task> {
    const result = await this.request<Task>(`/rooms/${roomId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    this.invalidateCache(`/rooms/${roomId}/tasks`);
    return result;
  }

  async getMaterials(roomId: string): Promise<Material[]> {
    return this.request<Material[]>(`/rooms/${roomId}/materials`);
  }

  async addMaterial(roomId: string, data: Partial<Material>): Promise<Material> {
    const result = await this.request<Material>(`/rooms/${roomId}/materials`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    this.invalidateCache(`/rooms/${roomId}/materials`);
    return result;
  }

  async updateMaterial(roomId: string, matId: string, data: Partial<Material>): Promise<Material> {
    const result = await this.request<Material>(`/rooms/${roomId}/materials/${matId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    this.invalidateCache(`/rooms/${roomId}/materials`);
    this.invalidateCache('/rooms');
    return result;
  }
}

export default new ApiService();
export type { Room, BudgetCategory, BudgetItem, Material, Task };
