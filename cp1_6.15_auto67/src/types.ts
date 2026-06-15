export interface Participant {
  id: string;
  name: string;
  phone: string;
  enrolledAt: Date;
  signedIn: boolean;
  signedInAt?: Date;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  duration: number;
  location: string;
  capacity: number;
  participants: Participant[];
  createdAt: Date;
}

export type TabType = 'list' | 'create' | 'signin' | 'manage';
