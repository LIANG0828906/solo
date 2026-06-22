export enum PetSpecies {
  Cat = 'cat',
  Dog = 'dog',
  Bird = 'bird',
  Rabbit = 'rabbit',
}

export enum ActivityType {
  Feeding = 'feeding',
  Walking = 'walking',
  Playing = 'playing',
  Resting = 'resting',
}

export enum MoodType {
  Happy = 'happy',
  Calm = 'calm',
  Unhappy = 'unhappy',
}

export enum TaskStatus {
  Open = 'open',
  Pending = 'pending',
  Confirmed = 'confirmed',
}

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  age: number;
  avatarIcon: string;
  mood: MoodType;
  moodScore: number;
}

export interface ActivityRecord {
  id: string;
  petId: string;
  type: ActivityType;
  timestamp: string;
  description: string;
}

export interface CareTask {
  id: string;
  petId: string;
  petName: string;
  startDate: string;
  endDate: string;
  durationHours: number;
  applicantCount: number;
  status: TaskStatus;
}

export interface TaskFilter {
  startDate?: string;
  endDate?: string;
  durationHours?: number;
}

export const SPECIES_LABELS: Record<PetSpecies, string> = {
  [PetSpecies.Cat]: '猫',
  [PetSpecies.Dog]: '狗',
  [PetSpecies.Bird]: '鸟',
  [PetSpecies.Rabbit]: '兔',
};

export const ACTIVITY_LABELS: Record<ActivityType, string> = {
  [ActivityType.Feeding]: '喂食',
  [ActivityType.Walking]: '散步',
  [ActivityType.Playing]: '玩耍',
  [ActivityType.Resting]: '休息',
};

export const ACTIVITY_WEIGHTS: Record<ActivityType, number> = {
  [ActivityType.Playing]: 2,
  [ActivityType.Walking]: 1,
  [ActivityType.Feeding]: 0.5,
  [ActivityType.Resting]: -0.5,
};

export const ACTIVITY_COLORS: Record<ActivityType, string> = {
  [ActivityType.Feeding]: '#FFD93D',
  [ActivityType.Walking]: '#6BCB77',
  [ActivityType.Playing]: '#4ECDC4',
  [ActivityType.Resting]: '#FF6B6B',
};

export const MOOD_EMOJIS: Record<MoodType, string> = {
  [MoodType.Happy]: '😊',
  [MoodType.Calm]: '😌',
  [MoodType.Unhappy]: '😢',
};

export const MOOD_COLORS: Record<MoodType, string> = {
  [MoodType.Happy]: '#6BCB77',
  [MoodType.Calm]: '#4ECDC4',
  [MoodType.Unhappy]: '#FF6B6B',
};

export const SPECIES_ICONS: Record<PetSpecies, string> = {
  [PetSpecies.Cat]: '🐱',
  [PetSpecies.Dog]: '🐶',
  [PetSpecies.Bird]: '🐦',
  [PetSpecies.Rabbit]: '🐰',
};

export const ACTIVITY_DESCRIPTIONS: Record<ActivityType, string[]> = {
  [ActivityType.Feeding]: ['吃了一顿丰盛的饭菜', '享用了美味的零食', '喝了新鲜的水', '品尝了特制营养餐'],
  [ActivityType.Walking]: ['在公园里散步了一圈', '在草地上奔跑了一会儿', '沿着小路悠闲地走了一趟', '在花园里探索了新路线'],
  [ActivityType.Playing]: ['和玩具玩得不亦乐乎', '追逐蝴蝶玩得很开心', '和主人玩了一场追逐游戏', '发现了新的玩具很开心'],
  [ActivityType.Resting]: ['安静地打了个盹', '在阳光下小憩了一会儿', '靠在软垫上休息', '舒舒服服地躺了下来'],
};

export function calculateMood(records: ActivityRecord[]): { mood: MoodType; moodScore: number } {
  const recent = records.slice(-5);
  if (recent.length === 0) {
    return { mood: MoodType.Calm, moodScore: 0 };
  }
  const score = recent.reduce((sum, r) => sum + ACTIVITY_WEIGHTS[r.type], 0);
  let mood: MoodType;
  if (score > 2) {
    mood = MoodType.Happy;
  } else if (score >= 0) {
    mood = MoodType.Calm;
  } else {
    mood = MoodType.Unhappy;
  }
  return { mood, moodScore: score };
}
