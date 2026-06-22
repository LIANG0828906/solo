export interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
}

export interface Pet {
  id: string;
  name: string;
  type: string;
  breed?: string;
  avatar: string;
}

export interface Post {
  id: string;
  content: string;
  images: string[];
  createdAt: string;
  likes: number;
  comments: number;
  user?: User;
  pet?: Pet;
}

export interface Hotspot {
  id: string;
  title: string;
  count: number;
}

export interface FeedResponse {
  posts: Post[];
  cursor?: string;
  hasMore: boolean;
}

export interface HotspotsResponse {
  hotspots: Hotspot[];
}
