export type VoicePart = 'Soprano' | 'Alto' | 'Tenor' | 'Bass';

export type SkillLevel = 1 | 2 | 3 | 4 | 5;

export interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface Member {
  id: string;
  name: string;
  primaryPart: VoicePart;
  secondaryPart?: VoicePart;
  skillLevel: SkillLevel;
  availableSlots: TimeSlot[];
  avatar?: string;
}

export interface ProgressRecord {
  [part: string]: {
    practicedMinutes: number;
    targetMinutes: number;
  };
}

export interface Piece {
  id: string;
  name: string;
  composer: string;
  key: string;
  bpm: number;
  requiredParts: VoicePart[];
  practiceProgress: ProgressRecord;
}

export interface ConflictRecord {
  memberId: string;
  conflictingRehearsalId: string;
}

export interface Rehearsal {
  id: string;
  title: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  participantIds: string[];
  pieceIds: string[];
  conflicts: ConflictRecord[];
}

export interface MemberRecommendation {
  memberId: string;
  voicePart: VoicePart;
  score: number;
  reason: string;
}

export type SortField = 'bpm-asc' | 'bpm-desc' | 'key' | 'progress';
