import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  Plant,
  GrowthRecord,
  AdoptionRequest,
  User,
  Difficulty,
  LightRequirement,
  WaterFrequency,
  RequestStatus,
} from './types';

const currentUser: User = {
  id: 'user-001',
  nickname: '园艺爱好者小王',
  avatar: '',
};

const generateGradientColor = (name: string): string => {
  const colors = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
    'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)',
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[Math.abs(index)];
};

const mockPlants: Plant[] = [
  {
    id: 'plant-001',
    name: '绿萝',
    latinName: 'Epipremnum aureum',
    difficulty: 1,
    lightRequirement: 'low',
    waterFrequency: 'weekly',
    description: '非常好养的室内观叶植物，能有效净化空气。适合放在客厅或书房，耐阴性强。',
    photos: [],
    status: 'available',
    ownerId: 'user-002',
    ownerNickname: '花仙子',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'plant-002',
    name: '多肉植物组合',
    latinName: 'Succulent Mix',
    difficulty: 2,
    lightRequirement: 'high',
    waterFrequency: 'everyOtherDay',
    description: '5盆不同品种的多肉植物，含玉露、熊童子、虹之玉等。颜色丰富，造型可爱。',
    photos: [],
    status: 'available',
    ownerId: 'user-003',
    ownerNickname: '多肉达人',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: 'plant-003',
    name: '龟背竹',
    latinName: 'Monstera deliciosa',
    difficulty: 3,
    lightRequirement: 'medium',
    waterFrequency: 'weekly',
    description: '网红室内植物，叶片有独特的裂口造型，很适合北欧风格家居。',
    photos: [],
    status: 'available',
    ownerId: 'user-004',
    ownerNickname: '植物控',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
  {
    id: 'plant-004',
    name: '发财树',
    latinName: 'Pachira aquatica',
    difficulty: 2,
    lightRequirement: 'medium',
    waterFrequency: 'weekly',
    description: '寓意吉祥的观叶植物，编织树干造型美观，养护简单。',
    photos: [],
    status: 'adopted',
    ownerId: 'user-001',
    ownerNickname: '园艺爱好者小王',
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'plant-005',
    name: '蝴蝶兰',
    latinName: 'Phalaenopsis',
    difficulty: 4,
    lightRequirement: 'medium',
    waterFrequency: 'everyOtherDay',
    description: '优雅的兰花品种，花期长达数月。需要注意温度和湿度控制。',
    photos: [],
    status: 'available',
    ownerId: 'user-005',
    ownerNickname: '兰花迷',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'plant-006',
    name: '茉莉花',
    latinName: 'Jasminum sambac',
    difficulty: 3,
    lightRequirement: 'high',
    waterFrequency: 'daily',
    description: '香气浓郁的传统名花，白色小花清新可爱，适合阳台种植。',
    photos: [],
    status: 'available',
    ownerId: 'user-001',
    ownerNickname: '园艺爱好者小王',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  },
  {
    id: 'plant-007',
    name: '虎皮兰',
    latinName: 'Sansevieria trifasciata',
    difficulty: 1,
    lightRequirement: 'low',
    waterFrequency: 'weekly',
    description: '耐旱耐阴的懒人植物，夜间释放氧气，非常适合卧室摆放。',
    photos: [],
    status: 'available',
    ownerId: 'user-006',
    ownerNickname: '新手园丁',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'plant-008',
    name: '仙人掌盆栽',
    latinName: 'Cactaceae',
    difficulty: 1,
    lightRequirement: 'high',
    waterFrequency: 'weekly',
    description: '造型各异的仙人掌组合，极度耐旱，几乎不需要打理。',
    photos: [],
    status: 'available',
    ownerId: 'user-001',
    ownerNickname: '园艺爱好者小王',
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
];

const mockGrowthRecords: GrowthRecord[] = [
  {
    id: 'gr-001',
    plantId: 'plant-001',
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    description: '今天发现绿萝长出了一片新叶子，嫩绿色的非常可爱！',
  },
  {
    id: 'gr-002',
    plantId: 'plant-001',
    date: new Date(Date.now() - 86400000 * 7).toISOString(),
    description: '给绿萝换了个大一点的花盆，根系已经很发达了。',
  },
  {
    id: 'gr-003',
    plantId: 'plant-001',
    date: new Date(Date.now() - 86400000 * 14).toISOString(),
    description: '第一次浇水，土壤干透了才浇，遵循见干见湿原则。',
  },
  {
    id: 'gr-004',
    plantId: 'plant-003',
    date: new Date(Date.now() - 86400000 * 2).toISOString(),
    description: '龟背竹的新叶子展开了，裂口很完美！',
  },
  {
    id: 'gr-005',
    plantId: 'plant-003',
    date: new Date(Date.now() - 86400000 * 10).toISOString(),
    description: '擦拭了叶片上的灰尘，植物看起来更有精神了。',
  },
];

const mockRequests: AdoptionRequest[] = [
  {
    id: 'req-001',
    plantId: 'plant-004',
    plantName: '发财树',
    applicantId: 'user-007',
    applicantNickname: '绿植新手',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'req-002',
    plantId: 'plant-006',
    plantName: '茉莉花',
    applicantId: 'user-008',
    applicantNickname: '花香爱好者',
    status: 'approved',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'req-003',
    plantId: 'plant-008',
    plantName: '仙人掌盆栽',
    applicantId: 'user-009',
    applicantNickname: '沙漠植物迷',
    status: 'rejected',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
];

interface StoreState {
  currentUser: User;
  plants: Plant[];
  growthRecords: GrowthRecord[];
  adoptionRequests: AdoptionRequest[];
  newPlantIds: string[];

  addPlant: (data: {
    name: string;
    latinName?: string;
    difficulty: Difficulty;
    lightRequirement: LightRequirement;
    waterFrequency: WaterFrequency;
    description: string;
    photos: string[];
  }) => Plant;

  removePlant: (plantId: string) => void;
  getPlantById: (plantId: string) => Plant | undefined;
  getGrowthRecordsByPlantId: (plantId: string) => GrowthRecord[];
  getUserPlants: (userId: string) => Plant[];
  getRequestsForUserPlants: (userId: string) => AdoptionRequest[];

  addAdoptionRequest: (plantId: string) => void;
  updateRequestStatus: (requestId: string, status: RequestStatus) => void;
  hasRequestedPlant: (plantId: string, userId: string) => boolean;

  clearNewPlantMarker: (plantId: string) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  currentUser,
  plants: mockPlants,
  growthRecords: mockGrowthRecords,
  adoptionRequests: mockRequests,
  newPlantIds: [],

  addPlant: (data) => {
    const newPlant: Plant = {
      id: uuidv4(),
      name: data.name,
      latinName: data.latinName || '',
      difficulty: data.difficulty,
      lightRequirement: data.lightRequirement,
      waterFrequency: data.waterFrequency,
      description: data.description,
      photos: data.photos,
      status: 'available',
      ownerId: get().currentUser.id,
      ownerNickname: get().currentUser.nickname,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      plants: [newPlant, ...state.plants],
      newPlantIds: [...state.newPlantIds, newPlant.id],
    }));
    return newPlant;
  },

  removePlant: (plantId) => {
    set((state) => ({
      plants: state.plants.filter((p) => p.id !== plantId),
    }));
  },

  getPlantById: (plantId) => {
    return get().plants.find((p) => p.id === plantId);
  },

  getGrowthRecordsByPlantId: (plantId) => {
    return get()
      .growthRecords.filter((r) => r.plantId === plantId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getUserPlants: (userId) => {
    return get().plants.filter((p) => p.ownerId === userId);
  },

  getRequestsForUserPlants: (userId) => {
    const userPlantIds = get()
      .getUserPlants(userId)
      .map((p) => p.id);
    return get()
      .adoptionRequests.filter((r) => userPlantIds.includes(r.plantId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  addAdoptionRequest: (plantId) => {
    const plant = get().getPlantById(plantId);
    if (!plant) return;
    const newRequest: AdoptionRequest = {
      id: uuidv4(),
      plantId,
      plantName: plant.name,
      plantPhoto: plant.photos[0],
      applicantId: get().currentUser.id,
      applicantNickname: get().currentUser.nickname,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      adoptionRequests: [...state.adoptionRequests, newRequest],
    }));
  },

  updateRequestStatus: (requestId, status) => {
    set((state) => ({
      adoptionRequests: state.adoptionRequests.map((r) =>
        r.id === requestId ? { ...r, status } : r
      ),
    }));
  },

  hasRequestedPlant: (plantId, userId) => {
    return get().adoptionRequests.some(
      (r) => r.plantId === plantId && r.applicantId === userId
    );
  },

  clearNewPlantMarker: (plantId) => {
    set((state) => ({
      newPlantIds: state.newPlantIds.filter((id) => id !== plantId),
    }));
  },
}));

export { generateGradientColor };
