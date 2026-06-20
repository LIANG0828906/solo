import { useState, useRef, useEffect, useCallback } from 'react';
import { useSpring, animated, useSprings } from '@react-spring/web';
import { Word } from '../stores/wordStore';
import './FlashCard.css';

interface FlashCardProps {
  words: Word[];
  currentIndex: number;
  onSwipe: (wordId: number, isMastered: boolean) => void;
  onNext: () => void;
}

function FlashCard({ words, currentIndex, onSwipe, onNext }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isDraggingRef = useRef(false);

  const [props, api] = useSpring(() => ({
    x: 0,
    y: 0,
    rotation: 0,
    scale: 1,
    config: { mass: 0.5, tension: 300, friction: 12 },
  }));

  const [nextProps] = useSpring(() => ({
    x: 20,
    scale: 0.95,
    config: { mass: 0.5, tension: 300, friction: 12 },
  }));

  const currentWord = words[currentIndex];
  const nextWord = words[currentIndex + 1];

  const resetCard = useCallback(() => {
    api.start({
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
    });
  }, [api]);

  const swipeCard = useCallback((direction: 'left' | 'right') => {
    const isMastered = direction === 'right';
    const screenWidth = window.innerWidth;
    const targetX = direction === 'right' ? screenWidth : -screenWidth;

    api.start({
      x: targetX,
      rotation: direction === 'right' ? 15 : -15,
      scale: 0.9,
      config: { mass: 0.5, tension: 300, friction: 12 },
    });

    if (currentWord) {
      onSwipe(currentWord.id, isMastered);
    }

    setTimeout(() => {
      onNext();
      setIsFlipped(false);
      setTimeout(() => {
        api.set({ x: 0, y: 0, rotation: 0, scale: 1 });
      }, 50);
    }, 300);
  }, [api, currentWord, onSwipe, onNext]);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - startXRef.current;
    const deltaY = e.clientY - startYRef.current;
    const rotation = (deltaX / window.innerWidth) * 15;
    const scale = 1 - Math.abs(deltaX) / window.innerWidth * 0.1;

    api.start({
      x: deltaX,
      y: deltaY * 0.3,
      rotation,
      scale: Math.max(0.9, Math.min(1, scale)),
      immediate: true,
    });
  };

  const handleMouseUp = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const threshold = window.innerWidth * 0.3;

    if (props.x.get() > threshold) {
      swipeCard('right');
    } else if (props.x.get() < -threshold) {
      swipeCard('left');
    } else {
      resetCard();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    isDraggingRef.current = true;
    startXRef.current = touch.clientX;
    startYRef.current = touch.clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDraggingRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - startXRef.current;
    const deltaY = touch.clientY - startYRef.current;
    const rotation = (deltaX / window.innerWidth) * 15;
    const scale = 1 - Math.abs(deltaX) / window.innerWidth * 0.1;

    api.start({
      x: deltaX,
      y: deltaY * 0.3,
      rotation,
      scale: Math.max(0.9, Math.min(1, scale)),
      immediate: true,
    });
  };

  const handleTouchEnd = () => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const threshold = window.innerWidth * 0.3;

    if (props.x.get() > threshold) {
      swipeCard('right');
    } else if (props.x.get() < -threshold) {
      swipeCard('left');
    } else {
      resetCard();
    }
  };

  const handlePlayAudio = () => {
    if (!currentWord?.audio_url) return;
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 1500);
  };

  const handleCardClick = () => {
    if (!isDraggingRef.current) {
      setIsFlipped(!isFlipped);
    }
  };

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  if (!currentWord) {
    return (
      <div className="flashcard-container">
        <div className="flashcard-empty card">
          <div className="empty-state-icon">🎉</div>
          <div className="empty-state-text">太棒了！你已经完成了所有词汇的学习</div>
        </div>
      </div>
    );
  }

  const swipeIndicatorColor = props.x.to({
    output: ['#d9a8a8', 'transparent', '#8fa88a'],
    range: [-200, 0, 200],
    extrapolate: 'clamp',
  });

  const swipeOpacity = props.x.to({
    output: [1, 0, 1],
    range: [-200, 0, 200],
    extrapolate: 'clamp',
  });

  return (
    <div className="flashcard-container" ref={containerRef}>
      <div className="flashcard-stack">
        {nextWord && (
          <animated.div
            className="flashcard next-card card"
            style={{
              x: nextProps.x,
              scale: nextProps.scale,
            }}
          >
            <div className="flashcard-content">
              <div className="flashcard-front">
                <div className="flashcard-word">{nextWord.word}</div>
                <div className="flashcard-hint">下一张</div>
              </div>
            </div>
          </animated.div>
        )}

        <animated.div
          className="flashcard current-card card"
          style={{
            x: props.x,
            y: props.y,
            rotateZ: props.rotation,
            scale: props.scale,
            zIndex: 10,
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <animated.div
            className="swipe-indicator swipe-left"
            style={{ opacity: swipeOpacity }}
          >
            <span className="swipe-icon">🔄</span>
            <span className="swipe-text">需复习</span>
          </animated.div>
          <animated.div
            className="swipe-indicator swipe-right"
            style={{ opacity: swipeOpacity }}
          >
            <span className="swipe-icon">✓</span>
            <span className="swipe-text">已掌握</span>
          </animated.div>

          <div className={`flashcard-inner ${isFlipped ? 'flipped' : ''}`} onClick={handleCardClick}>
            <div className="flashcard-face flashcard-front">
              <div className="flashcard-word">{currentWord.word}</div>
              <button
                className="audio-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePlayAudio();
                }}
              >
                <span className="audio-icon">{isPlaying ? '🔊' : '🔈'}</span>
                <span className="audio-text">{isPlaying ? '播放中...' : '播放发音'}</span>
              </button>
              <div className="flip-hint">点击卡片查看例句</div>
            </div>
            <div className="flashcard-face flashcard-back">
              <div className="flashcard-definition">{currentWord.definition}</div>
              {currentWord.example_sentence && (
                <div className="example-section">
                  <div className="example-label">📖 例句</div>
                  <div className="example-sentence">"{currentWord.example_sentence}"</div>
                  <div className="example-translation">{currentWord.example_translation}</div>
                </div>
              )}
              <div className="flip-hint">点击卡片返回</div>
            </div>
          </div>
        </animated.div>
      </div>

      <div className="flashcard-actions">
        <button
          className="swipe-btn btn-review"
          onClick={() => swipeCard('left')}
        >
          <span className="swipe-btn-icon">🔄</span>
          <span>需复习</span>
        </button>
        <button
          className="swipe-btn btn-master"
          onClick={() => swipeCard('right')}
        >
          <span className="swipe-btn-icon">✓</span>
          <span>已掌握</span>
        </button>
      </div>

      <div className="card-progress">
        <span>
          {currentIndex + 1} / {words.length}
        </span>
      </div>
    </div>
  );
}

export default FlashCard;
