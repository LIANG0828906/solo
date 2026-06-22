import { useEffect, useRef, useCallback } from 'react';
import { useDesignStore } from './store';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  BELT_Y,
  CM_TO_PX_RATIO,
  CLASP_INFO,
  MIN_BELT_LENGTH_CM,
  MAX_BELT_LENGTH_CM
} from './types';
import type { ClaspType } from './types';

const FONT_FAMILY_MAP: Record<string, string> = {
  KaiTi: 'KaiTi, 楷体, serif',
  SimSun: 'SimSun, 宋体, serif',
  SimHei: 'SimHei, 黑体, sans-serif'
};

interface CanvasProps {
  onThumbnailRef?: React.MutableRefObject<(() => string) | null>;
}

type CanvasState = {
  leatherColor: string;
  claspType: 'silver' | 'gold' | 'copper';
  beltLength: number;
  beltWidth: number;
  engravingText: string;
  engravingFont: 'KaiTi' | 'SimSun' | 'SimHei';
  engravingX: number;
  engravingY: number;
  fontSize: number;
};

export default function Canvas({ onThumbnailRef }: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef<'length' | 'text' | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRenderRef = useRef<number>(0);
  const initialState = useDesignStore.getState();
  const stateRef = useRef<CanvasState>({
    leatherColor: initialState.leatherColor,
    claspType: initialState.claspType,
    beltLength: initialState.beltLength,
    beltWidth: initialState.beltWidth,
    engravingText: initialState.engravingText,
    engravingFont: initialState.engravingFont,
    engravingX: initialState.engravingX,
    engravingY: initialState.engravingY,
    fontSize: initialState.fontSize
  });
  const needsRenderRef = useRef(true);

  const {
    leatherColor,
    claspType,
    beltLength,
    beltWidth,
    engravingText,
    engravingFont,
    engravingX,
    engravingY,
    fontSize
  } = useDesignStore();

  const setBeltLength = useDesignStore(s => s.setBeltLength);
  const setTextPosition = useDesignStore(s => s.setTextPosition);

  useEffect(() => {
    stateRef.current = {
      leatherColor,
      claspType,
      beltLength,
      beltWidth,
      engravingText,
      engravingFont,
      engravingX,
      engravingY,
      fontSize
    };
    needsRenderRef.current = true;
  }, [leatherColor, claspType, beltLength, beltWidth, engravingText, engravingFont, engravingX, engravingY, fontSize]);

  const getThumbnail = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return '';
    return canvas.toDataURL('image/png');
  }, []);

  useEffect(() => {
    if (onThumbnailRef) {
      onThumbnailRef.current = getThumbnail;
    }
  }, [onThumbnailRef, getThumbnail]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const s = stateRef.current;
    const beltPx = s.beltLength * CM_TO_PX_RATIO;
    const beltStartX = (CANVAS_WIDTH - beltPx) / 2;
    const beltEndX = beltStartX + beltPx;
    const beltTop = BELT_Y - s.beltWidth / 2;
    const beltBottom = BELT_Y + s.beltWidth / 2;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(beltStartX, beltTop + radius);
    ctx.arcTo(beltStartX + radius, beltTop + radius, radius, Math.PI, Math.PI * 1.5);
    ctx.lineTo(beltEndX - radius, beltTop);
    ctx.arcTo(beltEndX - radius, beltTop + radius, radius, Math.PI * 1.5, Math.PI * 2);
    ctx.lineTo(beltEndX, beltBottom - radius);
    ctx.arcTo(beltEndX - radius, beltBottom - radius, radius, 0, Math.PI * 0.5);
    ctx.lineTo(beltStartX + radius, beltBottom);
    ctx.arcTo(beltStartX + radius, beltBottom - radius, radius, Math.PI * 0.5, Math.PI);
    ctx.closePath();
    ctx.fillStyle = s.leatherColor;
    ctx.fill();

    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 2;
    for (let i = beltStartX + 15; i < beltEndX - 15; i += 20) {
      ctx.beginPath();
      ctx.moveTo(i, beltTop + 5);
      ctx.lineTo(i, beltBottom - 5);
      ctx.stroke();
    }

    const claspInfo = CLASP_INFO.find((c: { type: ClaspType }) => c.type === s.claspType) || CLASP_INFO[0];
    const claspWidth = 30;
    const claspHeight = s.beltWidth + 12;
    const claspX = beltEndX - 5;
    const claspY = BELT_Y - claspHeight / 2;

    ctx.fillStyle = claspInfo.color;
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, claspX, claspY, claspWidth, claspHeight, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(claspX + 4, claspY + 4, 4, claspHeight - 8);

    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    const prongX = claspX + claspWidth / 2;
    ctx.fillRect(prongX - 2, claspY + 6, 4, claspHeight - 12);

    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(beltEndX + claspWidth / 2, BELT_Y + s.beltWidth / 2 + 10, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (s.engravingText && s.engravingText.trim().length > 0) {
      const fontFamily = FONT_FAMILY_MAP[s.engravingFont] || FONT_FAMILY_MAP.KaiTi;
      ctx.font = `bold ${s.fontSize}px ${fontFamily}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.miterLimit = 2;
      ctx.strokeText(s.engravingText, s.engravingX, s.engravingY);

      ctx.fillStyle = '#FFFFFF';
      ctx.fillText(s.engravingText, s.engravingX, s.engravingY);
    }

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`${s.beltLength}cm`, beltStartX, beltBottom + 10);
  }, []);

  useEffect(() => {
    const loop = (time: number) => {
      const now = time;
      if (needsRenderRef.current && now - lastRenderRef.current >= 33) {
        draw();
        lastRenderRef.current = now;
        needsRenderRef.current = false;
      } else if (needsRenderRef.current) {
        draw();
        lastRenderRef.current = now;
        needsRenderRef.current = false;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [draw]);

  const getMousePos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    return {
      x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width),
      y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
    };
  };

  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getMousePos(e);
    const beltPx = stateRef.current.beltLength * CM_TO_PX_RATIO;
    const beltEndX = (CANVAS_WIDTH - beltPx) / 2 + beltPx;
    const knobX = beltEndX + 15;
    const knobY = BELT_Y + stateRef.current.beltWidth / 2 + 10;
    const dx = x - knobX;
    const dy = y - knobY;
    if (Math.sqrt(dx * dx + dy * dy) <= 12) {
      draggingRef.current = 'length';
      return;
    }
    if (stateRef.current.engravingText && stateRef.current.engravingText.trim().length > 0) {
      const fontFamily = FONT_FAMILY_MAP[stateRef.current.engravingFont] || FONT_FAMILY_MAP.KaiTi;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        ctx.font = `bold ${stateRef.current.fontSize}px ${fontFamily}`;
        const metrics = ctx.measureText(stateRef.current.engravingText);
        const textW = metrics.width + 10;
        const textH = stateRef.current.fontSize + 8;
        const tx = stateRef.current.engravingX;
        const ty = stateRef.current.engravingY;
        if (x >= tx - textW / 2 && x <= tx + textW / 2 &&
            y >= ty - textH / 2 && y <= ty + textH / 2) {
          draggingRef.current = 'text';
        }
      }
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingRef.current) return;
    const { x, y } = getMousePos(e);
    if (draggingRef.current === 'length') {
      const beltStartX = (CANVAS_WIDTH - stateRef.current.beltLength * CM_TO_PX_RATIO) / 2;
      const currentEndX = x;
      const newBeltPx = Math.max(MIN_BELT_LENGTH_CM * CM_TO_PX_RATIO, Math.min(MAX_BELT_LENGTH_CM * CM_TO_PX_RATIO, currentEndX - beltStartX));
      const newLengthCm = Math.round(newBeltPx / CM_TO_PX_RATIO);
      setBeltLength(newLengthCm);
    } else if (draggingRef.current === 'text') {
      setTextPosition(x, y);
    }
  };

  const handlePointerUp = () => {
    draggingRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const mouseLike = e as unknown as React.MouseEvent<HTMLCanvasElement>;
    handlePointerDown(mouseLike);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const mouseLike = e as unknown as React.MouseEvent<HTMLCanvasElement>;
    handlePointerMove(mouseLike);
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onMouseLeave={handlePointerUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handlePointerUp}
      style={{ display: 'block', cursor: draggingRef.current ? 'grabbing' : 'default', touchAction: 'none' }}
    />
  );
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, r, Math.PI * 1.5, Math.PI * 2);
  ctx.arcTo(x + w, y + h, r, 0, Math.PI * 0.5);
  ctx.arcTo(x, y + h, r, Math.PI * 0.5, Math.PI);
  ctx.arcTo(x, y, r, Math.PI, Math.PI * 1.5);
  ctx.closePath();
}


