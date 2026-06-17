import { useState, useRef, useEffect } from 'react';
import { useBottleStore } from '../store/useBottleStore';
import type { Bottle } from '../types';

const styles: { [key: string]: React.CSSProperties } = {
  cardWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  card: {
    width: '320px',
    minHeight: '200px',
    backgroundColor: '#1E293B',
    border: '1px solid #2D4A6C',
    borderRadius: '16px',
    boxShadow: '0 8px 24px #00000055',
    padding: '28px 24px',
    transition: 'all 0.3s ease-out',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    position: 'relative',
    zIndex: 2
  },
  emptyContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    minHeight: '150px',
    color: '#64748B',
    textAlign: 'center',
    gap: '12px'
  },
  emptyIcon: {
    fontSize: '48px',
    opacity: 0.5
  },
  emptyText: {
    fontSize: '14px',
    lineHeight: 1.6
  },
  bottleContent: {
    color: '#E2E8F0',
    fontSize: '15px',
    lineHeight: 1.8,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word'
  },
  imagesContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  image: {
    maxWidth: '140px',
    maxHeight: '140px',
    borderRadius: '8px',
    objectFit: 'cover'
  },
  continuations: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    borderTop: '1px solid #2D4A6C',
    paddingTop: '14px'
  },
  continuationItem: {
    padding: '10px 12px',
    backgroundColor: 'rgba(78, 205, 196, 0.08)',
    borderRadius: '8px',
    borderLeft: '2px solid #4ECDC4',
    fontSize: '13px',
    color: '#94A3B8',
    lineHeight: 1.6
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    borderTop: '1px solid #2D4A6C',
    paddingTop: '14px'
  },
  textarea: {
    width: '100%',
    minHeight: '48px',
    maxHeight: '120px',
    padding: '10px 12px',
    backgroundColor: '#0F1B2D',
    border: '1px solid #2D4A6C',
    borderRadius: '8px',
    color: '#E2E8F0',
    fontSize: '13px',
    lineHeight: 1.6,
    resize: 'none',
    outline: 'none',
    transition: 'border-color 0.3s ease-out',
    fontFamily: 'inherit'
  },
  charCount: {
    alignSelf: 'flex-end',
    fontSize: '11px',
    color: '#64748B'
  },
  submitBtn: {
    alignSelf: 'flex-end',
    padding: '8px 20px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#4ECDC4',
    color: '#0F1B2D',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease-out'
  },
  lightPoint: {
    position: 'absolute',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#FFD93D',
    boxShadow: '0 0 8px 2px rgba(255, 217, 61, 0.6)',
    zIndex: 3
  },
  resetBtn: {
    alignSelf: 'flex-end',
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: 'transparent',
    color: '#64748B',
    fontSize: '12px',
    cursor: 'pointer',
    transition: 'color 0.3s ease-out'
  }
};

function BottleCard() {
  const { currentBottle, addBottleContinuation, fetchRandomBottle, loading } = useBottleStore();
  const [continuation, setContinuation] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [rotateAngle, setRotateAngle] = useState(0);

  useEffect(() => {
    if (!currentBottle) return;
    const interval = setInterval(() => {
      setRotateAngle(prev => (prev + 1.2) % 360);
    }, 50);
    return () => clearInterval(interval);
  }, [currentBottle]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [continuation]);

  const handleSubmit = () => {
    if (continuation.trim()) {
      addBottleContinuation(continuation.trim());
      setContinuation('');
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.length <= 200) {
      setContinuation(val);
    }
  };

  const lightPoints = currentBottle ? Array.from({ length: 8 }, (_, i) => {
    const angle = (rotateAngle + i * 45) * (Math.PI / 180);
    const radius = 185;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius * 0.7;
    return { x, y, key: i };
  }) : [];

  const responsiveCardStyle: React.CSSProperties = {
    ...styles.card,
    width: '100%',
    maxWidth: '320px'
  };

  return (
    <div style={styles.cardWrapper}>
      <style>{`
        @media (max-width: 768px) {
          .bottleCard { width: 90% !important; max-width: none !important; }
        }
      `}</style>

      {lightPoints.map(point => (
        <div
          key={point.key}
          style={{
            ...styles.lightPoint,
            transform: `translate(${point.x}px, ${point.y}px)`
          }}
        />
      ))}

      <div className="bottleCard" style={responsiveCardStyle}>
        {!currentBottle ? (
          <div style={styles.emptyContent}>
            <div style={styles.emptyIcon}>🌊</div>
            <p style={styles.emptyText}>
              扔出一个漂流瓶，分享你的灵感<br />
              或捞起一个，与陌生人的灵感相遇
            </p>
          </div>
        ) : (
          <BottleContent
            bottle={currentBottle}
            continuation={continuation}
            onContinuationChange={handleTextareaChange}
            onSubmit={handleSubmit}
            textareaRef={textareaRef}
            loading={loading}
          />
        )}

        {currentBottle && (
          <button
            style={styles.resetBtn}
            onClick={fetchRandomBottle}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#4ECDC4'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B'; }}
          >
            换一个漂流瓶 →
          </button>
        )}
      </div>
    </div>
  );
}

interface BottleContentProps {
  bottle: Bottle;
  continuation: string;
  onContinuationChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  loading: boolean;
}

function BottleContent({ bottle, continuation, onContinuationChange, onSubmit, textareaRef, loading }: BottleContentProps) {
  return (
    <>
      <p style={styles.bottleContent}>{bottle.content}</p>

      {bottle.images.length > 0 && (
        <div style={styles.imagesContainer}>
          {bottle.images.map((img, idx) => (
            <img key={idx} src={img} alt="" style={styles.image} />
          ))}
        </div>
      )}

      {bottle.continuations.length > 0 && (
        <div style={styles.continuations}>
          {bottle.continuations.map((c) => (
            <div key={c.id} style={styles.continuationItem}>
              {c.content}
            </div>
          ))}
        </div>
      )}

      <div style={styles.inputWrapper}>
        <textarea
          ref={textareaRef}
          value={continuation}
          onChange={onContinuationChange}
          placeholder="写下你的感悟或续写..."
          style={styles.textarea}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#4ECDC4'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#2D4A6C'; }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={styles.charCount}>{continuation.length}/200</span>
          <button
            style={styles.submitBtn}
            disabled={!continuation.trim() || loading}
            onClick={onSubmit}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#6EE7E7';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = '#4ECDC4';
                e.currentTarget.style.transform = 'translateY(0)';
              }
            }}
          >
            续写灵感
          </button>
        </div>
      </div>
    </>
  );
}

export default BottleCard;
