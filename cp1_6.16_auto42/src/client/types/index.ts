export interface Animal {
  id: string;
  name: string;
  photos: string[];
  breed: string;
  age: string;
  gender: 'male' | 'female';
  personality: string;
  healthTags: string[];
  station: string;
  adoptionRequirements: string[];
  status: 'available' | 'pending' | 'adopted';
  createdAt: string;
}

export interface AdoptionApplication {
  id: string;
  animalId: string;
  animalName: string;
  applicantId: string;
  applicantName: string;
  personalIntro: string;
  livingSituation: string;
  petExperience: string;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'food' | 'medicine' | 'supplies' | 'equipment';
  quantity: number;
  unit: string;
  expiryDate?: string;
  supplier?: string;
  threshold: number;
  createdAt: string;
}

export interface InventoryLog {
  id: string;
  itemId: string;
  type: 'inbound' | 'outbound';
  quantity: number;
  purpose?: string;
  receiver?: string;
  operatorId: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'adopter' | 'admin' | 'volunteer';
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'new_application' | 'status_update' | 'low_stock';
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface WSMessage {
  type: 'notification' | 'status_update' | 'connected';
  payload: Notification | AdoptionApplication | { message: string };
}

export const breedColors: Record<string, string> = {
  '金毛寻回犬': '#FFE0B2',
  '拉布拉多': '#FFF3E0',
  '中华田园犬': '#FFCCBC',
  '泰迪': '#F8BBD0',
  '比熊': '#E1BEE7',
  '柯基': '#D1C4E9',
  '哈士奇': '#C5CAE9',
  '萨摩耶': '#BBDEFB',
  '边牧': '#B3E5FC',
  '阿拉斯加': '#B2EBF2',
  '布偶猫': '#B2DFDB',
  '英短': '#C8E6C9',
  '美短': '#DCEDC8',
  '橘猫': '#F0F4C3',
  '狸花猫': '#FFF9C4',
  '暹罗猫': '#FFECB3',
  '加菲猫': '#FFE0B2',
  '其他': '#E0E0E0'
};

export const categoryLabels: Record<string, string> = {
  food: '食品',
  medicine: '药品',
  supplies: '日用品',
  equipment: '设备'
};

export const statusLabels: Record<string, { label: string; color: string }> = {
  available: { label: '待领养', color: '#4CAF50' },
  pending: { label: '审核中', color: '#FF9800' },
  adopted: { label: '已领养', color: '#9E9E9E' },
  approved: { label: '已通过', color: '#4CAF50' },
  rejected: { label: '已拒绝', color: '#F44336' }
};
