import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../store';
import StarRating from '../components/StarRating';
import ReviewItem from '../components/ReviewItem';

const BookPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    currentBook,
    chapters,
    reviews,
    expandedChapterId,
    currentUser,
    toggleChapter,
    addReview,
    setCurrentBook,
  } = useStore();

  const [newReviewRating, setNewReviewRating] = useState<1 | 2 | 3 | 4 | 5>(5);
  const [newReviewContent, setNewReviewContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      setLoading(true);
      setCurrentBook(id).then(() => setLoading(false));
    }
  }, [id, setCurrentBook]);

  const handleSubmitReview = async () => {
    if (!currentUser || !id || !newReviewContent.trim()) return;
    const success = await addReview(id, newReviewRating, newReviewContent.trim());
    if (success) {
      setNewReviewContent('');
      setNewReviewRating(5);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <div>加载中...</div>
      </div>
    );
  }

  if (!currentBook) {
    return (
      <div className="page-container">
        <div>书籍不存在</div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="book-detail">
        <div className="book-cover-large">
          <img src={currentBook.coverUrl} alt={currentBook.title} />
        </div>
        <div className="book-meta">
          <h1>{currentBook.title}</h1>
          <p className="author">{currentBook.author}</p>
          <div style={{ marginBottom: '16px' }}>
            <StarRating rating={currentBook.avgRating} />
            <span style={{ marginLeft: '8px', color: 'var(--color-text-gray)' }}>
              {currentBook.avgRating} ({currentBook.reviewCount}条评价)
            </span>
          </div>
          <p className="description">{currentBook.description}</p>
        </div>
      </div>

      <div className="chapters-section">
        <h3 style={{ marginBottom: '16px' }}>章节目录</h3>
        {chapters.map((chapter) => (
          <div key={chapter.id} className="chapter-item">
            <div className="chapter-title" onClick={() => toggleChapter(chapter.id)}>
              <span>{chapter.title}</span>
              {expandedChapterId === chapter.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
            {expandedChapterId === chapter.id && (
              <div className="chapter-content">
                {chapter.pages.slice(0, 3).map((page, index) => (
                  <p key={index} style={{ marginBottom: '16px' }}>
                    {page}
                  </p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="reviews-section">
        <h3 style={{ marginBottom: '16px' }}>书评</h3>

        {currentUser ? (
          <div className="review-form">
            <div style={{ marginBottom: '12px' }}>
              <span style={{ marginRight: '8px' }}>评分：</span>
              <StarRating
                rating={newReviewRating}
                interactive
                onChange={(rating) => setNewReviewRating(rating as 1 | 2 | 3 | 4 | 5)}
              />
            </div>
            <textarea
              className="review-textarea"
              placeholder="写下你的书评..."
              value={newReviewContent}
              onChange={(e) => setNewReviewContent(e.target.value.slice(0, 300))}
              maxLength={300}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: 'var(--color-text-gray)' }}>
                {newReviewContent.length}/300
              </span>
              <button
                className="submit-btn"
                onClick={handleSubmitReview}
                disabled={!newReviewContent.trim()}
              >
                发表书评
              </button>
            </div>
          </div>
        ) : (
          <p style={{ marginBottom: '16px' }}>
            <Link to="/login" style={{ color: 'var(--color-accent)' }}>
              登录后发表书评
            </Link>
          </p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {reviews.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookPage;
