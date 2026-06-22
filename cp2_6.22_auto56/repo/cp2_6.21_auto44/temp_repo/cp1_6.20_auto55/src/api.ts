import type { ParticleParams, Preset } from './types';

interface ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: string;
};

export const api = {
  async getPresets(): Promise<Preset[]> {
    const response = await fetch('/api/presets');
    const result: ApiResponse<Preset[]> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch presets');
    }
    return result.data;
  },

  async getPreset(id: string): Promise<Preset> {
    const response = await fetch(`/api/presets/${id}`);
    const result: ApiResponse<Preset> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch preset');
    }
    return result.data;
  },

  async createPreset(name: string, params: ParticleParams): Promise<Preset> {
    const response = await fetch('/api/presets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, params }),
    });
    const result: ApiResponse<Preset> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to create preset');
    }
    return result.data;
  },

  async updatePreset(id: string, data: { name?: string; params?: ParticleParams }): Promise<Preset> {
    const response = await fetch(`/api/presets/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    const result: ApiResponse<Preset> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to update preset');
    }
    return result.data;
  },

  async deletePreset(id: string): Promise<Preset> {
    const response = await fetch(`/api/presets/${id}`, {
      method: 'DELETE',
    });
    const result: ApiResponse<Preset> = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete preset');
    }
    return result.data;
  },
};
