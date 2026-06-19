import { memo } from 'react';
import { Book } from '../types';
import { useBookStore } from '../store';
import { BookOpen } from 'lucide-react';

interface Props {
  book: Book;
}

function BookCard({ book }: Props) {
  const selectBook = useBookStore((s) => s.selectBook);

  return (
    <div
      className="book-card"
      onClick={() => selectBook(book.id)}
    >
      <div
        className="book-cover"
        style={{ background: book.gradientColor }}
      >
        <BookOpen className="book-cover-icon" size={40} />
      </div>

      <h3 className="book-title" title={book.title}>
        {book.title}
      </h3>
      <p className="book-author">{book.author}</p>

      <div className="progress-wrapper">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${book.progress}%` }}
          />
        </div>
        <span className="progress-text">{book.progress}%</span>
      </div>
    </div>
  );
}

export default memo(BookCard);
