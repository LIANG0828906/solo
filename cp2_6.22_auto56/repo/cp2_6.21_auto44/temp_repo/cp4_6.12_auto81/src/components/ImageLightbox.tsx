import { useEffect, useState, useCallback, useRef } from 'react';

interface Props {
  images: string[];
  index: number;
  onClose: () => void;
}

function ImageLightbox({ images, index, onClose }: Props) {
  const [cur, setCur] = useState(index);
  const touchStartX = useRef<number | null>(null);

  const total = images.length;

  const prev = useCallback(() => {
    setCur(i => (i - 1 + total) % total);
  }, [total]);

  const next = useCallback(() => {
    setCur(i => (i + 1) % total);
  }, [total]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    const scroll = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = scroll;
    };
  }, [onClose, prev, next]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current == null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff < 0) next();
      else prev();
    }
    touchStartX.current = null;
  };

  return (
    <div className="lightbox-mask" onClick={onClose}>
      <div
        className="lightbox-stage"
        onClick={e => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button className="lightbox-close" onClick={onClose} aria-label="关闭">×</button>
        {total > 1 && (
          <>
            <button className="lightbox-nav nav-left" onClick={prev} aria-label="上一张">‹</button>
            <button className="lightbox-nav nav-right" onClick={next} aria-label="下一张">›</button>
          </>
        )}
        <img src={images[cur]} alt="" className="lightbox-img" />
        {total > 1 && (
          <div className="lightbox-counter">{cur + 1} / {total}</div>
        )}
      </div>
    </div>
  );
}

export default ImageLightbox;
