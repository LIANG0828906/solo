export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
  galleries: string[];
  following: string[];
  visitedGalleries: VisitedGallery[];
}

export interface Artwork {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  authorId: string;
  authorName: string;
  galleryId: string;
  width: number;
  height: number;
  likes: number;
  ratings: number[];
  averageRating: number;
  commentCount: number;
  uploadedAt: string;
  position: { x: number; y: number; wall: 'front' | 'back' | 'left' | 'right' };
}

export interface Comment {
  id: string;
  artworkId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  likedBy: string[];
}

export interface Gallery {
  id: string;
  name: string;
  description: string;
  creatorId: string;
  creatorName: string;
  wallColor: string;
  isPublic: boolean;
  coverImage: string;
  artworks: Artwork[];
  followers: string[];
  location: { lat: number; lng: number; city: string };
  createdAt: string;
}

export interface VisitedGallery {
  galleryId: string;
  galleryName: string;
  visitedAt: string;
  location: { lat: number; lng: number };
}

export interface FeedItem {
  id: string;
  type: 'artwork' | 'comment';
  galleryId: string;
  galleryName: string;
  content: string;
  thumbnail?: string;
  timestamp: string;
}

export interface VirtualListItem<T> {
  index: number;
  item: T;
  style: React.CSSProperties;
}
