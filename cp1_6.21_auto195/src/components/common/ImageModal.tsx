import React from 'react';

interface Props {
  src: string;
  alt: string;
  onClose: () => void;
}

const ImageModal: React.FC<Props> = ({ src, alt, onClose }) => {
  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.75)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
  };

  const modalStyle: React.CSSProperties = {
    background: '#FFFFFF',
    borderRadius: '16px',
    padding: '16px',
    maxWidth: '500px',
    maxHeight: '90vh',
    position: 'relative',
    animation: 'popIn 0.3s ease-out',
  };

  const imgStyle: React.CSSProperties = {
    width: '100%',
    maxHeight: '60vh',
    objectFit: 'contain',
    borderRadius: '12px',
    display: 'block',
  };

  const closeBtnStyle: React.CSSProperties = {
    position: 'absolute',
    top: '-12px',
    right: '-12px',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: '#EF4444',
    color: '#FFFFFF',
    border: 'none',
    fontSize: '18px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)',
  };

  const captionStyle: React.CSSProperties = {
    textAlign: 'center',
    marginTop: '12px',
    fontSize: '16px',
    fontWeight: 600,
    color: '#1F2937',
  };

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <button
          style={closeBtnStyle}
          onClick={onClose}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#DC2626';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = '#EF4444';
          }}
        >
          ✕
        </button>
        <img
          src={src}
          alt={alt}
          style={imgStyle}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=600&fit=crop';
          }}
        />
        <p style={captionStyle}>{alt}</p>
      </div>
    </div>
  );
};

export default ImageModal;
