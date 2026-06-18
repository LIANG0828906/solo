import { useBookStore } from './store';
import type { Book } from '../shared/types';

function Stars({ rating, size = 'tiny' }: { rating: number; size?: 'tiny' | 'small' | 'normal' }) {
  const rounded = Math.round(rating);
  return (
    <span className={`stars ${size === 'tiny' ? 'tiny' : size === 'small' ? 'small' : ''}`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className={`star ${i < rounded ? 'filled' : ''}`} />
      ))}
    </span>
  );
}

function BookCard({ book, index }: { book: Book; index: number }) {
  const setSelectedBook = useBookStore((s) => s.setSelectedBook);

  return (
    <div
      className="book-card"
      style={
        {
          backgroundColor: book.coverColor,
          ['--idx' as string]: index,
        } as React.CSSProperties
      }
      onClick={() => setSelectedBook(book)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setSelectedBook(book);
        }
      }}
      aria-label={`查看《${book.title}》详情`}
    >
      <div className="book-title">{book.title}</div>
      <div className="book-mini-stars">
        <Stars rating={book.rating} size="tiny" />
        <span style={{ color: 'rgba(0,0,0,0.45)', fontSize: 11 }}>{book.rating.toFixed(1)}</span>
      </div>
      <div className="book-author">— {book.author}</div>
    </div>
  );
}

export default function BookList() {
  const books = useBookStore((s) => s.books);

  return (
    <section className="shelf-container" aria-label="虚拟书架">
      <div className="shelf-grid">
        {books.map((book, i) => (
          <BookCard key={book.id} book={book} index={i} />
        ))}
      </div>
    </section>
  );
}
