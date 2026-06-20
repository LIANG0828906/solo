export type EquipmentType = 'oven' | 'stove' | 'microwave' | 'riceCooker' | 'blender';

export interface EquipmentLimit {
  type: EquipmentType;
  name: string;
  maxCount: number;
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  equipmentType: EquipmentType;
  startTime: Date;
  endTime: Date;
  purpose: string;
  createdAt: Date;
}

export interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate: Date;
  storageLocation: string;
  addedAt: Date;
}

export interface ConflictItem {
  equipmentType: EquipmentType;
  equipmentName: string;
  requestedCount: number;
  currentCount: number;
  maxCount: number;
  conflictingReservations: string[];
}

export type TimeRange = {
  start: Date;
  end: Date;
};
