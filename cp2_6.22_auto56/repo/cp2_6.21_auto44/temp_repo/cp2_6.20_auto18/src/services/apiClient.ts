import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import type {
  Interview,
  CreateInterviewRequest,
  CreateInterviewResponse,
  VerifyCandidateRequest,
  VerifyCandidateResponse,
  SubmitEvaluationRequest,
  SubmitEvaluationResponse,
  EvaluationResult,
  UploadChunkResponse,
  CompleteUploadResponse,
} from '../types';

const CHUNK_SIZE = 5 * 1024 * 1024;

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error);
        throw error;
      }
    );
  }

  setToken(token: string | null) {
    this.token = token;
  }

  async createInterview(data: CreateInterviewRequest): Promise<CreateInterviewResponse> {
    const response = await this.client.post<CreateInterviewResponse>('/interviews', data);
    return response.data;
  }

  async getInterview(id: string): Promise<Interview> {
    const response = await this.client.get<Interview>(`/interviews/${id}`);
    return response.data;
  }

  async getInterviewList(): Promise<Interview[]> {
    const response = await this.client.get<Interview[]>('/interviews');
    return response.data;
  }

  async verifyCandidate(data: VerifyCandidateRequest): Promise<VerifyCandidateResponse> {
    const response = await this.client.post<VerifyCandidateResponse>('/candidates/verify', data);
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async uploadChunk(
    interviewId: string,
    questionId: string,
    chunk: Blob,
    chunkIndex: number,
    totalChunks: number,
    fileName: string,
    onProgress?: (loaded: number, total: number) => void
  ): Promise<UploadChunkResponse> {
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('chunkIndex', chunkIndex.toString());
    formData.append('totalChunks', totalChunks.toString());
    formData.append('fileName', fileName);
    formData.append('interviewId', interviewId);
    formData.append('questionId', questionId);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          onProgress(progressEvent.loaded, progressEvent.total);
        }
      };
    }

    const response = await this.client.post<UploadChunkResponse>(
      '/upload/chunk',
      formData,
      config
    );
    return response.data;
  }

  async completeUpload(
    interviewId: string,
    questionId: string,
    fileName: string,
    totalChunks: number
  ): Promise<CompleteUploadResponse> {
    const response = await this.client.post<CompleteUploadResponse>('/upload/complete', {
      interviewId,
      questionId,
      fileName,
      totalChunks,
    });
    return response.data;
  }

  async uploadFileByChunks(
    interviewId: string,
    questionId: string,
    file: File,
    onProgress?: (percent: number) => void
  ): Promise<string> {
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
    const fileName = `${interviewId}_${questionId}_${Date.now()}.webm`;

    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      await this.uploadChunk(interviewId, questionId, chunk, i, totalChunks, fileName);

      if (onProgress) {
        const percent = ((i + 1) / totalChunks) * 100;
        onProgress(Math.round(percent));
      }
    }

    const result = await this.completeUpload(interviewId, questionId, fileName, totalChunks);
    return result.videoUrl;
  }

  async submitEvaluation(data: SubmitEvaluationRequest): Promise<SubmitEvaluationResponse> {
    const response = await this.client.post<SubmitEvaluationResponse>('/evaluations', data);
    return response.data;
  }

  async getEvaluations(interviewId: string): Promise<EvaluationResult[]> {
    const response = await this.client.get<EvaluationResult[]>(
      `/evaluations?interviewId=${interviewId}`
    );
    return response.data;
  }

  async uploadVoiceComment(
    interviewId: string,
    audioBlob: Blob,
    onProgress?: (percent: number) => void
  ): Promise<{ url: string; waveformData: number[] }> {
    const formData = new FormData();
    formData.append('file', audioBlob, 'voice_comment.webm');
    formData.append('interviewId', interviewId);

    const config: AxiosRequestConfig = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onProgress) {
      config.onUploadProgress = (progressEvent) => {
        if (progressEvent.total) {
          const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          onProgress(percent);
        }
      };
    }

    const response = await this.client.post<{ url: string; waveformData: number[] }>(
      '/upload/voice',
      formData,
      config
    );
    return response.data;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
