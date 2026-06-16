import { useState, useRef, useCallback, useEffect } from 'react';
import { useDiaryStore } from './store';
import DiaryPage from './pages/DiaryPage';
import MapPage from './pages/MapPage';
import './styles.css';

export default function App() {
  const { currentPageIndex, setPageIndex } = useDiaryStore();
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToPage = useCallback(
    (targetIndex: number) => {
      if (isAnimating) return;
      targetIndex = Math.max(0, Math.min(1, targetIndex));
      if (targetIndex === currentPageIndex) return;

      setIsAnimating(true);
      setPageIndex(targetIndex);
      setDragOffset(0);
      setIsDragging(false);

      setTimeout(() => {
        setIsAnimating(false);
      }, 600);
    },
    [currentPageIndex, setPageIndex, isAnimating]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isAnimating) return;
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragStart || !isDragging) return;
      const deltaX = e.clientX - dragStart.x;
      setDragOffset(deltaX);
    },
    [dragStart, isDragging]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (!dragStart || !isDragging) return;

      const deltaX = e.clientX - dragStart.x;
      const threshold = 100;

      if (deltaX > threshold && currentPageIndex > 0) {
        goToPage(currentPageIndex - 1);
      } else if (deltaX < -threshold && currentPageIndex < 1) {
        goToPage(currentPageIndex + 1);
      } else {
        setDragOffset(0);
        setIsDragging(false);
      }

      setDragStart(null);
    },
    [dragStart, isDragging, currentPageIndex, goToPage]
  );

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  };

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragStart || !isDragging) return;
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStart.x;
      setDragOffset(deltaX);
    },
    [dragStart, isDragging]
  );

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!dragStart || !isDragging) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - dragStart.x;
      const threshold = 80;

      if (deltaX > threshold && currentPageIndex > 0) {
        goToPage(currentPageIndex - 1);
      } else if (deltaX < -threshold && currentPageIndex < 1) {
        goToPage(currentPageIndex + 1);
      } else {
        setDragOffset(0);
        setIsDragging(false);
      }

      setDragStart(null);
    },
    [dragStart, isDragging, currentPageIndex, goToPage]
  );

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPage(currentPageIndex - 1);
      } else if (e.key === 'ArrowRight') {
        goToPage(currentPageIndex + 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPageIndex, goToPage]);

  const getPageStyle = (pageIndex: number): React.CSSProperties => {
    let baseOffset = (pageIndex - currentPageIndex) * 100;

    if (isDragging) {
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      baseOffset += (dragOffset / containerWidth) * 100;
    }

    const progress = Math.abs(baseOffset) / 100;
    const rotation = baseOffset > 0 ? -15 * progress : 15 * progress;
    const clipProgress = Math.min(progress, 1);

    return {
      transform: `translateX(${baseOffset}%) rotateY(${rotation}deg)`,
      opacity: progress > 1.5 ? 0 : 1,
      clipPath: isDragging
        ? `polygon(${0 + clipProgress * 10}% ${0 + clipProgress * 5}%, 100% 0, 100% 100%, ${0 + clipProgress * 10}% ${100 - clipProgress * 5}%)`
        : 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
      transition: isDragging ? 'none' : 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      zIndex: pageIndex === currentPageIndex ? 2 : 1,
    };
  };

  const getShadowStyle = (): React.CSSProperties => {
    if (!isDragging || Math.abs(dragOffset) < 20) {
      return { opacity: 0 };
    }

    const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
    const shadowOffset = (dragOffset / containerWidth) * 50;

    return {
      width: '70%',
      height: '800px',
      left: `calc(15% + ${shadowOffset + 10}px)`,
      top: `calc(50% - 400px + 5px)`,
      opacity: 0.3,
      transition: 'opacity 0.2s ease',
    };
  };

  return (
    <div className="app-container">
      <div className="nav-buttons">
        <button
          className={`nav-btn ${currentPageIndex === 0 ? 'active' : ''}`}
          onClick={() => goToPage(0)}
        >
          📖 手账
        </button>
        <button
          className={`nav-btn ${currentPageIndex === 1 ? 'active' : ''}`}
          onClick={() => goToPage(1)}
        >
          🌍 情绪地图
        </button>
      </div>

      <div
        className="book-container"
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div className="page-shadow" style={getShadowStyle()} />

        <div className={`page-wrapper ${isDragging ? 'dragging' : ''}`} style={getPageStyle(0)}>
          <DiaryPage />
        </div>

        <div className={`page-wrapper ${isDragging ? 'dragging' : ''}`} style={getPageStyle(1)}>
          <MapPage />
        </div>
      </div>

      <div className="page-indicator">
        <div
          className={`page-dot ${currentPageIndex === 0 ? 'active' : ''}`}
          onClick={() => goToPage(0)}
        />
        <div
          className={`page-dot ${currentPageIndex === 1 ? 'active' : ''}`}
          onClick={() => goToPage(1)}
        />
      </div>
    </div>
  );
}