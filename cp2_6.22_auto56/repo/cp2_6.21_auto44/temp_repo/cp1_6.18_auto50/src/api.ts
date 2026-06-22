import { v4 as uuidv4 } from 'uuid';
import {
  Pet, PetSpecies, MoodType, ActivityType,
  ActivityRecord, CareTask, TaskStatus, TaskFilter,
  ACTIVITY_DESCRIPTIONS,
} from './types';

const MOCK_PETS: Pet[] = [
  { id: 'pet-1', name: '小橘', species: PetSpecies.Cat, age: 3, avatarIcon: '🐱', mood: MoodType.Happy, moodScore: 3 },
  { id: 'pet-2', name: '旺财', species: PetSpecies.Dog, age: 5, avatarIcon: '🐶', mood: MoodType.Calm, moodScore: 1 },
  { id: 'pet-3', name: '翠翠', species: PetSpecies.Bird, age: 2, avatarIcon: '🐦', mood: MoodType.Happy, moodScore: 4 },
  { id: 'pet-4', name: '团子', species: PetSpecies.Rabbit, age: 1, avatarIcon: '🐰', mood: MoodType.Unhappy, moodScore: -1 },
  { id: 'pet-5', name: '黑豆', species: PetSpecies.Cat, age: 7, avatarIcon: '🐱', mood: MoodType.Calm, moodScore: 0.5 },
  { id: 'pet-6', name: '大黄', species: PetSpecies.Dog, age: 4, avatarIcon: '🐶', mood: MoodType.Happy, moodScore: 2.5 },
  { id: 'pet-7', name: '小鹦', species: PetSpecies.Bird, age: 1, avatarIcon: '🐦', mood: MoodType.Calm, moodScore: 1.5 },
  { id: 'pet-8', name: '棉花', species: PetSpecies.Rabbit, age: 2, avatarIcon: '🐰', mood: MoodType.Happy, moodScore: 3 },
  { id: 'pet-9', name: '花花', species: PetSpecies.Cat, age: 6, avatarIcon: '🐱', mood: MoodType.Unhappy, moodScore: -0.5 },
  { id: 'pet-10', name: '豆豆', species: PetSpecies.Dog, age: 2, avatarIcon: '🐶', mood: MoodType.Happy, moodScore: 5 },
  { id: 'pet-11', name: '啾啾', species: PetSpecies.Bird, age: 3, avatarIcon: '🐦', mood: MoodType.Calm, moodScore: 1 },
  { id: 'pet-12', name: '雪球', species: PetSpecies.Rabbit, age: 4, avatarIcon: '🐰', mood: MoodType.Happy, moodScore: 2 },
];

const MOCK_ACTIVITIES: Record<string, ActivityRecord[]> = {
  'pet-1': [
    { id: 'a-1', petId: 'pet-1', type: ActivityType.Playing, timestamp: '2026-06-18 09:00', description: '和玩具玩得不亦乐乎' },
    { id: 'a-2', petId: 'pet-1', type: ActivityType.Feeding, timestamp: '2026-06-18 10:30', description: '吃了一顿丰盛的饭菜' },
    { id: 'a-3', petId: 'pet-1', type: ActivityType.Walking, timestamp: '2026-06-18 14:00', description: '在草地上奔跑了一会儿' },
    { id: 'a-4', petId: 'pet-1', type: ActivityType.Playing, timestamp: '2026-06-18 16:00', description: '追逐蝴蝶玩得很开心' },
    { id: 'a-5', petId: 'pet-1', type: ActivityType.Resting, timestamp: '2026-06-18 18:00', description: '安静地打了个盹' },
  ],
  'pet-2': [
    { id: 'a-6', petId: 'pet-2', type: ActivityType.Walking, timestamp: '2026-06-18 07:00', description: '在公园里散步了一圈' },
    { id: 'a-7', petId: 'pet-2', type: ActivityType.Feeding, timestamp: '2026-06-18 08:00', description: '享用了美味的零食' },
    { id: 'a-8', petId: 'pet-2', type: ActivityType.Resting, timestamp: '2026-06-18 12:00', description: '在阳光下小憩了一会儿' },
    { id: 'a-9', petId: 'pet-2', type: ActivityType.Walking, timestamp: '2026-06-18 16:00', description: '沿着小路悠闲地走了一趟' },
  ],
  'pet-3': [
    { id: 'a-10', petId: 'pet-3', type: ActivityType.Playing, timestamp: '2026-06-18 08:00', description: '和主人玩了一场追逐游戏' },
    { id: 'a-11', petId: 'pet-3', type: ActivityType.Feeding, timestamp: '2026-06-18 09:30', description: '品尝了特制营养餐' },
    { id: 'a-12', petId: 'pet-3', type: ActivityType.Playing, timestamp: '2026-06-18 11:00', description: '发现了新的玩具很开心' },
    { id: 'a-13', petId: 'pet-3', type: ActivityType.Playing, timestamp: '2026-06-18 15:00', description: '和玩具玩得不亦乐乎' },
  ],
  'pet-4': [
    { id: 'a-14', petId: 'pet-4', type: ActivityType.Resting, timestamp: '2026-06-18 08:00', description: '安静地打了个盹' },
    { id: 'a-15', petId: 'pet-4', type: ActivityType.Feeding, timestamp: '2026-06-18 09:00', description: '喝了新鲜的水' },
    { id: 'a-16', petId: 'pet-4', type: ActivityType.Resting, timestamp: '2026-06-18 13:00', description: '靠在软垫上休息' },
    { id: 'a-17', petId: 'pet-4', type: ActivityType.Resting, timestamp: '2026-06-18 17:00', description: '舒舒服服地躺了下来' },
  ],
};

const MOCK_TASKS: CareTask[] = [
  { id: 'task-1', petId: 'pet-1', petName: '小橘', startDate: '2026-06-19', endDate: '2026-06-20', durationHours: 8, applicantCount: 2, status: TaskStatus.Open },
  { id: 'task-2', petId: 'pet-2', petName: '旺财', startDate: '2026-06-20', endDate: '2026-06-21', durationHours: 12, applicantCount: 1, status: TaskStatus.Open },
  { id: 'task-3', petId: 'pet-3', petName: '翠翠', startDate: '2026-06-19', endDate: '2026-06-19', durationHours: 4, applicantCount: 3, status: TaskStatus.Open },
  { id: 'task-4', petId: 'pet-4', petName: '团子', startDate: '2026-06-21', endDate: '2026-06-22', durationHours: 6, applicantCount: 0, status: TaskStatus.Open },
  { id: 'task-5', petId: 'pet-5', petName: '黑豆', startDate: '2026-06-22', endDate: '2026-06-23', durationHours: 10, applicantCount: 1, status: TaskStatus.Open },
  { id: 'task-6', petId: 'pet-6', petName: '大黄', startDate: '2026-06-19', endDate: '2026-06-20', durationHours: 16, applicantCount: 0, status: TaskStatus.Open },
  { id: 'task-7', petId: 'pet-7', petName: '小鹦', startDate: '2026-06-23', endDate: '2026-06-24', durationHours: 3, applicantCount: 2, status: TaskStatus.Open },
  { id: 'task-8', petId: 'pet-8', petName: '棉花', startDate: '2026-06-20', endDate: '2026-06-21', durationHours: 5, applicantCount: 1, status: TaskStatus.Open },
];

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

let activitiesDB: Record<string, ActivityRecord[]> = { ...MOCK_ACTIVITIES };
let tasksDB: CareTask[] = [...MOCK_TASKS];

export async function getPets(): Promise<Pet[]> {
  await delay(200);
  return [...MOCK_PETS];
}

export async function getTasks(filters?: TaskFilter): Promise<CareTask[]> {
  await delay(150);
  let results = [...tasksDB];
  if (filters?.startDate) {
    results = results.filter(t => t.startDate >= filters.startDate!);
  }
  if (filters?.endDate) {
    results = results.filter(t => t.endDate <= filters.endDate!);
  }
  if (filters?.durationHours !== undefined) {
    results = results.filter(t => t.durationHours <= filters.durationHours!);
  }
  return results;
}

export async function submitCareApplication(taskId: string): Promise<{ success: boolean }> {
  await delay(300);
  const task = tasksDB.find(t => t.id === taskId);
  if (task && task.status === TaskStatus.Open) {
    task.applicantCount += 1;
    task.status = TaskStatus.Pending;
    return { success: true };
  }
  return { success: false };
}

export async function updateActivityLog(petId: string, activityType: ActivityType): Promise<ActivityRecord> {
  await delay(100);
  const descriptions = ACTIVITY_DESCRIPTIONS[activityType];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  const record: ActivityRecord = {
    id: uuidv4(),
    petId,
    type: activityType,
    timestamp: new Date().toLocaleString('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    }),
    description,
  };
  if (!activitiesDB[petId]) {
    activitiesDB[petId] = [];
  }
  activitiesDB[petId].push(record);
  return record;
}

export async function getActivities(petId: string): Promise<ActivityRecord[]> {
  await delay(100);
  return activitiesDB[petId] ? [...activitiesDB[petId]] : [];
}
