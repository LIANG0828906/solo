import type { Animal, AnimalDetail, FeedingRecord, HealthRecord } from '../types';

const BASE_URL = '/api/animals';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }
  return response.json();
}

export const animalApi = {
  async getAnimals(limit = 500, offset = 0): Promise<{ data: Animal[]; total: number }> {
    const response = await fetch(`${BASE_URL}?limit=${limit}&offset=${offset}`);
    return handleResponse(response);
  },

  async getAnimalDetail(id: string): Promise<AnimalDetail> {
    const response = await fetch(`${BASE_URL}/${id}`);
    return handleResponse(response);
  },

  async createAnimal(data: Omit<Animal, 'id' | 'healthStatus'>): Promise<Animal> {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async updateAnimal(id: string, data: Partial<Animal>): Promise<Animal> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async deleteAnimal(id: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/${id}`, {
      method: 'DELETE'
    });
    await handleResponse(response);
  },

  async getFeedingRecords(animalId: string): Promise<FeedingRecord[]> {
    const response = await fetch(`${BASE_URL}/${animalId}/feeding`);
    return handleResponse(response);
  },

  async createFeedingRecord(
    animalId: string,
    data: Omit<FeedingRecord, 'id' | 'animalId' | 'date' | 'time'>
  ): Promise<FeedingRecord> {
    const response = await fetch(`${BASE_URL}/${animalId}/feeding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async updateFeedingRecord(
    animalId: string,
    recordId: string,
    data: Partial<FeedingRecord>
  ): Promise<FeedingRecord> {
    const response = await fetch(`${BASE_URL}/${animalId}/feeding/${recordId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  },

  async deleteFeedingRecord(animalId: string, recordId: string): Promise<void> {
    const response = await fetch(`${BASE_URL}/${animalId}/feeding/${recordId}`, {
      method: 'DELETE'
    });
    await handleResponse(response);
  },

  async getTodayFeeding(): Promise<{
    records: (FeedingRecord & { animalName?: string; species?: string })[];
    unfedAnimals: Animal[];
  }> {
    const response = await fetch(`${BASE_URL}/feeding/today`);
    return handleResponse(response);
  },

  async createHealthRecord(
    animalId: string,
    data: Omit<HealthRecord, 'id' | 'animalId'>
  ): Promise<{
    record: HealthRecord;
    notification: { subject: string; body: string };
  }> {
    const response = await fetch(`${BASE_URL}/${animalId}/health`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(response);
  }
};
