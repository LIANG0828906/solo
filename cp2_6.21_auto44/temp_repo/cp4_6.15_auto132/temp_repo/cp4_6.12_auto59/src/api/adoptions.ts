import client from './client';
import type { AdoptionApplication } from '@/types';

export const getAdoptions = (): Promise<AdoptionApplication[]> => {
  return client.get('/adoptions').then((res) => res.data);
};

export interface CreateAdoptionData {
  animalId: string;
  applicantName: string;
  phone: string;
  housingType: 'own' | 'rental';
  hasPetExperience: boolean;
  reason: string;
}

export const createAdoption = (
  data: CreateAdoptionData
): Promise<AdoptionApplication> => {
  return client.post('/adoptions', data).then((res) => res.data);
};

export interface UpdateAdoptionData {
  status?: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
}

export const updateAdoption = (
  id: string,
  data: UpdateAdoptionData
): Promise<AdoptionApplication> => {
  return client.put(`/adoptions/${id}`, data).then((res) => res.data);
};
