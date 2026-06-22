export interface StatusUpdate {
  status: string;
  timestamp: string;
  note?: string;
  repairer?: string;
}

export interface Repair {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  images: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  repairer?: string;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusUpdate[];
}

export interface Stats {
  totalCount: number;
  statusCounts: Record<string, number>;
  priorityCounts: Record<string, number>;
  dailyCounts: Record<string, number>;
}

export interface FormData {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  images: string[];
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

export type UserRole = 'user' | 'repairer' | 'admin';
