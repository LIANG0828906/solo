import React, { useState, useEffect, useCallback } from 'react';
import { useMagazineStore } from './store';
import { CANVAS_ASPECT } from './types';
import type { MagazineElement } from './types';

export default function Preview() {
  const magazine = useMagazineStore((s) => s.magazine);
  const setPreviewMode = useMagazineStore((s) => s.setPreviewMode);
  const setCurrentPage = useMagazineStore((s) => s.setCurrentPage);

  const pages = magazine.pages;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipping, setFlipping] = useState<'forward' | 'backward' | null>(null);
  const [flipProgress, setFlipProgress] = useState(0);

  const goToPage = useCallback(
    (index: number) => {
      if (index < 0 || index >= pages.length) return;
      setFlipProgress(0);
      setFlipping(null);
      setCurrentIndex(index);
    },
    [pages.length]
  );

  const flipForward = useCallback(() => {
    if (currentIndex >= pages.length - 1 || flipping) return;
    setFlipping('forward');
    setFlipProgress(0);
    requestAnimationFrame(() => setFlipProgress(1));
    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setFlipping(null);
      setFlipProgress(0);
    }, 500);
  }, [currentIndex, pages.length, flipping]);

  const flipBackward = useCallback(() => {
    if (currentIndex <= 0 || flipping) return;
    setFlipping('backward');
    setFlipProgress(0);
    requestAnimationFrame(() => setFlipProgress(1));
    setTimeout(() => {
      setCurrentIndex((prev) => prev - 1);
      setFlipping(null);
      setFlipProgress(0);
    }, 500);
  }, [currentIndex, flipping]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        flipForward();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        flipBackward();
      } else if (e.key === 'Escape') {
        setPreviewMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flipForward, flipBackward, setPreviewMode]);

  if (pages.length === 0) return null;

  const currentPage = pages[currentIndex];

  const renderPageContent = (page: typeof pages[0], showCover: boolean = false) => {
    const isCover = showCover && page.id === magazine.coverPageId;
    const sorted = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);

    return (
      <div style={{
        width: '100%',
        height: '100%',
        background: '#ffffff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {isCover && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '30%',
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 28, fontFamily: 'Noto Serif SC' }}>
              {magazine.name}
            </div>
            <div style={{ color: '#fff', fontSize: 16, fontFamily: 'Noto Serif SC', marginTop: 8 }}>
              {magazine.author}
            </div>
          </div>
        )}
        {page.isToc && (
          <div style={{
            position: 'absolute',
            top: 20,
            left: 20,
            fontSize: 22,
            fontWeight: 700,
            color: '#2c3e50',
            fontFamily: 'Noto Serif SC',
            zIndex: 9999,
          }}>
            目录
          </div>
        )}
        {sorted.map((el) => (
          <PageElement key={el.id} element={el} onClickPage={() => {
            if (page.isToc) {
              const textEl = page.elements.find((e) => e.type === 'text');
              if (textEl) {
                const match = textEl.content?.match(/^(\d+)\./);
                if (match) {
                  const targetOrder = parseInt(match[1]);
                  const targetPage = pages.find((p) => p.order === targetOrder);
                  if (targetPage) {
                    const targetIdx = pages.indexOf(targetPage);
                    goToPage(targetIdx);
                  }
                }
              }
            }
          }} />
        ))}
      </div>
    );
  };

  const flipAngle = flipping === 'forward'
    ? -180 * flipProgress
    : flipping === 'backward'
    ? 180 * (1 - flipProgress)
    : 0;

  const prevPage = currentIndex > 0 ? pages[currentIndex - 1] : null;
  const nextPage = currentIndex < pages.length - 1 ? pages[currentIndex + 1] : null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#2a2a2a',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <button
        onClick={() => setPreviewMode(false)}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          color: '#fff',
          width: 40,
          height: 40,
          borderRadius: '50%',
          fontSize: 18,
          cursor: 'pointer',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.3)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; }}
      >
        ✕
      </button>

      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        perspective: 1500,
      }}>
        {flipping === 'forward' && prevPage && (
          <div style={{
            position: 'absolute',
            width: 480,
            height: Math.round(480 * CANVAS_ASPECT),
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) rotateY(${-180 * flipProgress}deg)`,
            transformOrigin: 'left center',
            transition: flipping ? 'transform 0.5s ease-in-out' : 'none',
            boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            {renderPageContent(prevPage, true)}
          </div>
        )}

        {flipping === 'backward' && nextPage && (
          <div style={{
            position: 'absolute',
            width: 480,
            height: Math.round(480 * CANVAS_ASPECT),
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) rotateY(${180 * (1 - flipProgress)}deg)`,
            transformOrigin: 'right center',
            transition: flipping ? 'transform 0.5s ease-in-out' : 'none',
            boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
            borderRadius: 4,
            overflow: 'hidden',
          }}>
            {renderPageContent(nextPage, true)}
          </div>
        )}

        {!flipping && (
          <div style={{
            width: 480,
            height: Math.round(480 * CANVAS_ASPECT),
            boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
          }}>
            {renderPageContent(currentPage, true)}
          </div>
        )}
      </div>

      {currentIndex > 0 && (
        <div
          onClick={flipBackward}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '20%',
            height: '100%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            color: 'rgba(255,255,255,0.3)',
            transition: 'background 0.2s',
            userSelect: 'none',
          }}
        >
          ◀
        </div>
      )}

      {currentIndex < pages.length - 1 && (
        <div
          onClick={flipForward}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '20%',
            height: '100%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            color: 'rgba(255,255,255,0.3)',
            transition: 'background 0.2s',
            userSelect: 'none',
          }}
        >
          ▶
        </div>
      )}

      <div style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}>
        <div style={{
          display: 'flex',
          gap: 6,
        }}>
          {pages.map((_, i) => (
            <div
              key={i}
              onClick={() => goToPage(i)}
              style={{
                width: i === currentIndex ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i === currentIndex ? '#e67e22' : 'rgba(255,255,255,0.3)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
        <div style={{
          color: 'rgba(255,255,255,0.6)',
          fontSize: 13,
          fontFamily: 'Noto Serif SC',
        }}>
          {currentIndex + 1} / {pages.length}
        </div>
      </div>
    </div>
  );
}

function PageElement({
  element,
  onClickPage,
}: {
  element: MagazineElement;
  onClickPage: () => void;
}) {
  const style: React.CSSProperties = {
    position: 'absolute',
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    transform: `rotate(${element.rotation}deg)`,
    zIndex: element.zIndex + 1,
  };

  if (element.type === 'text') {
    return (
      <div
        style={{
          ...style,
          fontFamily: element.fontFamily || 'Noto Serif SC',
          fontSize: element.fontSize || 16,
          color: element.color || '#000',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          overflow: 'hidden',
          cursor: 'pointer',
        }}
        onClick={onClickPage}
      >
        {element.content}
      </div>
    );
  }

  if (element.type === 'image') {
    return element.src ? (
      <div style={style}>
        <img
          src={element.src}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', userSelect: 'none' }}
          draggable={false}
        />
      </div>
    ) : null;
  }

  if (element.type === 'rect') {
    return (
      <div style={{ ...style, background: element.fillColor || '#e67e22', borderRadius: 2 }} />
    );
  }

  return null;
}
