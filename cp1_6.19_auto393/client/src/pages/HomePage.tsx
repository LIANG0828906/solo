import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBookStore } from '../store';
import BookForm from '../components/BookForm';
import BookCard from '../components/BookCard';
import { Sparkles, BookOpen } from 'lucide-react';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { books, fetchBooks, loading, error } = useBookStore();

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const handleFeaturedClick = (bookId: string) => {
    navigate(`/book/${bookId}`);
  };

  const featuredBooks = books.slice(0, 5);

  return (
    <div className="layout">
      <div className="left-section">
        <BookForm />
        <div className="books-section">
          <h2 id="books-list">可交换书籍</h2>
          {loading ? (
            <div className="loading">加载中...</div>
          ) : error ? (
            <div className="error">{error}</div>
          ) : books.length === 0 ? (
            <div className="empty">
              <div className="empty-icon">
                <BookOpen size={48} />
              </div>
              <p>暂无书籍，快来发布第一本吧！</p>
            </div>
          ) : (
            <div className="books-grid">
              {books.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="right-section">
        <div className="featured-recommend">
          <h3>
            <Sparkles size={18} style={{ marginRight: '6px', verticalAlign: 'middle', color: '#FF9800' }} />
            热门推荐
          </h3>
          {featuredBooks.length > 0 ? (
            featuredBooks.map((book) => (
              <div
                key={book.id}
                className="featured-item"
                onClick={() => handleFeaturedClick(book.id)}
              >
                <p className="featured-item-title">{book.title}</p>
                <p className="featured-item-author">{book.author}</p>
              </div>
            ))
          ) : (
            <div className="empty" style={{ padding: '20px' }}>
              暂无推荐
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
