import {
  Pet,
  AdoptionApplication,
  AdoptionProgress,
  ApplicationStatus,
  Stage,
  Gender,
  VaccineStatus,
  FilterOptions,
  STAGE_NAMES,
  StageInfo,
} from './types';

const PETS_KEY = 'adoption_pets';
const APPLICATIONS_KEY = 'adoption_applications';
const PROGRESS_KEY = 'adoption_progress';

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
}

const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600',
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600',
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=600',
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600',
  'https://images.unsplash.com/photo-1560807707-8cc77767d783?w=600',
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600',
];

const initialPets: Pet[] = [
  {
    id: generateId(),
    name: '小白',
    breed: '中华田园犬',
    ageYears: 1,
    ageMonths: 6,
    gender: Gender.MALE,
    weight: 12.5,
    neutered: true,
    vaccineStatus: VaccineStatus.FULLY_VACCINATED,
    personalityTags: ['温顺', '友好', '活泼'],
    photos: [PLACEHOLDER_IMAGES[0], PLACEHOLDER_IMAGES[1]],
    description: '小白是一只非常亲人的狗狗，喜欢和人互动，会简单的指令，适合家庭饲养。身体健康，已完成全部疫苗接种。',
    status: 'available',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: '团子',
    breed: '布偶猫',
    ageYears: 0,
    ageMonths: 8,
    gender: Gender.FEMALE,
    weight: 3.2,
    neutered: false,
    vaccineStatus: VaccineStatus.PARTIALLY_VACCINATED,
    personalityTags: ['粘人', '安静', '温顺'],
    photos: [PLACEHOLDER_IMAGES[4], PLACEHOLDER_IMAGES[5]],
    description: '团子是一只软糯的布偶猫，毛发柔软，性格温和，喜欢被抚摸。正在等待一个温暖的家。',
    status: 'available',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: '大黄',
    breed: '金毛寻回犬',
    ageYears: 3,
    ageMonths: 2,
    gender: Gender.MALE,
    weight: 28.0,
    neutered: true,
    vaccineStatus: VaccineStatus.FULLY_VACCINATED,
    personalityTags: ['温顺', '友好', '勇敢'],
    photos: [PLACEHOLDER_IMAGES[2], PLACEHOLDER_IMAGES[3]],
    description: '大黄性格温顺，对小孩特别友好，是绝佳的家庭伴侣犬。训练有素，会多种指令。',
    status: 'available',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: '小橘',
    breed: '橘猫',
    ageYears: 2,
    ageMonths: 0,
    gender: Gender.MALE,
    weight: 5.5,
    neutered: true,
    vaccineStatus: VaccineStatus.FULLY_VACCINATED,
    personalityTags: ['活泼', '好奇', '独立'],
    photos: [PLACEHOLDER_IMAGES[6], PLACEHOLDER_IMAGES[7]],
    description: '小橘是个活泼好动的橘猫，喜欢玩逗猫棒，吃饭也很香。适应能力强，适合新手铲屎官。',
    status: 'available',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: '奶茶',
    breed: '英国短毛猫',
    ageYears: 1,
    ageMonths: 2,
    gender: Gender.FEMALE,
    weight: 4.0,
    neutered: true,
    vaccineStatus: VaccineStatus.FULLY_VACCINATED,
    personalityTags: ['安静', '独立', '温顺'],
    photos: [PLACEHOLDER_IMAGES[5], PLACEHOLDER_IMAGES[4]],
    description: '奶茶性格安静独立，不吵闹，喜欢在窗台晒太阳。圆圆的脸蛋非常可爱。',
    status: 'available',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: '豆豆',
    breed: '柴犬',
    ageYears: 2,
    ageMonths: 8,
    gender: Gender.MALE,
    weight: 10.0,
    neutered: true,
    vaccineStatus: VaccineStatus.FULLY_VACCINATED,
    personalityTags: ['独立', '勇敢', '好奇'],
    photos: [PLACEHOLDER_IMAGES[3], PLACEHOLDER_IMAGES[2]],
    description: '豆豆是一只典型的柴犬，性格有点傲娇但非常聪明，需要有经验的主人。',
    status: 'available',
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: '花花',
    breed: '狸花猫',
    ageYears: 0,
    ageMonths: 5,
    gender: Gender.FEMALE,
    weight: 2.0,
    neutered: false,
    vaccineStatus: VaccineStatus.NOT_VACCINATED,
    personalityTags: ['活泼', '粘人', '好奇'],
    photos: [PLACEHOLDER_IMAGES[7], PLACEHOLDER_IMAGES[6]],
    description: '花花是救助的流浪小猫，非常粘人，喜欢被抱抱。正在等待疫苗接种，健康活泼。',
    status: 'available',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: generateId(),
    name: '豆豆',
    breed: '柯基',
    ageYears: 4,
    ageMonths: 5,
    gender: Gender.FEMALE,
    weight: 11.0,
    neutered: true,
    vaccineStatus: VaccineStatus.FULLY_VACCINATED,
    personalityTags: ['友好', '活泼', '温顺'],
    photos: [PLACEHOLDER_IMAGES[1], PLACEHOLDER_IMAGES[0]],
    description: '柯基豆豆是个快乐的小短腿，屁股特别有辨识度。喜欢散步和美食。',
    status: 'available',
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

function createDefaultStages(): StageInfo[] {
  const now = new Date();
  return Object.values(STAGE_NAMES).map((_, index) => ({
    stage: index as Stage,
    expectedDate: index === 0 ? now.toISOString() : new Date(now.getTime() + index * 3 * 24 * 60 * 60 * 1000).toISOString(),
    actualDate: index === 0 ? now.toISOString() : null,
    notes: index === 0 ? '申请已成功提交' : '',
  }));
}

const initialApplications: AdoptionApplication[] = [
  {
    id: generateId(),
    petId: initialPets[0].id,
    applicantName: '张三',
    contact: '13800138000',
    housingType: '自有住房',
    hasOtherPets: false,
    reason: '一直想养一只狗狗，家里有院子，有充足时间陪伴。',
    status: ApplicationStatus.APPROVED,
    feedback: '资质审核通过，家庭条件良好，请等待家访安排。',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const initialProgress: AdoptionProgress[] = [
  {
    id: generateId(),
    applicationId: initialApplications[0].id,
    stages: createDefaultStages().map((s, i) => ({
      ...s,
      actualDate: i <= 1 ? s.expectedDate : null,
    })),
    currentStage: Stage.REVIEW,
  },
];

export function initializeData(): void {
  if (!localStorage.getItem(PETS_KEY)) {
    localStorage.setItem(PETS_KEY, JSON.stringify(initialPets));
  }
  if (!localStorage.getItem(APPLICATIONS_KEY)) {
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(initialApplications));
  }
  if (!localStorage.getItem(PROGRESS_KEY)) {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(initialProgress));
  }
}

export function getPets(): Pet[] {
  const data = localStorage.getItem(PETS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getPetById(id: string): Pet | undefined {
  return getPets().find((p) => p.id === id);
}

export function addPet(pet: Omit<Pet, 'id' | 'createdAt'>): Pet {
  const pets = getPets();
  const newPet: Pet = {
    ...pet,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  pets.push(newPet);
  localStorage.setItem(PETS_KEY, JSON.stringify(pets));
  return newPet;
}

export function updatePet(id: string, updates: Partial<Pet>): Pet | null {
  const pets = getPets();
  const index = pets.findIndex((p) => p.id === id);
  if (index === -1) return null;
  pets[index] = { ...pets[index], ...updates };
  localStorage.setItem(PETS_KEY, JSON.stringify(pets));
  return pets[index];
}

export function deletePet(id: string): boolean {
  const pets = getPets();
  const filtered = pets.filter((p) => p.id !== id);
  if (filtered.length === pets.length) return false;
  localStorage.setItem(PETS_KEY, JSON.stringify(filtered));
  return true;
}

export function filterPets(pets: Pet[], filters: FilterOptions): Pet[] {
  return pets.filter((pet) => {
    if (filters.breeds.length > 0 && !filters.breeds.includes(pet.breed)) {
      return false;
    }
    if (filters.personalityTags.length > 0) {
      const hasTag = filters.personalityTags.some((tag) =>
        pet.personalityTags.includes(tag)
      );
      if (!hasTag) return false;
    }
    if (filters.ageRange) {
      const totalMonths = pet.ageYears * 12 + pet.ageMonths;
      if (totalMonths < filters.ageRange[0] || totalMonths > filters.ageRange[1]) {
        return false;
      }
    }
    return true;
  });
}

export function getApplications(): AdoptionApplication[] {
  const data = localStorage.getItem(APPLICATIONS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getApplicationsByPetId(petId: string): AdoptionApplication[] {
  return getApplications().filter((a) => a.petId === petId);
}

export function addApplication(
  app: Omit<AdoptionApplication, 'id' | 'status' | 'feedback' | 'createdAt'>
): AdoptionApplication {
  const apps = getApplications();
  const newApp: AdoptionApplication = {
    ...app,
    id: generateId(),
    status: ApplicationStatus.PENDING,
    feedback: '',
    createdAt: new Date().toISOString(),
  };
  apps.push(newApp);
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));
  return newApp;
}

export function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  feedback: string
): AdoptionApplication | null {
  const apps = getApplications();
  const index = apps.findIndex((a) => a.id === id);
  if (index === -1) return null;
  apps[index] = { ...apps[index], status, feedback };
  localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(apps));

  if (status === ApplicationStatus.APPROVED) {
    const progress = getProgress();
    if (!progress.find((p) => p.applicationId === id)) {
      addProgress(id);
    }
  }
  return apps[index];
}

export function getProgress(): AdoptionProgress[] {
  const data = localStorage.getItem(PROGRESS_KEY);
  return data ? JSON.parse(data) : [];
}

export function getProgressByApplicationId(
  applicationId: string
): AdoptionProgress | undefined {
  return getProgress().find((p) => p.applicationId === applicationId);
}

export function addProgress(applicationId: string): AdoptionProgress {
  const progressList = getProgress();
  const newProgress: AdoptionProgress = {
    id: generateId(),
    applicationId,
    stages: createDefaultStages(),
    currentStage: Stage.SUBMISSION,
  };
  progressList.push(newProgress);
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressList));
  return newProgress;
}

export function updateProgressStage(
  progressId: string,
  stage: Stage,
  notes?: string
): AdoptionProgress | null {
  const progressList = getProgress();
  const index = progressList.findIndex((p) => p.id === progressId);
  if (index === -1) return null;

  const progress = progressList[index];
  const stageIndex = progress.stages.findIndex((s) => s.stage === stage);
  if (stageIndex === -1) return null;

  progress.stages[stageIndex] = {
    ...progress.stages[stageIndex],
    actualDate: new Date().toISOString(),
    notes: notes ?? progress.stages[stageIndex].notes,
  };

  if (stage > progress.currentStage) {
    progress.currentStage = stage;
  }

  progressList[index] = progress;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(progressList));
  return progress;
}

export interface StatsData {
  totalAvailable: number;
  monthlyNew: number;
  monthlyAdopted: number;
  topBreeds: { breed: string; count: number }[];
  monthlyTrend: { month: string; count: number }[];
}

export function getStats(): StatsData {
  const pets = getPets();
  const apps = getApplications();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalAvailable = pets.filter((p) => p.status === 'available').length;
  const monthlyNew = pets.filter(
    (p) => new Date(p.createdAt) >= startOfMonth
  ).length;

  const approvedThisMonth = apps.filter(
    (a) =>
      a.status === ApplicationStatus.APPROVED &&
      new Date(a.createdAt) >= startOfMonth
  ).length;

  const breedCount = new Map<string, number>();
  pets.forEach((p) => {
    breedCount.set(p.breed, (breedCount.get(p.breed) || 0) + 1);
  });
  const topBreeds = Array.from(breedCount.entries())
    .map(([breed, count]) => ({ breed, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const monthlyTrend: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const count = apps.filter(
      (a) =>
        a.status === ApplicationStatus.APPROVED &&
        new Date(a.createdAt) >= d &&
        new Date(a.createdAt) < nextMonth
    ).length;
    monthlyTrend.push({
      month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      count,
    });
  }

  return {
    totalAvailable,
    monthlyNew,
    monthlyAdopted: approvedThisMonth,
    topBreeds,
    monthlyTrend,
  };
}

export function exportData(): string {
  return JSON.stringify(
    {
      pets: getPets(),
      applications: getApplications(),
      progress: getProgress(),
    },
    null,
    2
  );
}

export function importData(json: string): void {
  const data = JSON.parse(json);
  if (data.pets) localStorage.setItem(PETS_KEY, JSON.stringify(data.pets));
  if (data.applications)
    localStorage.setItem(APPLICATIONS_KEY, JSON.stringify(data.applications));
  if (data.progress)
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data.progress));
}
