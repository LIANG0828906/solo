export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  date: string;
  startTime: string;
  endTime: string;
  equipment: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  purpose: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConflictItem {
  reservationId: string;
  userName: string;
  startTime: string;
  endTime: string;
  equipment: string;
}

export interface Ingredient {
  id: string;
  userId: string;
  userName: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate: string;
  storageLocation: string;
  description?: string;
  isClaimed: boolean;
  claimedBy?: string;
  claimedAt?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'reservation' | 'ingredient' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
}

export interface EquipmentLimit {
  equipment: string;
  maxConcurrent: number;
  timeSlotMinutes: number;
}

export interface CreateReservationRequest {
  date: string;
  startTime: string;
  endTime: string;
  equipment: string;
  purpose: string;
}

export interface CreateIngredientRequest {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate: string;
  storageLocation: string;
  description?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiListResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ErrorResponse {
  success: boolean;
  error: string;
  code?: number;
}

export type TimeSlot = {
  time: string;
  available: boolean;
};
