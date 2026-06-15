export type EventTag = '景点' | '美食' | '交通';

export interface TripEvent {
  id: string;
  title: string;
  location: string;
  locationThumbnail?: string;
  startTime: string;
  endTime: string;
  notes: string;
  tags: EventTag[];
  createdAt: string;
  updatedAt: string;
  order: number;
  cost?: number;
}

export interface TripDay {
  date: string;
  events: TripEvent[];
  totalCost: number;
}

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  online: boolean;
}

export interface OperationRecord {
  id: string;
  operatorId: string;
  operatorName: string;
  operatorAvatar: string;
  action: 'add' | 'update' | 'delete' | 'reorder';
  eventTitle: string;
  timestamp: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  budget: number;
  totalSpent: number;
  days: TripDay[];
  members: TeamMember[];
  history: OperationRecord[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface SocketEventPayload {
  tripId: string;
  event?: TripEvent;
  day?: TripDay;
  dayDate?: string;
  eventId?: string;
  operatorId: string;
  timestamp: string;
}

export const TAG_COLORS: Record<EventTag, string> = {
  '景点': '#3b82f6',
  '美食': '#f97316',
  '交通': '#10b981',
};
