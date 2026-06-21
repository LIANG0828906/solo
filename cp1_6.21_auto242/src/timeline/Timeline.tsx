import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useAppContext } from '../AppContext';
import { CIVILIZATIONS } from '../data/events';
import { Civilization } from '../types';

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  visible: boolean;
}

const MIN_YEAR = -3000;
const MAX_YEAR = 2000;
const TOTAL_YEARS = MAX_YEAR - MIN_YEAR;
const PADDING = { left: 16, right: 16, top: 12, bottom: 32 };
const BAR_HEIGHT = 56;
const BAR_SPACING = 2;
const CANVAS_HEIGHT = 120;

const checkCollision = (rect1: Rect, rect2: Rect): boolean => {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
};

const resolveTextCollisions = (textItems: TextItem[]): TextItem[] => {
  const sortedItems = [...textItems].sort((a, b) => a.x - b.x);
  const resolved: TextItem[] = [];

  for (const item of sortedItems) {
    const itemRect: Rect = {
      x: item.x - item.width / 2,
      y: item.y - 10,
      width: item.width,
      height: 20,
    };

    let hasCollision = false;
    for (const resolvedItem of resolved) {
      if (!resolvedItem.visible) continue;
      const resolvedRect: Rect = {
        x: resolvedItem.x - resolvedItem.width / 2,
        y: resolvedItem.y - 10,
        width: resolvedItem.width,
        height: 20,
      };
      if (checkCollision(itemRect, resolvedRect)) {
        hasCollision = true;
        break;
      }
    }

    resolved.push({
      ...item,
      visible: !hasCollision,
    });
  }

  return resolved;
};

const formatYear = (year: number): string => {
  if (year < 0) {
    return `公元前${Math.abs(year)}年`;
  }
  return `公元${year}年`;
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
};

const Timeline: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const [hoveredCivilization, setHoveredCivilization] = useState<Civilization | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [tooltipOpacity, setTooltipOpacity] = useState(0);

  const { selectedCivilizationId, selectedCivilizationIds, selectCivilization, toggleComparisonCivilization } = useAppContext();

  const yearToPixel = useCallback((year: number, width: number): number => {
    const contentWidth = width - PADDING.left - PADDING.right;
    const normalizedYear = (year - MIN_YEAR) / TOTAL_YEARS;
    return PADDING.left + normalizedYear * contentWidth;
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const pixelToYear = useCallback((pixel: number, width: number): number => {
    const contentWidth = width - PADDING.left - PADDING.right;
    const normalizedPixel = (pixel - PADDING.left) / contentWidth;
    return MIN_YEAR + normalizedPixel * TOTAL_YEARS;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    const width = rect.width;
    const height = CANVAS_HEIGHT;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, width, height);

    drawRoundedRect(ctx, 0, 0, width, height, 12);
    ctx.fillStyle = '#1E293B';
    ctx.fill();

    const barY = PADDING.top;

    const civilizationRects: { civ: Civilization; rect: Rect }[] = [];
    const barYPositions: Record<string, number> = {};

    const rows: Rect[][] = [];
    for (const civ of CIVILIZATIONS) {
      const startX = yearToPixel(civ.startYear, width);
      const endX = yearToPixel(civ.endYear, width);
      const barWidth = Math.max(endX - startX - BAR_SPACING, 4);
      const civRect: Rect = {
        x: startX + BAR_SPACING / 2,
        y: barY,
        width: barWidth,
        height: BAR_HEIGHT,
      };

      let placed = false;
      for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
        let collision = false;
        for (const existingRect of rows[rowIndex]) {
          if (checkCollision(civRect, existingRect)) {
            collision = true;
            break;
          }
        }
        if (!collision) {
          rows[rowIndex].push(civRect);
          barYPositions[civ.id] = barY + rowIndex * (BAR_HEIGHT + BAR_SPACING);
          placed = true;
          break;
        }
      }

      if (!placed) {
        rows.push([civRect]);
        barYPositions[civ.id] = barY + rows.length * (BAR_HEIGHT + BAR_SPACING) - BAR_HEIGHT - BAR_SPACING;
      }

      civilizationRects.push({ civ, rect: civRect });
    }

    const textItems: TextItem[] = [];
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (const { civ, rect } of civilizationRects) {
      const actualY = barYPositions[civ.id];
      const isSelected = selectedCivilizationId === civ.id;
      const isInComparison = selectedCivilizationIds.includes(civ.id);
      const isHovered = hoveredCivilization?.id === civ.id;

      drawRoundedRect(ctx, rect.x, actualY, rect.width, rect.height, 6);
      ctx.fillStyle = civ.color;
      ctx.globalAlpha = isSelected || isInComparison ? 1 : 0.75;
      ctx.fill();
      ctx.globalAlpha = 1;

      if (isSelected || isInComparison) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = isSelected ? 3 : 2;
        ctx.stroke();
      }

      if (isHovered) {
        ctx.strokeStyle = '#FBBF24';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      const textMetrics = ctx.measureText(civ.name);
      if (textMetrics.width < rect.width - 12) {
        textItems.push({
          text: civ.name,
          x: rect.x + rect.width / 2,
          y: actualY + BAR_HEIGHT / 2,
          width: textMetrics.width,
          visible: true,
        });
      }
    }

    const resolvedTextItems = resolveTextCollisions(textItems);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    for (const item of resolvedTextItems) {
      if (item.visible) {
        ctx.fillText(item.text, item.x, item.y);
      }
    }

    const tickY = CANVAS_HEIGHT - PADDING.bottom + 8;
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, tickY);
    ctx.lineTo(width - PADDING.right, tickY);
    ctx.stroke();

    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#94A3B8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let year = MIN_YEAR; year <= MAX_YEAR; year += 1000) {
      const x = yearToPixel(year, width);

      ctx.beginPath();
      ctx.moveTo(x, tickY - 4);
      ctx.lineTo(x, tickY + 4);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1;
      ctx.stroke();

      const label = year === 0 ? '公元元年' : formatYear(year);
      ctx.fillText(label, x, tickY + 8);
    }

    canvas.dataset.civilizationRects = JSON.stringify(
      civilizationRects.map(({ civ, rect }) => ({
        ...civ,
        rect: { ...rect, y: barYPositions[civ.id] },
      }))
    );
  }, [yearToPixel, selectedCivilizationId, selectedCivilizationIds, hoveredCivilization]);

  const getCivilizationAtPoint = (x: number, y: number): Civilization | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rectsData = canvas.dataset.civilizationRects;
    if (!rectsData) return null;

    const rects = JSON.parse(rectsData);
    for (const item of rects) {
      const rect = item.rect;
      if (x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height) {
        return CIVILIZATIONS.find((c) => c.id === item.id) || null;
      }
    }
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const civ = getCivilizationAtPoint(x, y);
    setHoveredCivilization(civ);

    if (civ) {
      setTooltipPosition({ x: e.clientX, y: e.clientY });
      setTooltipOpacity(1);
      canvas.style.cursor = 'pointer';
    } else {
      setTooltipOpacity(0);
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseLeave = () => {
    setHoveredCivilization(null);
    setTooltipOpacity(0);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = 'default';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const civ = getCivilizationAtPoint(x, y);
    if (civ) {
      selectCivilization(civ.id);
      toggleComparisonCivilization(civ.id);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      animationFrameRef.current = requestAnimationFrame(() => {
        draw();
      });
    };

    window.addEventListener('resize', handleResize);
    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [draw]);

  useEffect(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.transition = 'opacity 0.2s ease-out';
    }
  }, []);

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          height: `${CANVAS_HEIGHT}px`,
          display: 'block',
          borderRadius: '12px',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          pointerEvents: 'none',
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontFamily: 'Inter, system-ui, sans-serif',
          whiteSpace: 'nowrap',
          zIndex: 1000,
          opacity: tooltipOpacity,
          transform: 'translate(-50%, -100%)',
          transition: 'opacity 0.2s ease-out',
          left: tooltipPosition.x,
          top: tooltipPosition.y - 12,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        }}
      >
        {hoveredCivilization && (
          <div>
            <div style={{ fontWeight: 600, marginBottom: '2px' }}>{hoveredCivilization.name}</div>
            <div style={{ color: '#94A3B8', fontSize: '11px' }}>
              {formatYear(hoveredCivilization.startYear)} - {formatYear(hoveredCivilization.endYear)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
