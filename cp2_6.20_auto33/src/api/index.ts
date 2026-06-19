import axios from 'axios';
import type {
  BreedInfo, FoodItem, GiftItem, Pet, CreatePetData,
  FoodType, GiftType, ActionResponse, LevelUpResult, GiftResponse
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export const petApi = {
  async getBreeds(): Promise<{ cats: BreedInfo[]; dogs: BreedInfo[] }> {
    const res = await api.get('/pets/breeds');
    return res.data;
  },

  async getFoods(): Promise<FoodItem[]> {
    const res = await api.get('/pets/foods');
    return res.data;
  },

  async getGifts(): Promise<GiftItem[]> {
    const res = await api.get('/pets/gifts');
    return res.data;
  },

  async createPet(data: CreatePetData): Promise<Pet> {
    const res = await api.post('/pets/create', data);
    return res.data;
  },

  async getPet(id: string): Promise<Pet> {
    const res = await api.get(`/pets/${id}`);
    return res.data;
  },

  async feedPet(id: string, foodType: FoodType): Promise<ActionResponse> {
    const res = await api.put(`/pets/${id}/feed`, { foodType });
    return res.data;
  },

  async playPet(id: string): Promise<ActionResponse> {
    const res = await api.put(`/pets/${id}/play`);
    return res.data;
  },

  async cleanPet(id: string): Promise<ActionResponse> {
    const res = await api.put(`/pets/${id}/clean`);
    return res.data;
  },

  async restPet(id: string): Promise<ActionResponse> {
    const res = await api.put(`/pets/${id}/rest`);
    return res.data;
  },
};

export const expApi = {
  async checkLevelUp(currentLevel: number, currentExp: number, gain: number): Promise<LevelUpResult> {
    const res = await api.get('/exp/levelup', {
      params: { currentLevel, currentExp, gain }
    });
    return res.data;
  }
};

export const socialApi = {
  async getSquarePets(): Promise<Pet[]> {
    const res = await api.get('/social/pets');
    return res.data;
  },

  async sendGift(fromPetId: string, toPetId: string, giftType: GiftType): Promise<GiftResponse> {
    const res = await api.post('/social/gift', { fromPetId, toPetId, giftType });
    return res.data;
  }
};
