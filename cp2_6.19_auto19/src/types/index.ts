export interface Member {
  id: string;
  nickname: string;
  avatar: string;
  joinedAt: string;
}

export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  maxCapacity: number;
  currentCount: number;
}

export interface GroupBuy {
  id: string;
  code: string;
  shareLink: string;
  productName: string;
  description: string;
  originalPrice: number;
  groupPrice: number;
  minMembers: number;
  currentMembers: Member[];
  creatorId: string;
  status: 'pending' | 'success' | 'closed';
  createdAt: string;
  endTime: string;
  availableSlots: TimeSlot[];
  assignedSlot?: TimeSlot;
}

export type GroupBuyStatus = 'pending' | 'success' | 'closed';

export interface ScheduleAssignment {
  groupBuyId: string;
  slotId: string;
  assignedAt: string;
}
