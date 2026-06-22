import type { Medicine, Prescription, CompatibilityCheckRequest, CompatibilityCheckResponse } from '../types';

const API_BASE = '/api';

export const fetchMedicines = async (): Promise<Medicine[]> => {
  const response = await fetch(`${API_BASE}/medicines`);
  if (!response.ok) throw new Error('获取药材列表失败');
  return response.json();
};

export const fetchMedicine = async (id: string): Promise<Medicine> => {
  const response = await fetch(`${API_BASE}/medicines/${id}`);
  if (!response.ok) throw new Error('获取药材详情失败');
  return response.json();
};

export const checkCompatibility = async (medicineIds: string[]): Promise<CompatibilityCheckResponse> => {
  const startTime = performance.now();
  const body: CompatibilityCheckRequest = { medicineIds };
  const response = await fetch(`${API_BASE}/compatibility/check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error('配伍禁忌检测失败');
  const result = await response.json();
  const elapsed = performance.now() - startTime;
  console.log(`配伍禁忌检测耗时: ${elapsed.toFixed(2)}ms`);
  return result;
};

export const savePrescription = async (prescription: Omit<Prescription, 'id' | 'createdAt'>): Promise<Prescription> => {
  const response = await fetch(`${API_BASE}/prescriptions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prescription),
  });
  if (!response.ok) throw new Error('保存处方失败');
  return response.json();
};

export const fetchPrescriptions = async (): Promise<Prescription[]> => {
  const response = await fetch(`${API_BASE}/prescriptions`);
  if (!response.ok) throw new Error('获取处方列表失败');
  return response.json();
};

export const fetchPrescription = async (id: string): Promise<Prescription> => {
  const response = await fetch(`${API_BASE}/prescriptions/${id}`);
  if (!response.ok) throw new Error('获取处方详情失败');
  return response.json();
};
