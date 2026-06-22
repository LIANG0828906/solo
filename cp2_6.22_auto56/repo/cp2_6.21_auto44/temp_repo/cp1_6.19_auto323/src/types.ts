export interface Comment {
  id: string;
  userId: string;
  username: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  likes: number;
  likedBy: string[];
  signedUpUsers: string[];
  comments: Comment[];
  createdAt: string;
}

export interface CreateEventData {
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  maxParticipants: number;
}
