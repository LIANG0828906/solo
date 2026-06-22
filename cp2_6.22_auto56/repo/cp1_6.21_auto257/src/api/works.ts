import axios from 'axios';
import type {
  Work,
  ApiResponse,
  GenerateShareRequest,
  GenerateShareResponse,
  UploadImageResponse,
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    console.error('[works api] error:', err?.message || err);
    return Promise.reject(err);
  },
);

function unwrap<T>(res: { data: ApiResponse<T> }): T {
  if (!res.data) throw new Error('响应数据为空');
  if (res.data.code !== 0) {
    throw new Error(res.data.message || '请求失败');
  }
  return res.data.data as T;
}

export async function listWorks(keyword = ''): Promise<Work[]> {
  const params: Record<string, string> = {};
  if (keyword) params.keyword = keyword;
  const res = await api.get<unknown, { data: ApiResponse<Work[]> }>('/works', { params });
  return unwrap(res);
}

export async function getWork(id: string): Promise<Work> {
  const res = await api.get<unknown, { data: ApiResponse<Work> }>(`/works/${id}`);
  return unwrap(res);
}

export async function createWork(partial?: Partial<Work>): Promise<Work> {
  const res = await api.post<unknown, { data: ApiResponse<Work> }>('/works', partial || {});
  return unwrap(res);
}

export async function updateWork(id: string, updates: Partial<Work>): Promise<Work> {
  const res = await api.put<unknown, { data: ApiResponse<Work> }>(`/works/${id}`, updates);
  return unwrap(res);
}

export async function deleteWork(id: string): Promise<{ success: boolean }> {
  const res = await api.delete<unknown, { data: ApiResponse<{ success: boolean }> }>(`/works/${id}`);
  return unwrap(res);
}

export async function uploadImage(file: File): Promise<UploadImageResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await api.post<unknown, { data: ApiResponse<UploadImageResponse> }>(
    '/upload',
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
    },
  );
  return unwrap(res);
}

export async function generateShareCard(
  payload: GenerateShareRequest,
): Promise<GenerateShareResponse> {
  const res = await api.post<unknown, { data: ApiResponse<GenerateShareResponse> }>(
    '/generate-share',
    payload,
  );
  return unwrap(res);
}

export const worksApi = {
  list: listWorks,
  get: getWork,
  create: createWork,
  update: updateWork,
  delete: deleteWork,
  uploadImage,
  generateShareCard,
};

export default worksApi;
