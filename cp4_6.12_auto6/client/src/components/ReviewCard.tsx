import { useState } from 'react';
import type { Review } from '@/types';
import StarRating from './StarRating';
import Lightbox from './Lightbox';

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}年${month}月${day}日`;
  };

  const visibleImages = review.images.slice(0, 3);

  return (
    <>
      <div className="review-card" style={{
        padding: '16px',
        borderBottom: '1px solid var(--color-border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#8D6E63',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 600,
            flexShrink: 0,
          }}>
            {review.userName.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 500, fontSize: '14px' }}>{review.userName}</div>
            <div style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
              {formatDate(review.createdAt)}
            </div>
          </div>
          <StarRating rating={review.rating} size={16} />
        </div>
        <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--color-text)', marginBottom: visibleImages.length > 0 ? '10px' : 0 }}>
          {review.content}
        </p>
        {visibleImages.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {visibleImages.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`评价图片 ${i + 1}`}
                onClick={() => setLightboxIndex(i)}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  border: '1px solid var(--color-border)',
                  transition: 'transform 0.2s ease',
                }}
                onMouseOver={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1.05)'; }}
                onMouseOut={(e) => { (e.target as HTMLImageElement).style.transform = 'scale(1)'; }}
              />
            ))}
          </div>
        )}
      </div>
      {lightboxIndex >= 0 && (
        <Lightbox
          images={review.images}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(-1)}
        />
      )}
    </>
  );
}
