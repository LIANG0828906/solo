import { useEffect, useRef, useCallback } from 'react';
import { ParticleEngine, easeOutCubic } from '../utils/particleEngine';
import { ColorScheme, PoemLine, sentimentColors, Sentiment } from '../types';

interface VisualCanvasProps {
  poem: PoemLine[];
  colorScheme: ColorScheme;
  sentiment: Sentiment;
  animationSpeed: number;
  onLineClick: (lineId: string) => void;
  editingLineId: string | null;
  editedLineText: string;
  onEditChange: (text: string) => void;
  onEditConfirm: () => void;
  updatedLineIds: Set<string>;
}

interface LineAnimation {
  id: string;
  startProgress: number;
  progress: number;
  fontSize: number;
  opacity: number;
  yOffset: number;
  scale: number;
}

export default function VisualCanvas({
  poem,
  colorScheme,
  sentiment,
  animationSpeed,
  onLineClick,
  editingLineId,
  editedLineText,
  onEditChange,
  onEditConfirm,
  updatedLineIds
}: VisualCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleEngineRef = useRef<ParticleEngine | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lineAnimationsRef = useRef<Map<string, LineAnimation>>(new Map());
  const poemKeyRef = useRef<string>('');
  const bgTransitionRef = useRef<number>(1);
  const prevBgRef = useRef<[string, string, string]>(colorScheme.bgGradient);

  const initAnimations = useCallback((poemLines: PoemLine[]) => {
    const map = new Map<string, LineAnimation>();
    const baseSizes = [38, 32, 34, 30];
    const baseOpacities = [1, 0.9, 0.95, 0.85];
    poemLines.forEach((line, idx) => {
      const prevAnim = lineAnimationsRef.current.get(line.id);
      map.set(line.id, {
        id: line.id,
        startProgress: idx * 0.5,
        progress: 0,
        fontSize: baseSizes[idx % baseSizes.length],
        opacity: baseOpacities[idx % baseOpacities.length],
        yOffset: 0,
        scale: prevAnim?.scale || 0
      });
    });
    lineAnimationsRef.current = map;
    poemKeyRef.current = poemLines.map(l => l.id).join(',');
  }, []);

  useEffect(() => {
    if (poem.length === 0) return;
    const currentKey = poem.map(l => l.id).join(',');
    if (currentKey !== poemKeyRef.current) {
      initAnimations(poem);
    }
  }, [poem, initAnimations]);

  useEffect(() => {
    prevBgRef.current = colorScheme.bgGradient;
    bgTransitionRef.current = 0;
  }, [colorScheme.bgGradient]);

  useEffect(() => {
    if (!particleEngineRef.current) return;
    const colors = sentimentColors[sentiment];
    particleEngineRef.current.setColors(colors);
  }, [sentiment]);

  useEffect(() => {
    if (!particleEngineRef.current) return;
    particleEngineRef.current.setSpeed(animationSpeed);
  }, [animationSpeed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setupCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      if (!particleEngineRef.current) {
        const colors = sentimentColors[sentiment];
        particleEngineRef.current = new ParticleEngine(
          {
            particleCount: 140,
            colors,
            connectionDistance: 130,
            connectionColor: colorScheme.lineConnectionColor,
            speedMultiplier: animationSpeed
          },
          rect.width,
          rect.height
        );
      } else {
        particleEngineRef.current.resize(rect.width, rect.height);
      }
    };

    setupCanvas();

    const handleResize = () => {
      setupCanvas();
    };

    window.addEventListener('resize', handleResize);

    const animate = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const deltaTime = Math.min(time - lastTimeRef.current, 50);
      lastTimeRef.current = time;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;

      if (bgTransitionRef.current < 1) {
        bgTransitionRef.current = Math.min(1, bgTransitionRef.current + deltaTime * 0.002);
      }

      const bgT = easeOutCubic(bgTransitionRef.current);
      const grad = ctx.createLinearGradient(0, 0, w, h);
      for (let i = 0; i < 3; i++) {
        const c1 = hexToRgb(prevBgRef.current[i]);
        const c2 = hexToRgb(colorScheme.bgGradient[i]);
        const r = Math.round(lerp(c1.r, c2.r, bgT));
        const g = Math.round(lerp(c1.g, c2.g, bgT));
        const b = Math.round(lerp(c1.b, c2.b, bgT));
        grad.addColorStop(i / 2, `rgb(${r}, ${g}, ${b})`);
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      if (particleEngineRef.current) {
        particleEngineRef.current.config.connectionColor = colorScheme.lineConnectionColor;
        particleEngineRef.current.update(deltaTime);
        particleEngineRef.current.render(ctx);
      }

      const lineCount = poem.length;
      const lineHeight = 70;
      const totalHeight = lineCount * lineHeight;
      const startY = (h - totalHeight) / 2 + lineHeight / 2;

      poem.forEach((line, idx) => {
        const anim = lineAnimationsRef.current.get(line.id);
        if (!anim) return;

        if (anim.progress < 1) {
          const progressPerMs = (0.001 * animationSpeed) / 0.8;
          anim.progress = Math.min(1, anim.progress + deltaTime * progressPerMs);
        }

        if (updatedLineIds.has(line.id) && anim.scale < 1) {
          anim.scale = Math.min(1, anim.scale + deltaTime * 0.008);
        } else if (!updatedLineIds.has(line.id)) {
          anim.scale = Math.min(1, anim.progress);
        }

        const animT = easeOutCubic(Math.max(0, (anim.progress - anim.startProgress * 0.3) / (1 - anim.startProgress * 0.3)));
        const displayY = startY + idx * lineHeight - (1 - animT) * 40;
        anim.yOffset = displayY;
        const displayOpacity = animT * anim.opacity;
        const displayScale = 0.85 + anim.scale * 0.15;

        ctx.save();
        ctx.translate(w / 2, displayY);
        ctx.scale(displayScale, displayScale);

        const displayText = editingLineId === line.id ? editedLineText : line.text;
        const fontSize = anim.fontSize;

        ctx.font = `${fontSize}px Georgia, 'Noto Serif SC', 'Times New Roman', serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.shadowColor = colorScheme.textGlowColor;
        ctx.shadowBlur = 18 * displayOpacity;
        ctx.fillStyle = `rgba(255, 255, 255, ${displayOpacity})`;
        ctx.fillText(displayText, 0, 0);

        const metrics = ctx.measureText(displayText);
        const textWidth = metrics.width;
        const textHeight = fontSize;
        const hitAreaX = -textWidth / 2 - 12;
        const hitAreaY = -textHeight / 2 - 8;
        const hitAreaW = textWidth + 24;
        const hitAreaH = textHeight + 16;

        (line as unknown as { _hit: { x: number; y: number; w: number; h: number } })._hit = {
          x: w / 2 + hitAreaX * displayScale,
          y: displayY + hitAreaY * displayScale,
          w: hitAreaW * displayScale,
          h: hitAreaH * displayScale
        };

        ctx.restore();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
      window.removeEventListener('resize', handleResize);
    };
  }, [poem, colorScheme, sentiment, animationSpeed, editingLineId, editedLineText, updatedLineIds]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for (const line of poem) {
      const hit = (line as unknown as { _hit?: { x: number; y: number; w: number; h: number } })._hit;
      if (hit && x >= hit.x && x <= hit.x + hit.w && y >= hit.y && y <= hit.y + hit.h) {
        onLineClick(line.id);
        return;
      }
    }
  };

  const getInputStyle = (): React.CSSProperties => {
    const editingLine = poem.find(l => l.id === editingLineId);
    if (!editingLine) return { display: 'none' };
    const hit = (editingLine as unknown as { _hit?: { x: number; y: number; w: number; h: number } })._hit;
    if (!hit) return { display: 'none' };
    const canvas = canvasRef.current;
    if (!canvas) return { display: 'none' };

    return {
      position: 'absolute',
      left: `${hit.x}px`,
      top: `${hit.y}px`,
      width: `${Math.max(hit.w, 200)}px`,
      height: `${hit.h}px`,
      background: 'rgba(15, 15, 35, 0.85)',
      backdropFilter: 'blur(10px)',
      border: '1.5px solid rgba(147, 197, 253, 0.6)',
      borderRadius: '8px',
      color: 'white',
      fontSize: '22px',
      fontFamily: `Georgia, 'Noto Serif SC', 'Times New Roman', serif`,
      textAlign: 'center',
      padding: '4px 12px',
      outline: 'none',
      boxShadow: '0 0 25px rgba(147, 197, 253, 0.25), inset 0 0 10px rgba(147, 197, 253, 0.1)',
      zIndex: 20,
      caretColor: '#93c5fd',
      transform: 'translate(-50%, 0)',
      transformOrigin: 'top left'
    };
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
        onClick={handleCanvasClick}
      />
      {editingLineId && (
        <input
          type="text"
          value={editedLineText}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onEditConfirm();
            } else if (e.key === 'Escape') {
              onEditConfirm();
            }
          }}
          onBlur={onEditConfirm}
          autoFocus
          style={getInputStyle()}
        />
      )}
    </div>
  );
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (result) {
    return {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    };
  }
  return { r: 255, g: 255, b: 255 };
};

const lerp = (start: number, end: number, t: number): number => start + (end - start) * t;
