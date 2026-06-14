export interface Participant {
  id: string;
  name: string;
  color: string;
  paid: boolean;
}

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  sharedBy: string[];
  isSharedByAll: boolean;
  emoji: string;
}

export interface Order {
  id: string;
  name: string;
  maxAmount?: number;
  participants: Participant[];
  items: OrderItem[];
  createdAt: string;
}

export interface SplitDetail {
  itemId: string;
  itemName: string;
  amount: number;
  emoji: string;
}

export interface ParticipantSplit {
  participantId: string;
  participantName: string;
  participantColor: string;
  total: number;
  details: SplitDetail[];
  paid: boolean;
}

export interface SplitResult {
  orderId: string;
  totalAmount: number;
  splits: ParticipantSplit[];
}

const BASE = '/api/orders';

export async function createOrder(
  name: string,
  maxAmount?: number,
  participantName?: string
): Promise<{ order: Order; currentParticipantId: string }> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, maxAmount, participantName }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function getOrder(id: string): Promise<Order> {
  const res = await fetch(`${BASE}/${id}`);
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function joinOrder(
  orderId: string,
  name: string
): Promise<{ participant: Participant; currentParticipantId: string }> {
  const res = await fetch(`${BASE}/${orderId}/participants`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function addItem(
  orderId: string,
  item: Partial<OrderItem>
): Promise<OrderItem> {
  const res = await fetch(`${BASE}/${orderId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(item),
  });
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function removeItem(
  orderId: string,
  itemId: string
): Promise<void> {
  const res = await fetch(`${BASE}/${orderId}/items/${itemId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error((await res.json()).error);
}

export async function togglePayment(
  orderId: string,
  participantId: string,
  paid?: boolean
): Promise<Participant> {
  const res = await fetch(
    `${BASE}/${orderId}/participants/${participantId}/payment`,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paid }),
    }
  );
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export async function getSplitResult(orderId: string): Promise<SplitResult> {
  const res = await fetch(`${BASE}/${orderId}/split`);
  if (!res.ok) throw new Error((await res.json()).error);
  return res.json();
}

export function createWebSocket(orderId: string): WebSocket {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsUrl = `${protocol}//${window.location.host}/ws`;
  const ws = new WebSocket(wsUrl);
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'join', orderId }));
  };
  return ws;
}
