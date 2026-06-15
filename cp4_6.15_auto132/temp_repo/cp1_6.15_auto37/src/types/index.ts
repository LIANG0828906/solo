export interface GigMember {
  id: string;
  name: string;
  status: 'confirmed' | 'pending' | 'leave';
}

export interface GigSchedule {
  meetingTime: string;
  soundcheck: string;
  warmup: string;
  performance: string;
  endTime: string;
}

export interface Gig {
  id: string;
  date: string;
  venue: string;
  city: string;
  schedule: GigSchedule;
  members: GigMember[];
  order: number;
}

export type EquipmentType = 'guitar' | 'bass' | 'drums' | 'keyboard' | 'amplifier' | 'other';
export type EquipmentStatus = 'normal' | 'repair' | 'borrowed';

export interface RepairRecord {
  date: string;
  description: string;
}

export interface BorrowRecord {
  date: string;
  borrower: string;
  returnDate?: string | null;
}

export interface Equipment {
  id: string;
  name: string;
  type: EquipmentType;
  purchaseYear: number;
  status: EquipmentStatus;
  photo?: string;
  purchaseReceiptUrl?: string;
  repairRecords: RepairRecord[];
  borrowRecords: BorrowRecord[];
}

export type RehearsalStage = 'not-started' | 'first-ensemble' | 'polishing' | 'mature';

export interface RehearsalTrack {
  id: string;
  name: string;
  stage: RehearsalStage;
  startDate: string;
  endDate: string;
  relatedGigId?: string;
}

export interface BandMember {
  id: string;
  name: string;
  role: string;
}

export interface DashboardStats {
  totalGigs: number;
  totalEquipment: number;
  rehearsalCompletionRate: number;
  pendingItems: number;
}
