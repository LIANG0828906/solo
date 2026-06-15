export interface Painting {
  id: string;
  title: string;
  artist: string;
  emotion: string;
  description: string;
  imageUrl: string;
  year: number;
}

export interface Comment {
  id: string;
  paintingId: string;
  nickname: string;
  content: string;
  createdAt: string;
}
