import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  originalPrice: number;
  currentPrice: number;
  cover?: string;
  seller: {
    id: string;
    username: string;
  };
}

const mockBooks: Book[] = [
  {
    id: '1',
    title: '高等数学（第七版）上册',
    author: '同济大学数学系',
    isbn: '9787040396638',
    originalPrice: 42.5,
    currentPrice: 18,
    seller: { id: '2', username: '学霸小李' },
  },
  {
    id: '2',
    title: '线性代数及其应用',
    author: 'David C. Lay',
    isbn: '9787111561012',
    originalPrice: 69,
    currentPrice: 25,
    seller: { id: '3', username: '书虫小王' },
  },
  {
    id: '3',
    title: '数据结构与算法分析',
    author: 'Mark Allen Weiss',
    isbn: '9787111572567',
    originalPrice: 59,
    currentPrice: 22,
    seller: { id: '4', username: '码农小张' },
  },
  {
    id: '4',
    title: '大学物理（第三版）',
    author: '张三慧',
    isbn: '9787302443281',
    originalPrice: 58,
    currentPrice: 20,
    seller: { id: '5', username: '物理系小陈' },
  },
  {
    id: '5',
    title: 'C++ Primer Plus（第六版）',
    author: 'Stephen Prata',
    isbn: '9787111615460',
    originalPrice: 128,
    currentPrice: 45,
    seller: { id: '6', username: '编程爱好者' },
  },
  {
    id: '6',
    title: '大学英语精读（第三版）第三册',
    author: '董亚芬',
    isbn: '9787544623193',
    originalPrice: 38,
    currentPrice: 15,
    seller: { id: '7', username: '外语达人' },
  },
];

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Book[]>(mockBooks);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const navigate = useNavigate();

  useEffect(() => {
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    try {
      const response = await axios.get('/api/books/search', {
        params: { q: searchQuery },
        timeout: 500,
      });
      if (response.data && response.data.length > 0) {
        setResults(response.data);
      } else {
        const filtered = mockBooks.filter(book =>
          !searchQuery ||
          book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          book.isbn.includes(searchQuery)
        );
        setResults(filtered);
      }
    } catch {
      const filtered = mockBooks.filter(book =>
        !searchQuery ||
        book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.isbn.includes(searchQuery)
      );
      setResults(filtered);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (bookId: string) => {
    navigate(`/book/${bookId}`);
  };

  return (
    <div>
      <div className="search-header">
        <h1 className="search-title">搜索你需要的教材</h1>
        <p className="search-subtitle">输入教材名称、作者或ISBN，快速找到你想要的教材</p>
        <input
          type="text"
          className="search-input"
          placeholder="搜索教材名称、作者或ISBN..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="loading">搜索中...</div>
      ) : results.length > 0 ? (
        <div className="search-results">
          {results.map(book => (
            <div
              key={book.id}
              className="book-card"
              onClick={() => handleCardClick(book.id)}
            >
              <div className="book-cover">📖</div>
              <div className="book-info">
                <div className="book-title" title={book.title}>{book.title}</div>
                <div className="book-author">{book.author}</div>
                <div className="book-prices">
                  <span className="book-original-price">¥{book.originalPrice.toFixed(2)}</span>
                  <span className="book-current-price">¥{book.currentPrice.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-illustration">🔍</div>
          <div className="empty-state-text">
            没有找到相关教材<br />试试其他关键词吧
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
