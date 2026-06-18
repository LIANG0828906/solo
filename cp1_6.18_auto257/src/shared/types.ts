export interface Book {
  id: string;
  title: string;
  author: string;
  description: string;
  rating: number;
  coverColor: string;
}

export interface Comment {
  id: string;
  bookId: string;
  bookTitle: string;
  username: string;
  content: string;
  rating: number;
  timestamp: number;
}

export interface NewCommentPayload {
  bookId: string;
  username: string;
  content: string;
  rating: number;
}

export interface InitialData {
  books: Book[];
  comments: Comment[];
}
