import client from './client';

export interface Wood {
  id: string;
  name: string;
  origin: string;
  grade: WoodGrade;
  stock_count: number;
  standard_size: string;
  unit_price: number;
  stock_date: string;
  created_at: string;
}

export type WoodGrade = '特级' | '一级' | '二级' | '三级';

export const gradeColors: Record<WoodGrade, string> = {
  '特级': '#9C27B0',
  '一级': '#D4AF37',
  '二级': '#B0B0B0',
  '三级': '#CD7F32'
};

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export const getWood = async (): Promise<Wood[]> => {
  const response = await client.get<any, ApiResponse<Wood[]>>('/wood');
  return response.data;
};

export const getLowStockWood = async (): Promise<Wood[]> => {
  const response = await client.get<any, ApiResponse<Wood[]>>('/wood/low-stock');
  return response.data;
};

export const getWoodById = async (id: string): Promise<Wood> => {
  const response = await client.get<any, ApiResponse<Wood>>(`/wood/${id}`);
  return response.data;
};

export const addWood = async (wood: Omit<Wood, 'id' | 'created_at'>): Promise<Wood> => {
  const response = await client.post<any, ApiResponse<Wood>>('/wood', wood);
  return response.data;
};

export const updateWood = async (id: string, wood: Partial<Wood>): Promise<Wood> => {
  const response = await client.patch<any, ApiResponse<Wood>>(`/wood/${id}`, wood);
  return response.data;
};

export const deleteWood = async (id: string): Promise<void> => {
  await client.delete(`/wood/${id}`);
};
