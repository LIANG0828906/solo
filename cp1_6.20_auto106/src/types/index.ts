export interface Event {
  id: string;
  name: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  customQuestions: string[];
  createdAt: string;
  registeredCount: number;
  remainingCount: number;
}

export interface Registration {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  customAnswers: string[];
  checkedIn: boolean;
  checkinTime?: string;
  checkinSequence?: number;
  createdAt: string;
}

export interface CheckinEvent {
  registrationId: string;
  name: string;
  checkinTime: string;
  checkinSequence: number;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  customAnswers: string[];
}

export interface RegisterResponse {
  registrationId: string;
  eventId: string;
  qrcodeUrl: string;
  name: string;
  createdAt: string;
}

export interface CheckinLogItem {
  id: string;
  name: string;
  checkinTime: string;
  checkinSequence: number;
  isNew?: boolean;
}
