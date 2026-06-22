export interface User {
  id: number;
  email: string;
  password: string;
  username: string;
  created_at: string;
}

export interface Club {
  id: number;
  name: string;
  description: string;
  cover_image_url: string;
  creator_id: number;
  created_at: string;
}

export interface ClubMember {
  id: number;
  club_id: number;
  user_id: number;
  joined_at: string;
}

export interface Book {
  id: number;
  club_id: number;
  title: string;
  author: string;
  cover_image_url: string;
  created_at: string;
}

export interface Stage {
  id: number;
  book_id: number;
  name: string;
  start_page: number;
  end_page: number;
  start_date: string;
  end_date: string;
}

export interface Note {
  id: number;
  stage_id: number;
  user_id: number;
  text: string;
  image_urls: string;
  created_at: string;
}

export interface NoteLike {
  id: number;
  note_id: number;
  user_id: number;
  created_at: string;
}

export interface Message {
  id: number;
  stage_id: number;
  user_id: number;
  content: string;
  mentions: string;
  created_at: string;
}
