import type { Artifact, ArtifactListItem } from './types/artifact';

const API_BASE = '/api';

export class DataService {
  static async getArtifacts(): Promise<ArtifactListItem[]> {
    const response = await fetch(`${API_BASE}/artifacts`);
    if (!response.ok) {
      throw new Error('Failed to fetch artifacts');
    }
    return response.json();
  }

  static async getArtifact(id: string): Promise<Artifact> {
    const response = await fetch(`${API_BASE}/artifacts/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch artifact ${id}`);
    }
    return response.json();
  }

  static async getNarration(artifactId: string): Promise<string> {
    const artifact = await this.getArtifact(artifactId);
    return artifact.narration;
  }
}
