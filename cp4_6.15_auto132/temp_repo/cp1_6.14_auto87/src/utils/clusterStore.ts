import { StarCluster } from '../types';

const STORAGE_KEY = 'star-clusters';

const CLUSTER_COLORS = [
  '#00d4ff',
  '#ff6b6b',
  '#ffd93d',
  '#6bcb77',
  '#9b59b6',
  '#ff9f43',
  '#ee5a24',
  '#00cec9',
];

export function getClusters(): StarCluster[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to load clusters from localStorage', e);
  }
  return [];
}

export function saveClusters(clusters: StarCluster[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clusters));
  } catch (e) {
    console.error('Failed to save clusters to localStorage', e);
  }
}

export function addCluster(cluster: StarCluster): StarCluster[] {
  const clusters = getClusters();
  clusters.push(cluster);
  saveClusters(clusters);
  return clusters;
}

export function deleteCluster(clusterId: string): StarCluster[] {
  const clusters = getClusters().filter(c => c.id !== clusterId);
  saveClusters(clusters);
  return clusters;
}

export function updateCluster(clusterId: string, updates: Partial<StarCluster>): StarCluster[] {
  const clusters = getClusters();
  const index = clusters.findIndex(c => c.id === clusterId);
  if (index !== -1) {
    clusters[index] = { ...clusters[index], ...updates };
    saveClusters(clusters);
  }
  return clusters;
}

export function getClusterById(clusterId: string): StarCluster | undefined {
  return getClusters().find(c => c.id === clusterId);
}

export function getRandomClusterColor(): string {
  return CLUSTER_COLORS[Math.floor(Math.random() * CLUSTER_COLORS.length)];
}

export function generateClusterId(): string {
  return `cluster-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export { CLUSTER_COLORS };
