import type {
  ApiResponse,
  CreateDrinkRequest,
  CreateIngredientRequest,
  CreateSaleRequest,
  Drink,
  Ingredient,
  ReportData,
  Sale,
  TodaySalesSummary,
} from '@shared/types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    });
    const result: ApiResponse<T> = await response.json();
    if (!result.success) {
      throw new Error(result.error || '请求失败');
    }
    return result.data as T;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('网络请求失败');
  }
}

export const api = {
  drinks: {
    getAll: (): Promise<Drink[]> => request<Drink[]>('/api/drinks'),
    getById: (id: string): Promise<Drink> => request<Drink>(`/api/drinks/${id}`),
    create: (data: CreateDrinkRequest): Promise<Drink> =>
      request<Drink>('/api/drinks', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CreateDrinkRequest>): Promise<Drink> =>
      request<Drink>(`/api/drinks/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<null> =>
      request<null>(`/api/drinks/${id}`, { method: 'DELETE' }),
  },

  ingredients: {
    getAll: (): Promise<Ingredient[]> => request<Ingredient[]>('/api/ingredients'),
    getById: (id: string): Promise<Ingredient> => request<Ingredient>(`/api/ingredients/${id}`),
    create: (data: CreateIngredientRequest): Promise<Ingredient> =>
      request<Ingredient>('/api/ingredients', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<CreateIngredientRequest>): Promise<Ingredient> =>
      request<Ingredient>(`/api/ingredients/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string): Promise<null> =>
      request<null>(`/api/ingredients/${id}`, { method: 'DELETE' }),
  },

  sales: {
    getAll: (): Promise<Sale[]> => request<Sale[]>('/api/sales'),
    getTodaySummary: (): Promise<TodaySalesSummary> => request<TodaySalesSummary>('/api/sales/today'),
    get30DaysReport: (): Promise<ReportData> => request<ReportData>('/api/sales/report/30days'),
    create: (data: CreateSaleRequest): Promise<Sale> =>
      request<Sale>('/api/sales', { method: 'POST', body: JSON.stringify(data) }),
  },
};
