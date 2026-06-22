export interface HeritageItem {
  id: string;
  name: string;
  region: string;
  category: string;
  images: string[];
  videoUrl?: string;
  story: string;
  ratings: Rating[];
  averageRating: number;
  createdAt: string;
  createdBy: string;
}

export interface Rating {
  userId: string;
  score: number;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  password: string;
  favorites: string[];
  createdAt: string;
}

export interface Database {
  heritage: HeritageItem[];
  users: User[];
}
