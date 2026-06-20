export interface User {
  id: string;
  username: string;
  email: string;
  role: 'student' | 'instructor';
  avatar?: string;
  bio?: string;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  sessions: number;
  difficulty: '初级' | '中级' | '高级';
  category: '编织' | '陶艺' | '木工' | '扎染';
  price: number;
  capacity: number;
  images: string;
  schedule: string;
  instructor_id: string;
  instructor_name: string;
  instructor_avatar?: string;
  instructor_bio?: string;
  created_at: string;
  enrolled_count: number;
}

export interface Enrollment {
  id: string;
  course_id: string;
  user_id: string;
  user_name: string;
  paid: number;
  created_at: string;
  course_title?: string;
  course_price?: number;
  instructor_name?: string;
}

export interface Material {
  id: string;
  course_id: string;
  name: string;
  specs: string;
  target_quantity: number;
  current_quantity: number;
  deadline: string;
  created_at: string;
}

export interface MaterialSupporter {
  id: string;
  material_id: string;
  user_id: string;
  user_name: string;
  quantity: number;
  created_at: string;
}

export type CategoryType = '编织' | '陶艺' | '木工' | '扎染';
export type DifficultyType = '初级' | '中级' | '高级';
export type PriceRange = '0-50' | '50-100' | '100-200' | '200+' | '';
