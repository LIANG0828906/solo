import axios from 'axios';
import type { MealGrid } from '../types';

const BASE = '/api';

export interface HistoryPlan {
  id: string;
  weekStart: string;
  meals: MealGrid;
}

export const historyApi = {
  getAll: () => axios.get<HistoryPlan[]>(`${BASE}/history`).then((r) => r.data),
  save: (data: { weekStart: string; meals: MealGrid }) =>
    axios.post<HistoryPlan>(`${BASE}/history`, data).then((r) => r.data),
};
