import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useCard } from '../App';
import type { Layer } from '../types/card';
import confetti from 'canvas-confetti';

interface Props {
  animKey: number;
}

const HANDLE_SIZE = 8;

export function EditorCanvas({ animKey }: Props) {
  const { state, selectLayer, updateLayer, cardRef } = useCard();
  const [dragging, setDragging] = useState<{
    layerId: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);
  const [resizing, setResizing] = useState<{
    layerId: string;
    handle: string;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasScale, setCanvasScale] = useState(1);
  const [animClass, setAnimClass] = useState('');

  useEffect(() => {
    if (animKey > 0) {
      const effect = state.animation.enterEffect;
      const cls = effect === 'fade-in' ? 'anim-fade-in'
        : effect === 'slide-up' ? 'anim-slide-up'
        : 'anim-zoom-in';
      setAnimClass('');
      requestAnimationFrame(() => {
        setAnimClass(cls);
        setTimeout(() => setAnimClass(''), state.animation.duration * 1000 + 200);
      });

      if (state.animation.continuousEffect === 'stars') {
        confetti({ particleCount: 30, spread: 60, origin: { y: 0.6 }, colors: ['#FF6B6B', '#FFE66D', '#FF8E8E'] });
      }
    }
  }, [animKey, state.animation]);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 40;
        const h = containerRef.current.clientHeight - 40;
        const scaleX = w / 600;
        const scaleY = h / 800;
        setCanvasScale(Math.min(scaleX, scaleY, 1));
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const toCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!cardRef.current) return { x: 0, y: 0 };
    const rect = cardRef.current.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / canvasScale,
      y: (clientY - rect.top) / canvasScale,
    };
  }, [canvasScale, cardRef]);

  const handleMouseDown = useCallback((e: React.MouseEvent, layer: Layer) => {
    e.stopPropagation();
    selectLayer(layer.id);
    setDragging({
      layerId: layer.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: layer.x,
      origY: layer.y,
    });
  }, [selectLayer]);

  const handleResizeStart = useCallback((e: React.MouseEvent, layer: Layer, handle: string) => {
    e.stopPropagation();
    e.preventDefault();
    setResizing({
      layerId: layer.id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      origX: layer.x,
      origY: layer.y,
      origW: layer.width,
      origH: layer.height,
    });
  }, []);

  useEffect(() => {
    if (!dragging && !resizing) return;
    const handleMove = (e: MouseEvent) => {
      if (dragging) {
        const dx = (e.clientX - dragging.startX) / canvasScale;
        const dy = (e.clientY - dragging.startY) / canvasScale;
        updateLayer(dragging.layerId, {
          x: Math.round(dragging.origX + dx),
          y: Math.round(dragging.origY + dy),
        });
      }
      if (resizing) {
        const dx = (e.clientX - resizing.startX) / canvasScale;
        const dy = (e.clientY - resizing.startY) / canvasScale;
        let newX = resizing.origX;
        let newY = resizing.origY;
        let newW = resizing.origW;
        let newH = resizing.origH;
        const h = resizing.handle;
        if (h.includes('e')) newW = Math.max(30, resizing.origW + dx);
        if (h.includes('w')) { newX = resizing.origX + dx; newW = Math.max(30, resizing.origW - dx); }
        if (h.includes('s')) newH = Math.max(30, resizing.origH + dy);
        if (h.includes('n')) { newY = resizing.origY + dy; newH = Math.max(30, resizing.origH - dy); }
        updateLayer(resizing.layerId, { x: Math.round(newX), y: Math.round(newY), width: Math.round(newW), height: Math.round(newH) });
      }
    };
    const handleUp = () => {
      setDragging(null);
      setResizing(null);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging, resizing, canvasScale, updateLayer]);

  const handleCanvasClick = useCallback(() => {
    selectLayer(null);
  }, [selectLayer]);

  const fontFamilyMap: Record<string, string> = {
    'noto-sans': 'var(--font-sans)',
    'noto-serif': 'var(--font-serif)',
    'zhanku-kuaile': 'var(--font-kuaile)',
  };

  const renderLayer = (layer: Layer) => {
    const isSelected = state.selectedLayerId === layer.id;
    const style: React.CSSProperties = {
      position: 'absolute',
      left: layer.x,
      top: layer.y,
      width: layer.width,
      height: layer.height,
      transform: `rotate(${layer.rotation}deg)`,
      opacity: layer.opacity,
      zIndex: layer.zIndex,
      cursor: dragging?.layerId === layer.id ? 'grabbing' : 'grab',
      transition: dragging ? 'none' : 'opacity 0.3s ease',
    };

    const inner: React.CSSProperties = layer.type === 'background'
      ? { width: '100%', height: '100%', backgroundColor: layer.color || '#FFF' }
      : layer.type === 'decoration'
        ? {
            width: '100%', height: '100%',
            backgroundImage: layer.src ? `url(${layer.src})` : undefined,
            backgroundSize: 'contain',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }
        : {
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent:
              layer.text?.textAlign === 'left' ? 'flex-start' :
              layer.text?.textAlign === 'right' ? 'flex-end' : 'center',
            fontFamily: layer.text ? fontFamilyMap[layer.text.fontFamily] || 'var(--font-sans)' : 'var(--font-sans)',
            fontSize: `${layer.text?.fontSize}px`,
            lineHeight: layer.text?.lineHeight || 1.5,
            color: layer.text?.color,
            textAlign: layer.text?.textAlign,
            WebkitTextStroke: layer.text && layer.text.strokeWidth > 0
              ? `${layer.text.strokeWidth}px ${layer.text.strokeColor}` : undefined,
            textShadow: layer.text && (layer.text.shadowBlur > 0 || layer.text.shadowOffsetX !== 0)
              ? `${layer.text.shadowOffsetX}px ${layer.text.shadowOffsetY}px ${layer.text.shadowBlur}px ${layer.text.shadowColor}` : undefined,
            wordBreak: 'break-word',
            padding: '4px',
            overflow: 'hidden',
          };

    const handles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const;
    const handlePositions: Record<string, React.CSSProperties> = {
      nw: { top: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'nw-resize' },
      n: { top: -HANDLE_SIZE/2, left: '50%', marginLeft: -HANDLE_SIZE/2, cursor: 'n-resize' },
      ne: { top: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'ne-resize' },
      e: { top: '50%', right: -HANDLE_SIZE/2, marginTop: -HANDLE_SIZE/2, cursor: 'e-resize' },
      se: { bottom: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'se-resize' },
      s: { bottom: -HANDLE_SIZE/2, left: '50%', marginLeft: -HANDLE_SIZE/2, cursor: 's-resize' },
      sw: { bottom: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'sw-resize' },
      w: { top: '50%', left: -HANDLE_SIZE/2, marginTop: -HANDLE_SIZE/2, cursor: 'w-resize' },
    };

    return (
      <div
        key={layer.id}
        style={style}
        onMouseDown={e => handleMouseDown(e, layer)}
        className={layer.type === 'text' ? 'canvas-text-layer' : ''}
      >
        <div style={inner}>
          {layer.type === 'text' && layer.text?.content}
        </div>
        {isSelected && layer.type !== 'background' && (
          <div className="selection-border" style={{
            position: 'absolute', inset: -1,
            border: '2px solid var(--color-primary)',
            borderRadius: 2,
            pointerEvents: 'none',
          }}>
            {handles.map(h => (
              <div
                key={h}
                className="resize-handle"
                style={{
                  position: 'absolute',
                  width: HANDLE_SIZE,
                  height: HANDLE_SIZE,
                  backgroundColor: '#FFF',
                  border: '2px solid var(--color-primary)',
                  borderRadius: 2,
                  ...handlePositions[h],
                }}
                onMouseDown={e => handleResizeStart(e, layer, h)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const continuousEffectStyle = state.animation.continuousEffect === 'petals'
    ? 'continuous-petals'
    : state.animation.continuousEffect === 'stars'
    ? 'continuous-stars'
    : 'continuous-particles';

  return (
    <div className="editor-canvas-container" ref={containerRef}>
      <div
        className="canvas-viewport"
        style={{ transform: `scale(${canvasScale})`, transformOrigin: 'top center' }}
      >
        <div
          ref={cardRef}
          className={`paper-texture card-canvas ${animClass} ${continuousEffectStyle}`}
          style={{ width: 600, height: 800, position: 'relative', overflow: 'hidden' }}
          onClick={handleCanvasClick}
        >
          {state.layers.map(renderLayer)}
          {state.animation.continuousEffect === 'petals' && <PetalEffect />}
          {state.animation.continuousEffect === 'stars' && <StarEffect />}
          {state.animation.continuousEffect === 'particles' && <ParticleEffect />}
        </div>
      </div>
      <style>{`
        .editor-canvas-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          background: var(--color-bg-dark);
          border-radius: var(--radius-md);
          margin: 12px;
          position: relative;
        }
        .canvas-viewport {
          transition: transform 0.3s ease;
        }
        .card-canvas {
          box-shadow: var(--shadow-lg);
          border-radius: var(--radius-sm);
          cursor: default;
        }
        .canvas-text-layer {
          user-select: none;
        }
        .resize-handle {
          z-index: 9999;
          pointer-events: all !important;
          transition: background-color 0.15s ease;
        }
        .resize-handle:hover {
          background-color: var(--color-primary) !important;
        }
        .anim-fade-in {
          animation: fadeIn var(--anim-dur, 2s) ease forwards;
        }
        .anim-slide-up {
          animation: slideUp var(--anim-dur, 2s) ease forwards;
        }
        .anim-zoom-in {
          animation: zoomIn var(--anim-dur, 2s) ease forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes zoomIn {
          from { transform: scale(0.3); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .continuous-petals .petal {
          position: absolute;
          width: 12px; height: 12px;
          background: radial-gradient(circle, #FFB6C1 40%, transparent 70%);
          border-radius: 50% 0 50% 0;
          animation: petalFall 4s linear infinite;
          pointer-events: none;
          opacity: 0.7;
        }
        @keyframes petalFall {
          0% { transform: translateY(-20px) rotate(0deg); opacity: 0.7; }
          100% { transform: translateY(820px) rotate(360deg); opacity: 0; }
        }
        .continuous-stars .star {
          position: absolute;
          width: 4px; height: 4px;
          background: #FFE66D;
          border-radius: 50%;
          animation: starTwinkle 2s ease-in-out infinite;
          pointer-events: none;
        }
        @keyframes starTwinkle {
          0%, 100% { opacity: 0.2; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        .continuous-particles .particle {
          position: absolute;
          width: 6px; height: 6px;
          border-radius: 50%;
          animation: particleSpin 3s linear infinite;
          pointer-events: none;
        }
        @keyframes particleSpin {
          0% { transform: rotate(0deg) translateX(40px) rotate(0deg); opacity: 0.8; }
          100% { transform: rotate(360deg) translateX(40px) rotate(-360deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function PetalEffect() {
  const petals = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 4}s`,
    size: 8 + Math.random() * 10,
  }));
  return <>{petals.map(p => (
    <div key={p.id} className="petal" style={{
      left: p.left, animationDelay: p.delay,
      width: p.size, height: p.size,
    }} />
  ))}</>;
}

function StarEffect() {
  const stars = Array.from({ length: 25 }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    delay: `${Math.random() * 2}s`,
    size: 2 + Math.random() * 4,
  }));
  return <>{stars.map(s => (
    <div key={s.id} className="star" style={{
      left: s.left, top: s.top, animationDelay: s.delay,
      width: s.size, height: s.size,
    }} />
  ))}</>;
}

function ParticleEffect() {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    cx: 50, cy: 50,
    delay: `${Math.random() * 3}s`,
    color: ['#FF6B6B', '#FFE66D', '#FF8E8E', '#4ECDC4', '#45B7D1'][i % 5],
  }));
  return <>{particles.map(p => (
    <div key={p.id} className="particle" style={{
      left: `${p.cx}%`, top: `${p.cy}%`,
      animationDelay: p.delay,
      backgroundColor: p.color,
    }} />
  ))}</>;
}
