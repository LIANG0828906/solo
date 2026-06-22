import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useTypographyStore,
  TextBlockType,
} from '../store/typographyStore';
import {
  CONTRAST_MODES,
  findFontById,
  getFontStack,
  getWeightValue,
} from '../utils/fontLoader';
import styles from './PreviewArea.module.css';

interface TextBlockProps {
  type: TextBlockType;
  text: string;
  fontId: string;
  isDragging: boolean;
  isBouncing: boolean;
  bounceOffset: { x: number; y: number };
}

function TextBlock({
  type,
  text,
  fontId,
  isDragging,
  isBouncing,
  bounceOffset,
}: TextBlockProps) {
  const store = useTypographyStore();
  const blockRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const [guides, setGuides] = useState<{ baseline: number; xHeight: number } | null>(null);
  const [isReady, setIsReady] = useState(false);

  const font = findFontById(fontId);
  const fontSizePx = store.fontSize * (96 / 72);
  const weight = getWeightValue(store.fontWeight);
  const lineHeightPx = fontSizePx * store.lineHeight;
  const contrastConfig = CONTRAST_MODES[store.contrastMode];
  const dragState = type === 'title' ? store.titleDrag : store.bodyDrag;

  const textStyle = useMemo<React.CSSProperties>(() => {
    const baseFontSize = type === 'title' ? fontSizePx * 1.6 : fontSizePx;
    return {
      fontFamily: font ? getFontStack(font) : 'inherit',
      fontSize: `${baseFontSize}px`,
      fontWeight: weight,
      lineHeight: store.lineHeight,
      letterSpacing: `${store.letterSpacing}em`,
      color: contrastConfig.textColor,
    };
  }, [font, fontSizePx, weight, store.lineHeight, store.letterSpacing, contrastConfig.textColor, type]);

  const calculateGuides = useCallback(() => {
    if (!contentRef.current || !blockRef.current) return;

    const sampleText = 'xAg';
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const fontSize = type === 'title' ? fontSizePx * 1.6 : fontSizePx;
    ctx.font = `${weight} ${fontSize}px ${font ? getFontStack(font) : 'sans-serif'}`;

    const metrics = ctx.measureText(sampleText);
    const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
    const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
    const xHeightRatio = 0.5;
    const totalHeight = ascent + descent;

    requestAnimationFrame(() => {
      setGuides({
        baseline: ascent,
        xHeight: ascent * xHeightRatio,
      });
      setIsReady(true);
    });

    void totalHeight;
  }, [font, fontSizePx, weight, type]);

  useEffect(() => {
    let cancelled = false;

    const runCalculate = () => {
      if (cancelled) return;
      calculateGuides();
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(runCalculate);
    } else {
      runCalculate();
    }

    const timeout = setTimeout(runCalculate, 100);
    runCalculate();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [calculateGuides, fontId, store.fontSize, store.fontWeight, store.lineHeight, text]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();

      const rect = blockRef.current?.getBoundingClientRect();
      if (!rect) return;

      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        px: dragState.x,
        py: dragState.y,
      };

      store.setIsDragging(type);
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [dragState.x, dragState.y, store, type]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (store.isDragging !== type || !dragStartRef.current) return;
      e.preventDefault();

      const start = dragStartRef.current;
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        store.setDragPosition(type, {
          x: start.px + dx,
          y: start.py + dy,
        });
        rafRef.current = null;
      });
    },
    [store, type]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (store.isDragging !== type) return;

      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);

      const currentX = dragState.x;
      const currentY = dragState.y;

      store.setIsDragging(null);
      store.setBounceAnimating(type);

      setTimeout(() => {
        store.resetSingleDrag(type);
      }, 200);

      setTimeout(() => {
        store.setBounceAnimating(null);
      }, 1200);

      dragStartRef.current = null;
      void currentX;
      void currentY;
    },
    [store, type, dragState.x, dragState.y]
  );

  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const transform = `translate(${dragState.x}px, ${dragState.y}px)`;

  const blockStyle: React.CSSProperties = {
    transform: isBouncing ? undefined : transform,
    ...(isBouncing
      ? {
          ['--bx' as string]: `${bounceOffset.x}px`,
          ['--by' as string]: `${bounceOffset.y}px`,
        }
      : {}),
  };

  const classNames = [
    styles.textBlock,
    isDragging ? styles.dragging : '',
    isDragging ? styles.dragBorder : '',
    isBouncing ? styles.bounceBack : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={styles.textBlockWrapper}>
      <div
        ref={blockRef}
        className={classNames}
        style={blockStyle}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <span
          ref={contentRef}
          className={`${styles.textContent} ${
            type === 'title' ? styles.titleText : styles.bodyText
          }`}
          style={textStyle}
        >
          {text || (type === 'title' ? '（请输入标题）' : '（请输入正文）')}
        </span>

        {isReady && guides && (
          <div
            className={styles.guides}
            style={{
              width: 'calc(100% + 12px)',
              height: contentRef.current?.offsetHeight || '100%',
              marginLeft: '-6px',
              marginTop: '4px',
            }}
          >
            {Array.from({ length: Math.ceil((contentRef.current?.offsetHeight || 1) / lineHeightPx) }).map(
              (_, i) => {
                const baseOffset = i * lineHeightPx;
                return (
                  <React.Fragment key={i}>
                    <div
                      className={styles.guideLine}
                      style={{ top: `${baseOffset + guides.baseline}px` }}
                    >
                      {i === 0 && (
                        <span
                          className={`${styles.guideLabel} ${styles.baselineLabel}`}
                          style={{ top: `${baseOffset + guides.baseline}px` }}
                        >
                          基线
                        </span>
                      )}
                    </div>
                    <div
                      className={styles.guideLine}
                      style={{
                        top: `${baseOffset + guides.baseline - guides.xHeight}px`,
                        opacity: 0.6,
                      }}
                    >
                      {i === 0 && (
                        <span
                          className={`${styles.guideLabel} ${styles.xHeightLabel}`}
                          style={{
                            top: `${baseOffset + guides.baseline - guides.xHeight}px`,
                          }}
                        >
                          x高
                        </span>
                      )}
                    </div>
                  </React.Fragment>
                );
              }
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PreviewArea() {
  const store = useTypographyStore();
  const prevKeyRef = useRef(store.transitionKey);
  const [shouldFade, setShouldFade] = useState(false);

  const contrastConfig = CONTRAST_MODES[store.contrastMode];

  const weightLabel: Record<string, string> = {
    light: 'light',
    regular: 'regular',
    bold: 'bold',
  };

  const paramLabel = `${store.fontSize}pt / ${weightLabel[store.fontWeight]} / ${store.lineHeight.toFixed(1)}x / ${
    store.letterSpacing >= 0 ? '+' : ''
  }${store.letterSpacing.toFixed(2)}em`;

  useEffect(() => {
    if (store.transitionKey !== prevKeyRef.current) {
      prevKeyRef.current = store.transitionKey;
      setShouldFade(true);
      const timer = setTimeout(() => setShouldFade(false), 320);
      return () => clearTimeout(timer);
    }
  }, [store.transitionKey]);

  const containerStyle: React.CSSProperties = {
    backgroundColor: contrastConfig.bgColor,
  };

  return (
    <div className={styles.preview} style={containerStyle}>
      <div className={styles.floatingLabel}>{paramLabel}</div>

      <div className={`${styles.content} ${shouldFade ? styles.fadeEnter : ''}`}>
        <TextBlock
          type="title"
          text={store.titleText}
          fontId={store.titleFontId}
          isDragging={store.isDragging === 'title'}
          isBouncing={store.bounceAnimating === 'title'}
          bounceOffset={{ x: store.titleDrag.x, y: store.titleDrag.y }}
        />
        <TextBlock
          type="body"
          text={store.bodyText}
          fontId={store.bodyFontId}
          isDragging={store.isDragging === 'body'}
          isBouncing={store.bounceAnimating === 'body'}
          bounceOffset={{ x: store.bodyDrag.x, y: store.bodyDrag.y }}
        />
      </div>

      <canvas className={styles.measureCanvas} width="1" height="1" />
    </div>
  );
}
