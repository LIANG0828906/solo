import type { Recording } from './recorder';

const API_BASE_URL = 'http://localhost:4000/api';

export interface ApiState {
  loading: boolean;
  error: string | null;
}

class PlayerApi {
  private state: ApiState = {
    loading: false,
    error: null
  };

  private listeners: Set<(state: ApiState) => void> = new Set();

  subscribe(callback: (state: ApiState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb({ ...this.state }));
  }

  private setLoading(loading: boolean): void {
    this.state.loading = loading;
    this.notify();
  }

  private setError(error: string | null): void {
    this.state.error = error;
    this.notify();
  }

  async saveRecord(recording: Recording): Promise<{ success: boolean; id?: string; message?: string }> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/saveRecord`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recording)
      });

      if (!response.ok) {
        throw new Error(`保存失败: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, id: data.id };
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      this.setError(message);
      return { success: false, message };
    } finally {
      this.setLoading(false);
    }
  }

  async listRecords(): Promise<{ success: boolean; recordings?: Recording[]; message?: string }> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/listRecords`);

      if (!response.ok) {
        throw new Error(`获取列表失败: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, recordings: data.recordings };
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      this.setError(message);
      return { success: false, message };
    } finally {
      this.setLoading(false);
    }
  }

  async getRecord(id: string): Promise<{ success: boolean; recording?: Recording; message?: string }> {
    this.setLoading(true);
    this.setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/record/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('录音不存在');
        }
        throw new Error(`获取录音失败: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, recording: data };
    } catch (err) {
      const message = err instanceof Error ? err.message : '未知错误';
      this.setError(message);
      return { success: false, message };
    } finally {
      this.setLoading(false);
    }
  }

  getState(): ApiState {
    return { ...this.state };
  }
}

export const playerApi = new PlayerApi();
