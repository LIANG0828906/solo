import type {
  Pet,
  MedicationPlan,
  MedicationLog,
  PetDetailResponse,
  StatsResponse,
} from './types';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const api = {
  getPets: () => request<Pet[]>('/api/pets'),

  getPetDetail: (id: string) =>
    request<PetDetailResponse>(`/api/pets/${id}`),

  createPet: (pet: Omit<Pet, 'id'>) =>
    request<Pet>('/api/pets', {
      method: 'POST',
      body: JSON.stringify(pet),
    }),

  updatePet: (id: string, pet: Partial<Pet>) =>
    request<Pet>(`/api/pets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pet),
    }),

  deletePet: (id: string) =>
    request<{ success: boolean }>(`/api/pets/${id}`, {
      method: 'DELETE',
    }),

  createPlan: (plan: Omit<MedicationPlan, 'id'>) =>
    request<MedicationPlan>('/api/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    }),

  updatePlan: (id: string, plan: Partial<MedicationPlan>) =>
    request<MedicationPlan>(`/api/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(plan),
    }),

  deletePlan: (id: string) =>
    request<{ success: boolean }>(`/api/plans/${id}`, {
      method: 'DELETE',
    }),

  recordMedication: (logId: string, status: 'completed' | 'skipped') =>
    request<MedicationLog>('/api/medication', {
      method: 'POST',
      body: JSON.stringify({ logId, status }),
    }),

  getStats: (id: string) =>
    request<StatsResponse>(`/api/stats/${id}`),
};
