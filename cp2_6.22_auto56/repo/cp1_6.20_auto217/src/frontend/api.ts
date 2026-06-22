import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export interface CareSchedule {
  wateringPeriods: number[];
  fertilizingPeriods: number[];
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  purchaseDate: string;
  avatar: string;
  createdAt: string;
  lastWateredAt: string | null;
  lastFertilizedAt: string | null;
  schedule: CareSchedule;
  daysToWater: number;
}

export type CareLogType = 'water' | 'fertilize' | 'repot' | 'light';

export interface CareLog {
  id: string;
  plantId: string;
  type: CareLogType;
  timestamp: string;
  note?: string;
}

export type Severity = 'low' | 'medium' | 'high';

export interface DiseaseRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RecognitionResult {
  id: string;
  plantId: string | null;
  disease: string;
  severity: Severity;
  severityLabel: string;
  recommendation: string;
  imageUrl: string;
  diseaseRegions: DiseaseRegion[];
  timestamp: string;
}

export interface StatsOverview {
  needWatering: number;
  recentDiseases: number;
  totalPlants: number;
}

const api = axios.create({
  baseURL: '/api',
  timeout: 10000
});

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling']
    });
  }
  return socket;
}

export const plantApi = {
  getAll: () => api.get<Plant[]>('/plants').then(r => r.data),
  get: (id: string) => api.get<Plant>(`/plants/${id}`).then(r => r.data),
  create: (data: Partial<Plant> & { name: string; species: string; purchaseDate: string }) =>
    api.post<Plant>('/plants', data).then(r => r.data),
  update: (id: string, data: Partial<Plant>) =>
    api.put<Plant>(`/plants/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete(`/plants/${id}`).then(r => r.data),
  getSchedule: (id: string) =>
    api.get<CareSchedule>(`/plants/${id}/schedule`).then(r => r.data),
  updateSchedule: (id: string, schedule: CareSchedule) =>
    api.put<CareSchedule>(`/plants/${id}/schedule`, schedule).then(r => r.data)
};

export const logApi = {
  getByPlant: (plantId: string) =>
    api.get<CareLog[]>(`/plants/${plantId}/logs`).then(r => r.data),
  add: (plantId: string, type: CareLogType, note?: string) =>
    api.post<CareLog>(`/plants/${plantId}/logs`, { type, note }).then(r => r.data)
};

export const recognitionApi = {
  recognize: (image: File, plantId?: string, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('image', image);
    if (plantId) {
      formData.append('plantId', plantId);
    }
    return api.post<RecognitionResult>('/recognize', formData, {
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      }
    }).then(r => r.data);
  },
  get: (id: string) =>
    api.get<RecognitionResult>(`/recognitions/${id}`).then(r => r.data),
  getByPlant: (plantId: string) =>
    api.get<RecognitionResult[]>(`/plants/${plantId}/recognitions`).then(r => r.data)
};

export const statsApi = {
  getOverview: () =>
    api.get<StatsOverview>('/stats/overview').then(r => r.data)
};

export default api;
