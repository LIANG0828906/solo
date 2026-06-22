export interface Activity {
  id: string;
  name: string;
  dateTime: string;
  location: string;
  maxParticipants: number;
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
