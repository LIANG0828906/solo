import type { Fabric, FabricDetail } from './types';

const API_BASE_URL = '/api';

export async function fetchFabrics(): Promise<Fabric[]> {
  const response = await fetch(`${API_BASE_URL}/fabrics`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getLowStockFabrics(): Promise<Fabric[]> {
  const fabrics = await fetchFabrics();
  return fabrics.filter((f) => f.totalMeters < f.threshold);
}

export async function getFabricDetail(id: string): Promise<FabricDetail> {
  const response = await fetch(`${API_BASE_URL}/fabrics/${id}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

export async function getDashboardStats(): Promise<{
  totalOrders: number;
  inProductionOrders: number;
  lowStockFabrics: number;
}> {
  const response = await fetch(`${API_BASE_URL}/dashboard`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
