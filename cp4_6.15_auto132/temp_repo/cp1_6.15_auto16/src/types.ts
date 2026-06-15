export interface Artist {
  id: string;
  name: string;
  specialty: string;
  intro: string;
  avatarColor: string;
  avatar: string;
}

export interface Slot {
  id: string;
  artistId: string;
  date: string;
  startHour: number;
  duration: number;
  booked: boolean;
}

export interface Booking {
  id: string;
  slotId: string;
  artistId: string;
  date: string;
  startHour: number;
  duration: number;
  userName: string;
  userPhone: string;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  icon: string;
}
