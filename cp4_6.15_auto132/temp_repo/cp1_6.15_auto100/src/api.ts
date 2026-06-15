export interface MenuItem {
  id: string;
  name: string;
  category: 'drink' | 'dessert' | 'light_meal';
  price: number;
  emoji: string;
  available: boolean;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  memberId: string;
  items: OrderItem[];
  totalPrice: number;
  pointsEarned: number;
  status: 'making' | 'completed';
  createdAt: string;
}

export interface Member {
  id: string;
  cardNumber: string;
  nickname: string;
  phone: string;
  points: number;
  createdAt: string;
}

export interface PointAdjustment {
  id: string;
  memberId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export async function fetchMenu(): Promise<MenuItem[]> {
  const res = await fetch('/api/menu');
  return res.json();
}

export async function createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
  const res = await fetch('/api/menu', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  return res.json();
}

export async function updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem> {
  const res = await fetch(`/api/menu/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(item) });
  return res.json();
}

export async function deleteMenuItem(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`/api/menu/${id}`, { method: 'DELETE' });
  return res.json();
}

export async function createOrder(memberId: string, items: OrderItem[], totalPrice: number): Promise<Order> {
  const res = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ memberId, items, totalPrice }) });
  return res.json();
}

export async function fetchOrders(status?: string): Promise<Order[]> {
  const url = status ? `/api/orders?status=${encodeURIComponent(status)}` : '/api/orders';
  const res = await fetch(url);
  return res.json();
}

export async function updateOrderStatus(id: string, status: string): Promise<Order> {
  const res = await fetch(`/api/orders/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
  return res.json();
}

export async function registerMember(nickname: string, phone: string): Promise<Member> {
  const res = await fetch('/api/members/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname, phone }) });
  return res.json();
}

export async function loginMember(phone: string): Promise<Member> {
  const res = await fetch('/api/members/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone }) });
  return res.json();
}

export async function getMember(id: string): Promise<Member & { orders: Order[] }> {
  const res = await fetch(`/api/members/${id}`);
  return res.json();
}

export async function adjustPoints(memberId: string, amount: number, reason: string): Promise<Member> {
  const res = await fetch(`/api/members/${memberId}/points`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount, reason }) });
  return res.json();
}

export async function adminLogin(password: string): Promise<{ success: boolean }> {
  const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
  return res.json();
}
