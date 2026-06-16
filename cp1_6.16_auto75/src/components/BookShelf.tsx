import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../store/bookStore';
import { hashColor } from '../utils/colorHash';
import { Book } from '../types';
import './BookShelf.css';

interface BookCardProps {
  book: Book;
  index: number;
  onClick: () => void;
}

function BookCard({ book, index, onClick }: BookCardProps) {
  const bgColor = hashColor(book.category);

  return (
    <div
      className="book-card"
      style={{
        backgroundColor: bgColor,
        animationDelay: `${index * 50}ms`
      }}
      onClick={onClick}
    >
      <div className="book-card-title">{book.title}</div>
      <div className="book-card-author">{book.author}</div>
    </div>
  );
}

export function BookShelf() {
  const navigate = useNavigate();
  const { books, setCurrentBook } = useBookStore();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredBooks = useMemo(() => {
    if (!searchQuery.trim()) return books;
    const query = searchQuery.toLowerCase();
    return books.filter(
      book =>
        book.title.toLowerCase().includes(query) ||
        book.author.toLowerCase().includes(query)
    );
  }, [books, searchQuery]);

  const handleBookClick = (book: Book) => {
    setCurrentBook(book.id);
    navigate(`/book/${book.id}`);
  };

  return (
    <div className="bookshelf-container">
      <div className="search-bar">
        <span className="search-icon">🔍</span>
        <input
          type="text"
          className="search-input"
          placeholder="搜索书名或作者..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="bookshelf-content">
        {filteredBooks.length > 0 ? (
          <div key={searchQuery} className="book-grid fade-in">
            {filteredBooks.map((book, index) => (
              <BookCard
                key={book.id}
                book={book}
                index={index}
                onClick={() => handleBookClick(book)}
              />
            ))}
          </div>
        ) : (
          <div key="empty" className="no-results fade-in">未找到相关书籍</div>
        )}
      </div>
    </div>
  );
}
