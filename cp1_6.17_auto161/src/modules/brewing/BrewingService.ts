export interface PourStage {
  time: number;
  water: number;
}

export interface FlavorRating {
  酸度: number;
  甜度: number;
  苦度: number;
  醇厚度: number;
  干净度: number;
  余韵: number;
}

export interface BrewingRecord {
  id?: string;
  beanName: string;
  origin: string;
  roastLevel: '浅' | '中' | '深';
  grindSize: number;
  waterTemp: number;
  powderWeight: number;
  waterWeight: number;
  ratio: string;
  pourStages: PourStage[];
  extractionRate: number;
  flavor?: FlavorRating;
  likes?: number;
  likedByMe?: boolean;
  comments?: Comment[];
  isPublished?: boolean;
  userId?: string;
  createdAt?: string;
}

export interface Comment {
  id: string;
  user: string;
  text: string;
  createdAt: string;
}

export const FLAVOR_LABELS = ['酸度', '甜度', '苦度', '醇厚度', '干净度', '余韵'] as const;

export const ORIGINS = [
  '埃塞俄比亚', '哥伦比亚', '巴西', '肯尼亚', '危地马拉',
  '哥斯达黎加', '巴拿马', '印尼', '卢旺达', '中国云南'
];

export const ROAST_LEVELS = ['浅', '中', '深'] as const;

export const calculateExtractionRate = (
  powderWeight: number,
  waterWeight: number,
  tds: number = 1.35
): number => {
  const dissolvedSolids = waterWeight * (tds / 100);
  const extractionRate = (dissolvedSolids / powderWeight) * 100;
  return Math.round(extractionRate * 100) / 100;
};

export const validateBrewForm = (record: Partial<BrewingRecord>): string[] => {
  const errors: string[] = [];
  if (!record.beanName || record.beanName.trim().length === 0) {
    errors.push('请填写咖啡豆名称');
  }
  if (record.beanName && record.beanName.length > 20) {
    errors.push('咖啡豆名称不能超过20字');
  }
  if (!record.origin) {
    errors.push('请选择产地');
  }
  if (!record.roastLevel) {
    errors.push('请选择烘焙度');
  }
  if (!record.grindSize || record.grindSize < 1 || record.grindSize > 10) {
    errors.push('研磨度需在1-10之间');
  }
  if (!record.waterTemp || record.waterTemp < 80 || record.waterTemp > 100) {
    errors.push('水温需在80-100°C之间');
  }
  if (!record.powderWeight || record.powderWeight <= 0) {
    errors.push('请输入粉量');
  }
  if (!record.pourStages || record.pourStages.length === 0) {
    errors.push('请至少添加一段注水');
  }
  if (record.pourStages && record.pourStages.length > 4) {
    errors.push('最多只能添加4段注水');
  }
  return errors;
};

export const createEmptyFlavor = (): FlavorRating => ({
  酸度: 0,
  甜度: 0,
  苦度: 0,
  醇厚度: 0,
  干净度: 0,
  余韵: 0,
});

export const createDefaultPourStages = (powderWeight: number = 15): PourStage[] => {
  const ratio = 15;
  const totalWater = powderWeight * ratio;
  return [
    { time: 30, water: Math.round(totalWater * 0.4) },
    { time: 45, water: Math.round(totalWater * 0.3) },
    { time: 45, water: Math.round(totalWater * 0.3) },
  ];
};

export const calculateTotalWater = (stages: PourStage[]): number => {
  return stages.reduce((sum, s) => sum + s.water, 0);
};

export const calculateTotalTime = (stages: PourStage[]): number => {
  return stages.reduce((sum, s) => sum + s.time, 0);
};
