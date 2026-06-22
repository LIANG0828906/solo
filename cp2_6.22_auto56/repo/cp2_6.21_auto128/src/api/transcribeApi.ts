import axios from 'axios';
import type { TranscriptResult } from '@/types';
import { mockUpload, mockTranscribe } from '@/utils/mockApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
});

export interface UploadResponse {
  taskId: string;
  message: string;
}

export interface TranscribeStatusResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: TranscriptResult;
}

const USE_MOCK = true;

export async function uploadAudio(
  file: File,
  onUploadProgress?: (progress: number) => void
): Promise<string> {
  if (USE_MOCK) {
    return mockUpload(file, onUploadProgress || (() => {}));
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post<UploadResponse>('/api/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onUploadProgress) {
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onUploadProgress(progress);
        }
      },
    });

    return response.data.taskId;
  } catch (error) {
    console.error('Upload failed:', error);
    throw error;
  }
}

export async function pollTranscribeStatus(
  taskId: string,
  onProgress: (progress: number) => void
): Promise<TranscriptResult> {
  if (USE_MOCK) {
    return mockTranscribe(taskId, onProgress);
  }

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await api.get<TranscribeStatusResponse>(
          `/api/transcribe/${taskId}`
        );
        const data = response.data;

        onProgress(data.progress);

        if (data.status === 'completed' && data.result) {
          resolve(data.result);
        } else if (data.status === 'failed') {
          reject(new Error('转写失败'));
        } else {
          setTimeout(poll, 500);
        }
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
}

export async function transcribeAudio(
  file: File,
  onUploadProgress: (progress: number) => void,
  onTranscribeProgress: (progress: number) => void
): Promise<TranscriptResult> {
  const taskId = await uploadAudio(file, onUploadProgress);
  const result = await pollTranscribeStatus(taskId, onTranscribeProgress);
  return result;
}
