export interface Member {
  id: string;
  name: string;
  joinCode: string;
  groupIndex: number;
  isOnline: boolean;
  lastUpdate: number;
  lat: number;
  lng: number;
  history: { lat: number; lng: number; time: number }[];
  pulseGreen?: boolean;
  missing?: boolean;
}

export interface TourGroup {
  id: string;
  name: string;
  date: string;
  memberCount: number;
  members: Member[];
  createdAt: number;
}

export const GROUP_COLORS = ['red', 'blue', 'green', 'orange', 'purple'];

export const COLOR_MAP: Record<string, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  purple: '#8B5CF6'
};
