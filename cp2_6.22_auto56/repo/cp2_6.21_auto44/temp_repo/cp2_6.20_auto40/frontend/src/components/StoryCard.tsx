import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Story } from '../types';

interface StoryCardProps {
  story: Story;
}

export default function StoryCard({ story }: StoryCardProps) {
  const navigate = useNavigate();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [displayPlayCount, setDisplayPlayCount] = useState(story.playCount);

  const coverImg =
    story.coverImageUrl || story.nodes[0]?.backgroundImageUrl ||
    'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=600&h=400&fit=crop';

  useEffect(() => {
    if (story.playCount !== displayPlayCount) {
      setDisplayPlayCount(story.playCount);
    }
  }, [story.playCount, displayPlayCount]);

  const rating = Math.round(story.averageRating * 10) / 10;
  const fullStars = Math.floor(rating);

  const handleClick = () => {
    navigate(`/play/${story.id}`);
  };

  return (
    <div
      className="story-card-wrapper"
      onClick={handleClick}
      style={{
        width: '100%',
        minHeight: 320,
        background: '#16213e',
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        breakInside: 'avoid',
        marginBottom: '1.5rem',
        display: 'inline-block',
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 10',
          background: !imgLoaded ? 'linear-gradient(135deg,#1a1a2e,#0f3460)' : undefined,
        }}
      >
        <img
          src={coverImg}
          alt={story.title}
          loading="lazy"
          onLoad={() => setImgLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: imgLoaded ? 'block' : 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(180deg, transparent 40%, rgba(22,33,62,0.95) 100%)',
            pointerEvents: 'none',
          }}
        />

        {story.published && (
          <div
            style={{
              position: 'absolute',
              right: 12,
              bottom: 110,
              background: 'rgba(15,52,96,0.85)',
              backdropFilter: 'blur(4px)',
              padding: '4px 8px',
              borderRadius: 6,
              fontSize: 12,
              color: '#eaeaea',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            🏷️ 已发布
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: 16,
          }}
        >
          <h3
            style={{
              fontFamily: "'Playfair Display', serif",
              color: '#eaeaea',
              fontSize: 20,
              fontWeight: 700,
              margin: '0 0 6px 0',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              lineHeight: 1.3,
            }}
          >
            {story.title || '未命名故事'}
          </h3>
          <div
            style={{
              color: '#a0a0b0',
              fontSize: 13,
              marginBottom: 12,
            }}
          >
            作者：{story.author || '匿名'}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#a0a0b0',
                fontSize: 13,
              }}
            >
              <span style={{ fontSize: 14 }}>👁️</span>
              <span
                className="play-count-num"
                key={`pc_${story.id}_${story.playCount}`}
              >
                {story.playCount.toLocaleString()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {[0, 1, 2, 3, 4].map((i) => {
                const isFilled = i < fullStars;
                const isHalf = !isFilled && i < story.averageRating;
                return (
                  <span
                    key={`${i}_${isFilled ? 'f' : isHalf ? 'h' : 'e'}_${story.ratingCount}_${story.id}`}
                    className="star-icon"
                    style={{
                      fontSize: 15,
                      color: isFilled
                        ? '#fbbf24'
                        : isHalf
                        ? '#fbbf24'
                        : '#64748b',
                      display: 'inline-block',
                      filter: isHalf ? 'opacity(0.5)' : undefined,
                    }}
                  >
                    {isFilled || isHalf ? '★' : '☆'}
                  </span>
                );
              })}
              <span
                style={{
                  color: '#a0a0b0',
                  fontSize: 12,
                  marginLeft: 4,
                }}
              >
                {story.averageRating > 0 ? story.averageRating.toFixed(1) : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .story-card-wrapper:hover {
          transform: translateY(-6px) !important;
          box-shadow: 0 12px 30px rgba(233,69,96,0.25) !important;
          transition: all 0.4s cubic-bezier(0.4,0,0.2,1) !important;
        }

        @keyframes bounceNumber {
          0% { transform: translateY(0) scaleY(1); }
          30% { transform: translateY(-6px) scaleY(1.15); }
          60% { transform: translateY(2px) scaleY(0.95); }
          100% { transform: translateY(0) scaleY(1); }
        }

        .play-count-num {
          display: inline-block;
          animation: bounceNumber 0.5s ease;
          font-weight: 600;
          color: #eaeaea;
        }

        @keyframes starRotate {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }

        .star-icon {
          display: inline-block;
          animation: starRotate 0.6s ease;
          transform-origin: center;
        }
      `}</style>
    </div>
  );
}
