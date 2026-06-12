export type AnimalStatus = 'available' | 'reserved' | 'adopted';
export type HealthRecordType = 'vaccine' | 'deworming' | 'checkup' | 'treatment';
export type AdoptionStatus = 'pending' | 'approved' | 'rejected';
export type HousingType = 'own' | 'rental';
export type Gender = 'male' | 'female';

export interface HealthRecord {
  id: string;
  animalId: string;
  type: HealthRecordType;
  date: string;
  notes: string;
  weight: number;
}

export interface Animal {
  id: string;
  name: string;
  breed: string;
  age: number;
  gender: Gender;
  color: string;
  photoUrl: string;
  intakeDate: string;
  personality: string;
  status: AnimalStatus;
  healthRecords: HealthRecord[];
}

export interface AdoptionApplication {
  id: string;
  animalId: string;
  animalName?: string;
  applicantName: string;
  phone: string;
  housingType: HousingType;
  hasPetExperience: boolean;
  reason: string;
  status: AdoptionStatus;
  reviewNotes: string;
  createdAt: string;
}

export interface User {
  username: string;
  role: 'admin' | 'visitor';
  token: string;
}
