import axios from 'axios';

export interface ColorPalette {
  id: string;
  colors: string[];
  name?: string;
  createdAt: number;
  imageUrl?: string;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

export const uploadImage = async (file: File): Promise<{ success: boolean; imageUrl?: string; error?: string }> => {
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    return { success: false, error: '上传失败' };
  }
};

export const savePalette = async (colors: string[], name?: string, imageUrl?: string): Promise<ApiResponse<ColorPalette>> => {
  try {
    const response = await api.post('/palettes', { colors, name, imageUrl });
    return response.data;
  } catch (error) {
    return { success: false, error: '保存失败' };
  }
};

export const getPalettes = async (): Promise<ApiResponse<ColorPalette[]>> => {
  try {
    const response = await api.get('/palettes');
    return response.data;
  } catch (error) {
    return { success: false, error: '获取失败' };
  }
};

export const deletePalette = async (id: string): Promise<ApiResponse<void>> => {
  try {
    const response = await api.delete(`/palettes/${id}`);
    return response.data;
  } catch (error) {
    return { success: false, error: '删除失败' };
  }
};
