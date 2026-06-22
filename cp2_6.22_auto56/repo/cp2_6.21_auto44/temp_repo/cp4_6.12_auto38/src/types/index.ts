export interface Member {
  id: string;
  name: string;
  avatar: string;
  role: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  cover: string;
  status: 'available' | 'borrowed' | 'in_transit';
  currentHolderId: string | null;
  readingProgress: number;
}

export interface BorrowRecord {
  id: string;
  bookId: string;
  fromMemberId: string;
  toMemberId: string;
  borrowDate: string;
  returnDate?: string;
  type: 'borrow' | 'return';
  note?: string;
}

export interface ReadingNote {
  id: string;
  bookId: string;
  memberId: string;
  content: string;
  timestamp: string;
}

export type BookStatus = 'available' | 'borrowed' | 'in_transit';
