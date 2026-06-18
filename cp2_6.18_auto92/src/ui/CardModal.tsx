import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';

export const CardModal: React.FC = () => {
  const { isCardModalOpen, currentCard, closeCardModal } = useGameStore();
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    if (isCardModalOpen) {
      setImageLoaded(false);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
    }
  }, [isCardModalOpen]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      closeCardModal();
    }, 300);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isCardModalOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCardModalOpen]);

  if (!isCardModalOpen && !isVisible) return null;

  return (
    <div
      onClick={handleBackdropClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: isVisible
          ? 'rgba(0, 0, 0, 0.85)'
          : 'rgba(0, 0, 0, 0)',
        backdropFilter: isVisible ? 'blur(8px)' : 'blur(0px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'all 0.3s ease',
        padding: '20px',
      }}
    >
      <style>{`
        @keyframes cardSlideUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>

      <div
        style={{
          maxWidth: '500px',
          width: '100%',
          maxHeight: '90vh',
          background: 'linear-gradient(135deg, #1A1B41 0%, #2D2F6E 100%)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: isVisible
            ? '0 25px 80px rgba(0, 0, 0, 0.6), 0 0 60px rgba(0, 229, 255, 0.15)'
            : 'none',
          border: '1px solid rgba(255, 215, 0, 0.2)',
          animation: isVisible ? 'cardSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {currentCard && (
          <>
            <div
              style={{
                position: 'relative',
                width: '100%',
                paddingTop: '75%',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #1A1B41 0%, #2D2F6E 100%)',
              }}
            >
              {!imageLoaded && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(90deg, #1A1B41 25%, #2D2F6E 50%, #1A1B41 75%)',
                    backgroundSize: '200% 100%',
                    animation: 'shimmer 1.5s infinite',
                  }}
                />
              )}
              <img
                src={currentCard.image}
                alt={currentCard.title}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: imageLoaded ? 1 : 0,
                  transition: 'opacity 0.5s ease',
                }}
                onLoad={() => setImageLoaded(true)}
                draggable={false}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: '40%',
                  background: 'linear-gradient(to top, #1A1B41 0%, transparent 100%)',
                  pointerEvents: 'none',
                }}
              />
            </div>

            <div
              style={{
                padding: '24px 28px 28px',
                overflowY: 'auto',
                flex: 1,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#FFD700',
                  textShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}
              >
                {currentCard.title}
              </h2>

              <p
                style={{
                  margin: 0,
                  fontSize: '15px',
                  lineHeight: 1.8,
                  color: 'rgba(255, 255, 255, 0.85)',
                  letterSpacing: '0.3px',
                }}
              >
                {currentCard.content}
              </p>
            </div>

            <div
              style={{
                padding: '0 28px 24px',
                borderTop: '1px solid rgba(255, 215, 0, 0.1)',
                paddingTop: '20px',
              }}
            >
              <button
                onClick={handleClose}
                style={{
                  width: '100%',
                  padding: '14px 24px',
                  background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  color: '#1A1B41',
                  fontSize: '16px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(255, 215, 0, 0.3)',
                  letterSpacing: '0.5px',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 25px rgba(255, 215, 0, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 215, 0, 0.3)';
                }}
              >
                继续探索 →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CardModal;
