import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Star, Loader2 } from 'lucide-react';
import type { WordDetail, WordPosition, Example } from '../types';

interface WordCardProps {
  position: WordPosition;
  detail: WordDetail | null;
  isLoading: boolean;
  isCollected: boolean;
  onClose: () => void;
  onToggleCollection: () => void;
}

function calculateCardPosition(position: WordPosition, cardWidth: number = 360) {
  const isMobile = window.innerWidth <= 768;
  
  if (isMobile) {
    return {
      top: 'auto',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)'
    };
  }

  const padding = 16;
  let left = position.x - cardWidth / 2;
  
  if (left < padding) {
    left = padding;
  } else if (left + cardWidth > window.innerWidth - padding) {
    left = window.innerWidth - cardWidth - padding;
  }

  let top = position.y - 20;
  const cardHeight = 400;
  
  if (top - cardHeight < padding) {
    top = position.y + 40;
  } else {
    top = position.y - cardHeight - 20;
  }

  return {
    top: `${top}px`,
    left: `${left}px`,
    bottom: 'auto',
    transform: 'none'
  };
}

function renderHighlightedExample(example: Example) {
  const before = example.english.slice(0, example.highlightStart);
  const highlighted = example.english.slice(example.highlightStart, example.highlightEnd);
  const after = example.english.slice(example.highlightEnd);

  return (
    <div className="example-item" key={example.english}>
      <span className={`example-difficulty ${example.difficulty}`}>
        {example.difficulty === 'easy' ? '简单' : '进阶'}
      </span>
      <div className="example-english">
        {before}
        <span className="example-highlight">{highlighted}</span>
        {after}
      </div>
      <div className="example-chinese">{example.chinese}</div>
    </div>
  );
}

export function WordCard({
  position,
  detail,
  isLoading,
  isCollected,
  onClose,
  onToggleCollection
}: WordCardProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [cardStyle, setCardStyle] = useState({});
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const style = calculateCardPosition(position);
    setCardStyle(style);
  }, [position]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        handleClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  }, [onClose]);

  const handleCollect = useCallback(async () => {
    setIsAnimating(true);
    await onToggleCollection();
    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  }, [onToggleCollection]);

  if (isClosing && !detail) {
    return null;
  }

  return (
    <div
      ref={cardRef}
      className={`word-card glass-card ${isClosing ? 'closing' : ''}`}
      style={cardStyle}
      onClick={(e) => e.stopPropagation()}
    >
      {isLoading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-gold)' }} />
          <div style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            正在分析...
          </div>
        </div>
      ) : detail ? (
        <>
          <div className="word-card-header">
            <div className="word-card-title">
              <div className="word-card-word">{detail.lemma}</div>
              <div className="word-card-phonetic">{detail.phonetic}</div>
              <div className="word-card-pos">{detail.partOfSpeech}</div>
            </div>
            <button className="word-card-close" onClick={handleClose} aria-label="关闭">
              <X size={18} />
            </button>
          </div>

          <div className="word-card-body">
            <div className="word-card-section">
              <div className="word-card-context-label">本文释义</div>
              <div className="word-card-definition">{detail.contextDefinition}</div>
            </div>

            <div className="word-card-section">
              <div className="word-card-section-title">词形变化</div>
              <div className="word-card-inflections">
                {detail.inflections.pastTense && (
                  <div className="inflection-tag">
                    <strong>过去式</strong>{detail.inflections.pastTense}
                  </div>
                )}
                {detail.inflections.presentParticiple && (
                  <div className="inflection-tag">
                    <strong>现在分词</strong>{detail.inflections.presentParticiple}
                  </div>
                )}
                {detail.inflections.pastParticiple && (
                  <div className="inflection-tag">
                    <strong>过去分词</strong>{detail.inflections.pastParticiple}
                  </div>
                )}
                {detail.inflections.plural && (
                  <div className="inflection-tag">
                    <strong>复数</strong>{detail.inflections.plural}
                  </div>
                )}
              </div>
            </div>

            <div className="word-card-section">
              <div className="word-card-section-title">例句</div>
              {detail.examples.map(renderHighlightedExample)}
            </div>
          </div>

          <div className="word-card-footer">
            <button
              className={`collect-btn ${isCollected ? 'collected' : ''} ${isAnimating ? 'animating' : ''}`}
              onClick={handleCollect}
            >
              <Star
                size={18}
                className={`star-icon ${isCollected ? 'filled' : 'empty'}`}
                fill={isCollected ? 'currentColor' : 'none'}
              />
              {isCollected ? '已收藏' : '加入学习'}
            </button>
          </div>
        </>
      ) : (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text-muted)' }}>未找到该单词</div>
        </div>
      )}
    </div>
  );
}
