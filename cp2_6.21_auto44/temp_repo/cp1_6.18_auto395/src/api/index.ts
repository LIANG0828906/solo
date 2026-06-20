export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Gallery {
  id: number;
  name: string;
  description: string;
  cover_image: string;
  user_id: number;
  created_at: string;
  exhibition_start: string | null;
  exhibition_end: string | null;
  background_music: string | null;
  theme_style: string;
  artwork_count: number;
}

export interface Artwork {
  id: number;
  gallery_id: number;
  title: string;
  image_url: string;
  thumbnail_url: string;
  order_index: number;
  likes: number;
  created_at: string;
}

export interface Comment {
  id: number;
  artwork_id: number;
  author_name: string;
  content: string;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_index: number;
}
