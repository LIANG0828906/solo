import axios from "axios";
import type { Work, UploadResponse, ReviewRequest, SearchParams } from "@/types";

const api = axios.create({
  baseURL: "/api",
  timeout: 60000,
});

export async function fetchWorks(params?: SearchParams): Promise<Work[]> {
  const res = await api.get<Work[]>("/works", { params });
  return res.data;
}

export async function fetchWorkById(id: string): Promise<Work> {
  const res = await api.get<Work>(`/works/${id}`);
  return res.data;
}

export async function uploadWork(
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const res = await api.post<UploadResponse>("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
  return res.data;
}

export async function reviewWork(
  id: string,
  data: ReviewRequest
): Promise<Work> {
  const res = await api.put<Work>(`/works/${id}/review`, data);
  return res.data;
}

export async function deleteWork(id: string): Promise<void> {
  await api.delete(`/works/${id}`);
}

export async function loginAdmin(
  password: string
): Promise<{ token: string }> {
  const res = await api.post<{ token: string }>("/auth/login", { password });
  return res.data;
}
