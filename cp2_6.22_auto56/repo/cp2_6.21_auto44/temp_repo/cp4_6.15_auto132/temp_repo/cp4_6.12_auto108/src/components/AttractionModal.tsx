import { useEffect, useState, useMemo } from 'react';
import type { Attraction } from '../types';
import { INTEREST_LABELS, CATEGORY_COLORS } from '../types';
import { useApp } from '../context/AppContext';

function renderStars(rating: number) {
  const full = Math.round(rating);
  return '★'.repeat(full) + '☆'.repeat(5 - full);
}

function ImageWithFallback({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          height: '100%',
          background:
            'linear-gradient(135deg, #d0d0d0 0%, #e8e8e8 50%, #d0d0d0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#888',
          fontSize: 48,
        }}
      >
        📷
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      onError={() => setError(true)}
      className={className}
      loading="lazy"
    />
  );
}

function Carousel({ photos, title }: { photos: string[]; title: string }) {
  const [idx, setIdx] = useState(0);
  const items = useMemo(() => (photos.length ? photos : ['', '', '']), [photos]);
  const maxIdx = items.length - 1;

  useEffect(() => {
    if (items.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % items.length);
    }, 4500);
    return () => clearInterval(t);
  }, [items.length]);

  const prev = () => setIdx((i) => (i <= 0 ? maxIdx : i - 1));
  const next = () => setIdx((i) => (i >= maxIdx ? 0 : i + 1));

  return (
    <div className="carousel">
      {items.map((src, i) => (
        <div
          key={i}
          className={`carousel-slide ${i === idx ? 'active' : ''}`}
        >
          {src ? (
            <ImageWithFallback src={src} alt={`${title}-${i + 1}`} />
          ) : (
            <div
              style={{
                width: '100%',
                height: '100%',
                background:
                  'linear-gradient(135deg, #bdbdbd 0%, #e0e0e0 50%, #bdbdbd 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#757575',
                fontSize: 56,
              }}
            >
              🏞️
            </div>
          )}
        </div>
      ))}

      {items.length > 1 && (
        <>
          <div className="carousel-nav">
            <button className="carousel-btn" onClick={(e) => { e.stopPropagation(); prev(); }}>
              ‹
            </button>
            <button className="carousel-btn" onClick={(e) => { e.stopPropagation(); next(); }}>
              ›
            </button>
          </div>
          <div className="carousel-indicators">
            {items.map((_, i) => (
              <div
                key={i}
                className={`indicator ${i === idx ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setIdx(i); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function TypingText({ text }: { text: string }) {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    setShown(0);
    if (!text) return;
    let i = 0;
    const timer = setInterval(() => {
      i += 2;
      setShown(Math.min(i, text.length));
      if (i >= text.length) clearInterval(timer);
    }, 15);
    return () => clearInterval(timer);
  }, [text]);

  return (
    <div className="modal-description">
      {text.slice(0, shown)}
      {shown < text.length && <span className="typing-cursor" />}
    </div>
  );
}

export default function AttractionModal() {
  const { state, handleOpenModal } = useApp();
  const attr: Attraction | null = state.modalAttraction;

  useEffect(() => {
    if (!attr) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleOpenModal(null);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [attr, handleOpenModal]);

  if (!attr) return null;

  return (
    <div
      className="modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleOpenModal(null);
      }}
    >
      <div className="modal-content" style={{ position: 'relative' }}>
        <button
          type="button"
          className="modal-close"
          onClick={() => handleOpenModal(null)}
          aria-label="关闭"
        >
          ×
        </button>

        <Carousel photos={attr.photos} title={attr.name} />

        <div className="modal-body">
          <h2 className="modal-title">{attr.name}</h2>
          <div className="modal-subheader">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 14,
                color: 'var(--color-secondary)',
                fontWeight: 600,
              }}
            >
              {renderStars(attr.rating)}
              <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                {attr.rating.toFixed(1)}
              </span>
            </div>
            <span
              className="category-badge"
              style={{
                background: CATEGORY_COLORS[attr.category],
                padding: '4px 12px',
                fontSize: 12,
              }}
            >
              {INTEREST_LABELS[attr.category]}
            </span>
            <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              📍 {attr.city}
            </span>
            <span
              style={{
                marginLeft: 'auto',
                fontFamily: 'var(--font-display)',
                fontSize: 22,
                fontWeight: 700,
                color: 'var(--color-primary)',
              }}
            >
              ¥{attr.cost}
            </span>
          </div>

          <TypingText text={attr.description} />

          <div className="info-tags">
            <div className="info-tag">
              <span className="info-tag-icon">🕐</span>
              <span>开放时间：{attr.openTime}</span>
            </div>
            <div className="info-tag">
              <span className="info-tag-icon">⏱</span>
              <span>推荐停留：{attr.stayDuration}小时</span>
            </div>
            <div className="info-tag">
              <span className="info-tag-icon">💰</span>
              <span>预计花费：¥{attr.cost}/人</span>
            </div>
            <div className="info-tag">
              <span className="info-tag-icon">🧭</span>
              <span>
                坐标：{attr.lat.toFixed(4)}, {attr.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
