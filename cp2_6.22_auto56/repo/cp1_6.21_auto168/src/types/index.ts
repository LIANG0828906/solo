export type SkillCategory =
  | '前端'
  | '后端'
  | '设计'
  | '沟通'
  | '产品'
  | '测试'
  | '运维'
  | '数据分析'
  | '项目管理'
  | '其他';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  skills?: Skill[];
  averageRating?: number;
  reviewCount?: number;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: SkillCategory;
  teacherId: string;
  teacher?: User;
  createdAt: string;
}

export interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  teacherId: string;
  skillId: string;
}

export interface Booking {
  id: string;
  skillId: string;
  skill?: Skill;
  studentId: string;
  student?: User;
  teacherId: string;
  teacher?: User;
  startTime: string;
  endTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  review?: Review;
  createdAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  reviewerId: string;
  reviewer?: User;
  revieweeId: string;
  reviewee?: User;
  rating: number;
  comment?: string;
  createdAt: string;
}
