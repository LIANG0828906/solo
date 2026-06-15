import type { Book } from '@/types';

export interface BookUpdateDiff {
  oldBook: Book;
  newBook: Book;
  statusChanged: boolean;
  locationChanged: boolean;
}

export interface BooksDiff {
  createdBooks: Book[];
  updatedBooks: BookUpdateDiff[];
  deletedBookIds: string[];
}

export function diffBooks(oldBooks: Book[], newBooks: Book[]): BooksDiff {
  const oldBooksMap = new Map<string, Book>();
  for (const book of oldBooks) {
    oldBooksMap.set(book.id, book);
  }

  const newBooksMap = new Map<string, Book>();
  for (const book of newBooks) {
    newBooksMap.set(book.id, book);
  }

  const createdBooks: Book[] = [];
  for (const book of newBooks) {
    if (!oldBooksMap.has(book.id)) {
      createdBooks.push(book);
    }
  }

  const deletedBookIds: string[] = [];
  for (const book of oldBooks) {
    if (!newBooksMap.has(book.id)) {
      deletedBookIds.push(book.id);
    }
  }

  const updatedBooks: BookUpdateDiff[] = [];
  for (const newBook of newBooks) {
    const oldBook = oldBooksMap.get(newBook.id);
    if (oldBook) {
      const statusChanged = oldBook.status !== newBook.status;
      const locationChanged =
        oldBook.currentLocation !== newBook.currentLocation ||
        oldBook.currentLat !== newBook.currentLat ||
        oldBook.currentLng !== newBook.currentLng;

      if (statusChanged || locationChanged) {
        updatedBooks.push({
          oldBook,
          newBook,
          statusChanged,
          locationChanged,
        });
      }
    }
  }

  return {
    createdBooks,
    updatedBooks,
    deletedBookIds,
  };
}
