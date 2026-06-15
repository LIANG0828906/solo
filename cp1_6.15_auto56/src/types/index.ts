export interface Artwork {
  id: string;
  name: string;
  description: string;
  dimensions: string;
  material: string;
  price: number;
  images: string[];
  sellerId: string;
  sellerName: string;
  likes: number;
  createdAt: number;
  status: string;
}

export interface User {
  id: string;
  username: string;
  nickname: string;
}

export interface Favorite {
  id: string;
  userId: string;
  artworkId: string;
  createdAt: number;
  artwork?: Artwork;
}

export interface Purchase {
  id: string;
  userId: string;
  artworkId: string;
  price: number;
  status: string;
  createdAt: number;
  artwork?: Artwork;
}

export interface ActivityItem {
  id: string;
  type: 'upload' | 'favorite' | 'purchase';
  artwork: Artwork;
  date: number;
  status: string;
}
