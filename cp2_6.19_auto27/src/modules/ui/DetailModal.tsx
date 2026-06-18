import React, { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';

export const DetailModal: React.FC = () => {
  const {
    isDetailModalOpen,
    detailModalArtworkId,
    artworks,
    closeDetailModal,
    updateArtworkNotes,
  } = useStore();

  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [notes, setNotes] = useState('');

  const artwork = artworks.find((a) => a.id === detailModalArtworkId);

  useEffect(() => {
    if (isDetailModalOpen && artwork) {
      setNotes(artwork.notes);
      setIsAnimating(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    } else if (!isDetailModalOpen) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isDetailModalOpen, artwork]);

  const handleClose = () => {
    if (artwork && notes !== artwork.notes) {
      updateArtworkNotes(artwork.id, notes);
    }
    closeDetailModal();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDetailModalOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDetailModalOpen, notes, artwork]);

  if (!isAnimating || !artwork) return null;

  const getOrientationLabel = (orientation: string) => {
    switch (orientation) {
      case 'portrait':
        return '竖版';
      case 'landscape':
        return '横版';
      case 'square':
        return '方形';
      default:
        return orientation;
    }
  };

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: isVisible
          ? 'rgba(0, 0, 0, 0.6)'
          : 'rgba(0, 0, 0, 0)',
        backdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        WebkitBackdropFilter: isVisible ? 'blur(4px)' : 'blur(0px)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'background-color 300ms ease, backdrop-filter 300ms ease',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 500,
          backgroundColor: '#2A2A2A',
          borderRadius: '16px 16px 0 0',
          padding: 24,
          paddingBottom: 40,
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          maxHeight: '80vh',
          overflowY: 'auto',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 20,
          }}
        >
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 600,
                color: '#E0E0E0',
                marginBottom: 4,
              }}
            >
              {artwork.name}
            </h2>
            <div
              style={{
                fontSize: 12,
                color: '#888',
              }}
            >
              创建于 {artwork.createdAt}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              border: 'none',
              backgroundColor: '#3A3A3A',
              color: '#E0E0E0',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#4A90D9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3A3A3A';
            }}
          >
            ×
          </button>
        </div>

        <div
          style={{
            width: '100%',
            height: 200,
            backgroundColor: '#444',
            borderRadius: 8,
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#888',
            fontSize: 14,
          }}
        >
          展品图片预览
        </div>

        <div
          style={{
            marginBottom: 16,
          }}
        >
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#E0E0E0',
              margin: '0 0 8px 0',
            }}
          >
            作品描述
          </h3>
          <p
            style={{
              fontSize: 13,
              color: '#BBB',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {artwork.description}
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 16,
            marginBottom: 16,
          }}
        >
          <div>
            <h3
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#888',
                margin: '0 0 4px 0',
              }}
            >
              尺寸
            </h3>
            <p
              style={{
                fontSize: 14,
                color: '#E0E0E0',
                margin: 0,
                fontWeight: 500,
              }}
            >
              {artwork.width} × {artwork.height} cm
            </p>
          </div>
          <div>
            <h3
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#888',
                margin: '0 0 4px 0',
              }}
            >
              方向
            </h3>
            <p
              style={{
                fontSize: 14,
                color: '#E0E0E0',
                margin: 0,
                fontWeight: 500,
              }}
            >
              {getOrientationLabel(artwork.orientation)}
            </p>
          </div>
        </div>

        <div
          style={{
            marginBottom: 20,
          }}
        >
          <h3
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#888',
              margin: '0 0 8px 0',
            }}
          >
            标签
          </h3>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {artwork.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  backgroundColor: '#3A3A3A',
                  color: '#4A90D9',
                  padding: '4px 10px',
                  borderRadius: 12,
                  fontSize: 11,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h3
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#E0E0E0',
              margin: '0 0 8px 0',
            }}
          >
            笔记
          </h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="添加关于这件展品的笔记..."
            style={{
              width: '100%',
              minHeight: 80,
              padding: 10,
              border: '1px solid #555',
              borderRadius: 6,
              backgroundColor: '#3A3A3A',
              color: '#E0E0E0',
              fontSize: 12,
              resize: 'vertical',
              outline: 'none',
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#4A90D9';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#555';
            }}
          />
        </div>
      </div>
    </div>
  );
};
