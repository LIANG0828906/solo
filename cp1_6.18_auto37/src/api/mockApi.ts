import type {
  Activity,
  CreateActivityPayload,
  ContributedMaterial,
  UserMaterial,
} from '@/types';
import { v4 as uuidv4 } from 'uuid';

const delay = () =>
  new Promise<void>((resolve) =>
    setTimeout(resolve, Math.floor(Math.random() * 200) + 200)
  );

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    name: '周末毛线编织会',
    date: '2026-06-22',
    location: '朝阳社区',
    category: '编织',
    maxParticipants: 8,
    participants: [
      {
        id: 'p1',
        name: '小红',
        avatar: '👩',
        contributedMaterials: [
          { materialId: 'm1', quantity: 3 },
          { materialId: 'm2', quantity: 2 },
        ],
      },
    ],
    materials: [
      { id: 'm1', name: '毛线', emoji: '🧶', requiredQuantity: 10, contributedQuantity: 3 },
      { id: 'm2', name: '棒针', emoji: '🪡', requiredQuantity: 5, contributedQuantity: 2 },
      { id: 'm3', name: '剪刀', emoji: '✂️', requiredQuantity: 3, contributedQuantity: 0 },
    ],
    description: '一起享受毛线编织的乐趣，初学者也欢迎！',
  },
  {
    id: '2',
    name: '手作陶艺体验日',
    date: '2026-06-25',
    location: '798艺术区',
    category: '陶艺',
    maxParticipants: 12,
    participants: [
      {
        id: 'p2',
        name: '大明',
        avatar: '👨',
        contributedMaterials: [
          { materialId: 'm4', quantity: 2 },
        ],
      },
      {
        id: 'p3',
        name: '小丽',
        avatar: '👧',
        contributedMaterials: [
          { materialId: 'm6', quantity: 3 },
        ],
      },
    ],
    materials: [
      { id: 'm4', name: '陶土', emoji: '🏺', requiredQuantity: 8, contributedQuantity: 2 },
      { id: 'm5', name: '雕刻刀', emoji: '🔪', requiredQuantity: 4, contributedQuantity: 0 },
      { id: 'm6', name: '釉料', emoji: '🎨', requiredQuantity: 6, contributedQuantity: 3 },
    ],
    description: '体验手工陶艺的魅力，制作属于自己的作品！',
  },
  {
    id: '3',
    name: '水彩画初学者工坊',
    date: '2026-06-28',
    location: '海淀书城',
    category: '绘画',
    maxParticipants: 10,
    participants: [
      {
        id: 'p4',
        name: '阿强',
        avatar: '🧑',
        contributedMaterials: [
          { materialId: 'm7', quantity: 2 },
          { materialId: 'm8', quantity: 3 },
        ],
      },
      {
        id: 'p5',
        name: '小美',
        avatar: '👩‍🦰',
        contributedMaterials: [
          { materialId: 'm9', quantity: 5 },
        ],
      },
      {
        id: 'p6',
        name: '老王',
        avatar: '👴',
        contributedMaterials: [
          { materialId: 'm7', quantity: 1 },
        ],
      },
    ],
    materials: [
      { id: 'm7', name: '水彩颜料', emoji: '🎨', requiredQuantity: 6, contributedQuantity: 3 },
      { id: 'm8', name: '画笔', emoji: '🖌️', requiredQuantity: 8, contributedQuantity: 3 },
      { id: 'm9', name: '画纸', emoji: '📄', requiredQuantity: 12, contributedQuantity: 5 },
    ],
    description: '零基础水彩画入门，轻松画出美丽作品！',
  },
  {
    id: '4',
    name: '木作小家具DIY',
    date: '2026-06-30',
    location: '望京SOHO',
    category: '木工',
    maxParticipants: 6,
    participants: [
      {
        id: 'p7',
        name: '大刘',
        avatar: '🧔',
        contributedMaterials: [
          { materialId: 'm10', quantity: 4 },
          { materialId: 'm12', quantity: 5 },
        ],
      },
    ],
    materials: [
      { id: 'm10', name: '木板', emoji: '🪵', requiredQuantity: 10, contributedQuantity: 4 },
      { id: 'm11', name: '砂纸', emoji: '🧻', requiredQuantity: 8, contributedQuantity: 0 },
      { id: 'm12', name: '钉子', emoji: '🔨', requiredQuantity: 15, contributedQuantity: 5 },
    ],
    description: '亲手打造独一无二的木制小家具！',
  },
  {
    id: '5',
    name: '钩针杯垫教学',
    date: '2026-07-03',
    location: '三里屯',
    category: '编织',
    maxParticipants: 10,
    participants: [
      {
        id: 'p8',
        name: '小芳',
        avatar: '👩‍🦱',
        contributedMaterials: [
          { materialId: 'm13', quantity: 2 },
        ],
      },
      {
        id: 'p9',
        name: '阿杰',
        avatar: '👦',
        contributedMaterials: [
          { materialId: 'm14', quantity: 1 },
        ],
      },
    ],
    materials: [
      { id: 'm13', name: '棉线', emoji: '🧶', requiredQuantity: 8, contributedQuantity: 2 },
      { id: 'm14', name: '钩针', emoji: '🪡', requiredQuantity: 5, contributedQuantity: 1 },
    ],
    description: '学习钩针基础技法，制作精美杯垫！',
  },
  {
    id: '6',
    name: '釉下彩绘陶盘',
    date: '2026-07-06',
    location: '通州文创园',
    category: '陶艺',
    maxParticipants: 8,
    participants: [
      {
        id: 'p10',
        name: '小静',
        avatar: '👱‍♀️',
        contributedMaterials: [
          { materialId: 'm15', quantity: 2 },
        ],
      },
    ],
    materials: [
      { id: 'm15', name: '陶盘', emoji: '🍽️', requiredQuantity: 8, contributedQuantity: 2 },
      { id: 'm16', name: '彩绘笔', emoji: '🖌️', requiredQuantity: 6, contributedQuantity: 0 },
      { id: 'm17', name: '釉料', emoji: '🎨', requiredQuantity: 4, contributedQuantity: 0 },
    ],
    description: '在陶盘上绘制釉下彩，创作独特艺术品！',
  },
];

const MOCK_USER_MATERIALS: UserMaterial[] = [
  { id: 'um1', name: '毛线', emoji: '🧶', quantity: 3 },
  { id: 'um2', name: '陶土', emoji: '🏺', quantity: 2 },
  { id: 'um3', name: '水彩颜料', emoji: '🎨', quantity: 1 },
  { id: 'um4', name: '木板', emoji: '🪵', quantity: 4 },
  { id: 'um5', name: '棉线', emoji: '🧶', quantity: 5 },
];

export async function fetchActivities(): Promise<Activity[]> {
  await delay();
  return MOCK_ACTIVITIES;
}

export async function createActivity(
  payload: CreateActivityPayload
): Promise<Activity> {
  await delay();
  const activity: Activity = {
    id: uuidv4(),
    name: payload.name,
    date: payload.date,
    location: payload.location,
    category: payload.category,
    maxParticipants: payload.maxParticipants,
    participants: [],
    materials: payload.materials.map((m) => ({
      id: uuidv4(),
      name: m.name,
      emoji: m.emoji,
      requiredQuantity: m.requiredQuantity,
      contributedQuantity: 0,
    })),
    description: payload.description,
  };
  MOCK_ACTIVITIES.push(activity);
  return activity;
}

export async function joinActivity(
  activityId: string,
  contributions: ContributedMaterial[]
): Promise<Activity> {
  await delay();
  const activity = MOCK_ACTIVITIES.find((a) => a.id === activityId);
  if (!activity) {
    throw new Error(`Activity ${activityId} not found`);
  }
  const participant = {
    id: uuidv4(),
    name: '我',
    avatar: '👤',
    contributedMaterials: contributions,
  };
  activity.participants.push(participant);
  for (const c of contributions) {
    const material = activity.materials.find((m) => m.id === c.materialId);
    if (material) {
      material.contributedQuantity += c.quantity;
    }
  }
  return activity;
}

export async function fetchUserMaterials(): Promise<UserMaterial[]> {
  await delay();
  return MOCK_USER_MATERIALS;
}

export async function addUserMaterial(
  name: string,
  emoji: string,
  quantity: number
): Promise<UserMaterial> {
  await delay();
  const material: UserMaterial = { id: uuidv4(), name, emoji, quantity };
  MOCK_USER_MATERIALS.push(material);
  return material;
}

export async function updateUserMaterial(
  id: string,
  quantity: number
): Promise<UserMaterial> {
  await delay();
  const material = MOCK_USER_MATERIALS.find((m) => m.id === id);
  if (!material) {
    throw new Error(`UserMaterial ${id} not found`);
  }
  material.quantity = quantity;
  return material;
}
