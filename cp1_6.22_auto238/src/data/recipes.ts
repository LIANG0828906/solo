export interface DyeMaterial {
  id: string;
  name: string;
  source: string;
  defaultColor: { r: number; g: number; b: number };
  lightfastness: number;
  pHMin: number;
  pHMax: number;
  type: 'direct' | 'mordant' | 'reductive';
  isCustom?: boolean;
}

export interface RecipeStep {
  id: string;
  materialId: string;
  materialName: string;
  weightGrams: number;
  mordantName: string;
  mordantConcentration: number;
  duration: number;
  temperature: number;
}

export interface Recipe {
  id: string;
  name: string;
  description: string;
  steps: RecipeStep[];
  dyeType: 'direct' | 'mordant' | 'reductive';
  fabricType: string;
  createdAt: string;
  updatedAt: string;
  completion: number;
}

export interface ColorResult {
  mainColor: { r: number; g: number; b: number };
  secondaryColor: { r: number; g: number; b: number };
  pantoneApprox: string;
  rgb: string;
  hex: string;
}

export const defaultDyeMaterials: DyeMaterial[] = [
  { id: 'd1', name: '茜草', source: '茜草根部', defaultColor: { r: 188, g: 74, b: 60 }, lightfastness: 7, pHMin: 4, pHMax: 7, type: 'mordant' },
  { id: 'd2', name: '靛蓝', source: '马蓝叶片', defaultColor: { r: 44, g: 62, b: 80 }, lightfastness: 8, pHMin: 9, pHMax: 12, type: 'reductive' },
  { id: 'd3', name: '洋葱皮', source: '洋葱外皮', defaultColor: { r: 176, g: 142, b: 72 }, lightfastness: 6, pHMin: 3, pHMax: 8, type: 'direct' },
  { id: 'd4', name: '栀子', source: '栀子果实', defaultColor: { r: 235, g: 200, b: 85 }, lightfastness: 5, pHMin: 4, pHMax: 9, type: 'direct' },
  { id: 'd5', name: '苏木', source: '苏木心材', defaultColor: { r: 136, g: 50, b: 70 }, lightfastness: 6, pHMin: 5, pHMax: 8, type: 'mordant' },
  { id: 'd6', name: '姜黄', source: '姜黄根茎', defaultColor: { r: 218, g: 165, b: 32 }, lightfastness: 5, pHMin: 3, pHMax: 7, type: 'direct' },
  { id: 'd7', name: '紫草', source: '紫草根茎', defaultColor: { r: 105, g: 53, b: 94 }, lightfastness: 6, pHMin: 6, pHMax: 9, type: 'mordant' },
  { id: 'd8', name: '石榴皮', source: '石榴果皮', defaultColor: { r: 190, g: 150, b: 80 }, lightfastness: 7, pHMin: 3, pHMax: 8, type: 'mordant' },
  { id: 'd9', name: '五倍子', source: '盐肤木虫瘿', defaultColor: { r: 100, g: 85, b: 70 }, lightfastness: 8, pHMin: 3, pHMax: 7, type: 'mordant' },
  { id: 'd10', name: '板栗壳', source: '板栗外皮', defaultColor: { r: 110, g: 78, b: 50 }, lightfastness: 7, pHMin: 4, pHMax: 8, type: 'mordant' },
  { id: 'd11', name: '胡桃青皮', source: '核桃未熟果皮', defaultColor: { r: 120, g: 90, b: 55 }, lightfastness: 8, pHMin: 4, pHMax: 8, type: 'direct' },
  { id: 'd12', name: '蓝莓', source: '蓝莓果实', defaultColor: { r: 90, g: 65, b: 120 }, lightfastness: 4, pHMin: 3, pHMax: 6, type: 'direct' },
  { id: 'd13', name: '茶叶', source: '茶树叶片', defaultColor: { r: 140, g: 110, b: 75 }, lightfastness: 7, pHMin: 4, pHMax: 7, type: 'direct' },
  { id: 'd14', name: '红花', source: '红花花瓣', defaultColor: { r: 205, g: 85, b: 100 }, lightfastness: 5, pHMin: 4, pHMax: 8, type: 'mordant' },
  { id: 'd15', name: '槐花', source: '槐树花蕾', defaultColor: { r: 240, g: 220, b: 120 }, lightfastness: 6, pHMin: 4, pHMax: 9, type: 'mordant' },
  { id: 'd16', name: '黄柏', source: '黄柏树皮', defaultColor: { r: 220, g: 180, b: 100 }, lightfastness: 7, pHMin: 4, pHMax: 8, type: 'mordant' },
  { id: 'd17', name: '黄檗', source: '黄檗树皮', defaultColor: { r: 230, g: 190, b: 110 }, lightfastness: 7, pHMin: 4, pHMax: 8, type: 'mordant' },
  { id: 'd18', name: '鼠李皮', source: '鼠李树皮', defaultColor: { r: 85, g: 100, b: 60 }, lightfastness: 7, pHMin: 5, pHMax: 8, type: 'mordant' },
  { id: 'd19', name: '菘蓝', source: '菘蓝叶片', defaultColor: { r: 50, g: 70, b: 90 }, lightfastness: 8, pHMin: 9, pHMax: 12, type: 'reductive' },
  { id: 'd20', name: '木蓝', source: '木蓝叶片', defaultColor: { r: 55, g: 75, b: 95 }, lightfastness: 8, pHMin: 9, pHMax: 11, type: 'reductive' },
];

export const mordants = [
  { name: '明矾', concentration: 10 },
  { name: '铁矾', concentration: 5 },
  { name: '铜矾', concentration: 5 },
  { name: '铬矾', concentration: 5 },
  { name: '锡盐', concentration: 5 },
  { name: '石灰', concentration: 8 },
  { name: '无媒染', concentration: 0 },
];

export const fabricTypes = ['棉', '麻', '丝', '毛', '涤纶混纺', '粘胶'];

export const pantoneMap: { hex: string; code: string; name: string }[] = [
  { hex: '#BC4A3C', code: 'PANTONE 18-1444', name: 'Autumn Maple' },
  { hex: '#2C3E50', code: 'PANTONE 19-3952', name: 'Classic Blue' },
  { hex: '#B08E48', code: 'PANTONE 14-0756', name: 'Golden Ochre' },
  { hex: '#EBC855', code: 'PANTONE 12-0752', name: 'Buttercup' },
  { hex: '#883246', code: 'PANTONE 18-2046', name: 'Beetroot Purple' },
  { hex: '#DAA520', code: 'PANTONE 14-0958', name: 'Autumn Gold' },
  { hex: '#69355E', code: 'PANTONE 18-3438', name: 'Grapeade' },
  { hex: '#BE9650', code: 'PANTONE 15-1040', name: 'Drifting Sand' },
  { hex: '#645546', code: 'PANTONE 18-1022', name: 'Caribou' },
  { hex: '#6E4E32', code: 'PANTONE 18-1030', name: 'Brown Derby' },
  { hex: '#785A37', code: 'PANTONE 18-0936', name: 'Caramel Cafe' },
  { hex: '#5A4178', code: 'PANTONE 18-3838', name: 'Ultra Violet' },
  { hex: '#8C6E4B', code: 'PANTONE 17-0939', name: 'Adobe' },
  { hex: '#CD5564', code: 'PANTONE 18-1662', name: 'Poinciana' },
  { hex: '#F0DC78', code: 'PANTONE 12-0740', name: 'Lemon Zest' },
  { hex: '#DCB464', code: 'PANTONE 15-1050', name: 'Empire Yellow' },
  { hex: '#E6BE6E', code: 'PANTONE 14-0852', name: 'Solar Power' },
  { hex: '#55643C', code: 'PANTONE 18-0324', name: 'Olive Branch' },
  { hex: '#32465A', code: 'PANTONE 19-4034', name: 'Poseidon' },
  { hex: '#374B5F', code: 'PANTONE 19-4040', name: 'Blue Depths' },
];

export function findClosestPantone(r: number, g: number, b: number): { code: string; name: string } {
  let minDistance = Infinity;
  let closest = pantoneMap[0];
  for (const p of pantoneMap) {
    const hex = p.hex.replace('#', '');
    const pr = parseInt(hex.substring(0, 2), 16);
    const pg = parseInt(hex.substring(2, 4), 16);
    const pb = parseInt(hex.substring(4, 6), 16);
    const dist = Math.sqrt((r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2);
    if (dist < minDistance) {
      minDistance = dist;
      closest = p;
    }
  }
  return { code: closest.code, name: closest.name };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function calculateRecipeCompletion(steps: RecipeStep[]): number {
  if (steps.length === 0) return 0;
  const filled = steps.filter(
    (s) => s.materialId && s.weightGrams > 0 && (s.mordantConcentration >= 0 || s.mordantName === '无媒染')
  ).length;
  return Math.round((filled / steps.length) * 100);
}

export function blendDyeColors(
  steps: RecipeStep[],
  materials: DyeMaterial[]
): ColorResult {
  if (steps.length === 0) {
    return {
      mainColor: { r: 245, g: 240, b: 235 },
      secondaryColor: { r: 235, g: 225, b: 215 },
      pantoneApprox: 'PANTONE 11-0601',
      rgb: 'rgb(245,240,235)',
      hex: '#F5F0EB',
    };
  }

  let totalWeight = 0;
  let rSum = 0,
    gSum = 0,
    bSum = 0;

  for (const step of steps) {
    const mat = materials.find((m) => m.id === step.materialId);
    if (!mat) continue;
    const weight = step.weightGrams || 1;
    totalWeight += weight;
    const mordantFactor = step.mordantName === '铁矾' ? 0.75 : step.mordantName === '铜矾' ? 0.9 : 1.0;
    rSum += mat.defaultColor.r * weight * mordantFactor;
    gSum += mat.defaultColor.g * weight * mordantFactor;
    bSum += mat.defaultColor.b * weight * mordantFactor;
  }

  if (totalWeight === 0) {
    totalWeight = 1;
  }

  const r = Math.round(Math.min(255, rSum / totalWeight));
  const g = Math.round(Math.min(255, gSum / totalWeight));
  const b = Math.round(Math.min(255, bSum / totalWeight));

  const secondaryR = Math.round(Math.min(255, r * 1.15));
  const secondaryG = Math.round(Math.min(255, g * 1.1));
  const secondaryB = Math.round(Math.min(255, b * 0.95));

  const pantone = findClosestPantone(r, g, b);

  return {
    mainColor: { r, g, b },
    secondaryColor: { r: secondaryR, g: secondaryG, b: secondaryB },
    pantoneApprox: pantone.code,
    rgb: `rgb(${r},${g},${b})`,
    hex: rgbToHex(r, g, b),
  };
}

const now = new Date().toISOString();

export const defaultRecipes: Recipe[] = [
  {
    id: 'r1',
    name: '茜草复古红',
    description: '经典茜草媒染红，适合棉麻面料',
    dyeType: 'mordant',
    fabricType: '棉',
    steps: [
      { id: 's1', materialId: 'd1', materialName: '茜草', weightGrams: 15, mordantName: '明矾', mordantConcentration: 10, duration: 60, temperature: 80 },
    ],
    createdAt: now,
    updatedAt: now,
    completion: 100,
  },
  {
    id: 'r2',
    name: '靛蓝深邃青',
    description: '植物靛蓝还原染，需反复浸染',
    dyeType: 'reductive',
    fabricType: '棉',
    steps: [
      { id: 's2', materialId: 'd2', materialName: '靛蓝', weightGrams: 20, mordantName: '石灰', mordantConcentration: 8, duration: 30, temperature: 25 },
    ],
    createdAt: now,
    updatedAt: now,
    completion: 100,
  },
  {
    id: 'r3',
    name: '洋葱皮暖棕',
    description: '洋葱皮直接染，温暖的大地色',
    dyeType: 'direct',
    fabricType: '丝',
    steps: [
      { id: 's3', materialId: 'd3', materialName: '洋葱皮', weightGrams: 25, mordantName: '无媒染', mordantConcentration: 0, duration: 45, temperature: 75 },
    ],
    createdAt: now,
    updatedAt: now,
    completion: 100,
  },
  {
    id: 'r4',
    name: '草木染绿调',
    description: '槐花与靛蓝叠染自然绿',
    dyeType: 'mordant',
    fabricType: '麻',
    steps: [
      { id: 's4a', materialId: 'd15', materialName: '槐花', weightGrams: 18, mordantName: '明矾', mordantConcentration: 10, duration: 50, temperature: 75 },
      { id: 's4b', materialId: 'd2', materialName: '靛蓝', weightGrams: 8, mordantName: '石灰', mordantConcentration: 5, duration: 15, temperature: 25 },
    ],
    createdAt: now,
    updatedAt: now,
    completion: 100,
  },
  {
    id: 'r5',
    name: '苏木紫罗兰',
    description: '苏木配合铁矾染紫色调',
    dyeType: 'mordant',
    fabricType: '丝',
    steps: [
      { id: 's5', materialId: 'd5', materialName: '苏木', weightGrams: 12, mordantName: '铁矾', mordantConcentration: 5, duration: 55, temperature: 70 },
    ],
    createdAt: now,
    updatedAt: now,
    completion: 100,
  },
];
