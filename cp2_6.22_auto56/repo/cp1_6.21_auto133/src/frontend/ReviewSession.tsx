import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flashcard, Rating } from './types';
import { api } from './api';

const ReviewSession: React.FC = () => {
  const navigate = useNavigate();
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadDueCards();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!isFlipped && !isProcessing) {
          setIsFlipped(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, isProcessing]);

  const loadDueCards = async () => {
    try {
      setLoading(true);
      const data = await api.getDueCards();
      setCards(data);
    } catch (err: any) {
      setError(err.message || '加载待复习卡片失败');
    } finally {
      setLoading(false);
    }
  };

  const handleFlip = () => {
    if (!isProcessing) {
      setIsFlipped(true);
    }
  };

  const handleRate = useCallback(async (rating: Rating) => {
    if (isProcessing || cards.length === 0) return;

    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    setIsProcessing(true);

    try {
      await api.rateCard(currentCard.id, rating);
      
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
      } else {
        setCards([]);
      }
    } catch (err: any) {
      setError(err.message || '评分失败');
    } finally {
      setIsProcessing(false);
    }
  }, [cards, currentIndex, isProcessing]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>{error}</div>
        <button style={styles.backButton} onClick={() => navigate('/cards')}>
          返回卡片列表
        </button>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.completeState}>
          <div style={styles.completeIcon}>🎉</div>
          <h2 style={styles.completeTitle}>
            {currentIndex > 0 ? '复习完成！' : '今日没有待复习的卡片'}
          </h2>
          <p style={styles.completeText}>
            {currentIndex > 0 
              ? `你已完成 ${currentIndex + 1} 张卡片的复习`
              : '明天再来看看有没有新的卡片需要复习吧'}
          </p>
          <button 
            style={styles.backButton}
            onClick={() => navigate('/cards')}
          >
            返回卡片列表
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>复习会话</h1>
        <div style={styles.progress}>
          {currentIndex + 1} / {cards.length}
        </div>
      </div>

      <div style={styles.progressBar}>
        <div 
          style={{
            ...styles.progressFill,
            width: `${((currentIndex + 1) / cards.length) * 100}%`
          }}
        />
      </div>

      <div style={styles.cardContainer}>
        <div
          style={{
            ...styles.cardWrapper,
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
          }}
          onClick={handleFlip}
        >
          <div style={{ ...styles.cardFace, ...styles.cardFront }}>
            <div style={styles.cardLabel}>问题</div>
            <div style={styles.cardTitle}>{currentCard.title}</div>
            <div style={styles.cardTags}>
              {currentCard.tags.map(tag => (
                <span key={tag} style={styles.tagBadge}>{tag}</span>
              ))}
            </div>
            <div style={styles.flipHint}>
              点击卡片或按空格键翻转查看答案
            </div>
          </div>

          <div style={{ ...styles.cardFace, ...styles.cardBack }}>
            <div style={styles.cardLabel}>答案</div>
            <div style={styles.cardContent}>
              <pre style={styles.cardContentText}>{currentCard.content}</pre>
            </div>
          </div>
        </div>
      </div>

      {isFlipped && (
        <div style={styles.ratingContainer}>
          <p style={styles.ratingPrompt}>你记得这张卡片吗？</p>
          <div style={styles.ratingButtons}>
            <button
              style={{ ...styles.ratingButton, ...styles.hardButton }}
              onClick={() => handleRate(0)}
              disabled={isProcessing}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(239, 68, 68, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
              }}
            >
              <span style={styles.ratingEmoji}>😓</span>
              <span style={styles.ratingText}>太难</span>
            </button>
            
            <button
              style={{ ...styles.ratingButton, ...styles.mediumButton }}
              onClick={() => handleRate(1)}
              disabled={isProcessing}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(245, 158, 11, 0.3)';
              }}
            >
              <span style={styles.ratingEmoji}>🤔</span>
              <span style={styles.ratingText}>一般</span>
            </button>
            
            <button
              style={{ ...styles.ratingButton, ...styles.easyButton }}
              onClick={() => handleRate(2)}
              disabled={isProcessing}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.3)';
              }}
            >
              <span style={styles.ratingEmoji}>😊</span>
              <span style={styles.ratingText}>容易</span>
            </button>
          </div>
        </div>
      )}

      <div style={styles.footer}>
        <button
          style={styles.exitButton}
          onClick={() => navigate('/cards')}
        >
          退出复习
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '32px 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: 'calc(100vh - 60px)',
    boxSizing: 'border-box' as const
  } as React.CSSProperties,

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  } as React.CSSProperties,

  title: {
    fontSize: '28px',
    fontWeight: 600,
    color: '#1E293B',
    margin: 0
  } as React.CSSProperties,

  progress: {
    fontSize: '16px',
    color: '#64748B',
    fontWeight: 500
  } as React.CSSProperties,

  progressBar: {
    height: '6px',
    backgroundColor: '#E2E8F0',
    borderRadius: '3px',
    marginBottom: '40px',
    overflow: 'hidden'
  } as React.CSSProperties,

  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: '3px',
    transition: 'width 0.3s ease'
  } as React.CSSProperties,

  loading: {
    textAlign: 'center' as const,
    padding: '64px',
    fontSize: '16px',
    color: '#64748B'
  } as React.CSSProperties,

  error: {
    textAlign: 'center' as const,
    padding: '16px',
    backgroundColor: '#FEE2E2',
    color: '#DC2626',
    borderRadius: '8px',
    marginBottom: '16px'
  } as React.CSSProperties,

  completeState: {
    textAlign: 'center' as const,
    padding: '64px 24px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties,

  completeIcon: {
    fontSize: '64px',
    marginBottom: '24px'
  } as React.CSSProperties,

  completeTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1E293B',
    margin: '0 0 12px 0'
  } as React.CSSProperties,

  completeText: {
    fontSize: '16px',
    color: '#64748B',
    margin: '0 0 32px 0'
  } as React.CSSProperties,

  backButton: {
    padding: '12px 32px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.15s ease',
    fontFamily: 'inherit',
    '&:hover': {
      transform: 'scale(1.02)'
    }
  } as React.CSSProperties,

  cardContainer: {
    perspective: '1500px',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px 0'
  } as React.CSSProperties,

  cardWrapper: {
    width: '100%',
    maxWidth: '500px',
    height: '350px',
    position: 'relative' as const,
    transformStyle: 'preserve-3d' as const,
    transition: 'transform 0.4s ease-in-out',
    cursor: 'pointer'
  } as React.CSSProperties,

  cardFace: {
    position: 'absolute' as const,
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: '16px',
    boxShadow: '0 8px 30px rgba(148, 163, 184, 0.4)',
    padding: '32px',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center' as const,
    boxSizing: 'border-box' as const
  } as React.CSSProperties,

  cardFront: {
    zIndex: 2
  } as React.CSSProperties,

  cardBack: {
    transform: 'rotateY(180deg)',
    zIndex: 1
  } as React.CSSProperties,

  cardLabel: {
    position: 'absolute' as const,
    top: '16px',
    left: '24px',
    fontSize: '12px',
    fontWeight: 500,
    color: '#94A3B8',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  } as React.CSSProperties,

  cardTitle: {
    fontSize: '24px',
    fontWeight: 600,
    color: '#1E293B',
    marginBottom: '16px',
    lineHeight: 1.4
  } as React.CSSProperties,

  cardTags: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    justifyContent: 'center',
    marginBottom: '24px'
  } as React.CSSProperties,

  tagBadge: {
    backgroundColor: '#EBF4FF',
    color: '#3B82F6',
    padding: '6px 12px',
    borderRadius: '6px',
    fontSize: '13px',
    fontWeight: 500
  } as React.CSSProperties,

  cardContent: {
    width: '100%',
    overflowY: 'auto' as const,
    maxHeight: '250px',
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  } as React.CSSProperties,

  cardContentText: {
    fontSize: '18px',
    color: '#334155',
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap' as const,
    margin: 0,
    fontFamily: 'inherit'
  } as React.CSSProperties,

  flipHint: {
    position: 'absolute' as const,
    bottom: '20px',
    fontSize: '13px',
    color: '#94A3B8'
  } as React.CSSProperties,

  ratingContainer: {
    marginTop: '32px',
    textAlign: 'center' as const
  } as React.CSSProperties,

  ratingPrompt: {
    fontSize: '16px',
    color: '#64748B',
    margin: '0 0 16px 0'
  } as React.CSSProperties,

  ratingButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '16px',
    flexWrap: 'wrap' as const
  } as React.CSSProperties,

  ratingButton: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '8px',
    padding: '16px 32px',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
    fontFamily: 'inherit',
    minWidth: '100px'
  } as React.CSSProperties,

  hardButton: {
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
  } as React.CSSProperties,

  mediumButton: {
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
  } as React.CSSProperties,

  easyButton: {
    backgroundColor: '#22C55E',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(34, 197, 94, 0.3)'
  } as React.CSSProperties,

  ratingEmoji: {
    fontSize: '24px'
  } as React.CSSProperties,

  ratingText: {
    fontSize: '14px',
    fontWeight: 500
  } as React.CSSProperties,

  footer: {
    marginTop: '32px',
    textAlign: 'center' as const
  } as React.CSSProperties,

  exitButton: {
    padding: '10px 24px',
    backgroundColor: 'transparent',
    color: '#64748B',
    border: '1px solid #CBD5E1',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
    '&:hover': {
      backgroundColor: '#F8FAFC',
      borderColor: '#94A3B8',
      color: '#475569'
    }
  } as React.CSSProperties
};

export default ReviewSession;
