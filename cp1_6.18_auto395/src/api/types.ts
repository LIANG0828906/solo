export interface User {
  id: number;
  username: string;
  email: string;
  created_at?: string;
}

export interface Gallery {
  id: number;
  name: string;
  description: string;
  cover_image?: string;
  user_id: number;
  created_at: string;
  updated_at: string;
  artworks_count?: number;
}

export interface Artwork {
  id: number;
  gallery_id: number;
  title: string;
  image_url: string;
  order_index: number;
  likes_count: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: number;
  artwork_id: number;
  content: string;
  author_name: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_index: number;
}
