export interface Topic {
  id: string;
  content: string;
}

export interface Decision {
  id: string;
  content: string;
}

export interface TodoItem {
  id: string;
  content: string;
  assignee: string;
  completed: boolean;
}

export interface ParticipantEngagement {
  name: string;
  speakingTime: number;
}

export interface MeetingSummary {
  title: string;
  topics: Topic[];
  decisions: Decision[];
  todos: TodoItem[];
  participantEngagement: ParticipantEngagement[];
}

export interface Meeting {
  id: string;
  name: string;
  participants: string[];
  duration: number;
  createdAt: string;
  rawText: string;
  summary: MeetingSummary;
  transcriptionProgress: number;
  status: 'pending' | 'processing' | 'completed';
}

export interface TranscribeProgressEvent {
  type: 'transcribe_progress';
  meetingId: string;
  currentSegment: number;
  totalSegments: number;
  percentage: number;
}

export interface SummaryUpdateEvent {
  type: 'summary_update';
  meetingId: string;
  summary: MeetingSummary;
  isIncremental: boolean;
}

export type WebSocketEvent = TranscribeProgressEvent | SummaryUpdateEvent;
