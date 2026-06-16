export interface User {
  id: string;
  username: string;
  password: string;
  avatarColor: string;
  createdAt: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  coverUrl: string;
  description: string;
  avgRating: number;
  reviewCount: number;
}

export interface Chapter {
  id: string;
  bookId: string;
  title: string;
  pages: string[];
  order: number;
}

export interface Review {
  id: string;
  bookId: string;
  userId: string;
  username: string;
  userAvatarColor: string;
  rating: 1 | 2 | 3 | 4 | 5;
  content: string;
  likedBy: string[];
  createdAt: string;
}
