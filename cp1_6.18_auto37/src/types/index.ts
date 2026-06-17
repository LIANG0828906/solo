export type Category = '编织' | '陶艺' | '绘画' | '木工';

export interface ContributedMaterial {
  materialId: string;
  quantity: number;
}

export interface Participant {
  id: string;
  name: string;
  avatar: string;
  contributedMaterials: ContributedMaterial[];
}

export interface MaterialNeed {
  id: string;
  name: string;
  emoji: string;
  requiredQuantity: number;
  contributedQuantity: number;
}

export interface Activity {
  id: string;
  name: string;
  date: string;
  location: string;
  category: Category;
  maxParticipants: number;
  participants: Participant[];
  materials: MaterialNeed[];
  description: string;
}

export interface UserMaterial {
  id: string;
  name: string;
  emoji: string;
  quantity: number;
}

export interface CreateActivityPayload {
  name: string;
  date: string;
  location: string;
  category: Category;
  maxParticipants: number;
  materials: Omit<MaterialNeed, 'id' | 'contributedQuantity'>[];
  description: string;
}

export interface JoinPayload {
  activityId: string;
  contributions: ContributedMaterial[];
}
