import { useRef, useEffect, useCallback, useState } from 'react';
import { useBookStore } from '@/store/bookStore';
import PageRenderer from './PageRenderer';
import ThumbnailBar from '@/components/ThumbnailBar';
import FullscreenButton from '@/components/FullscreenButton';
import ContinueReading from '@/components/ContinueReading';
import { easeOutCubicFn } from './FlipAnimation';

const FLIP_DURATION = 500;
const DRAG_EDGE_ZONE = 0.2;

export default function Reader() {
  const store = useBookStore();
  const {
    book,
    currentPage,
    isFlipping,
    flipDirection,
    flipProgress,
    activeHotspot,
    isFullscreen,
    showContinueReading,
    isInstantTransition,
    startFlip,
    endFlip,
    setFlipProgress,
    triggerHotspot,
    startDrag,
    updateDrag,
    endDrag,
    cancelDrag,
    goToPageInstant,
  } = store;

  const containerRef = useRef<HTMLDivElement>(null);
  const flipRafRef = useRef<number | null>(null);
  const flipStartRef = useRef<number>(0);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [showThumbBar, setShowThumbBar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [screenSize, setScreenSize] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  useEffect(() => {
    function onResize() {
      const w = window.innerWidth;
      if (w < 480) {
        setScreenSize('mobile');
        setIsMobile(true);
      } else if (w < 768) {
        setScreenSize('tablet');
        setIsMobile(false);
      } else {
        setScreenSize('desktop');
        setIsMobile(false);
      }
    }
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const containerW = container.clientWidth;
    const maxW = screenSize === 'mobile' ? containerW : containerW * 0.8;
    const h = maxW * 0.75;
    setDimensions({ width: Math.floor(maxW), height: Math.floor(h) });
  }, [screenSize, isFullscreen]);

  const runFlipAnimation = useCallback(
    (direction: 'next' | 'prev') => {
      if (flipRafRef.current !== null) {
        cancelAnimationFrame(flipRafRef.current);
      }
      flipStartRef.current = performance.now();

      function animate() {
        const elapsed = performance.now() - flipStartRef.current;
        const rawProgress = Math.min(elapsed / FLIP_DURATION, 1);
        const progress = easeOutCubicFn(rawProgress);
        setFlipProgress(progress);

        if (rawProgress < 1) {
          flipRafRef.current = requestAnimationFrame(animate);
        } else {
          flipRafRef.current = null;
          endFlip();
        }
      }

      flipRafRef.current = requestAnimationFrame(animate);
    },
    [setFlipProgress, endFlip]
  );

  useEffect(() => {
    if (isFlipping && flipDirection && flipProgress === 0) {
      runFlipAnimation(flipDirection);
    }
  }, [isFlipping, flipDirection, flipProgress, runFlipAnimation]);

  useEffect(() => {
    return () => {
      if (flipRafRef.current !== null) cancelAnimationFrame(flipRafRef.current);
    };
  }, []);

  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isFlipping) return;
      if (!book) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      if (x < DRAG_EDGE_ZONE && currentPage > 0) {
        startFlip('prev');
      } else if (x > 1 - DRAG_EDGE_ZONE && currentPage < book.totalPages - 1) {
        startFlip('next');
      }
    },
    [isFlipping, book, currentPage, startFlip]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isFlipping) return;
      if (!book) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      if (x < DRAG_EDGE_ZONE || x > 1 - DRAG_EDGE_ZONE) {
        startDrag(e.clientX);
        e.preventDefault();
      }
    },
    [isFlipping, book, startDrag]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      updateDrag(e.clientX);
    },
    [updateDrag]
  );

  const handleMouseUp = useCallback(() => {
    if (!useBookStore.getState().drag.isDragging) return;
    const result = endDrag();
    if (result.shouldFlip && result.direction) {
      startFlip(result.direction);
    }
  }, [endDrag, startFlip]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (isFlipping) return;
      if (!book) return;
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (touch.clientX - rect.left) / rect.width;
      if (x < DRAG_EDGE_ZONE || x > 1 - DRAG_EDGE_ZONE) {
        startDrag(touch.clientX);
        e.preventDefault();
      }
    },
    [isFlipping, book, startDrag]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      updateDrag(touch.clientX);
      e.preventDefault();
    },
    [updateDrag]
  );

  const handleTouchEnd = useCallback(() => {
    if (!useBookStore.getState().drag.isDragging) return;
    const result = endDrag();
    if (result.shouldFlip && result.direction) {
      startFlip(result.direction);
    } else {
      cancelDrag();
    }
  }, [endDrag, startFlip, cancelDrag]);

  useEffect(() => {
    const onMouseMoveGlobal = (e: MouseEvent) => {
      updateDrag(e.clientX);
    };
    const onMouseUpGlobal = () => {
      if (useBookStore.getState().drag.isDragging) {
        const result = endDrag();
        if (result.shouldFlip && result.direction) {
          startFlip(result.direction);
        }
      }
    };
    const onTouchMoveGlobal = (e: TouchEvent) => {
      if (useBookStore.getState().drag.isDragging && e.touches.length > 0) {
        updateDrag(e.touches[0].clientX);
        e.preventDefault();
      }
    };
    const onTouchEndGlobal = () => {
      if (useBookStore.getState().drag.isDragging) {
        const result = endDrag();
        if (result.shouldFlip && result.direction) {
          startFlip(result.direction);
        } else {
          cancelDrag();
        }
      }
    };

    window.addEventListener('mousemove', onMouseMoveGlobal);
    window.addEventListener('mouseup', onMouseUpGlobal);
    window.addEventListener('touchmove', onTouchMoveGlobal, { passive: false });
    window.addEventListener('touchend', onTouchEndGlobal);

    return () => {
      window.removeEventListener('mousemove', onMouseMoveGlobal);
      window.removeEventListener('mouseup', onMouseUpGlobal);
      window.removeEventListener('touchmove', onTouchMoveGlobal);
      window.removeEventListener('touchend', onTouchEndGlobal);
    };
  }, [updateDrag, endDrag, startFlip, cancelDrag]);

  const handleHotspotClick = useCallback(
    (hotspot: { id: string; type: string }) => {
      triggerHotspot(hotspot.id);
      setTimeout(() => triggerHotspot(null), 700);
    },
    [triggerHotspot]
  );

  const handleThumbnailClick = useCallback(
    (page: number) => {
      if (isFlipping) return;
      goToPageInstant(page);
    },
    [isFlipping, goToPageInstant]
  );

  useEffect(() => {
    if (!isFullscreen) {
      setShowThumbBar(true);
      return;
    }
    setShowThumbBar(false);
    const handleMouseMoveFullscreen = (e: MouseEvent) => {
      const h = window.innerHeight;
      if (e.clientY > h - 80) {
        setShowThumbBar(true);
      } else {
        setShowThumbBar(false);
      }
    };
    window.addEventListener('mousemove', handleMouseMoveFullscreen);
    return () => window.removeEventListener('mousemove', handleMouseMoveFullscreen);
  }, [isFullscreen]);

  if (!book) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#2C2C2C' }}>
        <div style={{ color: '#999', fontFamily: "'Noto Sans SC', sans-serif", fontSize: 16 }}>
          加载中...
        </div>
      </div>
    );
  }

  const currentPageData = book.pages[currentPage];
  const thumbBarHeight = screenSize === 'tablet' ? 45 : screenSize === 'mobile' ? 0 : 60;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        background: '#2C2C2C',
        overflow: 'hidden',
        fontFamily: "'Noto Sans SC', sans-serif",
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'absolute',
          left: 16,
          top: 16,
          color: '#ffffff',
          fontSize: screenSize === 'mobile' ? 12 : 14,
          fontFamily: "'Noto Sans SC', sans-serif",
          zIndex: 10,
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        {currentPage + 1}/{book.totalPages}
      </div>

      <FullscreenButton />

      <div
        ref={containerRef}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: isFullscreen ? '100vh' : `calc(100vh - ${thumbBarHeight}px)`,
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onClick={handlePageClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          style={{
            position: 'relative',
            width: dimensions.width,
            height: dimensions.height,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            transition: isInstantTransition ? 'opacity 0.2s ease-in' : 'none',
            opacity: isInstantTransition ? 0.85 : 1,
          }}
        >
          {currentPageData && (
            <PageRenderer
              page={currentPageData}
              width={dimensions.width}
              height={dimensions.height}
              activeHotspotId={activeHotspot}
              flipDirection={isFlipping ? flipDirection : null}
              flipProgress={isFlipping ? flipProgress : 0}
              onHotspotClick={handleHotspotClick}
              disabled={isFlipping}
            />
          )}

          {!isFlipping && screenSize === 'mobile' && (
            <>
              {currentPage > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startFlip('prev');
                  }}
                  style={{
                    position: 'absolute',
                    left: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(212,160,23,0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  }}
                >
                  ◀
                </button>
              )}
              {currentPage < book.totalPages - 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startFlip('next');
                  }}
                  style={{
                    position: 'absolute',
                    right: 8,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    border: 'none',
                    background: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontSize: 16,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(212,160,23,0.7)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.2)';
                  }}
                >
                  ▶
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {screenSize !== 'mobile' && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: thumbBarHeight,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            transition: isFullscreen
              ? 'transform 0.3s ease, opacity 0.3s ease'
              : 'none',
            transform: isFullscreen && !showThumbBar ? 'translateY(100%)' : 'translateY(0)',
            opacity: isFullscreen && !showThumbBar ? 0 : 1,
            zIndex: 20,
          }}
        >
          <ThumbnailBar
            pages={book.pages}
            currentPage={currentPage}
            thumbnailWidth={screenSize === 'tablet' ? 30 : 40}
            onClick={handleThumbnailClick}
          />
        </div>
      )}

      {showContinueReading && <ContinueReading />}
    </div>
  );
}
