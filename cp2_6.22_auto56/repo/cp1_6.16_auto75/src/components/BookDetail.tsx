import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBookStore } from '../store/bookStore';
import { hashColor, hashAvatarColor } from '../utils/colorHash';
import { getRecommendedBooks } from '../utils/recommend';
import { Review } from '../types';
import './BookDetail.css';

function renderStars(rating: number): string {
  const rounded = Math.round(rating);
  return '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
}

function ReviewItem({ review, index }: { review: Review; index: number }) {
  const avatarColor = hashAvatarColor(review.userName);

  return (
    <div
      className="review-item"
      style={{ animationDelay: `${0.3 + index * 0.1}s` }}
    >
      <div
        className="review-avatar"
        style={{ backgroundColor: avatarColor }}
      >
        {review.userName.charAt(0)}
      </div>
      <div className="review-bubble">
        <div className="review-header">
          <span className="review-username">{review.userName}</span>
          <span className="review-rating" style={{ color: '#c8a165' }}>
            {renderStars(review.rating)}
          </span>
        </div>
        <p className="review-content">{review.content}</p>
      </div>
    </div>
  );
}

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getBookById, setCurrentBook, setRecommendedBooks, recommendedBookIds } = useBookStore();
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showEndTip, setShowEndTip] = useState(false);
  const descRef = useRef<HTMLDivElement>(null);
  const progressIntervalRef = useRef<number | null>(null);
  const scrollIntervalRef = useRef<number | null>(null);

  const book = id ? getBookById(id) : undefined;

  useEffect(() => {
    if (id) {
      setCurrentBook(id);
      const allBooks = useBookStore.getState().books;
      const recommended = getRecommendedBooks(id, allBooks, 3);
      setRecommendedBooks(recommended);
    }
  }, [id, setCurrentBook, setRecommendedBooks]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
      }
    };
  }, []);

  const handleStartPreview = () => {
    if (isPreviewing) return;

    setIsPreviewing(true);
    setProgress(0);
    setShowEndTip(false);

    const descEl = descRef.current;
    if (!descEl) return;

    const totalDuration = 5000;
    const interval = 500;
    const steps = totalDuration / interval;
    const progressStep = 100 / steps;
    const scrollStep = (descEl.scrollHeight - descEl.clientHeight) / steps;

    let currentProgress = 0;
    let currentScroll = 0;

    progressIntervalRef.current = window.setInterval(() => {
      currentProgress += progressStep;
      currentScroll += scrollStep;

      if (currentProgress >= 100) {
        currentProgress = 100;
        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
        }
        if (scrollIntervalRef.current) {
          clearInterval(scrollIntervalRef.current);
        }
        setProgress(100);
        setIsPreviewing(false);
        setShowEndTip(true);

        setTimeout(() => {
          if (descRef.current) {
            descRef.current.scrollTop = 0;
          }
          setProgress(0);
          setShowEndTip(false);
        }, 2000);
      } else {
        setProgress(currentProgress);
        if (descRef.current) {
          descRef.current.scrollTop = currentScroll;
        }
      }
    }, interval);
  };

  const handleRecommendClick = (bookId: string) => {
    setCurrentBook(bookId);
    navigate(`/book/${bookId}`);
  };

  const handleBack = () => {
    navigate('/');
  };

  if (!book) {
    return <div className="book-detail-container">未找到该书籍</div>;
  }

  const coverColor = hashColor(book.category);
  const displayReviews = book.reviews.slice(0, 3);
  const recommendedBooks = recommendedBookIds
    .map(bid => getBookById(bid))
    .filter(Boolean);

  return (
    <div className="book-detail-container">
      <button className="back-button" onClick={handleBack}>
        ← 返回书架
      </button>

      <div className="book-detail-content">
        <div className="book-cover-large" style={{ backgroundColor: coverColor }}>
          <div className="cover-title">{book.title}</div>
        </div>

        <div className="book-info">
          <h1 className="book-title">{book.title}</h1>
          <div className="book-meta">
            <span className="book-author">{book.author}</span>
            <span className="book-divider">·</span>
            <span className="book-year">{book.publishYear}年出版</span>
          </div>

          <div className="book-tags">
            <span className="book-category">{book.category}</span>
            {book.tags.map(tag => (
              <span key={tag} className="book-tag">{tag}</span>
            ))}
          </div>

          <div className="description-section">
            <h3 className="section-title">内容简介</h3>
            <div
              className="book-description"
              ref={descRef}
              style={{ overflow: isPreviewing ? 'hidden' : 'auto' }}
            >
              {book.description}
            </div>
          </div>

          <button
            className="preview-button"
            onClick={handleStartPreview}
            disabled={isPreviewing}
          >
            {isPreviewing ? '预览中...' : '开始预览'}
          </button>

          {showEndTip && (
            <div className="preview-end-tip">预览结束</div>
          )}

          <div className="progress-bar-container">
            <div
              className="progress-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="reviews-section">
          <h3 className="section-title">读者评论</h3>
          <div className="reviews-list">
            {displayReviews.map((review, index) => (
              <ReviewItem key={review.id} review={review} index={index} />
            ))}
          </div>
        </div>

        <div className="recommend-section">
          <h3 className="recommend-title">你可能也会喜欢</h3>
          <div className="recommend-books">
            {recommendedBooks.map((recBook, index) => recBook && (
              <div
                key={recBook.id}
                className="recommend-book-card"
                style={{
                  backgroundColor: hashColor(recBook.category),
                  animationDelay: `${index * 0.15}s`
                }}
                onClick={() => handleRecommendClick(recBook.id)}
              >
                <div className="recommend-book-title">{recBook.title}</div>
                <div className="recommend-book-author">{recBook.author}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
