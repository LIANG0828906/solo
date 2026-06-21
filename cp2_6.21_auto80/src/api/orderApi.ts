import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export type ChocolateItem = {
  id: string;
  flavorId: string;
  shape: 'circle' | 'square' | 'heart' | 'shell';
  color: string;
  texture: 'matte' | 'glossy' | 'crushed-nuts' | 'gold-foil';
};

export type GiftBoxConfig = {
  boxShape: 'square' | 'heart' | 'drawer';
  ribbonColor: string;
  cardText: string;
  cardFont: string;
  cardColor: string;
};

export type OrderPayload = {
  chocolates: ChocolateItem[];
  giftBox: GiftBoxConfig;
};

export type OrderResponse = {
  orderId: string;
  status: string;
  createdAt: string;
};

export async function submitOrderApi(payload: OrderPayload): Promise<OrderResponse> {
  const response = await api.post<OrderResponse>('/orders', payload);
  return response.data;
}

export async function fetchOrderHistoryApi(): Promise<OrderResponse[]> {
  const response = await api.get<OrderResponse[]>('/orders');
  return response.data;
}
