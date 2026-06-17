import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book } from '../services/api';

interface BookShelfProps {
  books: Book[];
  onSearch: (query: string) => void;
}

const categoryMap: Record<string, string> = {
  '小说': 'book-spine-novel',
  '科普': 'book-spine-science',
  '历史': 'book-spine-history',
  '哲学': 'book-spine-philosophy',
  '艺术': 'book-spine-art',
  '其他': 'book-spine-other',
};

function getAbbreviation(title: string): string {
  if (title.length <= 4) return title;
  return title.slice(0, 4);
}

export default function BookShelf({ books, onSearch }: BookShelfProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIds, setHighlightedIds] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [searchPerformed, setSearchPerformed] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (searchTimer.current) {
      clearTimeout(searchTimer.current);
    }

    searchTimer.current = setTimeout(() => {
      setSearchPerformed(value.trim().length > 0);
      onSearch(value.trim());
    }, 150);
  };

  useEffect(() => {
    if (searchPerformed && searchQuery.trim() && books.length > 0) {
      setHighlightedIds(new Set(books.map(b => b.id)));
    } else {
      setHighlightedIds(new Set());
    }
  }, [books, searchPerformed, searchQuery]);

  const showNoResults = searchPerformed && books.length === 0;

  return (
    <div className="book-shelf-container">
      <div className="shelf-header">
        <input
          type="text"
          className="search-box"
          placeholder="搜索书名或作者..."
          value={searchQuery}
          onChange={handleSearchChange}
        />
      </div>

      <div className="shelf">
        {books.map((book) => (
          <div
            key={book.id}
            className={`book-spine ${categoryMap[book.category] || 'book-spine-other'} ${
              highlightedIds.has(book.id) ? 'highlighted' : ''
            }`}
            onMouseEnter={() => setHoveredId(book.id)}
            onMouseLeave={() => setHoveredId(null)}
          >
            <span className="book-title-abbr">{getAbbreviation(book.title)}</span>
            {hoveredId === book.id && (
              <div className="book-popup">
                <div className="book-popup-title">{book.title}</div>
                <div className="book-popup-author">{book.author}</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {showNoResults && (
        <div className="no-results">
          未找到
          <span
            className="no-results-link"
            onClick={() => navigate('/add')}
          >
            点击添加新书
          </span>
        </div>
      )}
    </div>
  );
}
