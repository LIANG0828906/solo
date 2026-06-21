import axios from 'axios';
import type { Order, OrderStatus } from '@/types';

const BASE_URL = '/api/orders';

export interface CreateOrderPayload {
  inspectionId: string;
  deviceId: string;
  deviceName: string;
  description: string;
  creatorId: string;
}

export interface UpdateOrderPayload {
  status?: OrderStatus;
  assigneeId?: string;
  assigneeName?: string;
}

export const orderAPI = {
  async list(params?: { status?: OrderStatus; assigneeId?: string }): Promise<
    Order[]
  > {
    const res = await axios.get(BASE_URL, { params });
    return res.data;
  },

  async get(id: string): Promise<Order> {
    const res = await axios.get(`${BASE_URL}/${id}`);
    return res.data;
  },

  async create(payload: CreateOrderPayload): Promise<Order> {
    const res = await axios.post(BASE_URL, payload);
    return res.data;
  },

  async update(id: string, payload: UpdateOrderPayload): Promise<Order> {
    const res = await axios.put(`${BASE_URL}/${id}`, payload);
    return res.data;
  },
};
