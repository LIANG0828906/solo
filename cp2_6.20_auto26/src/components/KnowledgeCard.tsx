import React, { useState, useEffect } from 'react';
import { Star, Share2, X, Tag, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import type { KnowledgeCard as KnowledgeCardType } from '../types';
import { useStore } from '../store';
import { renderMarkdown, applyMarkdownStyles } from '../utils/markdown';

interface KnowledgeCardProps {
  card: KnowledgeCardType;
}

export const KnowledgeCardComponent: React.FC<KnowledgeCardProps> = ({ card }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isStarAnimating, setIsStarAnimating] = useState(false);
  const toggleFavorite = useStore(state => state.toggleFavorite);

  useEffect(() => {
    applyMarkdownStyles();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  const openModal = () => {
    setIsModalOpen(true);
    setTimeout(() => setIsAnimating(true), 10);
  };

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(() => setIsModalOpen(false), 300);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsStarAnimating(true);
    toggleFavorite(card.id);
    if (!card.isFavorited) {
      toast.success('已收藏', {
        duration: 2000,
        style: {
          borderRadius: '8px',
          background: '#fff8e1',
          color: '#e65100',
          fontWeight: '600'
        }
      });
    }
    setTimeout(() => setIsStarAnimating(false), 500);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/cards/${card.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      toast.success('链接已复制到剪贴板', {
        duration: 2000,
        style: {
          borderRadius: '8px',
          background: '#fff8e1',
          color: '#e65100',
          fontWeight: '600'
        }
      });
    }
  };

  const cardStyles: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.08)',
    cursor: 'pointer',
    transition: 'box-shadow 0.2s ease, transform 0.2s ease',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    height: '100%'
  };

  const cardHoverStyles: React.CSSProperties = {
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.12)',
    transform: 'translateY(-2px)'
  };

  const tagStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    backgroundColor: '#fff3e0',
    color: '#e65100',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '500'
  };

  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: isAnimating ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    transition: 'background-color 0.3s ease'
  };

  const modalContentStyles: React.CSSProperties = {
    backgroundColor: '#fff8e1',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'hidden',
    transform: isAnimating ? 'scale(1)' : 'scale(0.8)',
    opacity: isAnimating ? 1 : 0,
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    display: 'flex',
    flexDirection: 'column'
  };

  const starStyles: React.CSSProperties = {
    transition: 'all 0.3s ease',
    transform: isStarAnimating ? 'scale(1.3)' : 'scale(1)',
    color: card.isFavorited ? '#ffc107' : '#bdbdbd',
    fill: card.isFavorited ? '#ffc107' : 'none'
  };

  return (
    <>
      <div
        style={cardStyles}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, cardHoverStyles);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = cardStyles.boxShadow as string;
          e.currentTarget.style.transform = 'translateY(0)';
        }}
        onClick={openModal}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#bf360c',
            margin: 0,
            flex: 1,
            paddingRight: '12px'
          }}>
            {card.title}
          </h3>
          <button
            onClick={handleFavoriteClick}
            style={{ padding: '4px' }}
          >
            <Star size={20} style={starStyles} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8d6e63' }}>
          <FolderOpen size={14} />
          <span>{card.category}</span>
        </div>

        <p style={{ 
          fontSize: '14px', 
          color: '#5d4037', 
          lineHeight: '1.6',
          margin: 0,
          flex: 1
        }}>
          {card.summary}
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {card.tags.map(tag => (
            <span key={tag} style={tagStyles}>
              <Tag size={12} />
              {tag}
            </span>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div style={overlayStyles} onClick={closeModal}>
          <div style={modalContentStyles} onClick={(e) => e.stopPropagation()}>
            <div style={{ 
              padding: '24px', 
              borderBottom: '1px solid #ffe0b2',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: '#bf360c' }}>
                {card.title}
              </h2>
              <button 
                onClick={closeModal}
                style={{ 
                  padding: '8px', 
                  borderRadius: '8px',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#ffe0b2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X size={24} color="#e65100" />
              </button>
            </div>

            <div style={{ 
              padding: '8px 24px', 
              borderBottom: '1px solid #ffe0b2',
              display: 'flex',
              alignItems: 'center',
              gap: '24px',
              fontSize: '13px',
              color: '#8d6e63'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FolderOpen size={14} />
                {card.category}
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {card.tags.map(tag => (
                  <span key={tag} style={tagStyles}>
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div 
              className="markdown-body"
              style={{ 
                padding: '24px', 
                overflowY: 'auto',
                flex: 1,
                backgroundColor: '#ffffff'
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(card.content) }}
            />

            <div style={{ 
              padding: '16px 24px', 
              borderTop: '1px solid #ffe0b2',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              backgroundColor: '#fff8e1'
            }}>
              <button
                onClick={handleFavoriteClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: card.isFavorited ? '#fff3e0' : '#ffffff',
                  border: '1px solid #ffcc80',
                  color: '#e65100',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.04)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0px 4px 12px rgba(0, 0, 0, 0.1)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0px 2px 4px rgba(0, 0, 0, 0.04)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <Star size={18} style={starStyles} />
                {card.isFavorited ? '已收藏' : '收藏'}
              </button>
              <button
                onClick={handleShare}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  backgroundColor: '#e65100',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0px 2px 4px rgba(230, 81, 0, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0px 4px 12px rgba(230, 81, 0, 0.3)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.backgroundColor = '#bf360c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0px 2px 4px rgba(230, 81, 0, 0.2)';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = '#e65100';
                }}
              >
                <Share2 size={18} />
                分享
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
