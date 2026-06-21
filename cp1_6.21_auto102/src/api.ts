import axios from 'axios';

export interface FlavorProfile {
  acidity: number;
  sweetness: number;
  bitterness: number;
  body: number;
  aroma: number;
}

export interface CoffeeBean {
  id: string;
  name: string;
  origin: string;
  roastLevel: 'light' | 'medium' | 'dark';
  altitude?: string;
  process?: string;
  flavorNotes: string[];
  flavorProfile: FlavorProfile;
  description: string;
}

export interface BrewRecord {
  id: string;
  beanId: string;
  date: string;
  waterTemp: number;
  grindSize: string;
  pourMethod: string;
  tasteNotes: string;
  rating: number;
}

const api = axios.create({
  baseURL: '/api',
});

export let loadingCount = 0;
export const loadingListeners: Array<(loading: boolean) => void> = [];

function notifyLoading(loading: boolean) {
  loadingListeners.forEach((listener) => listener(loading));
}

api.interceptors.request.use(
  (config) => {
    loadingCount++;
    if (loadingCount === 1) {
      notifyLoading(true);
    }
    return config;
  },
  (error) => {
    loadingCount--;
    if (loadingCount === 0) {
      notifyLoading(false);
    }
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    loadingCount--;
    if (loadingCount === 0) {
      notifyLoading(false);
    }
    return response;
  },
  (error) => {
    loadingCount--;
    if (loadingCount === 0) {
      notifyLoading(false);
    }
    return Promise.reject(error);
  }
);

export function addLoadingListener(listener: (loading: boolean) => void) {
  loadingListeners.push(listener);
  return () => {
    const index = loadingListeners.indexOf(listener);
    if (index > -1) {
      loadingListeners.splice(index, 1);
    }
  };
}

export async function getBeans(): Promise<CoffeeBean[]> {
  const response = await api.get<CoffeeBean[]>('/beans');
  return response.data;
}

export async function getBean(id: string): Promise<CoffeeBean> {
  const response = await api.get<CoffeeBean>(`/beans/${id}`);
  return response.data;
}

export async function createBean(bean: Omit<CoffeeBean, 'id'>): Promise<CoffeeBean> {
  const response = await api.post<CoffeeBean>('/beans', bean);
  return response.data;
}

export async function getBrews(beanId: string): Promise<BrewRecord[]> {
  const response = await api.get<BrewRecord[]>(`/beans/${beanId}/brews`);
  return response.data;
}

export async function createBrew(
  beanId: string,
  brew: Omit<BrewRecord, 'id' | 'beanId'>
): Promise<BrewRecord> {
  const response = await api.post<BrewRecord>(`/beans/${beanId}/brews`, brew);
  return response.data;
}

export async function getOrigins(): Promise<string[]> {
  const response = await api.get<string[]>('/origins');
  return response.data;
}
