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

export default function FontCard({ font }: FontCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const [isHovered, setIsHovered] = useState(false);

  const selectedFontId = useFontStore((s) => s.selectedFontId);
  const compareFontIds = useFontStore((s) => s.compareFontIds);
  const selectFont = useFontStore((s) => s.selectFont);
  const toggleCompareFont = useFontStore((s) => s.toggleCompareFont);

  const isSelected = selectedFontId === font.id;
  const isInCompare = compareFontIds.includes(font.id);

  const drawCanvas = useCallback((text: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderMiniPreview(canvas, text, font.googleFontName);
  }, [font.googleFontName]);

  useEffect(() => {
    drawCanvas('AaBbCc');
  }, [drawCanvas]);

  useEffect(() => {
    if (!isHovered) {
      cancelAnimationFrame(animFrameRef.current);
      drawCanvas('AaBbCc');
      return;
    }

    const startTime = Date.now();
    const duration = 300;

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
      <canvas
        ref={canvasRef}
        className="font-card__canvas"
      />
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
