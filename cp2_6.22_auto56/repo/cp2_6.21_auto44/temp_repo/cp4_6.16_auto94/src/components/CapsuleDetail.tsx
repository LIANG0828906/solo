import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { format, differenceInDays } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { Capsule } from '../types';
import './CapsuleDetail.css';

interface CapsuleDetailProps {
  capsule: Capsule | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenCapsule: (id: string) => Promise<void>;
}

export default function CapsuleDetail({ capsule, isOpen, onClose, onOpenCapsule }: CapsuleDetailProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen && capsule && capsule.status === 'unlocked') {
      onOpenCapsule(capsule.id);
    }
  }, [isOpen, capsule, onOpenCapsule]);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 250);
  };

  if (!capsule || !isOpen) return null;

  const images = capsule.mediaItems.filter((m) => m.type === 'image');
  const audios = capsule.mediaItems.filter((m) => m.type === 'audio');

  const createdDate = new Date(capsule.createdAt);
  const openedDate = capsule.openedAt ? new Date(capsule.openedAt) : null;
  const savedDays = openedDate ? differenceInDays(openedDate, createdDate) : 0;

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
  };

  const closeLightbox = () => {
    setActiveImageIndex(null);
  };

  const prevImage = () => {
    if (activeImageIndex === null) return;
    setActiveImageIndex((prev) => (prev! > 0 ? prev! - 1 : images.length - 1));
  };

  const nextImage = () => {
    if (activeImageIndex === null) return;
    setActiveImageIndex((prev) => (prev! < images.length - 1 ? prev! + 1 : 0));
  };

  return (
    <div
      className={`detail-overlay ${isClosing ? 'closing' : ''}`}
      onClick={handleClose}
    >
      <div
        className={`detail-modal ${isClosing ? 'closing' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="detail-close-btn" onClick={handleClose}>
          ✕
        </button>

        <div className="detail-content">
          <h1 className="detail-title">{capsule.title}</h1>

          <div className="detail-meta">
            <div className="meta-item">
              <span className="meta-label">封存时间</span>
              <span className="meta-value">
                {format(createdDate, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
              </span>
            </div>
            {openedDate && (
              <div className="meta-item">
                <span className="meta-label">开启时间</span>
                <span className="meta-value">
                  {format(openedDate, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                </span>
              </div>
            )}
            <div className="meta-item highlight">
              <span className="meta-label">已保存</span>
              <span className="meta-value">{savedDays} 天</span>
            </div>
          </div>

          <div className="detail-body">
            <div className="markdown-content">
              <ReactMarkdown>{capsule.content}</ReactMarkdown>
            </div>
          </div>

          {images.length > 0 && (
            <div className="media-section">
              <h3 className="section-title">📷 照片记忆</h3>
              <div className="image-gallery">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="gallery-item"
                    onClick={() => openLightbox(idx)}
                  >
                    <img src={img.dataUrl} alt={`照片 ${idx + 1}`} loading="lazy" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {audios.length > 0 && (
            <div className="media-section">
              <h3 className="section-title">🎵 声音记录</h3>
              <div className="audio-list">
                {audios.map((audio, idx) => (
                  <div key={audio.id} className="audio-item">
                    <span className="audio-name">{audio.name || `录音 ${idx + 1}`}</span>
                    <audio controls src={audio.dataUrl} preload="none" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {activeImageIndex !== null && (
        <div className="lightbox" onClick={closeLightbox}>
          <button className="lightbox-close" onClick={closeLightbox}>
            ✕
          </button>
          <button className="lightbox-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
            ‹
          </button>
          <img
            src={images[activeImageIndex].dataUrl}
            alt="预览"
            onClick={(e) => e.stopPropagation()}
          />
          <button className="lightbox-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
            ›
          </button>
          <div className="lightbox-counter">
            {activeImageIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}
