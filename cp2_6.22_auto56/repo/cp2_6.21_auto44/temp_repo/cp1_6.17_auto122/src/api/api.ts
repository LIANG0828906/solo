import type {
  Garden,
  ClaimGardenRequest,
  AddWaterLogRequest,
  WeeklyWaterData,
  CarbonData,
  MonthlyReport,
} from '../../shared/types';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const json = await res.json();
  if (!json.success) {
    throw new Error(json.error || 'Request failed');
  }
  return json.data as T;
}

export function fetchGardens(): Promise<Garden[]> {
  return request<Garden[]>('/api/gardens');
}

export function fetchGarden(id: string): Promise<Garden> {
  return request<Garden>(`/api/gardens/${id}`);
}

export function claimGarden(
  id: string, body: ClaimGardenRequest): Promise<Garden> {
  return request<Garden>(`/api/gardens/${id}/claim`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function addWaterLog(
  id: string,
  body: AddWaterLogRequest,
): Promise<Garden> {
  return request<Garden>(`/api/gardens/${id}/water`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function harvestGarden(id: string): Promise<Garden> {
  return request<Garden>(`/api/gardens/${id}/harvest`, {
    method: 'POST',
  });
}

export function updateGarden(
  id: string,
  patch: Partial<Garden>,
): Promise<Garden> {
  return request<Garden>(`/api/gardens/${id}`, {
    method: 'PUT',
    body: JSON.stringify(patch),
  });
}

export function fetchWeeklyWater(): Promise<WeeklyWaterData[]> {
  return request<WeeklyWaterData[]>('/api/report/weekly-water');
}

export function fetchCarbonReduction(): Promise<CarbonData[]> {
  return request<CarbonData[]>('/api/report/carbon-reduction');
}

export function fetchMonthlyReport(): Promise<MonthlyReport> {
  return request<MonthlyReport>('/api/report/monthly');
}
