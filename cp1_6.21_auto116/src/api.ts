import axios from 'axios';
import type { MaterialMeta, SearchParams, SearchResult } from './types';

const api = axios.create({
  baseURL: '/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'
  }
});

export async function getMetadataList(params?: SearchParams): Promise<SearchResult> {
  const response = await api.get('/metadata', { params });
  return response.data;
}

export async function addMetadata(data: Omit<MaterialMeta, 'id' | 'createTime'>): Promise<MaterialMeta> {
  const response = await api.post('/metadata', data);
  return response.data;
}

export async function deleteMetadata(id: string): Promise<{ success: boolean }> {
  const response = await api.delete(`/metadata/${id}`);
  return response.data;
}

export async function getFieldUniqueValues(fieldName: string): Promise<string[]> {
  const response = await api.get(`/metadata/fields/${fieldName}`);
  return response.data;
}

export async function searchMetadata(params: SearchParams): Promise<SearchResult> {
  return getMetadataList(params);
}
