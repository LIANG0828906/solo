import React, { useEffect, useCallback } from 'react';
import { HiOutlineX } from 'react-icons/hi';

interface ImageLightboxProps {
  imageUrl: string | null;
  onClose: () => void;
}

export function ImageLightbox({ imageUrl, onClose }: ImageLightboxProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (imageUrl) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [imageUrl, handleKeyDown]);

  if (!imageUrl) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="lightbox" onClick={handleOverlayClick}>
      <button className="lightbox__close" onClick={onClose} aria-label="关闭">
        <HiOutlineX size={24} />
      </button>
      <div className="lightbox__inner">
        <img src={imageUrl} alt="预览" className="lightbox__image" loading="lazy" />
      </div>
    </div>
  );
}
