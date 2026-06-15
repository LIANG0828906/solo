export interface Pet {
  id: string;
  name: string;
  breed: string;
  gender: 'male' | 'female';
  birthday: string;
  avatar: string;
  species: 'dog' | 'cat' | 'other';
  weight?: number;
  description?: string;
  createdAt: string;
}

export interface PetFormData {
  name: string;
  species: 'dog' | 'cat' | 'other';
  breed: string;
  gender: 'male' | 'female';
  birthday: string;
  weight: number;
  description?: string;
  avatar?: File;
}

export type RecordType = 'feeding' | 'walking' | 'sleep' | 'other';

export interface Record {
  id: string;
  petId: string;
  type: RecordType;
  date: string;
  time: string;
  duration?: number;
  foodType?: string;
  grams?: number;
  startTime?: string;
  route?: string;
  note?: string;
  createdAt: string;
}

export interface RecordFormData {
  petId: string;
  type: RecordType;
  date: string;
  time: string;
  duration?: number;
  foodType?: string;
  grams?: number;
  startTime?: string;
  route?: string;
  note?: string;
}

export interface Measurement {
  id: string;
  petId: string;
  date: string;
  weight: number;
  length: number;
  createdAt: string;
}

export interface MeasurementFormData {
  petId: string;
  date: string;
  weight: number;
  length: number;
}

export type MedicalType = 'vaccine' | 'deworm' | 'checkup' | 'other';

export interface Medical {
  id: string;
  petId: string;
  type: MedicalType;
  date: string;
  notes?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface MedicalFormData {
  petId: string;
  type: MedicalType;
  date: string;
  notes?: string;
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}

export type TabType = 'records' | 'medical' | 'growth' | 'album';
