export interface Route {
  id: string;
  title: string;
  userId: string;
  coordinates: [number, number][];
  distance: number;
  elevationGain: number;
  elevationLoss: number;
  movingTime: number;
  avgSpeed: number;
  likes: number;
  createdAt: string;
  color: string;
}

export interface Challenge {
  id: string;
  routeId: string;
  userId: string;
  finishTime: number;
  createdAt: string;
  likes: number;
}

export interface Comment {
  id: string;
  routeId: string;
  userId: string;
  nickname: string;
  avatar: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface User {
  id: string;
  nickname: string;
  avatar: string;
  createdAt: string;
}

export type SortType = 'time' | 'distance' | 'likes';
