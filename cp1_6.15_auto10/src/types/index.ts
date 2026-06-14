export interface Event {
  id: string;
  title: string;
  description: string;
  dateTime: string;
  location: string;
  maxParticipants: number;
  currentParticipants: number;
  qrCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  name: string;
  email: string;
  qrCode: string;
  signedIn: boolean;
  signedInAt: string;
  registeredAt: string;
}

export interface EventStats {
  total: number;
  signedIn: number;
  rate: number;
}

export interface CreateEventData {
  title: string;
  description: string;
  dateTime: string;
  location: string;
  maxParticipants: number;
}

export interface RegisterData {
  name: string;
  email: string;
}

export type SignInData =
  | { email: string; registrationId?: never }
  | { email?: never; registrationId: string };
