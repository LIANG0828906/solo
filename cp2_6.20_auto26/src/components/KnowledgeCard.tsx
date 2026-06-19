import React, { useState, useEffect } from 'react';
import { Star, Share2, X, Tag, FolderOpen, Eye } from 'lucide-react';
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
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
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
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsAnimating(true);
      });
    });
  };

  const closeModal = () => {
    setIsAnimating(false);
    setTimeout(() => setIsModalOpen(false), 350);
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wasFavorited = card.isFavorited;
    toggleFavorite(card.id);
    
    if (!wasFavorited) {
      toast.success('已收藏', {
        duration: 2000,
        style: {
          borderRadius: '8px',
          background: '#fff8e1',
          color: '#e65100',
          fontWeight: '600',
          fontSize: '14px',
          padding: '12px 20px',
          boxShadow: '0 4px 12px rgba(230, 81, 0, 0.15)'
        },
        icon: '⭐'
      });
    } else {
      toast('已取消收藏', {
        duration: 1500,
        style: {
          borderRadius: '8px',
          background: '#fafafa',
          color: '#757575',
          fontSize: '14px',
          padding: '12px 20px'
        }
      });
    }
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
          fontWeight: '600',
          fontSize: '14px',
          padding: '12px 20px'
        }
      });
    }
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
    fontWeight: '500',
    transition: 'all 0.2s ease'
  };

  const getStarStyles = (size: number = 20): React.CSSProperties => ({
    transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
    transform: card.isFavorited ? 'scale(1.1)' : 'scale(1)',
    color: card.isFavorited ? '#ffc107' : '#bdbdbd',
    fill: card.isFavorited ? '#ffc107' : 'none',
    filter: card.isFavorited ? 'drop-shadow(0 0 4px rgba(255, 193, 7, 0.5))' : 'none',
    strokeWidth: 2
  });

  return (
    <>
      <style>{`
        @keyframes modalScaleIn {
          0% { transform: scale(0.8); opacity: 0; }
          60% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes modalScaleOut {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        @keyframes overlayFadeIn {
          0% { background-color: rgba(0, 0, 0, 0); }
          100% { background-color: rgba(0, 0, 0, 0.6); }
        }
        @keyframes overlayFadeOut {
          0% { background-color: rgba(0, 0, 0, 0.6); }
          100% { background-color: rgba(0, 0, 0, 0); }
        }
        @keyframes cardFloat {
          0% { transform: translateY(0); }
          100% { transform: translateY(-4px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .card-hover-shine::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
          transition: left 0.6s ease;
        }
        .card-hover-shine:hover::before {
          left: 100%;
        }
      `}</style>

      <div
        className="card-hover-shine"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          padding: '20px',
          boxShadow: isHovered 
            ? '0px 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(230, 81, 0, 0.08)' 
            : '0px 2px 8px rgba(0, 0, 0, 0.06)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          border: isHovered ? '1px solid #ffcc80' : '1px solid transparent',
          outline: isPressed ? '2px solid #ffcc80' : 'none',
          outlineOffset: '-2px'
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsPressed(false);
        }}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onClick={openModal}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '700', 
            color: '#bf360c',
            margin: 0,
            flex: 1,
            paddingRight: '12px',
            lineHeight: '1.4',
            transition: 'color 0.2s ease',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {card.title}
          </h3>
          <button
            onClick={handleFavoriteClick}
            style={{ 
              padding: '6px', 
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              backgroundColor: isHovered ? (card.isFavorited ? '#fff8e1' : '#fafafa') : 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.stopPropagation();
              e.currentTarget.style.backgroundColor = card.isFavorited ? '#fff3e0' : '#f5f5f5';
            }}
            onMouseLeave={(e) => {
              e.stopPropagation();
              e.currentTarget.style.backgroundColor = isHovered ? (card.isFavorited ? '#fff8e1' : '#fafafa') : 'transparent';
            }}
          >
            <Star size={20} style={getStarStyles(20)} />
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#8d6e63' }}>
          <FolderOpen size={14} style={{ opacity: 0.7 }} />
          <span>{card.category}</span>
        </div>

        <p style={{ 
          fontSize: '14px', 
          color: '#5d4037', 
          lineHeight: '1.6',
          margin: 0,
          flex: 1,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}>
          {card.summary}
        </p>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {card.tags.slice(0, 3).map(tag => (
              <span key={tag} style={tagStyles}>
                <Tag size={12} />
                {tag}
              </span>
            ))}
            {card.tags.length > 3 && (
              <span style={{
                fontSize: '12px',
                color: '#a1887f',
                padding: '4px 2px'
              }}>
                +{card.tags.length - 3}
              </span>
            )}
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            color: isHovered ? '#e65100' : '#a1887f',
            transition: 'color 0.2s ease',
            fontWeight: '500'
          }}>
            <Eye size={14} />
            <span>查看详情</span>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: isAnimating ? 'overlayFadeIn 0.35s ease forwards' : 'overlayFadeOut 0.3s ease forwards'
          }}
          onClick={closeModal}
        >
          <div
            style={{
              backgroundColor: '#fff8e1',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '850px',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: isAnimating ? 'modalScaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' : 'modalScaleOut 0.3s ease forwards',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25), 0 10px 20px rgba(0, 0, 0, 0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ 
              padding: '24px 28px', 
              borderBottom: '1px solid #ffe0b2',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: '16px',
              background: 'linear-gradient(180deg, #fff3e0 0%, #fff8e1 100%)'
            }}>
              <div style={{ flex: 1 }}>
                <h2 style={{ 
                  margin: 0, 
                  marginBottom: '12px',
                  fontSize: '26px', 
                  fontWeight: '700', 
                  color: '#bf360c',
                  lineHeight: '1.3'
                }}>
                  {card.title}
                </h2>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '20px',
                  flexWrap: 'wrap',
                  fontSize: '13px',
                  color: '#8d6e63'
                }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FolderOpen size={14} />
                    {card.category}
                  </span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {card.tags.map(tag => (
                      <span key={tag} style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '3px 10px',
                        backgroundColor: '#ffffff',
                        color: '#e65100',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: '500',
                        border: '1px solid #ffe0b2'
                      }}>
                        <Tag size={11} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <button 
                onClick={closeModal}
                style={{ 
                  padding: '10px', 
                  borderRadius: '10px',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ffe0b2';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <X size={22} color="#e65100" strokeWidth={2.5} />
              </button>
            </div>

            <div 
              className="markdown-body"
              style={{ 
                padding: '28px 32px', 
                overflowY: 'auto',
                flex: 1,
                backgroundColor: '#ffffff'
              }}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(card.content) }}
            />

            <div style={{ 
              padding: '16px 28px', 
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
                  padding: '12px 22px',
                  borderRadius: '10px',
                  backgroundColor: card.isFavorited ? '#fff3e0' : '#ffffff',
                  border: `2px solid ${card.isFavorited ? '#ffc107' : '#ffcc80'}`,
                  color: card.isFavorited ? '#f57f17' : '#e65100',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: card.isFavorited 
                    ? '0 2px 8px rgba(255, 193, 7, 0.25)' 
                    : '0px 2px 4px rgba(0, 0, 0, 0.04)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = card.isFavorited 
                    ? '0 4px 16px rgba(255, 193, 7, 0.35)' 
                    : '0px 6px 16px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = card.isFavorited 
                    ? '0 2px 8px rgba(255, 193, 7, 0.25)' 
                    : '0px 2px 4px rgba(0, 0, 0, 0.04)';
                }}
              >
                <Star size={18} style={getStarStyles(18)} />
                {card.isFavorited ? '已收藏' : '收藏'}
              </button>
              <button
                onClick={handleShare}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  borderRadius: '10px',
                  backgroundColor: '#e65100',
                  color: '#ffffff',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0px 3px 8px rgba(230, 81, 0, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0px 6px 20px rgba(230, 81, 0, 0.4)';
                  e.currentTarget.style.backgroundColor = '#bf360c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0px 3px 8px rgba(230, 81, 0, 0.3)';
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
