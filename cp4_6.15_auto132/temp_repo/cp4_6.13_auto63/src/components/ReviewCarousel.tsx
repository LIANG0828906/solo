import React, { useEffect, useRef, useState } from 'react';

export interface Review {
  id: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  bookTitle?: string;
}

interface ReviewCarouselProps {
  reviews: Review[];
}

const ChevronIcon: React.FC<{ direction: 'left' | 'right'; size?: number }> = ({ direction, size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ transform: direction === 'left' ? 'none' : 'rotate(180deg)' }}
  >
    <polyline points="15 18 9 12 15 6"></polyline>
  </svg>
);

const STAR_COUNT = 5;
const AUTO_INTERVAL = 5000;

const ReviewCarousel: React.FC<ReviewCarouselProps> = ({ reviews }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const limitedReviews = reviews.slice(0, 10);
  const total = limitedReviews.length;

  const startAutoPlay = () => {
    if (timerRef.current || total <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, AUTO_INTERVAL);
  };

  const stopAutoPlay = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total]);

  useEffect(() => {
    if (currentIndex >= total && total > 0) {
      setCurrentIndex(0);
    }
  }, [total, currentIndex]);

  const goPrev = () => {
    stopAutoPlay();
    setCurrentIndex((prev) => (prev - 1 + total) % total);
    startAutoPlay();
  };

  const goNext = () => {
    stopAutoPlay();
    setCurrentIndex((prev) => (prev + 1) % total);
    startAutoPlay();
  };

  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    maxWidth: 700,
    margin: '0 auto',
  };

  const viewportStyle: React.CSSProperties = {
    overflow: 'hidden',
    borderRadius: 16,
  };

  const trackStyle: React.CSSProperties = {
    display: 'flex',
    transform: `translateX(-${currentIndex * 100}%)`,
    transition: 'transform 0.4s ease',
  };

  const cardBaseStyle: React.CSSProperties = {
    flex: '0 0 100%',
    minWidth: 0,
    boxSizing: 'border-box',
    padding: 20,
    background: 'linear-gradient(135deg, #E8D5F2 0%, #F5D5E5 100%)',
    borderRadius: 16,
  };

  const emptyStyle: React.CSSProperties = {
    ...cardBaseStyle,
    textAlign: 'center',
    color: '#7C3AED',
    fontSize: 15,
    padding: 50,
  };

  const reviewerInfoStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  };

  const avatarStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: '50%',
    backgroundColor: '#C4B5FD',
    color: '#5B21B6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    fontWeight: 600,
    flexShrink: 0,
    overflow: 'hidden',
    border: '2px solid #FFFFFF',
    boxShadow: '0 2px 6px rgba(124, 58, 237, 0.2)',
  };

  const avatarImgStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  };

  const reviewerMetaStyle: React.CSSProperties = {
    flex: 1,
    minWidth: 0,
  };

  const nameStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    color: '#4C1D95',
    margin: 0,
  };

  const dateStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#7C3AED',
    margin: 0,
    marginTop: 2,
  };

  const starStyle = (active: boolean): React.CSSProperties => ({
    color: active ? '#F59E0B' : '#E9D5FF',
    fontSize: 16,
    letterSpacing: 1,
  });

  const commentStyle: React.CSSProperties = {
    fontSize: 14,
    color: '#5B21B6',
    lineHeight: 1.65,
    margin: 0,
    padding: '12px 14px',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 10,
    border: '1px solid rgba(255, 255, 255, 0.7)',
  };

  const bookTitleStyle: React.CSSProperties = {
    fontSize: 12,
    color: '#9333EA',
    marginTop: 10,
    fontStyle: 'italic',
  };

  const navBtnBaseStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#7C3AED',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    boxShadow: '0 2px 10px rgba(124, 58, 237, 0.2)',
    transition: 'background-color 0.2s ease, transform 0.2s ease',
  };

  const leftBtnStyle: React.CSSProperties = {
    ...navBtnBaseStyle,
    left: -8,
  };

  const rightBtnStyle: React.CSSProperties = {
    ...navBtnBaseStyle,
    right: -8,
  };

  const dotsWrapStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  };

  const dotStyle = (active: boolean): React.CSSProperties => ({
    width: active ? 24 : 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: active ? '#A78BFA' : '#E9D5FF',
    border: 'none',
    cursor: 'pointer',
    transition: 'width 0.3s ease, background-color 0.3s ease',
    padding: 0,
  });

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 0; i < STAR_COUNT; i++) {
      stars.push(
        <span key={i} style={starStyle(i < rating)}>★</span>
      );
    }
    return stars;
  };

  if (total === 0) {
    return (
      <div style={wrapperStyle}>
        <div style={emptyStyle}>暂无评价内容</div>
      </div>
    );
  }

  return (
    <div
      style={wrapperStyle}
      ref={containerRef}
      onMouseEnter={stopAutoPlay}
      onMouseLeave={startAutoPlay}
    >
      {total > 1 && (
        <button
          style={leftBtnStyle}
          onClick={goPrev}
          aria-label="上一条"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F3E8FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          }}
        >
          <ChevronIcon direction="left" />
        </button>
      )}

      <div style={viewportStyle}>
        <div style={trackStyle}>
          {limitedReviews.map((review) => (
            <div key={review.id} style={cardBaseStyle}>
              <div style={reviewerInfoStyle}>
                <div style={avatarStyle}>
                  {review.reviewerAvatar ? (
                    <img src={review.reviewerAvatar} alt={review.reviewerName} style={avatarImgStyle} />
                  ) : (
                    review.reviewerName.charAt(0)
                  )}
                </div>
                <div style={reviewerMetaStyle}>
                  <p style={nameStyle}>{review.reviewerName}</p>
                  <p style={dateStyle}>{review.date}</p>
                </div>
                <div>{renderStars(review.rating)}</div>
              </div>
              <p style={commentStyle}>"{review.comment}"</p>
              {review.bookTitle && (
                <div style={bookTitleStyle}>—— 《{review.bookTitle}》</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {total > 1 && (
        <button
          style={rightBtnStyle}
          onClick={goNext}
          aria-label="下一条"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F3E8FF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
          }}
        >
          <ChevronIcon direction="right" />
        </button>
      )}

      {total > 1 && (
        <div style={dotsWrapStyle}>
          {limitedReviews.map((_, idx) => (
            <button
              key={idx}
              style={dotStyle(idx === currentIndex)}
              onClick={() => {
                stopAutoPlay();
                setCurrentIndex(idx);
                startAutoPlay();
              }}
              aria-label={`第 ${idx + 1} 条`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewCarousel;
