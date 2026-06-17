import {
  BrewingRecord,
  PourStage,
  FlavorRating,
  calculateExtractionRate,
  validateBrewForm,
  createEmptyFlavor,
  createDefaultPourStages,
  calculateTotalWater,
} from './BrewingService';

const API_BASE = '/api';

export interface BrewFormState {
  beanName: string;
  origin: string;
  roastLevel: '浅' | '中' | '深' | '';
  grindSize: number;
  waterTemp: number;
  powderWeight: number;
  ratio: string;
  pourStages: PourStage[];
}

export const createInitialFormState = (): BrewFormState => ({
  beanName: '',
  origin: '',
  roastLevel: '',
  grindSize: 5,
  waterTemp: 92,
  powderWeight: 15,
  ratio: '1:15',
  pourStages: createDefaultPourStages(15),
});

export const updatePourStage = (
  stages: PourStage[],
  index: number,
  field: keyof PourStage,
  value: number
): PourStage[] => {
  return stages.map((stage, i) =>
    i === index ? { ...stage, [field]: value } : stage
  );
};

export const addPourStage = (stages: PourStage[]): PourStage[] => {
  if (stages.length >= 4) return stages;
  return [...stages, { time: 30, water: 50 }];
};

export const removePourStage = (stages: PourStage[], index: number): PourStage[] => {
  if (stages.length <= 1) return stages;
  return stages.filter((_, i) => i !== index);
};

export const recalcExtractionRate = (form: BrewFormState): number => {
  const waterWeight = calculateTotalWater(form.pourStages);
  return calculateExtractionRate(form.powderWeight, waterWeight);
};

export const validateForm = (form: BrewFormState): string[] => {
  const record: Partial<BrewingRecord> = {
    ...form,
    pourStages: form.pourStages,
    waterWeight: calculateTotalWater(form.pourStages),
  };
  return validateBrewForm(record);
};

export const submitBrewRecord = async (
  form: BrewFormState,
  flavor: FlavorRating,
  isPublished: boolean
): Promise<BrewingRecord> => {
  const waterWeight = calculateTotalWater(form.pourStages);
  const extractionRate = calculateExtractionRate(form.powderWeight, waterWeight);

  const payload: BrewingRecord = {
    beanName: form.beanName.trim(),
    origin: form.origin,
    roastLevel: form.roastLevel as '浅' | '中' | '深',
    grindSize: form.grindSize,
    waterTemp: form.waterTemp,
    powderWeight: form.powderWeight,
    waterWeight,
    ratio: form.ratio,
    pourStages: form.pourStages,
    extractionRate,
    flavor,
    isPublished,
  };

  const res = await fetch(`${API_BASE}/records`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error('保存记录失败');
  }

  return res.json();
};

export const fetchOrigins = async (): Promise<string[]> => {
  const res = await fetch(`${API_BASE}/origins`);
  if (!res.ok) throw new Error('获取产地列表失败');
  return res.json();
};

export const likeRecord = async (id: string): Promise<{ likes: number; likedByMe: boolean }> => {
  const res = await fetch(`${API_BASE}/records/${id}/like`, { method: 'POST' });
  if (!res.ok) throw new Error('操作失败');
  return res.json();
};

export const addComment = async (id: string, text: string): Promise<{ id: string; user: string; text: string; createdAt: string }> => {
  const res = await fetch(`${API_BASE}/records/${id}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error('评论失败');
  return res.json();
};

export { createEmptyFlavor };
