import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useBookStore, Book } from '../store';
import { BookOpen, User, Tag, Calendar } from 'lucide-react';
import RecommendCard from './RecommendCard';
import Modal from './Modal';

const BookDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [showModal, setShowModal] = useState(false);
  const {
    fetchBook,
    fetchRecommendations,
    recommendations,
    requestExchange,
    hasRequested,
    loading,
    error
  } = useBookStore();

  useEffect(() => {
    if (id) {
      fetchBook(id).then((data) => {
        if (data) {
          setBook(data);
          fetchRecommendations(id);
        }
      });
    }
    return () => {
      useBookStore.getState().clearRecommendations();
    };
  }, [id, fetchBook, fetchRecommendations]);

  const handleExchangeClick = () => {
    if (book && !hasRequested(book.id)) {
      setShowModal(true);
    }
  };

  const handleConfirmExchange = async () => {
    if (book) {
      await requestExchange(book.id, book.owner);
      setShowModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  if (loading && !book) {
    return <div className="loading">加载中...</div>;
  }

  if (error && !book) {
    return <div className="error">{error}</div>;
  }

  if (!book) {
    return <div className="empty">未找到该书籍</div>;
  }

  const requested = hasRequested(book.id);

  return (
    <div className="detail-layout">
      <div className="detail-main">
        <div className="book-detail">
          <div className="book-detail-cover">
            <BookOpen className="book-icon-large" />
          </div>
          <div className="book-detail-content">
            <h1 className="book-detail-title">{book.title}</h1>
            <p className="book-detail-author">作者：{book.author}</p>
            <div className="book-detail-meta">
              <span className="meta-item">
                <Tag size={16} />
                {book.category}
              </span>
              <span className="meta-item">
                <User size={16} />
                {book.owner}
              </span>
              <span className="meta-item">
                <Calendar size={16} />
                {formatDate(book.createdAt)}
              </span>
            </div>
            {book.description && (
              <p className="book-detail-description">{book.description}</p>
            )}
            <div className="book-detail-tags">
              {book.tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                </span>
              ))}
            </div>
            <button
              className="btn btn-exchange"
              onClick={handleExchangeClick}
              disabled={requested}
            >
              {requested ? '已请求' : '请求交换'}
            </button>
          </div>
        </div>
      </div>
      <div className="detail-sidebar">
        <div className="recommend-section">
          <h3>智能推荐</h3>
          {loading ? (
            <div className="loading">加载推荐中...</div>
          ) : recommendations.length > 0 ? (
            recommendations.map((rec, index) => (
              <RecommendCard key={rec.book.id} recommendation={rec} />
            ))
          ) : (
            <div className="empty">暂无相关推荐</div>
          )}
        </div>
      </div>
      <Modal
        isOpen={showModal}
        title="确认交换请求"
        message={`确定要向 ${book.owner} 请求交换《${book.title}》吗？`}
        onConfirm={handleConfirmExchange}
        onCancel={() => setShowModal(false)}
        confirmText="确认请求"
        cancelText="再想想"
      />
    </div>
  );
};

export default BookDetail;
