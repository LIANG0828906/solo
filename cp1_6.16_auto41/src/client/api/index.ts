import type {
  Pet,
  PetStats,
  InteractionType,
  ItemType,
  InventoryItem,
  FriendInfo,
  CheckInStatus,
} from '../types';

const API_BASE = '/api';

const getHeaders = (userId: string): HeadersInit => ({
  'Content-Type': 'application/json',
  'x-user-id': userId,
});

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

const request = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  const data: ApiResponse<T> = await response.json();

  if (!data.success || !response.ok) {
    throw new Error(data.error || data.message || '请求失败');
  }

  return data.data as T;
};

export const petApi = {
  create: (name: string, color: string, userId: string) =>
    request<{ pet: Pet; userId: string }>('/pet/create', {
      method: 'POST',
      body: JSON.stringify({ name, color, userId }),
    }),

  getState: (userId: string) =>
    request<Pet>('/pet/state', {
      headers: getHeaders(userId),
    }),

  interact: (userId: string, type: InteractionType) =>
    request<{ stats: PetStats; isSick: boolean }>('/pet/interact', {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ type }),
    }),

  useItem: (userId: string, itemType: ItemType) =>
    request<{ stats: PetStats; isSick: boolean }>(`/items/${itemType}/use`, {
      method: 'POST',
      headers: getHeaders(userId),
    }),
};

export const friendApi = {
  getFriends: (userId: string) =>
    request<FriendInfo[]>('/friends', {
      headers: getHeaders(userId),
    }),

  search: (id: string) =>
    request<{ id: string; petName: string; petColor: string }>('/friends/search', {
      method: 'POST',
      body: JSON.stringify({ id }),
    }),

  sendRequest: (userId: string, toId: string) =>
    request<{ success: boolean; message: string }>('/friends/request', {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ toId }),
    }),

  acceptRequest: (userId: string, friendId: string) =>
    request<{ success: boolean; message: string }>('/friends/accept', {
      method: 'POST',
      headers: getHeaders(userId),
      body: JSON.stringify({ friendId }),
    }),

  getRequests: (userId: string) =>
    request<Array<{ id: string; petName: string; petColor: string }>>('/friends/requests', {
      headers: getHeaders(userId),
    }),

  getFriendDetail: (userId: string, friendId: string) =>
    request<FriendInfo>(`/friends/${friendId}`, {
      headers: getHeaders(userId),
    }),

  helpFriend: (userId: string, friendId: string, type: InteractionType) =>
    request<{ friendPetStats: PetStats; friendliness: number }>(
      `/friends/${friendId}/help`,
      {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify({ type }),
      }
    ),
};

export const checkInApi = {
  getStatus: (userId: string) =>
    request<CheckInStatus>('/checkin/status', {
      headers: getHeaders(userId),
    }),

  checkIn: (userId: string) =>
    request<{ success: boolean; streak: number; reward: ItemType; rewardName: string }>('/checkin', {
      method: 'POST',
      headers: getHeaders(userId),
    }),
};

export const backpackApi = {
  getItems: (userId: string) =>
    request<InventoryItem[]>('/backpack', {
      headers: getHeaders(userId),
    }),
};

export const userApi = {
  getInfo: (userId: string) =>
    request<{
      userId: string;
      pet: Pet;
      friendliness: number;
      checkInStreak: number;
      backpack: InventoryItem[];
    }>('/user/info', {
      headers: getHeaders(userId),
    }),
};
