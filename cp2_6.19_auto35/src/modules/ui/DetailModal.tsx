import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';

const DetailModal: React.FC = () => {
  const { showDetailModal, detailArtworkId, artworks, closeDetailModal, updateArtworkNote } =
    useStore();
  const [note, setNote] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const artwork = artworks.find((a) => a.id === detailArtworkId);

  useEffect(() => {
    if (showDetailModal && artwork) {
      setNote(artwork.note);
      setIsExiting(false);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    }
  }, [showDetailModal, detailArtworkId, artwork]);

  const handleClose = () => {
    setIsExiting(true);
    setIsVisible(false);
    setTimeout(() => {
      closeDetailModal();
    }, 300);
  };

  const handleSaveNote = () => {
    if (detailArtworkId) {
      updateArtworkNote(detailArtworkId, note);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showDetailModal && !isExiting) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDetailModal, isExiting]);

  if (!showDetailModal || !artwork) return null;

  return (
    <div
      className={`detail-modal-backdrop ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}
      onClick={handleBackdropClick}
    >
      <div className={`detail-modal ${isVisible ? 'visible' : ''} ${isExiting ? 'exiting' : ''}`}>
        <div className="detail-modal-header">
          <h3>{artwork.name}</h3>
          <button className="close-button" onClick={handleClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="detail-modal-content">
          <div className="detail-image-section">
            <div className="detail-image-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="M21 15l-5-5L5 21" />
              </svg>
            </div>
          </div>

          <div className="detail-info-section">
            <div className="detail-row">
              <span className="detail-label">尺寸</span>
              <span className="detail-value">
                {artwork.width} × {artwork.height} cm
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">方向</span>
              <span className="detail-value">
                {artwork.orientation === 'portrait'
                  ? '竖版'
                  : artwork.orientation === 'landscape'
                  ? '横版'
                  : '方形'}
              </span>
            </div>
            <div className="detail-row">
              <span className="detail-label">创建日期</span>
              <span className="detail-value">{artwork.createdAt}</span>
            </div>

            <div className="detail-section">
              <span className="detail-section-title">描述</span>
              <p className="detail-description">{artwork.description}</p>
            </div>

            <div className="detail-section">
              <span className="detail-section-title">标签</span>
              <div className="detail-tags">
                {artwork.tags.map((tag) => (
                  <span key={tag} className="detail-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <span className="detail-section-title">笔记</span>
              <textarea
                className="detail-note-input"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={handleSaveNote}
                placeholder="添加笔记..."
                rows={4}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
