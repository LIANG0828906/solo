const BASE = '/api';

export async function registerUser(data: { nickname: string; password: string }) {
  const res = await fetch(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '注册失败');
  }
  return res.json();
}

export async function loginUser(data: { nickname: string; password: string }) {
  const res = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '登录失败');
  }
  return res.json();
}

export async function getUserById(id: string) {
  const res = await fetch(`${BASE}/users/${id}`);
  if (!res.ok) throw new Error('获取用户失败');
  return res.json();
}

export async function getItems() {
  const res = await fetch(`${BASE}/items`);
  if (!res.ok) throw new Error('获取物品列表失败');
  return res.json();
}

export async function getItemById(id: string) {
  const res = await fetch(`${BASE}/items/${id}`);
  if (!res.ok) throw new Error('获取物品详情失败');
  return res.json();
}

export async function createItem(data: {
  user_id: string;
  title: string;
  description: string;
  category: string;
  image?: string;
}) {
  const res = await fetch(`${BASE}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '发布物品失败');
  }
  return res.json();
}

export async function createExchangeRequest(data: {
  item_id: string;
  requester_id: string;
  message: string;
}) {
  const res = await fetch(`${BASE}/exchange-requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '提交交换请求失败');
  }
  return res.json();
}

export async function getExchangeRequestsByOwner(userId: string) {
  const res = await fetch(`${BASE}/exchange-requests/owner/${userId}`);
  if (!res.ok) throw new Error('获取交换请求失败');
  return res.json();
}

export async function getExchangeRequestsByRequester(userId: string) {
  const res = await fetch(`${BASE}/exchange-requests/requester/${userId}`);
  if (!res.ok) throw new Error('获取交换请求失败');
  return res.json();
}

export async function updateExchangeRequest(id: string, status: 'accepted' | 'rejected') {
  const res = await fetch(`${BASE}/exchange-requests/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || '更新请求失败');
  }
  return res.json();
}

export async function getItemsByUserId(userId: string) {
  const res = await fetch(`${BASE}/items/user/${userId}`);
  if (!res.ok) throw new Error('获取用户物品失败');
  return res.json();
}
