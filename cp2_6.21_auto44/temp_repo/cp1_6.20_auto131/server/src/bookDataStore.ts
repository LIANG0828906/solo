import booksData from './data/books.json';

export interface RatingEntry { date: string; avg: number; }
export interface Review { id: string; username: string; rating: number; content: string; timestamp: string; }
export interface Book { id: string; title: string; author: string; cover: string; averageRating: number; ratings: RatingEntry[]; reviews: Review[]; }

const books: Book[] = booksData as Book[];

export function searchBooks(query: string): Pick<Book, 'id' | 'title' | 'author' | 'cover' | 'averageRating'>[] {
  const q = query.toLowerCase();
  return books
    .filter(b => b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q))
    .map(({ id, title, author, cover, averageRating }) => ({ id, title, author, cover, averageRating }));
}

export function getBookById(id: string): Book | undefined {
  return books.find(b => b.id === id);
}

export function getReviewsByBookId(id: string): Review[] {
  const book = getBookById(id);
  return book ? book.reviews : [];
}
