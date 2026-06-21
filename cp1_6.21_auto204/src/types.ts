export interface Activity {
  id: string;
  name: string;
  dateTime: string;
  location: string;
  maxParticipants: string;
  registrationDeadline: string;
  createdAt: string;
  isPublic: boolean;
}

export interface Registration {
  id: string;
  activityId: string;
  name: string;
  email: string;
  phone: string;
  qrCode: string;
  registeredAt: string;
}

export interface AttendanceRecord {
  id: string;
  registrationId: string;
  activityId: string;
  name: string;
  checkInTime: string;
}

export interface ActivityContextType {
  currentActivityId: string | null;
  setCurrentActivityId: (id: string | null) => void;
  checkInStatus: 'idle' | 'success' | 'error';
  setCheckInStatus: (status: 'idle' | 'success' | 'error') => void;
  lastCheckedIn: AttendanceRecord | null;
  setLastCheckedIn: (record: AttendanceRecord | null) => void;
}
