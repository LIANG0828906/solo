import type {
  PlantBase,
  PlantConfig,
  StageMorphology,
  EvolutionGraph,
  GrowthActionRequest,
  GrowthActionResponse,
  PlantInfo,
  ApiResponse
} from './types.js';

const API_PREFIX = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const json: ApiResponse<T> = await response.json();
    if (!json.success) {
      throw new Error(json.error || 'Request failed');
    }
    if (json.data === undefined) {
      throw new Error('No data in response');
    }
    return json.data;
  } catch (error) {
    console.error(`[API] ${url} error:`, error);
    throw error;
  }
}

export async function getPlantList(): Promise<PlantBase[]> {
  return fetchJson<PlantBase[]>(`${API_PREFIX}/plants`);
}

export async function getPlantConfig(id: string): Promise<PlantConfig> {
  return fetchJson<PlantConfig>(`${API_PREFIX}/plants/${id}/config`);
}

export async function getPlantStage(id: string, stage: string): Promise<StageMorphology> {
  return fetchJson<StageMorphology>(`${API_PREFIX}/plants/${id}/stage/${stage}`);
}

export async function getEvolutionGraph(): Promise<EvolutionGraph> {
  return fetchJson<EvolutionGraph>(`${API_PREFIX}/evolution/graph`);
}

export async function submitGrowthAction(req: GrowthActionRequest): Promise<GrowthActionResponse> {
  return fetchJson<GrowthActionResponse>(`${API_PREFIX}/growth/action`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req)
  });
}

export async function getPlantInfo(id: string): Promise<PlantInfo> {
  return fetchJson<PlantInfo>(`${API_PREFIX}/plants/${id}/info`);
}
