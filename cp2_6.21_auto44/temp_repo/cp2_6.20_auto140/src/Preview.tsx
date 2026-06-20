import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Modal } from 'antd';
import { useEditorStore, getPageTitle } from './store';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  TextElement,
  ImageElement,
  ShapeElement,
} from './types';

const PREVIEW_W = 520;
const PREVIEW_H = Math.round(PREVIEW_W * 1.414);
const SCALE = PREVIEW_W / CANVAS_WIDTH;

export default function Preview() {
  const { magazine, previewOpen, setPreviewOpen, currentPageId } = useEditorStore();
  const sortedPages = useMemo(
    () => [...magazine.pages].sort((a, b) => a.order - b.order),
    [magazine.pages],
  );
  const initialIndex = Math.max(
    0,
    sortedPages.findIndex((p) => p.id === currentPageId),
  );
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [turning, setTurning] = useState<null | 'next' | 'prev'>(null);
  const [nextIndex, setNextIndex] = useState<number>(currentIndex);
  const [tocOpen, setTocOpen] = useState(false);
  const animatingRef = useRef(false);

  useEffect(() => {
    if (previewOpen) {
      setCurrentIndex(initialIndex);
      setNextIndex(initialIndex);
    }
  }, [previewOpen, initialIndex]);

  useEffect(() => {
    if (!previewOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewOpen(false);
      } else if (e.key === 'ArrowRight') {
        goNext();
      } else if (e.key === 'ArrowLeft') {
        goPrev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOpen, currentIndex, turning]);

  const goNext = () => {
    if (animatingRef.current) return;
    if (currentIndex >= sortedPages.length - 1) return;
    const idx = currentIndex + 1;
    setNextIndex(idx);
    setTurning('next');
    animatingRef.current = true;
    setTimeout(() => {
      setCurrentIndex(idx);
      setTurning(null);
      animatingRef.current = false;
    }, 500);
  };

  const goPrev = () => {
    if (animatingRef.current) return;
    if (currentIndex <= 0) return;
    const idx = currentIndex - 1;
    setNextIndex(idx);
    setTurning('prev');
    animatingRef.current = true;
    setTimeout(() => {
      setCurrentIndex(idx);
      setTurning(null);
      animatingRef.current = false;
    }, 500);
  };

  const jumpTo = (idx: number) => {
    if (animatingRef.current) return;
    if (idx === currentIndex) {
      setTocOpen(false);
      return;
    }
    const direction: 'next' | 'prev' = idx > currentIndex ? 'next' : 'prev';
    setNextIndex(idx);
    setTurning(direction);
    animatingRef.current = true;
    setTocOpen(false);
    setTimeout(() => {
      setCurrentIndex(idx);
      setTurning(null);
      animatingRef.current = false;
    }, 500);
  };

  if (!previewOpen) return null;

  const currentPage = sortedPages[currentIndex];
  const nextPage = sortedPages[nextIndex];
  const total = sortedPages.length;
  const progress = total > 1 ? ((currentIndex + 1) / total) * 100 : 100;

  return (
    <div className="preview-root">
      <Button
        className="preview-toc-btn pill ghost"
        style={{
          position: 'absolute',
          top: 20,
          right: 72,
          zIndex: 10,
          background: 'rgba(255,255,255,0.12)',
          color: '#fff',
          border: '1px solid rgba(255,255,255,0.18)',
        }}
        onClick={() => setTocOpen(true)}
      >
        目录
      </Button>
      <button className="preview-close" title="关闭 (Esc)" onClick={() => setPreviewOpen(false)}>
        ✕
      </button>

      <div className="page-stage" style={{ width: PREVIEW_W, height: PREVIEW_H }}>
        {turning === null && (
          <PageView page={currentPage} magazine={magazine} index={currentIndex} />
        )}
        {turning === 'next' && (
          <>
            <div className="page-turning-exit-right">
              <PageView page={currentPage} magazine={magazine} index={currentIndex} />
            </div>
            <div className="page-turning-enter-right">
              <PageView page={nextPage} magazine={magazine} index={nextIndex} />
            </div>
          </>
        )}
        {turning === 'prev' && (
          <>
            <div className="page-turning-exit-left">
              <PageView page={currentPage} magazine={magazine} index={currentIndex} />
            </div>
            <div className="page-turning-enter-left">
              <PageView page={nextPage} magazine={magazine} index={nextIndex} />
            </div>
          </>
        )}
      </div>

      <div className="preview-hotzone left" onClick={goPrev} title="上一页 (←)">
        <div className="hotzone-arrow">‹</div>
      </div>
      <div className="preview-hotzone right" onClick={goNext} title="下一页 (→)">
        <div className="hotzone-arrow">›</div>
      </div>

      <div className="preview-progress">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          {String(currentIndex + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
        </div>
      </div>

      <Modal
        title="杂志目录"
        open={tocOpen}
        onCancel={() => setTocOpen(false)}
        footer={null}
        centered
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 420, overflowY: 'auto' }}>
          {sortedPages.map((p, i) => (
            <div
              key={p.id}
              className="preview-toc-item"
              onClick={() => jumpTo(i)}
              style={{
                background: i === currentIndex ? 'rgba(230,126,34,0.08)' : undefined,
              }}
            >
              <span className="idx">{String(i + 1).padStart(2, '0')}</span>
              <span className="title">{getPageTitle(p, i)}</span>
              {p.id === magazine.coverPageId && (
                <span style={{
                  marginLeft: 10,
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#e67e22',
                  color: '#fff',
                  fontWeight: 700,
                }}>
                  封面
                </span>
              )}
              {p.isToc && (
                <span style={{
                  marginLeft: 10,
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: '#2c3e50',
                  color: '#fff',
                  fontWeight: 700,
                }}>
                  目录
                </span>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function PageView({
  page,
  magazine,
  index,
}: {
  page: ReturnType<typeof useEditorStore.getState>['magazine']['pages'][number];
  magazine: ReturnType<typeof useEditorStore.getState>['magazine'];
  index: number;
}) {
  const isCover = magazine.coverPageId === page.id;
  const sortedEls = [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
  return (
    <div
      className={`page-holder ${isCover ? 'cover' : ''}`}
      style={{ width: PREVIEW_W, height: PREVIEW_H }}
    >
      {isCover && (
        <div className="cover-text">
          <div className="mag-name">{magazine.name || '杂志名称'}</div>
          <div className="mag-author">{magazine.author || ''}</div>
        </div>
      )}
      {sortedEls.map((el) => {
        const style: React.CSSProperties = {
          position: 'absolute',
          width: el.width * SCALE,
          height: el.height * SCALE,
          transform: `translate3d(${el.x * SCALE}px, ${el.y * SCALE}px, 0) rotate(${el.rotation}deg)`,
          zIndex: el.zIndex,
          transformOrigin: 'center center',
        };
        if (el.type === 'text') {
          const t = el as TextElement;
          return (
            <div
              key={el.id}
              style={{
                ...style,
                fontFamily: t.fontFamily,
                fontSize: t.fontSize * SCALE,
                color: t.color,
                fontWeight: 700,
                lineHeight: 1.4,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflow: 'hidden',
                padding: 2,
              }}
            >
              {t.content}
            </div>
          );
        }
        if (el.type === 'shape') {
          const s = el as ShapeElement;
          return (
            <div
              key={el.id}
              style={{
                ...style,
                background: s.fillColor,
                borderRadius: s.borderRadius * SCALE,
              }}
            />
          );
        }
        if (el.type === 'image') {
          const img = el as ImageElement;
          return (
            <img
              key={el.id}
              src={img.src}
              alt=""
              style={{
                ...style,
                objectFit: img.fitMode,
                pointerEvents: 'none',
                userSelect: 'none',
              }}
              draggable={false}
            />
          );
        }
        return null;
      })}
      <div style={{
        position: 'absolute',
        bottom: 12,
        right: 18,
        fontSize: 11,
        color: 'rgba(44,62,80,0.45)',
        fontVariantNumeric: 'tabular-nums',
        zIndex: 99,
      }}>
        — {String(index + 1).padStart(2, '0')} —
      </div>
    </div>
  );
}
