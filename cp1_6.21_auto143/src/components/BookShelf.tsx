import { Book } from '../utils/api';

interface BookShelfProps {
  books: Book[];
  selectedBookId: string | null;
  onSelect: (bookId: string) => void;
}

function BookShelf({ books, selectedBookId, onSelect }: BookShelfProps) {
  return (
    <div style={styles.container}>
      <h2 style={styles.title}>我的书架</h2>
      <div style={styles.bookList}>
        {books.map(book => (
          <div
            key={book.id}
            className="book-item"
            onClick={() => onSelect(book.id)}
            style={{
              ...styles.bookItem,
              ...(selectedBookId === book.id ? styles.bookItemActive : {}),
            }}
          >
            <div style={styles.bookIcon}>📖</div>
            <div style={styles.bookInfo}>
              <div style={styles.bookTitle}>{book.title}</div>
              <div style={styles.bookAuthor}>{book.author}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    flex: 1,
    padding: '16px 12px',
    overflowY: 'auto',
  },
  title: {
    margin: '0 8px 12px',
    fontSize: '12px',
    fontWeight: 600,
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
  },
  bookList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  bookItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  bookItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  bookIcon: {
    fontSize: '24px',
    flexShrink: 0,
  },
  bookInfo: {
    flex: 1,
    minWidth: 0,
  },
  bookTitle: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#1E293B',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  bookAuthor: {
    fontSize: '12px',
    color: '#64748B',
    marginTop: '2px',
  },
};

export default BookShelf;
