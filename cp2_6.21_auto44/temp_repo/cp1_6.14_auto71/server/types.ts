export interface Pet {
  id: string;
  name: string;
  breed: string;
  gender: string;
  birthday: string;
  avatar: string;
  createdAt: string;
}

export interface Record {
  id: string;
  petId: string;
  type: 'feeding' | 'walking' | 'sleeping';
  date: string;
  time: string;
  duration?: number;
  foodType?: string;
  grams?: number;
  route?: string;
  notes?: string;
  createdAt: string;
}

export interface Medical {
  id: string;
  petId: string;
  type: 'vaccine' | 'deworm' | 'checkup' | 'other';
  date: string;
  notes?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface Measurement {
  id: string;
  petId: string;
  date: string;
  weight: number;
  length: number;
  createdAt: string;
}

export interface Database {
  pets: Pet[];
  records: Record[];
  medical: Medical[];
  measurements: Measurement[];
}

export interface ApiResponse<T> {
  code: number;
  message: string;
  data?: T;
}
