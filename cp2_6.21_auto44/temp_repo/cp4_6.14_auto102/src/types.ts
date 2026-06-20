export type MemberRole = '社长' | '副社长' | '干事' | '普通成员';

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  joinDate: string;
  phone?: string;
}

export interface Activity {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  description: string;
  participantIds: string[];
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  isUrgent: boolean;
}
