export interface Tasting {
  id: string;
  teaName: string;
  variety: string;
  brewTemperature: number;
  rating: number;
  tasteNotes: string[];
  aromaTags: string[];
  colorCode: string;
  dryLeafPhotoUrl: string;
  infusedLeafPhotoUrl: string;
  createTime: string;
  soupClarity: number;
  aromaIntensity: number;
  mouthfeelRichness: number;
  aftertasteDuration: number;
  leafIntegrity: number;
}

const API_BASE = '/api';

export async function getTastings(): Promise<Tasting[]> {
  const response = await fetch(`${API_BASE}/tastings`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tastings: ${response.status}`);
  }
  return response.json();
}

export async function getTastingById(id: string): Promise<Tasting> {
  const response = await fetch(`${API_BASE}/tastings/${id}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch tasting ${id}: ${response.status}`);
  }
  return response.json();
}

export async function addTasting(
  tasting: Omit<Tasting, 'id' | 'createTime'>
): Promise<Tasting> {
  const response = await fetch(`${API_BASE}/tastings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tasting),
  });
  if (!response.ok) {
    throw new Error(`Failed to add tasting: ${response.status}`);
  }
  return response.json();
}
