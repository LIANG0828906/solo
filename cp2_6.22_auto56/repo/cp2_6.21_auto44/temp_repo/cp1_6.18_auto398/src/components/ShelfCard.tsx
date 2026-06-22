import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookShelf } from '@/types';

interface ShelfCardProps {
  shelf: BookShelf;
  index?: number;
  onClick?: (shelf: BookShelf) => void;
}

const ShelfCard: React.FC<ShelfCardProps> = ({ shelf, index = 0, onClick }) => {
  const navigate = useNavigate();
  const [currentCovers, setCurrentCovers] = useState<string[]>(shelf.coverMosaic || []);
  const [transitionPhase, setTransitionPhase] = useState(false);

  useEffect(() => {
    if (currentCovers.length === 0) {
      setCurrentCovers([
        'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=200&h=300&fit=crop',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=200&h=300&fit=crop',
        'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=200&h=300&fit=crop',
        'https://images.unsplash.com/photo-1589998059171-988d887df646?w=200&h=300&fit=crop',
      ]);
    }
    const interval = setInterval(() => {
      setTransitionPhase(true);
      setTimeout(() => {
        setCurrentCovers((prev) => {
          const arr = [...prev];
          for (let i = arr.length - 1; i > 0; i--) {
            if (Math.random() > 0.4) {
              const j = Math.floor(Math.random() * (i + 1));
              [arr[i], arr[j]] = [arr[j], arr[i]];
            }
          }
          return arr;
        });
        setTransitionPhase(false);
      }, 400);
    }, 3000);
    return () => clearInterval(interval);
  }, [shelf.coverMosaic]);

  const handleClick = () => {
    if (onClick) {
      onClick(shelf);
    } else {
      navigate(`/shelf/${shelf.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="glass-card slide-up"
      style={{
        cursor: 'pointer',
        padding: 18,
        animationDelay: `${Math.min(index * 0.06, 0.5)}s`,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gridTemplateRows: '1fr 1fr',
          gap: 4,
          borderRadius: 12,
          overflow: 'hidden',
          aspectRatio: '1',
          width: '100%',
          marginBottom: 14,
          background: '#000',
          position: 'relative',
        }}
      >
        {currentCovers.slice(0, 4).map((url, i) => (
          <div
            key={i}
            style={{
              overflow: 'hidden',
              opacity: transitionPhase ? 0.3 : 1,
              transition: 'opacity 0.4s ease, transform 0.4s ease',
              transform: transitionPhase ? `scale(${0.9 + Math.random() * 0.1})` : 'scale(1)',
            }}
          >
            <img
              src={url}
              alt=""
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.6s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            />
          </div>
        ))}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            pointerEvents: 'none',
          }}
        />
        {shelf.isPublic && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              background: 'rgba(108, 99, 255, 0.9)',
              color: '#fff',
              fontSize: 10,
              padding: '3px 8px',
              borderRadius: 10,
              fontWeight: 600,
              backdropFilter: 'blur(4px)',
            }}
          >
            🌐 公开
          </div>
        )}
      </div>

      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: 6,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
        }}
      >
        {shelf.name}
      </div>
      {shelf.description && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            marginBottom: 12,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 38,
          }}
        >
          {shelf.description}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 12,
          color: 'var(--text-muted)',
          paddingTop: 12,
          borderTop: '1px solid var(--glass-border)',
        }}
      >
        <span>📖 {shelf.bookIds.length} 本</span>
        <span>❤️ {shelf.likes}</span>
      </div>
    </div>
  );
};

export default ShelfCard;
