import axios, { AxiosError } from 'axios';
import type { Resource } from '../../context/ResourceContext';

export interface FetchResult {
  url: string;
  domain: string;
  favicon: string;
  title: string;
  description: string;
  summary: string;
  tags: string[];
  screenshotUrl?: string;
}

interface ApiResp<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
  timestamp?: number;
}

const http = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

http.interceptors.response.use(
  (r) => r,
  (err: AxiosError) => {
    if (err.code === 'ERR_CANCELED') throw err;
    const data = (err.response?.data as ApiResp<null> | undefined);
    const msg = data?.error?.message || err.message || '网络请求失败';
    return {
      data: {
        success: false,
        error: { code: data?.error?.code || 'NETWORK_ERROR', message: msg }
      }
    } as any;
  }
);

export async function fetchContent(url: string): Promise<{ ok: boolean; data?: FetchResult; error?: string }> {
  try {
    const resp = await http.post<ApiResp<FetchResult>>('/fetch', { url });
    const body = resp.data;
    if (!body || !body.success) {
      return { ok: false, error: body?.error?.message || '抓取失败' };
    }
    return { ok: true, data: body.data };
  } catch (e: any) {
    return { ok: false, error: e?.message || '请求异常' };
  }
}

export async function submitTags(url: string, tags: string[]): Promise<boolean> {
  try {
    const resp = await http.post<ApiResp<any>>('/tags', { url, tags });
    return !!resp.data?.success;
  } catch { return false; }
}

export async function getResources(): Promise<Resource[]> {
  try {
    const resp = await http.get<ApiResp<Resource[]>>('/resources');
    return resp.data?.success && resp.data.data ? resp.data.data : [];
  } catch { return []; }
}

export async function searchResources(params: { searchTerm?: string; filterTags?: string[] }): Promise<Resource[]> {
  try {
    const resp = await http.get<ApiResp<Resource[]>>('/search', {
      params: {
        searchTerm: params.searchTerm || '',
        filterTags: (params.filterTags || []).join(',')
      }
    });
    return resp.data?.success && resp.data.data ? resp.data.data : [];
  } catch { return []; }
}

export async function createResource(data: Omit<Resource, 'id' | 'createdAt'>): Promise<{ ok: boolean; data?: Resource; error?: string }> {
  try {
    const resp = await http.post<ApiResp<Resource>>('/resources', data);
    if (!resp.data?.success) {
      return { ok: false, error: resp.data?.error?.message || '保存失败' };
    }
    return { ok: true, data: resp.data.data };
  } catch (e: any) {
    return { ok: false, error: e?.message || '请求异常' };
  }
}

export async function deleteResource(id: string): Promise<boolean> {
  try {
    const resp = await http.delete<ApiResp<any>>(`/resources/${id}`);
    return !!resp.data?.success;
  } catch { return false; }
}

export async function updateResource(id: string, updates: Partial<Resource>): Promise<Resource | null> {
  try {
    const resp = await http.patch<ApiResp<Resource>>(`/resources/${id}`, updates);
    return resp.data?.success && resp.data.data ? resp.data.data : null;
  } catch { return null; }
}

export async function requestScreenshot(url: string): Promise<string | null> {
  try {
    const resp = await http.post<ApiResp<{ screenshotUrl: string }>>('/screenshot', { url });
    return resp.data?.success && resp.data.data ? resp.data.data.screenshotUrl : null;
  } catch { return null; }
}

export function parseBookmarkHTML(html: string): Array<{ title: string; url: string }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const anchors = doc.querySelectorAll('a[href]');
  const result: Array<{ title: string; url: string }> = [];
  const seen = new Set<string>();
  anchors.forEach(a => {
    const url = a.getAttribute('href') || '';
    if (!url.startsWith('http') || seen.has(url)) return;
    seen.add(url);
    const title = (a.textContent || '').trim() || url;
    result.push({ title, url });
  });
  return result;
}
