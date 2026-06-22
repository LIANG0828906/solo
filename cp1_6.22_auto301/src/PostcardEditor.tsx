import React, { useState, useEffect, useCallback } from 'react';
import type { Postcard } from './types';

interface PostcardEditorProps {
  selectedPostcard: Postcard | null;
  onSave: (id: string, note: string) => void;
  onClose: () => void;
}

const PostcardEditor: React.FC<PostcardEditorProps> = function PostcardEditor({
  selectedPostcard,
  onSave,
  onClose,
}) {
  const [note, setNote] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (selectedPostcard) {
      setNote(selectedPostcard.note || '');
      setIsAnimating(true);
      requestAnimationFrame(() => {
        setIsVisible(true);
      });
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [selectedPostcard]);

  const handleSave = useCallback(() => {
    if (selectedPostcard) {
      onSave(selectedPostcard.id, note);
    }
  }, [selectedPostcard, note, onSave]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleSave();
    }
  }, [onClose, handleSave]);

  useEffect(() => {
    if (selectedPostcard) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [selectedPostcard, handleKeyDown]);

  if (!isAnimating || !selectedPostcard) {
    return null;
  }

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    opacity: isVisible ? 1 : 0,
    transition: 'opacity 0.2s ease-out',
  };

  const panelStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '16px',
    boxShadow: '8px 16px 32px rgba(0,0,0,0.2)',
    padding: '24px',
    width: '600px',
    maxWidth: '90vw',
    minWidth: '300px',
    fontFamily: 'Georgia, serif',
    transform: isVisible ? 'scale(1)' : 'scale(0.9)',
    opacity: isVisible ? 1 : 0,
    transition: 'transform 0.2s ease-out, opacity 0.2s ease-out',
    maxHeight: '90vh',
    overflowY: 'auto',
  };

  const imageStyle: React.CSSProperties = {
    width: '400px',
    maxWidth: '100%',
    height: 'auto',
    backgroundColor: selectedPostcard.imageUrl,
    borderRadius: '12px',
    margin: '0 auto 20px',
    display: 'block',
    aspectRatio: '3 / 2.5',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#3E2723',
    margin: '0 0 12px 0',
    textAlign: 'center',
  };

  const metaStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  };

  const metaItemStyle: React.CSSProperties = {
    fontSize: '14px',
    color: '#6D4C41',
    margin: 0,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: '8px',
    display: 'block',
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: '120px',
    padding: '12px',
    border: '2px solid #D2B48C',
    borderRadius: '8px',
    fontFamily: 'Georgia, serif',
    fontSize: '14px',
    lineHeight: 1.6,
    resize: 'vertical',
    boxSizing: 'border-box',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  };

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px',
  };

  const baseButtonStyle: React.CSSProperties = {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    fontFamily: 'Georgia, serif',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'transform 0.1s ease, background-color 0.2s ease',
  };

  const saveButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    background: 'linear-gradient(135deg, #8B4513, #A0522D)',
    color: 'white',
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...baseButtonStyle,
    backgroundColor: '#EEE',
    color: '#3E2723',
  };

  const charCountStyle: React.CSSProperties = {
    fontSize: '12px',
    color: '#8D6E63',
    textAlign: 'right',
    marginTop: '4px',
  };

  return (
    <div style={overlayStyle} onClick={handleOverlayClick}>
      <div style={panelStyle} onClick={(e) => e.stopPropagation()}>
        <h2 style={titleStyle}>{selectedPostcard.title}</h2>
        <div style={metaStyle}>
          <p style={metaItemStyle}>📍 {selectedPostcard.location}</p>
          <p style={metaItemStyle}>📅 {selectedPostcard.date}</p>
        </div>
        <div style={imageStyle} />
        <label style={labelStyle} htmlFor="note">个人感言</label>
        <textarea
          id="note"
          style={textareaStyle}
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          placeholder="写下你的旅行回忆和感受..."
          maxLength={500}
          onFocus={(e) => {
            e.target.style.borderColor = '#8B4513';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#D2B48C';
          }}
        />
        <p style={charCountStyle}>{note.length}/500</p>
        <div style={buttonContainerStyle}>
          <button
            style={cancelButtonStyle}
            onClick={onClose}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            关闭
          </button>
          <button
            style={saveButtonStyle}
            onClick={handleSave}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostcardEditor;
