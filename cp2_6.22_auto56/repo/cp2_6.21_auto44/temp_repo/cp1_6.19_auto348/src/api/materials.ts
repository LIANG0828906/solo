import axios from 'axios';
import type { MaterialsResponse, ImagesResponse } from '@/types';
import type { ThemeKey } from '@/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
});

export async function fetchMaterials(
  keyword: string,
  themes: ThemeKey[],
  limit = 20,
  offset = 0,
): Promise<MaterialsResponse> {
  const res = await api.get<MaterialsResponse>('/materials', {
    params: {
      keyword,
      theme: themes.join(','),
      limit,
      offset,
    },
  });
  return res.data;
}

export async function fetchImages(keyword: string, limit = 12): Promise<ImagesResponse> {
  const res = await api.get<ImagesResponse>('/materials/images', {
    params: { keyword, limit },
  });
  return res.data;
}
