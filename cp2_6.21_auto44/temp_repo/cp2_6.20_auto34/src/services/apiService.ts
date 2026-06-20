import axios, { AxiosInstance, AxiosProgressEvent } from 'axios';

export interface PresetParam {
  name: string;
  defaultValue: number;
  min: number;
  max: number;
}

export interface Preset {
  id: string;
  name: string;
  type: string;
  params: PresetParam[];
}

export interface TrackExport {
  file_id: string;
  name?: string;
  position: number;
  volume: number;
  effects: EffectExport[];
}

export interface EffectExport {
  type: string;
  params: Record<string, number>;
}

export interface ExportParams {
  tracks: TrackExport[];
  bpm: number;
  masterVolume: number;
  sample_rate?: number;
}

export interface UploadAudioResponse {
  id: string;
  name: string;
  duration: number;
  url: string;
}

class ApiService {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: '/api',
      timeout: 30000,
    });
  }

  async uploadAudio(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<UploadAudioResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.instance.post<UploadAudioResponse>(
      '/upload',
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event: AxiosProgressEvent) => {
          if (onProgress && event.total) {
            const progress = Math.round((event.loaded / event.total) * 100);
            onProgress(progress);
          }
        },
      }
    );

    return response.data;
  }

  async getPresets(): Promise<Preset[]> {
    const response = await this.instance.get<Preset[]>('/presets');
    return response.data;
  }

  async exportMix(params: ExportParams): Promise<Blob> {
    const response = await this.instance.post<Blob>('/export', params, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiService = new ApiService();
