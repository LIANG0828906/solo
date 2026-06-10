import type {
  Order,
  ToolType,
  ValidateRestorationRequest,
  ValidateRestorationResponse,
  CompleteRestorationRequest,
  CompleteRestorationResponse,
  TenDayReport,
} from '@/types';

const BASE_URL = 'http://localhost:8000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export async function getDailyOrders(): Promise<Order[]> {
  return request<Order[]>('/api/orders/daily');
}

export async function getCurrentOrder(): Promise<Order | null> {
  return request<Order | null>('/api/orders/current');
}

export async function getNextOrder(): Promise<Order | null> {
  return request<Order | null>('/api/orders/next');
}

export async function validateRestoration(
  orderId: string,
  tools: ToolType[],
): Promise<ValidateRestorationResponse> {
  const body: ValidateRestorationRequest = { orderId, tools };
  return request<ValidateRestorationResponse>('/api/restoration/validate', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function completeRestoration(
  orderId: string,
  tools: ToolType[],
  timeRemaining: number,
): Promise<CompleteRestorationResponse> {
  const body: CompleteRestorationRequest = { orderId, tools, timeRemaining };
  return request<CompleteRestorationResponse>('/api/restoration/complete', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function failRestoration(
  orderId: string,
  tools: ToolType[],
  eventType: string,
): Promise<{ success: boolean; message: string }> {
  return request<{ success: boolean; message: string }>('/api/restoration/fail', {
    method: 'POST',
    body: JSON.stringify({ orderId, tools, eventType }),
  });
}

export async function getRandomPoem(): Promise<{ poem: string }> {
  return request<{ poem: string }>('/api/poem/random');
}

export async function getTenDayReport(): Promise<TenDayReport> {
  return request<TenDayReport>('/api/report/ten-day');
}

export async function getStatsSummary(): Promise<{
  totalOrders: number;
  completedOrders: number;
  successRate: number;
  totalCoins: number;
  currentDay: number;
  currentPeriod: number;
}> {
  return request<{
    totalOrders: number;
    completedOrders: number;
    successRate: number;
    totalCoins: number;
    currentDay: number;
    currentPeriod: number;
  }>('/api/stats/summary');
}

export async function getRandomEvent(): Promise<{
  type: string;
  name: string;
  description: string;
  penalty: number;
} | null> {
  return request<{
    type: string;
    name: string;
    description: string;
    penalty: number;
  } | null>('/api/event/random');
}
