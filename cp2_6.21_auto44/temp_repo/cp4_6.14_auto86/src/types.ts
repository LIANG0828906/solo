export type BookingStatus = 'booked' | 'pending' | 'available' | 'maintenance';
export type MessagePlatform = 'airbnb' | 'xiaozhu';

export interface Property {
  id: string;
  name: string;
  platform: MessagePlatform;
  pricePerNight: number;
  maxGuests: number;
  photoUrl: string;
  isActive: boolean;
  createdAt: string;
}

export interface CalendarDay {
  propertyId: string;
  date: string;
  status: BookingStatus;
  guestName?: string;
  bookingId?: string;
}

export interface Message {
  id: string;
  propertyId: string;
  propertyName: string;
  platform: MessagePlatform;
  guestName: string;
  content: string;
  reply?: string;
  isReplied: boolean;
  createdAt: string;
  repliedAt?: string;
}
