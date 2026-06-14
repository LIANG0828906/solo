export interface User {
  id: string;
  username: string;
  createdAt: string;
}

export interface CommunityScores {
  life: number;
  transport: number;
  quiet: number;
  green: number;
  neighbor: number;
}

export interface Community {
  id: string;
  name: string;
  address: string;
  lat: number;
