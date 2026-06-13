export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export interface Teacher extends User {
  role: 'teacher';
  courses: Course[];
  bio: string;
}

export interface Student extends User {
  role: 'student';
}

export interface Course {
  id: string;
  teacherId: string;
  type: string;
  duration: 30 | 45 | 60;
  price: number;
}

export interface TimeSlot {
  id: string;
  teacherId: string;
  dayOfWeek: number;
  startTime: string;
  isBooked: boolean;
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  studentId: string;
  teacherId: string;
  courseId: string;
  date: string;
  startTime: string;
  endTime: string;
  note: string;
  status: BookingStatus;
  review?: Review;
  tasks?: PracticeTask[];
}

export interface Review {
  id: string;
  bookingId: string;
  rating: number;
  description: string;
  createdAt: string;
}

export interface PracticeTask {
  id: string;
  bookingId: string;
  title: string;
  description: string;
  dueDate: string;
  isCompleted: boolean;
  recordingUrl?: string;
  recordingName?: string;
}

export interface StudentProgress {
  totalBookings: number;
  completedBookings: number;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
  taskCompletionRate: number;
  averageRating: number;
  ratingHistory: { date: string; rating: number }[];
  weeklyHours: { week: string; hours: number }[];
}

export interface WSMessage {
  type: 'booking_created' | 'booking_updated' | 'booking_cancelled' | 'task_completed' | 'review_added';
  payload: any;
}
