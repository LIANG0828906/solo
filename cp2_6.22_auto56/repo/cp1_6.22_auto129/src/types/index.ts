export interface Activity {
  id: string;
  title: string;
  coverImage: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  registeredUsers: string[];
  checkedInUsers: { userId: string; time: string }[];
  pointsReward: number;
  photos: string[];
  status: 'upcoming' | 'ongoing' | 'ended';
  createdAt: string;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  totalPoints: number;
  activitiesParticipated: number;
  registeredAt: string;
}

export interface Comment {
  id: string;
  activityId: string;
  userId: string;
  content: string;
  likes: number;
  likedBy: string[];
  createdAt: string;
}

export interface CheckInRecord {
  id: string;
  activityId: string;
  userId: string;
  time: string;
  pointsEarned: number;
}

export interface ActivityFormData {
  title: string;
  coverImage: string;
  description: string;
  location: string;
  startTime: string;
  endTime: string;
  maxParticipants: number;
  pointsReward: number;
}

export interface RegisterFormData {
  nickname: string;
  avatar: string;
}
