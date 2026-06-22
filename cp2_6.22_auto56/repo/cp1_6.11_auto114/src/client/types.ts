export interface User {
  id: string;
  email: string;
  nickname: string;
  avatar?: string;
  createdAt: string;
}

export interface Instrument {
  id: string;
  name: string;
  category: 'acoustic-guitar' | 'electric-piano' | 'violin' | 'saxophone' | 'drum-kit';
  images: string[];
  condition: 'new' | 'minor-flaw' | 'used';
  conditionDescription: string;
  rentPerDay: number;
  salePrice: number;
  publisherId: string;
  publisherNickname: string;
  createdAt: string;
  status: 'active' | 'offline';
}

export interface Booking {
  id: string;
  instrumentId: string;
  instrumentName: string;
  requesterId: string;
  requesterNickname: string;
  publisherId: string;
  publisherNickname: string;
  bookingDate: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface Review {
  id: string;
  instrumentId: string;
  userId: string;
  userNickname: string;
  userAvatar?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  comment: string;
  createdAt: string;
}

export const categoryLabels: Record<string, string> = {
  'acoustic-guitar': '木吉他',
  'electric-piano': '电钢琴',
  'violin': '小提琴',
  'saxophone': '萨克斯',
  'drum-kit': '架子鼓',
};

export const conditionLabels: Record<string, string> = {
  'new': '全新',
  'minor-flaw': '微瑕',
  'used': '旧品',
};

export const bookingStatusLabels: Record<string, string> = {
  'pending': '待确认',
  'confirmed': '已确认',
  'completed': '已完成',
  'cancelled': '已取消',
};
