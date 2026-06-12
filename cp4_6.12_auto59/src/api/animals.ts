import client from './client';
import type { Animal, HealthRecord } from '@/types';

export interface GetAnimalsParams {
  status?: string;
  page?: number;
  limit?: number;
}

export const getAnimals = (params?: GetAnimalsParams): Promise<Animal[]> => {
  return client.get('/animals', { params }).then((res) => res.data);
};

export const getAnimal = (id: string): Promise<Animal> => {
  return client.get(`/animals/${id}`).then((res) => res.data);
};

export interface CreateAnimalData {
  name: string;
  breed: string;
  age: number;
  gender: 'male' | 'female';
  color: string;
  photoUrl: string;
  personality: string;
  status: 'available' | 'reserved' | 'adopted';
}

export const createAnimal = (data: CreateAnimalData): Promise<Animal> => {
  return client.post('/animals', data).then((res) => res.data);
};

export type UpdateAnimalData = Partial<CreateAnimalData>;

export const updateAnimal = (id: string, data: UpdateAnimalData): Promise<Animal> => {
  return client.put(`/animals/${id}`, data).then((res) => res.data);
};

export const deleteAnimal = (id: string): Promise<void> => {
  return client.delete(`/animals/${id}`).then((res) => res.data);
};

export interface AddHealthRecordData {
  type: 'vaccine' | 'deworming' | 'checkup' | 'treatment';
  date: string;
  notes: string;
  weight: number;
}

export const addHealthRecord = (
  animalId: string,
  data: AddHealthRecordData
): Promise<HealthRecord> => {
  return client
    .post(`/animals/${animalId}/health-records`, data)
    .then((res) => res.data);
};
