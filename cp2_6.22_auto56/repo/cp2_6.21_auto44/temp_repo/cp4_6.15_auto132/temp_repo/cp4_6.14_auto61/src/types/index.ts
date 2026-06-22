export type DebateStatus = 'waiting' | 'in_progress' | 'completed';

export type Speaker = 'pro' | 'con';

export interface Debate {
  id: string;
  name: string;
  proSpeaker: string;
  conSpeaker: string;
  proDuration: number;
  conDuration: number;
  status: DebateStatus;
  currentSpeaker: Speaker;
  remainingTime: number;
  isRunning: boolean;
  createdAt: number;
}

export interface Argument {
  id: string;
  debateId: string;
  author: string;
  speaker: Speaker;
  content: string;
  timestamp: number;
}

export type RecordType = 'argument' | 'timer_start' | 'timer_pause' | 'timer_reset' | 'switch_speaker' | 'time_up';

export interface DebateRecord {
  id: string;
  debateId: string;
  timestamp: number;
  speaker: Speaker;
  type: RecordType;
  content?: string;
}

export interface CreateDebateRequest {
  name: string;
  proSpeaker: string;
  conSpeaker: string;
  proDuration: number;
  conDuration: number;
}

export interface UpdateTimerRequest {
  isRunning: boolean;
  remainingTime: number;
  currentSpeaker?: Speaker;
}

export interface SubmitArgumentRequest {
  author: string;
  speaker: Speaker;
  content: string;
}
