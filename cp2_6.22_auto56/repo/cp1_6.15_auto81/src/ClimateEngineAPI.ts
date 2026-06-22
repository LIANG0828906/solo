export interface GreeneryItem {
  type: 'tree' | 'shrub';
  x: number;
  z: number;
}

export interface SimulateRequest {
  greenery: GreeneryItem[];
  gridSize: number;
  resolution: number;
}

export interface SimulateResponse {
  temperature: number[];
  humidity: number[];
  windSpeed: number[];
}

export async function getTemperatureMap(config: SimulateRequest): Promise<Float32Array> {
  const response = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(`Simulation API error: ${response.status}`);
  }

  const data: SimulateResponse = await response.json();
  return new Float32Array(data.temperature);
}

export async function getHumidityMap(config: SimulateRequest): Promise<Float32Array> {
  const response = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(`Simulation API error: ${response.status}`);
  }

  const data: SimulateResponse = await response.json();
  return new Float32Array(data.humidity);
}

export async function getWindField(config: SimulateRequest): Promise<Float32Array> {
  const response = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(`Simulation API error: ${response.status}`);
  }

  const data: SimulateResponse = await response.json();
  return new Float32Array(data.windSpeed);
}

export async function runFullSimulation(config: SimulateRequest): Promise<SimulateResponse> {
  const response = await fetch('/api/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });

  if (!response.ok) {
    throw new Error(`Simulation API error: ${response.status}`);
  }

  return response.json();
}
