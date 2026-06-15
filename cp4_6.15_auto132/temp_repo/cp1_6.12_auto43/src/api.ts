import type {
  InventoryItem,
  AddItemRequest,
  UpdateItemRequest,
  StockReport,
} from './types';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(errorData.error || `请求失败: ${response.status}`);
  }
  return response.json();
}

export async function fetchItems(): Promise<InventoryItem[]> {
  const response = await fetch(`${API_BASE}/items`);
  return handleResponse<InventoryItem[]>(response);
}

export async function addItem(data: AddItemRequest): Promise<InventoryItem> {
  const response = await fetch(`${API_BASE}/items`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<InventoryItem>(response);
}

export async function updateItem(
  id: string,
  data: UpdateItemRequest
): Promise<InventoryItem> {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  return handleResponse<InventoryItem>(response);
}

export async function deleteItem(id: string): Promise<{ success: boolean }> {
  const response = await fetch(`${API_BASE}/items/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<{ success: boolean }>(response);
}

export async function getReport(): Promise<StockReport> {
  const response = await fetch(`${API_BASE}/report`);
  return handleResponse<StockReport>(response);
}
