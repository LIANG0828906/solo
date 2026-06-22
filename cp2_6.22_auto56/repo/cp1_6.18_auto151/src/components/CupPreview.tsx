import { useRef, useEffect, useCallback } from 'react';
import { renderCup, buildLayers, createBubbles, updateBubbles } from '@/renderer/cupRenderer';
import type { Bubble } from '@/renderer/cupRenderer';
import { Ingredient } from '@/data/ingredients';

interface CupPreviewProps {
  base: Ingredient | null;
  syrups: Ingredient[];
  foamLevel: number;
  garnishes: Ingredient[];
  width?: number;
  height?: number;
  showBubbles?: boolean;
}

function getCupBounds(w: number, h: number) {
  const centerX = w / 2;
  const topHalfWidth = w * 0.3;
  const bottomHalfWidth = w * 0.225;
  const topY = h * 0.08;
  const bottomY = h * 0.88;
  return {
    left: centerX - bottomHalfWidth,
    right: centerX + bottomHalfWidth,
    top: topY,
    bottom: bottomY,
  };
}

export default function CupPreview({
  base,
  syrups,
  foamLevel,
  garnishes,
  width = 200,
  height = 300,
  showBubbles = true,
}: CupPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bubblesRef = useRef<Bubble[]>([]);
  const frameRef = useRef<number>(0);

  const layers = buildLayers(base, syrups, foamLevel, garnishes);
  const cupBounds = getCupBounds(width, height);

  const depsKey = [
    base?.id ?? '',
    ...syrups.map(s => s.id),
    foamLevel,
    ...garnishes.map(g => g.id),
  ].join('-');

  useEffect(() => {
    bubblesRef.current = createBubbles(15, cupBounds);
  }, [depsKey]);

  const draw = useCallback(() => {
    if (showBubbles) {
      bubblesRef.current = updateBubbles(bubblesRef.current, cupBounds);
    }
    const canvas = canvasRef.current;
    if (canvas) {
      renderCup(canvas, layers, width, height, bubblesRef.current);
    }
    frameRef.current = requestAnimationFrame(draw);
  }, [layers, width, height, showBubbles, cupBounds]);

  useEffect(() => {
    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [draw]);

  return (
    <div className="flex justify-center items-center">
      <canvas ref={canvasRef} style={{ width, height }} />
    </div>
  );
}
