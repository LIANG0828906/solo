export interface Pet {
  id: string;
  name: string;
  breed: string;
  gender: 'male' | 'female';
  birthday: string;
  weight: number;
  avatar?: string;
  colorScheme: string;
}

export interface VaccineRecord {
  id: string;
  petId: string;
  name: string;
  date: string;
  nextDueDate: string;
  type: 'vaccine' | 'deworming';
  isDone: boolean;
}

export interface DietRecord {
  id: string;
  petId: string;
  type: 'dry' | 'wet' | 'snack';
  brand: string;
  grams: number;
  timestamp: string;
}

export interface WalkRecord {
  id: string;
  petId: string;
  startLocation: { lat: number; lng: number };
  endLocation: { lat: number; lng: number };
  duration: number;
  notes: string;
  timestamp: string;
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export type DietType = 'dry' | 'wet' | 'snack';
