import { v4 as uuidv4 } from 'uuid';

export type PlantLocation = '阳台' | '客厅' | '厨房' | '卧室' | '书房' | '其他';

export interface Plant {
  id: string;
  name: string;
  purchaseDate: string;
  location: PlantLocation;
  photos: string[];
  createdAt: string;
  lastDiagnosisDate?: string;
}

export type SymptomType = '叶片发黄' | '枯萎' | '虫害' | '霉斑' | '生长缓慢' | '烂根';

export type SeverityLevel = 'mild' | 'moderate' | 'severe';

export interface MatchedCause {
  name: string;
  probability: number;
  description: string;
  careMeasures: string[];
  severity: SeverityLevel;
}

export interface DiagnosisResult {
  id: string;
  symptomRecordId: string;
  plantId: string;
  causes: MatchedCause[];
  createdAt: string;
  confirmed: boolean;
}

export interface SymptomRecord {
  id: string;
  plantId: string;
  symptomTypes: SymptomType[];
  occurredDate: string;
  wateringLevel: number;
  fertilizingLevel: number;
  lightLevel: number;
  notes: string;
  createdAt: string;
}

const KEYS = {
  PLANTS: 'plant_doctor_plants',
  SYMPTOMS: 'plant_doctor_symptoms',
  DIAGNOSES: 'plant_doctor_diagnoses',
} as const;

function readKey<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeKey<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to write to localStorage', err);
  }
}

export function getPlants(): Plant[] {
  return readKey<Plant>(KEYS.PLANTS);
}

export function savePlant(plantData: Omit<Plant, 'id' | 'createdAt'>): Plant {
  const plants = getPlants();
  const newPlant: Plant = {
    ...plantData,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  writeKey<Plant>(KEYS.PLANTS, [...plants, newPlant]);
  return newPlant;
}

export function updatePlant(id: string, updates: Partial<Plant>): Plant | null {
  const plants = getPlants();
  const index = plants.findIndex((p) => p.id === id);
  if (index === -1) return null;
  plants[index] = { ...plants[index], ...updates };
  writeKey<Plant>(KEYS.PLANTS, plants);
  return plants[index];
}

export function deletePlant(id: string): void {
  const plants = getPlants().filter((p) => p.id !== id);
  writeKey<Plant>(KEYS.PLANTS, plants);
  const symptoms = getSymptomRecords().filter((s) => s.plantId !== id);
  writeKey<SymptomRecord>(KEYS.SYMPTOMS, symptoms);
  const diagnoses = getDiagnosisResults().filter((d) => d.plantId !== id);
  writeKey<DiagnosisResult>(KEYS.DIAGNOSES, diagnoses);
}

export function getSymptomRecords(): SymptomRecord[] {
  return readKey<SymptomRecord>(KEYS.SYMPTOMS);
}

export function saveSymptomRecord(data: Omit<SymptomRecord, 'id' | 'createdAt'>): SymptomRecord {
  const records = getSymptomRecords();
  const newRecord: SymptomRecord = {
    ...data,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  writeKey<SymptomRecord>(KEYS.SYMPTOMS, [...records, newRecord]);
  return newRecord;
}

export function getDiagnosisResults(): DiagnosisResult[] {
  return readKey<DiagnosisResult>(KEYS.DIAGNOSES);
}

export function saveDiagnosisResult(data: Omit<DiagnosisResult, 'id'>): DiagnosisResult {
  const results = getDiagnosisResults();
  const newResult: DiagnosisResult = {
    ...data,
    id: uuidv4(),
  };
  writeKey<DiagnosisResult>(KEYS.DIAGNOSES, [...results, newResult]);
  return newResult;
}

export function getDiagnosesByPlantId(plantId: string): DiagnosisResult[] {
  return getDiagnosisResults()
    .filter((d) => d.plantId === plantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getSymptomsByPlantId(plantId: string): SymptomRecord[] {
  return getSymptomRecords()
    .filter((s) => s.plantId === plantId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function updateDiagnosisResult(id: string, updates: Partial<DiagnosisResult>): void {
  const results = getDiagnosisResults();
  const index = results.findIndex((d) => d.id === id);
  if (index !== -1) {
    results[index] = { ...results[index], ...updates };
    writeKey<DiagnosisResult>(KEYS.DIAGNOSES, results);
  }
}

const SEED_FLAG_KEY = 'plant_doctor_seeded_v2';

export function hasSeedData(): boolean {
  return localStorage.getItem(SEED_FLAG_KEY) === '1';
}

export function seedSampleData(): void {
  if (hasSeedData()) return;
  const plants = getPlants();
  if (plants.length > 0) {
    localStorage.setItem(SEED_FLAG_KEY, '1');
    return;
  }

  const now = Date.now();
  const daysAgo = (d: number) => new Date(now - d * 86400000).toISOString();

  const p1Id = uuidv4();
  const p2Id = uuidv4();
  const p3Id = uuidv4();

  const samplePlants: Plant[] = [
    {
      id: p1Id,
      name: '龟背竹',
      purchaseDate: '2025-08-15',
      location: '客厅',
      photos: [
        'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=600&h=600&fit=crop',
        'https://images.unsplash.com/photo-1453904300235-0f2f60b13395?w=600&h=600&fit=crop',
      ],
      createdAt: daysAgo(120),
      lastDiagnosisDate: daysAgo(5),
    },
    {
      id: p2Id,
      name: '多肉·玉露',
      purchaseDate: '2026-01-20',
      location: '阳台',
      photos: [
        'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=600&h=600&fit=crop',
      ],
      createdAt: daysAgo(60),
      lastDiagnosisDate: daysAgo(14),
    },
    {
      id: p3Id,
      name: '薄荷',
      purchaseDate: '2026-03-10',
      location: '厨房',
      photos: [
        'https://images.unsplash.com/photo-1628556270448-4d4e4148e1b1?w=600&h=600&fit=crop',
      ],
      createdAt: daysAgo(30),
    },
  ];

  const sampleSymptoms: SymptomRecord[] = [
    {
      id: uuidv4(),
      plantId: p1Id,
      symptomTypes: ['叶片发黄', '生长缓慢'],
      occurredDate: '2026-06-08',
      wateringLevel: 75,
      fertilizingLevel: 20,
      lightLevel: 35,
      notes: '新长的叶片偏黄，老叶尖端干枯',
      createdAt: daysAgo(5),
    },
    {
      id: uuidv4(),
      plantId: p1Id,
      symptomTypes: ['叶片发黄'],
      occurredDate: '2026-04-20',
      wateringLevel: 60,
      fertilizingLevel: 30,
      lightLevel: 40,
      notes: '季节转换期叶片发黄',
      createdAt: daysAgo(45),
    },
    {
      id: uuidv4(),
      plantId: p2Id,
      symptomTypes: ['霉斑', '虫害'],
      occurredDate: '2026-06-01',
      wateringLevel: 40,
      fertilizingLevel: 30,
      lightLevel: 85,
      notes: '叶片表面有白色粉状物，有细小虫子',
      createdAt: daysAgo(14),
    },
  ];

  const sampleDiagnoses: DiagnosisResult[] = [
    {
      id: uuidv4(),
      symptomRecordId: sampleSymptoms[0].id,
      plantId: p1Id,
      causes: [
        {
          name: '浇水过多',
          probability: 0.82,
          description: '土壤长期过湿导致根系缺氧，叶片发黄且生长停滞。建议调整浇水频率，等土壤干透再浇。',
          careMeasures: ['减少浇水频率至每周1-2次', '检查花盆排水孔是否通畅', '将植物移至通风更好的位置', '观察新叶是否逐渐转绿'],
          severity: 'moderate',
        },
        {
          name: '缺肥',
          probability: 0.58,
          description: '土壤养分不足，表现为整体叶片发黄、生长速度明显变慢。',
          careMeasures: ['每月施加一次稀释的观叶营养液', '春秋季换盆时加入缓释肥', '避免一次性施肥过多烧根'],
          severity: 'mild',
        },
        {
          name: '光照不足',
          probability: 0.43,
          description: '长期放在光线较暗处，光合作用不足导致叶片失绿。',
          careMeasures: ['移至明亮散射光处', '每天保证3-4小时温和光照', '避免突然阳光直射灼伤叶片'],
          severity: 'mild',
        },
      ],
      createdAt: daysAgo(5),
      confirmed: true,
    },
    {
      id: uuidv4(),
      symptomRecordId: sampleSymptoms[1].id,
      plantId: p1Id,
      causes: [
        {
          name: '换季适应',
          probability: 0.55,
          description: '春季气温波动导致的正常生理性落叶，通常无需特别处理。',
          careMeasures: ['保持正常养护节奏', '持续观察新叶生长', '及时摘除黄叶节省养分'],
          severity: 'mild',
        },
      ],
      createdAt: daysAgo(45),
      confirmed: true,
    },
    {
      id: uuidv4(),
      symptomRecordId: sampleSymptoms[2].id,
      plantId: p2Id,
      causes: [
        {
          name: '白粉病',
          probability: 0.88,
          description: '潮湿闷热通风差导致的真菌感染，典型症状是叶片表面白粉状霉斑。',
          careMeasures: ['摘除严重病叶并密封丢弃', '喷洒稀释小苏打水溶液（1勺/升水）', '加强通风，拉开与其他植物距离', '避免叶片沾水过夜'],
          severity: 'severe',
        },
        {
          name: '介壳虫',
          probability: 0.67,
          description: '叶片附着的细小虫子会吸食汁液并分泌蜜露，诱发霉菌。',
          careMeasures: ['用棉签蘸酒精擦拭虫体', '喷洒稀释矿物油溶液', '检查叶片背面和缝隙', '隔离防止传染其他植物'],
          severity: 'severe',
        },
      ],
      createdAt: daysAgo(14),
      confirmed: true,
    },
  ];

  writeKey<Plant>(KEYS.PLANTS, samplePlants);
  writeKey<SymptomRecord>(KEYS.SYMPTOMS, sampleSymptoms);
  writeKey<DiagnosisResult>(KEYS.DIAGNOSES, sampleDiagnoses);
  localStorage.setItem(SEED_FLAG_KEY, '1');
}
