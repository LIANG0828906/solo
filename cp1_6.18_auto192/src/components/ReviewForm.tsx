import { useState } from 'react';
import { Star } from 'lucide-react';

interface ReviewFormProps {
  movieId: string;
  onSubmit: (movieId: string, text: string, rating: number) => Promise<void>;
}

const ratingLabels = ['很差', '较差', '一般', '不错', '很棒'];

export default function ReviewForm({ movieId, onSubmit }: ReviewFormProps) {
  const [text, setText] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || rating === 0) return;
    
    setIsSubmitting(true);
    await onSubmit(movieId, text.trim(), rating);
    setText('');
    setRating(0);
    setIsSubmitting(false);
  };

  return (
    <div
      style={{
        backgroundColor: '#1E293B',
        borderRadius: '12px',
        padding: '24px',
      }}
    >
      <h3 style={{ color: '#F1F5F9', fontSize: '20px', margin: '0 0 16px 0' }}>
        撰写影评
      </h3>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ color: '#94A3B8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
          您的评分
        </label>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= (hoverRating || rating);
            const isHovered = star === hoverRating;
            return (
              <div
                key={star}
                style={{
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease-in-out',
                  transform: isHovered ? 'scale(1.2)' : 'scale(1)',
                }}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  size={32}
                  fill={isFilled ? 'url(#starGradient)' : 'none'}
                  stroke={isFilled ? '#F59E0B' : '#475569'}
                  strokeWidth={2}
                />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="starGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#FCD34D" />
                    </linearGradient>
                  </defs>
                </svg>
                {isHovered && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-32px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      backgroundColor: '#334155',
                      color: '#F1F5F9',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ratingLabels[star - 1]}
                  </div>
                )}
              </div>
            );
          })}
          {rating > 0 && (
            <span style={{ color: '#F59E0B', marginLeft: '12px', fontSize: '16px' }}>
              {rating} / 5
            </span>
          )}
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <label style={{ color: '#94A3B8', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
          影评内容
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="分享您对这部电影的看法..."
          style={{
            width: '100%',
            height: '120px',
            padding: '12px',
            backgroundColor: '#0F172A',
            border: '1px solid #D1D5DB',
            borderRadius: '8px',
            color: '#F1F5F9',
            fontSize: '14px',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.25s ease-in-out',
            fontFamily: 'inherit',
          }}
          onFocus={(e) => (e.target as HTMLTextAreaElement).style.borderColor = '#3B82F6'}
          onBlur={(e) => (e.target as HTMLTextAreaElement).style.borderColor = '#D1D5DB'}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !text.trim() || rating === 0}
        style={{
          backgroundColor: '#3B82F6',
          color: '#FFFFFF',
          padding: '12px 28px',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 600,
          cursor: isSubmitting || !text.trim() || rating === 0 ? 'not-allowed' : 'pointer',
          opacity: isSubmitting || !text.trim() || rating === 0 ? 0.5 : 1,
          transition: 'all 0.25s ease-in-out',
        }}
        onMouseDown={(e) => {
          if (!isSubmitting && text.trim() && rating > 0) {
            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
          }
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        {isSubmitting ? '提交中...' : '发布影评'}
      </button>
    </div>
  );
}
