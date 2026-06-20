import { useEffect, useRef, useState, useCallback } from 'react';
import { useFontStore } from '@/store/fontStore';
import { renderMiniPreview } from '@/utils/canvasRenderer';
import type { Font } from '@/types/font';
import { Plus } from 'lucide-react';

interface FontCardProps {
  font: Font;
}

const CHARS = 'AaBbCcXxYyZz0123';

function getRandomChars(count: number): string {
  let result = '';
  for (let i = 0; i < count; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

declare global {
  interface Document {
    fonts?: {
      check: (spec: string, text?: string) => boolean;
      load: (spec: string, text?: string) => Promise<FontFace[]>;
    };
  }
}

export default function FontCard({ font }: FontCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);
  const [fontLoaded, setFontLoaded] = useState(false);

  const selectedFontId = useFontStore((s) => s.selectedFontId);
  const compareFontIds = useFontStore((s) => s.compareFontIds);
  const selectFont = useFontStore((s) => s.selectFont);
  const toggleCompareFont = useFontStore((s) => s.toggleCompareFont);

  const isSelected = selectedFontId === font.id;
  const isInCompare = compareFontIds.includes(font.id);

  useEffect(() => {
    let cancelled = false;

    const checkFont = async () => {
      try {
        if (document.fonts && document.fonts.check) {
          const isLoaded = document.fonts.check(`16px "${font.googleFontName}"`);
          if (isLoaded) {
            if (!cancelled) setFontLoaded(true);
            return;
          }

          if (document.fonts.load) {
            await document.fonts.load(`16px "${font.googleFontName}"`, 'AaBbCc');
            if (!cancelled) setFontLoaded(true);
          } else {
            await new Promise((r) => setTimeout(r, 2000));
            if (!cancelled) setFontLoaded(true);
          }
        } else {
          await new Promise((r) => setTimeout(r, 2500));
          if (!cancelled) setFontLoaded(true);
        }
      } catch {
        if (!cancelled) setFontLoaded(true);
      }
    };

    checkFont();
    return () => {
      cancelled = true;
    };
  }, [font.googleFontName]);

  const drawCanvas = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderMiniPreview(canvas, text, fontLoaded ? font.googleFontName : 'sans-serif');
  }, [font.googleFontName, fontLoaded]);

  useEffect(() => {
    drawCanvas('AaBbCc');
  }, [drawCanvas, fontLoaded]);

  useEffect(() => {
    if (!isHovered) {
      cancelAnimationFrame(animFrameRef.current);
      drawCanvas('AaBbCc');
      return;
    }

    const startTime = Date.now();
    const duration = 500;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      if (elapsed >= duration) {
        drawCanvas('AaBbCc');
        return;
      }
      drawCanvas(getRandomChars(6));
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isHovered, drawCanvas]);

  const categoryLabels: Record<string, string> = {
    'serif': '衬线',
    'sans-serif': '无衬线',
    'handwriting': '手写',
    'monospace': '等宽',
    'display': '显示',
  };

  return (
    <div
      className={`font-card ${isSelected ? 'font-card--selected' : ''}`}
      onClick={() => selectFont(font.id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <button
        className="font-card__compare-btn"
        onClick={(e) => {
          e.stopPropagation();
          toggleCompareFont(font.id);
        }}
        title={isInCompare ? '移出对比' : '加入对比'}
      >
        <Plus
          size={14}
          className={isInCompare ? 'compare-icon--active' : ''}
        />
      </button>

      <div className="font-card__canvas-wrap">
        <canvas
          ref={canvasRef}
          className="font-card__canvas"
        />
        {!fontLoaded && (
          <div className="font-card__canvas-loading">
            <svg className="font-card__spinner" viewBox="0 0 24 24">
              <circle
                className="font-card__spinner-track"
                cx="12" cy="12" r="10"
                fill="none"
                stroke="#1E3A5F"
                strokeOpacity="0.3"
                strokeWidth="2.5"
              />
              <circle
                className="font-card__spinner-arc"
                cx="12" cy="12" r="10"
                fill="none"
                stroke="#4A90D9"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray="47 16"
              />
            </svg>
          </div>
        )}
      </div>

      <div className="font-card__info">
        <h3 className="font-card__name">{font.name}</h3>
        <div className="font-card__meta">
          <span className="font-card__category">{categoryLabels[font.category] || font.category}</span>
          <span className="font-card__variants">
            {font.variants.weights}粗 {font.variants.italics}斜
          </span>
        </div>
        <div className="font-card__tags">
          {font.tags.map((tag) => (
            <span key={tag} className="font-card__tag">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}
