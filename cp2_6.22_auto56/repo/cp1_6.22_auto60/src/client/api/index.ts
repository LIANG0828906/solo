import type { ProjectState, VideoMetadata, Chapter, Transition, CropRange } from '../../types';

const API_BASE = '/api';

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  getLatestProject(): Promise<ProjectState> {
    return request<ProjectState>('/project/latest');
  },

  createProject(): Promise<ProjectState> {
    return request<ProjectState>('/project', { method: 'POST' });
  },

  getProject(id: string): Promise<ProjectState> {
    return request<ProjectState>(`/project/${id}`);
  },

  async uploadVideo(
    file: File,
    duration: number,
    onProgress?: (percent: number) => void,
  ): Promise<VideoMetadata> {
    const formData = new FormData();
    formData.append('video', file);
    formData.append('duration', String(duration));

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE}/video/upload`);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const data = JSON.parse(xhr.responseText);
          resolve(data.metadata);
        } else {
          reject(new Error(`上传失败: ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('网络错误'));
      xhr.send(formData);
    });
  },

  setProjectVideo(projectId: string, videoId: string): Promise<{ success: boolean; project: ProjectState }> {
    return request(`/project/${projectId}/video`, {
      method: 'POST',
      body: JSON.stringify({ videoId }),
    });
  },

  getChapters(projectId: string): Promise<{ chapters: Chapter[]; transitions: Transition[]; cropRange: CropRange }> {
    return request(`/project/${projectId}/chapters`);
  },

  saveChapters(
    projectId: string,
    data: { chapters?: Chapter[]; transitions?: Transition[]; cropRange?: CropRange },
  ): Promise<{ success: boolean; project: ProjectState }> {
    return request(`/project/${projectId}/chapters`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
