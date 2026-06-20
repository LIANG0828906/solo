import api from '@/services/api';
import type { Note, Track, VersionSnapshot } from '@/types';

class VersionClient {
  private cache: Map<string, VersionSnapshot[]> = new Map();

  async getVersions(roomId: string): Promise<VersionSnapshot[]> {
    const response = await api.get(`/versions/${roomId}`);
    const versions = response.data.versions;
    this.cache.set(roomId, versions);
    return versions;
  }

  getCachedVersions(roomId: string): VersionSnapshot[] | undefined {
    return this.cache.get(roomId);
  }

  async createVersion(
    roomId: string,
    userId: string,
    userName: string,
    snapshot: { notes: Note[]; tracks: Track[]; bpm: number }
  ): Promise<VersionSnapshot> {
    const response = await api.post('/versions', { roomId, userId, userName, snapshot });
    const version = response.data.version;
    
    const cached = this.cache.get(roomId) || [];
    this.cache.set(roomId, [version, ...cached].slice(0, 10));
    
    return version;
  }

  async deleteVersion(versionId: string): Promise<boolean> {
    const response = await api.delete(`/versions/${versionId}`);
    return response.data.success;
  }

  async restoreVersion(versionId: string, roomId: string): Promise<{ notes: Note[]; tracks: Track[]; bpm: number }> {
    const response = await api.post(`/versions/${versionId}/restore`, { roomId });
    return {
      notes: response.data.notes,
      tracks: response.data.tracks,
      bpm: response.data.bpm,
    };
  }
}

export const versionClient = new VersionClient();
