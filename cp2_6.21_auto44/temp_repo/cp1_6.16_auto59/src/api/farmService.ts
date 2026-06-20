import { v4 as uuidv4 } from 'uuid';

export type GrowthStage = 'seed' | 'seedling' | 'growing' | 'flowering' | 'mature';

export type CropType = 'vegetable' | 'fruit';

export interface CropInfo {
  id: string;
  name: string;
  type: CropType;
  image: string;
  adoptionDate: string;
  expectedHarvestDate: string;
  currentStage: GrowthStage;
  location: string;
  farmerName: string;
  description: string;
}

export interface GrowthRecord {
  id: string;
  stage: GrowthStage;
  stageName: string;
  date: string;
  isCompleted: boolean;
}

export interface CropPhoto {
  id: string;
  url: string;
  uploadDate: string;
  note: string;
  farmerName: string;
  stage: GrowthStage;
}

export interface CropTimeline {
  records: GrowthRecord[];
  photos: CropPhoto[];
}

export interface WateringRequest {
  id: string;
  cropId: string;
  requestedAt: string;
  status: 'pending' | 'accepted' | 'completed';
  videoUrl?: string;
}

const cropPlaceholderImages: Record<CropType, string[]> = {
  vegetable: [
    'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=600&h=400&fit=crop'
  ],
  fruit: [
    'https://images.unsplash.com/photo-1553456558-aff63285bdd1?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=600&h=400&fit=crop',
    'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&h=400&fit=crop'
  ]
};

const photoGallery: string[] = [
  'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=800&h=700&fit=crop',
  'https://images.unsplash.com/photo-1592419044706-39796d40f98c?w=600&h=900&fit=crop',
  'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=700&h=800&fit=crop',
  'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=800&h=600&fit=crop',
  'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=800&fit=crop'
];

const stageConfig: Record<GrowthStage, { name: string; color: string }> = {
  seed: { name: '种子期', color: 'seed' },
  seedling: { name: '幼苗期', color: 'seedling' },
  growing: { name: '生长期', color: 'growing' },
  flowering: { name: '花果期', color: 'flowering' },
  mature: { name: '成熟期', color: 'mature' }
};

const mockCrops: CropInfo[] = [
  {
    id: 'crop-001',
    name: '有机西红柿',
    type: 'vegetable',
    image: cropPlaceholderImages.vegetable[0],
    adoptionDate: '2026-03-15',
    expectedHarvestDate: '2026-07-20',
    currentStage: 'growing',
    location: '阳光农场 · A区3号地块',
    farmerName: '李大叔',
    description: '采用传统有机种植方式，不使用化学农药，自然成熟的沙瓤西红柿。'
  },
  {
    id: 'crop-002',
    name: '红富士苹果树',
    type: 'fruit',
    image: cropPlaceholderImages.fruit[0],
    adoptionDate: '2026-02-10',
    expectedHarvestDate: '2026-10-25',
    currentStage: 'flowering',
    location: '青山果园 · B区7号树',
    farmerName: '王伯伯',
    description: '树龄8年的红富士苹果树，阳光充足，果实甜脆多汁。'
  },
  {
    id: 'crop-003',
    name: '水果黄瓜',
    type: 'vegetable',
    image: cropPlaceholderImages.vegetable[1],
    adoptionDate: '2026-04-05',
    expectedHarvestDate: '2026-06-30',
    currentStage: 'seedling',
    location: '阳光农场 · A区8号地块',
    farmerName: '李大叔',
    description: '清脆爽口的水果黄瓜，可以直接生吃的健康小零食。'
  },
  {
    id: 'crop-004',
    name: '蜜橘树',
    type: 'fruit',
    image: cropPlaceholderImages.fruit[1],
    adoptionDate: '2026-01-20',
    expectedHarvestDate: '2026-11-15',
    currentStage: 'seed',
    location: '青山果园 · C区2号树',
    farmerName: '王伯伯',
    description: '皮薄多汁的蜜橘，甜度高，富含维生素C。'
  },
  {
    id: 'crop-005',
    name: '紫茄子',
    type: 'vegetable',
    image: cropPlaceholderImages.vegetable[2],
    adoptionDate: '2026-02-28',
    expectedHarvestDate: '2026-06-15',
    currentStage: 'mature',
    location: '阳光农场 · B区5号地块',
    farmerName: '张阿姨',
    description: '肉质细嫩的紫皮茄子，适合红烧或清蒸。'
  },
  {
    id: 'crop-006',
    name: '水蜜桃树苗',
    type: 'fruit',
    image: cropPlaceholderImages.fruit[2],
    adoptionDate: '2026-03-20',
    expectedHarvestDate: '2026-08-10',
    currentStage: 'growing',
    location: '青山果园 · A区12号树',
    farmerName: '王伯伯',
    description: '江南水蜜桃，果肉柔软多汁，香气浓郁。'
  }
];

const farmerNotes = [
  '今天天气真好，阳光充足，小苗长得很精神~',
  '早上浇了水，土壤湿度刚刚好，继续加油哦！',
  '发现了几个小蚜虫，用大蒜水喷洒了一下，环保又有效。',
  '今天给它搭了个小架子，以后就可以往上爬啦~',
  '开花了开花了！好期待结果的样子！',
  '小果子冒出来了，每天来看都有新变化！',
  '最近雨水多，注意排水，根要好好呼吸才行。',
  '成熟啦！红彤彤的真好看，等着你来采摘~'
];

function delay<T>(data: T, ms: number = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), ms));
}

export function getCropInfo(userId: string = 'user-default'): Promise<CropInfo[]> {
  return delay(mockCrops, 800);
}

export function getCropTimeline(cropId: string): Promise<CropTimeline> {
  const crop = mockCrops.find((c) => c.id === cropId);
  if (!crop) {
    return Promise.reject(new Error('作物不存在'));
  }

  const stages: GrowthStage[] = ['seed', 'seedling', 'growing', 'flowering', 'mature'];
  const currentIndex = stages.indexOf(crop.currentStage);

  const records: GrowthRecord[] = stages.map((stage, index) => {
    const baseDate = new Date(crop.adoptionDate);
    baseDate.setDate(baseDate.getDate() + index * 25);
    return {
      id: `record-${uuidv4().slice(0, 8)}`,
      stage,
      stageName: stageConfig[stage].name,
      date: baseDate.toISOString().split('T')[0],
      isCompleted: index <= currentIndex
    };
  });

  const photoCount = Math.min(8, (currentIndex + 1) * 2);
  const photos: CropPhoto[] = Array.from({ length: photoCount }, (_, i) => {
    const baseDate = new Date(crop.adoptionDate);
    baseDate.setDate(baseDate.getDate() + i * 12 + Math.floor(Math.random() * 5));
    const photoStageIndex = Math.min(Math.floor((i / photoCount) * (currentIndex + 1)), currentIndex);
    return {
      id: `photo-${uuidv4().slice(0, 8)}`,
      url: photoGallery[i % photoGallery.length],
      uploadDate: baseDate.toISOString().split('T')[0],
      note: farmerNotes[i % farmerNotes.length],
      farmerName: crop.farmerName,
      stage: stages[photoStageIndex]
    };
  });

  return delay({ records, photos }, 600);
}

export function requestWatering(cropId: string): Promise<WateringRequest> {
  const request: WateringRequest = {
    id: `watering-${uuidv4().slice(0, 8)}`,
    cropId,
    requestedAt: new Date().toISOString(),
    status: 'pending'
  };
  return delay(request, 500);
}

export function getStageColor(stage: GrowthStage): string {
  return stageConfig[stage].color;
}

export function getStageName(stage: GrowthStage): string {
  return stageConfig[stage].name;
}
