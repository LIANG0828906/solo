export interface Exhibition {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  startDate: string;
  endDate: string;
  visitCount: number;
  curatorName: string;
  createdAt: number;
}

export interface Work {
  id: string;
  exhibitionId: string;
  title: string;
  description: string;
  imageUrl: string;
  artistName: string;
  contactInfo: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectReason?: string;
  createdAt: number;
}

export interface Review {
  id: string;
  workId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface Favorite {
  id: string;
  workId: string;
  createdAt: number;
}

export interface DailyStat {
  id: string;
  exhibitionId: string;
  date: string;
  favoriteCount: number;
  commentCount: number;
}

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'error' | 'info';
}
