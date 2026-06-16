export enum PetStatus {
  AVAILABLE = 'available',
  PENDING = 'pending',
  ADOPTED = 'adopted',
}

export enum ApplicationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export type HousingType = 'own' | 'rent' | 'other';

export interface Pet {
  id: string;
  name: string;
  breed: string;
  age: number;
  personality: string[];
  imageUrl: string;
  status: PetStatus;
  description: string;
  adoptionCount: number;
}

export interface Application {
  id: string;
  petId: string;
  petName: string;
  applicantName: string;
  phone: string;
  housingType: HousingType;
  experience: string;
  status: ApplicationStatus;
  submitTime: number;
  remark?: string;
}

export interface AppState {
  pets: Pet[];
  applications: Application[];
}

export type ApplicationFilter = 'all' | 'pending' | 'approved' | 'rejected';

export interface FormData {
  name: string;
  phone: string;
  housingType: HousingType;
  experience: string;
}

export interface FormErrors {
  name?: string;
  phone?: string;
  housingType?: string;
  experience?: string;
}
