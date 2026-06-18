import { useState } from 'react';
import Link from 'next/link';
import type { Letter } from '@/types';
import { formatRelativeTime } from '@/utils/time';
import HeartIcon from './HeartIcon';
import BookIcon from './BookIcon';

interface LetterCardProps {
  letter: Letter;
  favorited: boolean;
  index: number;
  onFavorite: (letterId: number) => void;
}

function getRandomAspectRatio(id: number) {
  const ratios = [
    { paddingTop: '100%' },
    { paddingTop: '110%' },
    { paddingTop: '120%' },
    { paddingTop: '130%' },
    { paddingTop: '140%' },
    { paddingTop: '150%' },
  ];
  return ratios[id % ratios.length];
}

export default function LetterCard({ letter, favorited, index, onFavorite }: LetterCardProps) {
  const [animating, setAnimating] = useState(false);
  const ratio = getRandomAspectRatio(letter.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAnimating(true);
    onFavorite(letter.id);
    setTimeout(() => setAnimating(false), 300);
  };

  return (
    <div
      style={{
        breakInside: 'avoid',
        marginBottom: 16,
        animation: `fadeIn 0.5s ease-out ${index * 0.03}s both`,
      }}
    >
      <Link href={`/letter/${letter.id}`}>
        <div
          style={{
            position: 'relative',
            width: '100%',
            ...ratio,
            background: '#FDF9F0',
            borderRadius: 12,
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
            cursor: 'pointer',
            overflow: 'hidden',
          }}
          className="letter-card"
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              padding: '20px 18px',
              display: 'flex',
              flexDirection: 'column',
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
            }}
          >
            <h3
              style={{
                fontFamily: 'var(--font-kaiti)',
                fontSize: '1.2rem',
                color: '#2C1810',
                marginBottom: 12,
                lineHeight: 1.4,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {letter.title}
            </h3>
            <p
              style={{
                fontSize: '0.9rem',
                color: '#4A3B32',
                lineHeight: 1.7,
                flex: 1,
                display: '-webkit-box',
                WebkitLineClamp: 6,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {letter.content.slice(0, 30)}
              {letter.content.length > 30 ? '...' : ''}
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: 12,
                paddingTop: 12,
                borderTop: '1px solid rgba(139,115,85,0.1)',
              }}
            >
              <button
                onClick={handleFavorite}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 8px',
                  borderRadius: 6,
                  transition: 'transform 0.2s',
                }}
                className="fav-btn"
              >
                <HeartIcon filled={favorited} className={animating ? 'heart-beat' : ''} />
                <span style={{ fontSize: '0.8rem', color: '#8B7355' }}>
                  {letter.favoritesCount}
                </span>
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <BookIcon />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#8B7355' }}>
                  {formatRelativeTime(letter.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>

      <style jsx>{`
        .letter-card:hover {
          transform: translateY(-4px) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.08) !important;
        }
        .fav-btn:hover {
          transform: scale(1.05);
        }
      `}</style>
    </div>
  );
}
