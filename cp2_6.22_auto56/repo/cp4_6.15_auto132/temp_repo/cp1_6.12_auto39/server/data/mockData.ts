import { addHours, addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import type { EquipmentLimit, Reservation, Ingredient, EquipmentType } from '../types';

const BASE_DATE = new Date('2026-06-12');

export const equipmentLimits: EquipmentLimit[] = [
  { type: 'oven', name: '烤箱', maxCount: 2 },
  { type: 'stove', name: '灶台', maxCount: 3 },
  { type: 'microwave', name: '微波炉', maxCount: 1 },
  { type: 'riceCooker', name: '电饭煲', maxCount: 2 },
  { type: 'blender', name: '料理机', maxCount: 1 },
];

const createDateTime = (dayOffset: number, hour: number, minute: number = 0): Date => {
  return setMinutes(setHours(addDays(startOfDay(BASE_DATE), dayOffset), hour), minute);
};

export const mockReservations: Reservation[] = [
  {
    id: 'res-001',
    userId: 'user-001',
    userName: '张三',
    equipmentType: 'oven',
    startTime: createDateTime(0, 10, 0),
    endTime: createDateTime(0, 12, 0),
    purpose: '烤蛋糕',
    createdAt: createDateTime(-1, 15, 30),
  },
  {
    id: 'res-002',
    userId: 'user-002',
    userName: '李四',
    equipmentType: 'oven',
    startTime: createDateTime(0, 11, 0),
    endTime: createDateTime(0, 13, 0),
    purpose: '烤披萨',
    createdAt: createDateTime(-1, 16, 0),
  },
  {
    id: 'res-003',
    userId: 'user-003',
    userName: '王五',
    equipmentType: 'stove',
    startTime: createDateTime(0, 18, 0),
    endTime: createDateTime(0, 20, 0),
    purpose: '做晚饭',
    createdAt: createDateTime(0, 9, 0),
  },
  {
    id: 'res-004',
    userId: 'user-004',
    userName: '赵六',
    equipmentType: 'microwave',
    startTime: createDateTime(1, 12, 0),
    endTime: createDateTime(1, 12, 30),
    purpose: '热午饭',
    createdAt: createDateTime(0, 10, 0),
  },
  {
    id: 'res-005',
    userId: 'user-005',
    userName: '孙七',
    equipmentType: 'riceCooker',
    startTime: createDateTime(2, 17, 0),
    endTime: createDateTime(2, 19, 0),
    purpose: '煮饭',
    createdAt: createDateTime(1, 14, 0),
  },
  {
    id: 'res-006',
    userId: 'user-006',
    userName: '周八',
    equipmentType: 'blender',
    startTime: createDateTime(0, 8, 0),
    endTime: createDateTime(0, 8, 30),
    purpose: '做果汁',
    createdAt: createDateTime(-2, 20, 0),
  },
];

export const mockIngredients: Ingredient[] = [
  {
    id: 'ing-001',
    name: '牛奶',
    quantity: 2,
    unit: 'L',
    category: '乳制品',
    expiryDate: addHours(BASE_DATE, 12),
    storageLocation: '冷藏柜A区',
    addedAt: createDateTime(-3, 10, 0),
  },
  {
    id: 'ing-002',
    name: '鸡蛋',
    quantity: 30,
    unit: '个',
    category: '蛋类',
    expiryDate: addHours(BASE_DATE, 20),
    storageLocation: '冷藏柜B区',
    addedAt: createDateTime(-2, 15, 0),
  },
  {
    id: 'ing-003',
    name: '西红柿',
    quantity: 5,
    unit: 'kg',
    category: '蔬菜',
    expiryDate: addDays(BASE_DATE, -1),
    storageLocation: '蔬菜架',
    addedAt: createDateTime(-5, 9, 0),
  },
  {
    id: 'ing-004',
    name: '土豆',
    quantity: 3,
    unit: 'kg',
    category: '蔬菜',
    expiryDate: addDays(BASE_DATE, 7),
    storageLocation: '蔬菜架',
    addedAt: createDateTime(-1, 11, 0),
  },
  {
    id: 'ing-005',
    name: '鸡胸肉',
    quantity: 2,
    unit: 'kg',
    category: '肉类',
    expiryDate: addHours(BASE_DATE, 6),
    storageLocation: '冷冻柜',
    addedAt: createDateTime(-1, 14, 0),
  },
  {
    id: 'ing-006',
    name: '大米',
    quantity: 10,
    unit: 'kg',
    category: '主食',
    expiryDate: addDays(BASE_DATE, 30),
    storageLocation: '干货区',
    addedAt: createDateTime(-7, 10, 0),
  },
  {
    id: 'ing-007',
    name: '豆腐',
    quantity: 4,
    unit: '盒',
    category: '豆制品',
    expiryDate: addHours(BASE_DATE, 18),
    storageLocation: '冷藏柜A区',
    addedAt: createDateTime(-2, 16, 0),
  },
  {
    id: 'ing-008',
    name: '苹果',
    quantity: 20,
    unit: '个',
    category: '水果',
    expiryDate: addDays(BASE_DATE, 5),
    storageLocation: '水果架',
    addedAt: createDateTime(-1, 9, 0),
  },
  {
    id: 'ing-009',
    name: '面包',
    quantity: 2,
    unit: '袋',
    category: '主食',
    expiryDate: addDays(BASE_DATE, -2),
    storageLocation: '常温架',
    addedAt: createDateTime(-4, 10, 0),
  },
  {
    id: 'ing-010',
    name: '生菜',
    quantity: 1,
    unit: 'kg',
    category: '蔬菜',
    expiryDate: addHours(BASE_DATE, 3),
    storageLocation: '蔬菜架',
    addedAt: createDateTime(-1, 12, 0),
  },
  {
    id: 'ing-011',
    name: '橄榄油',
    quantity: 1,
    unit: '瓶',
    category: '调料',
    expiryDate: addDays(BASE_DATE, 60),
    storageLocation: '调料区',
    addedAt: createDateTime(-10, 10, 0),
  },
  {
    id: 'ing-012',
    name: '酸奶',
    quantity: 6,
    unit: '杯',
    category: '乳制品',
    expiryDate: addHours(BASE_DATE, 10),
    storageLocation: '冷藏柜B区',
    addedAt: createDateTime(-3, 14, 0),
  },
];

export const getEquipmentName = (type: EquipmentType): string => {
  const limit = equipmentLimits.find(l => l.type === type);
  return limit?.name || type;
};

export const getEquipmentLimit = (type: EquipmentType): number => {
  const limit = equipmentLimits.find(l => l.type === type);
  return limit?.maxCount || 0;
};
