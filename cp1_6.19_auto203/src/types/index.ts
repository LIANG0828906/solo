export interface Participant {
  id: string;
  nickname: string;
  avatarColor: string;
  signedUpAt: number;
  checkedIn: boolean;
  checkedInAt?: number;
}

export interface Activity {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  coverUrl?: string;
  coverGradient: string;
  description: string;
  maxParticipants: number;
  participants: Participant[];
  createdAt: number;
}
