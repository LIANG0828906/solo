import React, { useEffect, useCallback } from 'react';
import { usePhotoStore } from '../../store';

const PhotoViewer: React.FC = () => {
  const {
    viewerOpen,
    photos,
    currentPhotoId,
    closeViewer,
    goToPrevPhoto,
    goToNextPhoto
  } = usePhotoStore();

  const currentPhoto = photos.find(p => p.id === currentPhotoId);
  const currentIndex = photos.findIndex(p => p.id === currentPhotoId);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!viewerOpen) return;
    if (e.key === 'Escape') closeViewer();
    if (e.key === 'ArrowLeft') goToPrevPhoto();
    if (e.key === 'ArrowRight') goToNextPhoto();
  }, [viewerOpen, closeViewer, goToPrevPhoto, goToNextPhoto]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    if (viewerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [viewerOpen]);

  if (!viewerOpen || !currentPhoto) return null;

  const buttonStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: '#ffffff',
    border: 'none',
    cursor: 'pointer',
    fontSize: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease-out',
    zIndex: 10
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closeViewer();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#000000CC',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <button
        onClick={closeViewer}
        style={{
          position: 'absolute',
          top: '24px',
          right: '24px',
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
          color: '#ffffff',
          border: 'none',
          cursor: 'pointer',
          fontSize: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s ease-out',
          zIndex: 10
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
      >
        ×
      </button>

      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToPrevPhoto(); }}
          style={{ ...buttonStyle, left: '24px' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
        >
          ‹
        </button>
      )}

      {currentIndex < photos.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); goToNextPhoto(); }}
          style={{ ...buttonStyle, right: '24px' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)'; }}
        >
          ›
        </button>
      )}

      <div style={{ maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <img
          key={currentPhoto.id}
          src={currentPhoto.fullUrl}
          alt={currentPhoto.title}
          className="fade-in"
          style={{
            maxWidth: '90vw',
            maxHeight: '80vh',
            objectFit: 'contain',
            borderRadius: '8px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)'
          }}
        />
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <h2 style={{ color: '#ffffff', fontSize: '18px', marginBottom: '4px' }}>{currentPhoto.title}</h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>{currentPhoto.date}</p>
        </div>
      </div>
    </div>
  );
};

export default PhotoViewer;
