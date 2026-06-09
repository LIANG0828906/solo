export type FlourType = 'fine' | 'medium' | 'bran';

export type QualityGrade = 'S' | 'A' | 'B' | 'C';

export interface SiftingResult {
  fine: number;
  medium: number;
  bran: number;
}

export interface ProductionBatch {
  id: string;
  batchNumber: string;
  flourType: FlourType;
  productionDate: string;
  weight: number;
  qualityGrade: QualityGrade;
  millGap: number;
  waterValve: number;
  timestamp: number;
}

export const OVERLOAD_THRESHOLD = 85;

export function calculateLoad(millGap: number, waterValve: number): number {
  const load = (100 - millGap * 25) * (waterValve / 100);
  return Math.max(0, Math.min(100, load));
}

export function calculateRotationSpeed(waterValve: number): number {
  return Math.max(0, Math.min(60, waterValve * 0.6));
}

export function calculateOutputPerFrame(
  waterValve: number,
  millGap: number,
  deltaTime: number
): number {
  return (waterValve / 100) * 0.008 * (3.5 - millGap) * (deltaTime / 16.67);
}

export function calculateSiftingDistribution(
  totalFlour: number,
  millGap: number
): SiftingResult {
  const passRate1 = Math.max(45, 75 - (millGap - 0.5) * 18);
  const fineRate = passRate1 / 100;
  const passRate2 = 60;
  const mediumRate = (1 - fineRate) * (passRate2 / 100);
  const branRate = 1 - fineRate - mediumRate;

  return {
    fine: totalFlour * fineRate,
    medium: totalFlour * mediumRate,
    bran: totalFlour * branRate,
  };
}

export function determineQualityGrade(
  millGap: number,
  waterValve: number
): QualityGrade {
  if (millGap < 1.2 && waterValve < 70) {
    return 'S';
  }
  if (millGap < 1.8 && waterValve < 85) {
    return 'A';
  }
  if (millGap < 2.5) {
    return 'B';
  }
  return 'C';
}

let batchSequence = 0;

export function generateBatchNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const datePart = `${year}${month}${day}`;

  batchSequence = (batchSequence % 1000) + 1;
  const sequencePart = String(batchSequence).padStart(3, '0');

  return `M${datePart}-${sequencePart}`;
}

export function getFlourTypeName(type: FlourType): string {
  const typeNames: Record<FlourType, string> = {
    fine: '精白面',
    medium: '中筋面',
    bran: '麸皮',
  };
  return typeNames[type];
}
