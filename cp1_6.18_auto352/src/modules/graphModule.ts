import type { GraphData, GraphNode, GraphLink } from '../types';

const CATEGORY_COLORS: Record<string, string> = {
  tech: '#FF8A65',
  life: '#81C784',
  study: '#64B5F6',
  creation: '#BA68C8',
  default: '#BCAAA4',
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorMessage = await response.text().catch(() => 'Unknown error');
    throw new Error(`HTTP error! status: ${response.status}, message: ${errorMessage}`);
  }
  return response.json();
}

export async function fetchGraphData(): Promise<GraphData> {
  try {
    const response = await fetch('/api/graph', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<GraphData>(response);
  } catch (error) {
    console.error('Failed to fetch graph data:', error);
    throw error;
  }
}

export function calculateNodeSize(connections: number): number {
  const minSize = 20;
  const maxSize = 40;
  const normalized = Math.min(Math.max(connections, 0), 10);
  return minSize + (normalized / 10) * (maxSize - minSize);
}

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
}
