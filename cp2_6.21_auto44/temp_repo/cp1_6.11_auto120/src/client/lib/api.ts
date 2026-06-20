import axios from 'axios';
import * as T from '@shared/types';

const requestStartTimeMap = new Map<string, number>();

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.request.use(
  (config) => {
    const requestId = `${config.method}-${config.url}-${Date.now()}-${Math.random()}`;
    requestStartTimeMap.set(requestId, Date.now());
    (config as any)._requestId = requestId;

    try {
      const uiStore = (window as any).__uiStore;
      if (uiStore && typeof uiStore.beginRequest === 'function') {
        uiStore.beginRequest();
      }
    } catch {}

    if (!(window as any).__pendingReqCount) {
      (window as any).__pendingReqCount = 0;
    }
    (window as any).__pendingReqCount++;

    return config;
  },
  (error) => {
    try {
      const uiStore = (window as any).__uiStore;
      if (uiStore && typeof uiStore.endRequest === 'function') {
        uiStore.endRequest();
      }
    } catch {}

    if ((window as any).__pendingReqCount) {
      (window as any).__pendingReqCount = Math.max(0, (window as any).__pendingReqCount - 1);
    }

    try {
      const uiStore = (window as any).__uiStore;
      if (uiStore && typeof uiStore.pushToast === 'function') {
        uiStore.pushToast('操作失败，请重试', 'error');
      }
    } catch {}

    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    const config = response.config as any;
    const requestId = config._requestId;
    const startTime = requestStartTimeMap.get(requestId);
    if (startTime) {
      const duration = Date.now() - startTime;
      if (duration > 300) {
        (response.config as any)._slow = true;
      }
      requestStartTimeMap.delete(requestId);
    }

    try {
      const uiStore = (window as any).__uiStore;
      if (uiStore && typeof uiStore.endRequest === 'function') {
        uiStore.endRequest();
      }
    } catch {}

    if ((window as any).__pendingReqCount) {
      (window as any).__pendingReqCount = Math.max(0, (window as any).__pendingReqCount - 1);
    }

    return response;
  },
  (error) => {
    const config = error.config as any;
    if (config) {
      const requestId = config._requestId;
      if (requestId) {
        requestStartTimeMap.delete(requestId);
      }
    }

    try {
      const uiStore = (window as any).__uiStore;
      if (uiStore && typeof uiStore.endRequest === 'function') {
        uiStore.endRequest();
      }
    } catch {}

    if ((window as any).__pendingReqCount) {
      (window as any).__pendingReqCount = Math.max(0, (window as any).__pendingReqCount - 1);
    }

    try {
      const uiStore = (window as any).__uiStore;
      if (uiStore && typeof uiStore.pushToast === 'function') {
        uiStore.pushToast('操作失败，请重试', 'error');
      }
    } catch {}

    return Promise.reject(error);
  }
);

export const listDishes = (params?: { tag?: string; userId?: string; q?: string }): Promise<T.Dish[]> => {
  return api.get('/dishes', { params }).then((res) => res.data);
};

export const getDish = (id: string): Promise<T.Dish> => {
  return api.get(`/dishes/${id}`).then((res) => res.data);
};

export const createDish = (payload: Omit<T.Dish, 'id' | 'likes' | 'commentCount' | 'createdAt' | 'updatedAt'>): Promise<T.Dish> => {
  return api.post('/dishes', payload).then((res) => res.data);
};

export const updateDish = (id: string, payload: Partial<Omit<T.Dish, 'id'>>): Promise<T.Dish> => {
  return api.put(`/dishes/${id}`, payload).then((res) => res.data);
};

export const deleteDish = (id: string): Promise<{ success: boolean }> => {
  return api.delete(`/dishes/${id}`).then((res) => res.data);
};

export const listComments = (dishId: string, page: number = 1, size: number = 5): Promise<T.Paginated<T.Comment>> => {
  return api.get(`/dishes/${dishId}/comments`, { params: { page, size } }).then((res) => res.data);
};

export const createComment = (dishId: string, { username, text }: { username: string; text: string }): Promise<T.Comment> => {
  return api.post(`/dishes/${dishId}/comments`, { username, text }).then((res) => res.data);
};

export const likeComment = (dishId: string, cid: string): Promise<T.Comment> => {
  return api.post(`/dishes/${dishId}/comments/${cid}/like`).then((res) => res.data);
};

export const listTags = (): Promise<{ tag: string; count: number }[]> => {
  return api.get('/tags').then((res) => res.data);
};
