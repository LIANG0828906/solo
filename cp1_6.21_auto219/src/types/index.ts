export interface User {
  id: string;
  name: string;
  role: string;
}

export interface Device {
  id: string;
  name: string;
}

export interface Inspection {
  id: string;
  deviceId: string;
  deviceName: string;
  userId: string;
  items: string[];
  abnormalItems: string[];
  description: string;
  photos: string[];
  createdAt: string;
}

export type OrderStatus = 'pending' | 'processing' | 'completed';

export interface Order {
  id: string;
  inspectionId: string;
  deviceId: string;
  deviceName: string;
  status: OrderStatus;
  assigneeId: string | null;
  assigneeName: string | null;
  creatorId: string;
  description: string;
  createdAt: string;
  assignedAt: string | null;
  completedAt: string | null;
}
