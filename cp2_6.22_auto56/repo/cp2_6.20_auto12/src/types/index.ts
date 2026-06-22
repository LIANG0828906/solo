export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
}

export interface Vote {
  id: string;
  pollId: string;
  userName: string;
  userColor: string;
  availableSlotIds: string[];
  createdAt: string;
}

export interface Poll {
  id: string;
  title: string;
  description: string;
  timeSlots: TimeSlot[];
  votes: Vote[];
  isClosed: boolean;
  createdAt: string;
  adminToken?: string;
}

export interface BestTimeRecommendation {
  date: string;
  startTime: string;
  endTime: string;
  coverage: number;
  participantCount: number;
  totalParticipants: number;
}

export interface CreatePollRequest {
  title: string;
  description: string;
  timeSlots: {
    date: string;
    startTime: string;
    endTime: string;
  }[];
}

export interface SubmitVoteRequest {
  userName: string;
  availableSlotIds: string[];
}

export interface SlotVoteCount {
  slotId: string;
  count: number;
  percentage: number;
}
