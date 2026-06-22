export interface TimeSlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  votes: string[];
}

export interface EventData {
  id: string;
  title: string;
  description: string;
  timeSlots: TimeSlot[];
  createdAt: string;
}

export interface VoteContextType {
  currentEvent: EventData | null;
  setCurrentEvent: (event: EventData | null) => void;
  votedSlotId: string | null;
  setVotedSlotId: (id: string | null) => void;
}
