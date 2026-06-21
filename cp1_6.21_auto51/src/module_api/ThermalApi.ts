export interface BlockData {
  id: string;
  name: string;
  x: number;
  z: number;
  height: number;
  greenRate: number;
  buildingDensity: number;
  baseHeat: number;
  heatValue?: number;
  temperature?: number;
}

export interface ThermalHistory {
  labels: string[];
  values: number[];
  blocks: { id: string; name: string }[];
}

export interface BlockHistory {
  block: {
    id: string;
    name: string;
    greenRate: number;
    buildingDensity: number;
    currentTemperature: number;
  };
  history: {
    hour: number;
    time: string;
    heatValue: number;
    temperature: number;
  }[];
}

export interface ThermalCurrent {
  hour: number;
  averageHeat: number;
  maxHeat: number;
  averageTemperature: number;
  maxTemperature: number;
  solarIntensity: number;
  globalGreenRate: number;
  globalBuildingDensity: number;
}

export interface EnvParams {
  solarIntensity: number;
  globalGreenRate: number;
  globalBuildingDensity: number;
}

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(API_BASE + url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export const ThermalApi = {
  getBlocks(): Promise<BlockData[]> {
    return request<BlockData[]>('/blocks');
  },

  updateParams(params: Partial<EnvParams>): Promise<EnvParams> {
    return request<EnvParams>('/params', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  getThermalHistory(blockIds: string[]): Promise<ThermalHistory> {
    const ids = blockIds.join(',');
    return request<ThermalHistory>(`/thermal/history?blockIds=${ids}`);
  },

  getBlockHistory(id: string): Promise<BlockHistory> {
    return request<BlockHistory>(`/block/${id}/history`);
  },

  getCurrentThermal(): Promise<ThermalCurrent> {
    return request<ThermalCurrent>('/thermal/current');
  },
};
