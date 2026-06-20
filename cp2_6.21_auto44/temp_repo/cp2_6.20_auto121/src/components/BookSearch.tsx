import React, { useState, useRef, useEffect } from 'react';
import { searchBooks, BookInfo } from '../api/bookApi';

interface BookSearchProps {
  onSelect: (book: BookInfo) => void;
}

const BookSearch: React.FC<BookSearchProps> = ({ onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<BookInfo[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (query.length >= 3) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        const books = await searchBooks(query);
        setResults(books);
        setShowDropdown(true);
      }, 300);
    } else {
      setResults([]);
      setShowDropdown(false);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const handleSelect = (book: BookInfo) => {
    onSelect(book);
    setQuery(book.title);
    setShowDropdown(false);
  };

  return (
    <div className="book-search-wrapper">
      <input
        className="book-search-input"
        placeholder="输入书名搜索（至少3个字符）..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length > 0 && setShowDropdown(true)}
        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
      />
      {showDropdown && results.length > 0 && (
        <div className="book-search-dropdown">
          {results.map((book) => (
            <div
              key={book.isbn}
              className="book-search-item"
              onMouseDown={() => handleSelect(book)}
            >
              <img className="book-search-item-cover" src={book.cover} alt={book.title} />
              <div>
                <div className="book-search-item-title">{book.title}</div>
                <div className="book-search-item-author">{book.author}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookSearch;
