export type Breed = '泰迪' | '金毛' | '英短' | '布偶' | '比熊' | '柯基' | '美短' | '哈士奇';

export type AvatarEmoji = '🐶' | '🐱' | '🐰' | '🐹';

export interface Pet {
  id: string;
  name: string;
  breed: Breed;
  age: number;
  avatar: AvatarEmoji;
}

export interface Service {
  id: string;
  name: string;
  priceRange: string;
  duration: string;
  color: string;
  icon: string;
}

export interface Appointment {
  id: string;
  petId: string;
  serviceId: string;
  date: string;
  timeSlot: string;
  notes: string;
  status: 'pending' | 'completed';
}

export interface Review {
  id: string;
  appointmentId: string;
  rating: number;
  content: string;
  createdAt: string;
}

export interface ReviewStats {
  totalServices: number;
  averageRating: number;
  recentReviews: Review[];
}

export const BREEDS: Breed[] = ['泰迪', '金毛', '英短', '布偶', '比熊', '柯基', '美短', '哈士奇'];

export const AVATAR_EMOJIS: AvatarEmoji[] = ['🐶', '🐱', '🐰', '🐹'];

export const TIME_SLOTS: string[] = [];
for (let h = 9; h <= 17; h++) {
  TIME_SLOTS.push(`${h}:00`);
}
