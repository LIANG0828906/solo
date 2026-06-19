import axios from 'axios';
import { Plot, Order, Contribution, User, Animal, Building } from '../stores/useGameStore';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const gameApi = {
  async register(username: string): Promise<User> {
    try {
      const { data } = await api.post('/user/register', { username });
      return data;
    } catch {
      return { id: 'mock-user', username, coins: 500, inventory: {} };
    }
  },

  async login(username: string): Promise<User> {
    try {
      const { data } = await api.post('/user/login', { username });
      return data;
    } catch {
      return { id: 'mock-user', username, coins: 500, inventory: {} };
    }
  },

  async getPlots(): Promise<Plot[]> {
    try {
      const { data } = await api.get('/plots');
      return data;
    } catch {
      return [];
    }
  },

  async plantCrop(plotId: string, cropId: string): Promise<Plot> {
    try {
      const { data } = await api.post(`/plots/${plotId}/plant`, { cropId });
      return data;
    } catch {
      return {} as Plot;
    }
  },

  async harvestCrop(plotId: string): Promise<{ reward: number; cropId: string }> {
    try {
      const { data } = await api.post(`/plots/${plotId}/harvest`);
      return data;
    } catch {
      return { reward: 0, cropId: '' };
    }
  },

  async buildStructure(buildingTypeId: string, x: number, y: number): Promise<Building> {
    try {
      const { data } = await api.post('/plots/build', { buildingTypeId, x, y });
      return data;
    } catch {
      return {} as Building;
    }
  },

  async feedAnimals(buildingId: string): Promise<Animal[]> {
    try {
      const { data } = await api.post('/animals/feed', { buildingId });
      return data;
    } catch {
      return [];
    }
  },

  async collectProduct(buildingId: string): Promise<{ product: string; amount: number }> {
    try {
      const { data } = await api.post('/animals/collect', { buildingId });
      return data;
    } catch {
      return { product: '', amount: 0 };
    }
  },

  async getOrders(): Promise<Order[]> {
    try {
      const { data } = await api.get('/orders');
      return data;
    } catch {
      return [];
    }
  },

  async submitOrder(orderId: string, amount: number): Promise<Order> {
    try {
      const { data } = await api.post(`/orders/${orderId}/submit`, { amount });
      return data;
    } catch {
      return {} as Order;
    }
  },

  async getAnimals(): Promise<Animal[]> {
    try {
      const { data } = await api.get('/animals');
      return data;
    } catch {
      return [];
    }
  },

  async getContributions(): Promise<Contribution[]> {
    try {
      const { data } = await api.get('/coop/contributions');
      return data;
    } catch {
      return [];
    }
  },
};
