import React, { useRef, useEffect, useCallback, useState } from 'react';
import { EcosystemService, eventBus } from './EcosystemService';
import { glitchEngine, GlitchEffect } from '../GlitchModule/GlitchEngine';

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const TANK_BACKGROUND = 'rgba(11, 30, 14, 0.9)';

interface DragState {
  isDragging: boolean;
  entityType: 'plant' | 'creature' | null;
  entityId: string | null;
  offsetX: number;
  offsetY: number;
}

const EcosystemContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const ecosystemRef = useRef<EcosystemService | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    entityType: null,
    entityId: null,
    offsetX: 0,
    offsetY: 0,
  });

  useEffect(() => {
    const offscreen = document.createElement('canvas');
    offscreen.width = CANVAS_WIDTH;
    offscreen.height = CANVAS_HEIGHT;
    offscreenCanvasRef.current = offscreen;

    ecosystemRef.current = new EcosystemService();
    glitchEngine.start();

    return () => {
      glitchEngine.stop();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const renderGlitchEffect = useCallback(
    (ctx: CanvasRenderingContext2D, glitch: GlitchEffect, currentTime: number) => {
      const elapsed = currentTime - glitch.startTime;
      const progress = Math.min(1, elapsed / glitch.duration);

      switch (glitch.type) {
        case 'pixelShift': {
          const { x, y, width, height, shiftX, channelOffset } = glitch.params;
          const fadeProgress = progress < 0.5 ? progress * 2 : (1 - progress) * 2;

          ctx.save();
          ctx.globalAlpha = fadeProgress * 0.8;

          const imageData = ctx.getImageData(x, y, width, height);
          const data = imageData.data;

          for (let py = 0; py < height; py++) {
            for (let px = 0; px < width; px++) {
              const i = (py * width + px) * 4;
              const shiftAmount = Math.floor(shiftX * fadeProgress);
              const channelShift = Math.floor(channelOffset * fadeProgress);

              const redPx = Math.max(0, px - shiftAmount - channelShift);
              const bluePx = Math.min(width - 1, px + shiftAmount + channelShift);

              const redI = (py * width + redPx) * 4;
              const blueI = (py * width + bluePx) * 4;

              const r = data[redI];
              const g = data[i + 1];
              const b = data[blueI + 2];

              ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
              ctx.fillRect(x + px, y + py, 1, 1);
            }
          }
          ctx.restore();
          break;
        }

        case 'noiseOverlay': {
          const { noises } = glitch.params;
          const fadeProgress = progress < 0.3 ? progress / 0.3 : progress > 0.7 ? (1 - progress) / 0.3 : 1;

          noises.forEach((noise: any) => {
            const blinkPhase = ((elapsed / 1000 + noise.blinkOffset) % 0.1) / 0.1;
            const blinkAlpha = blinkPhase < 0.5 ? 1 : 0.3;

            ctx.save();
            ctx.globalAlpha = fadeProgress * blinkAlpha;
            ctx.fillStyle = noise.color;
            ctx.fillRect(noise.x, noise.y, noise.size, noise.size);
            ctx.restore();
          });
          break;
        }

        case 'dataLoss': {
          const { x, y, width, height } = glitch.params;
          const fadeProgress = progress < 0.2 ? 1 - progress / 0.2 : 0;

          ctx.save();

          ctx.fillStyle = '#000000';
          ctx.globalAlpha = 1 - fadeProgress * 0.5;
          ctx.fillRect(x, y, width, height);

          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1;
          ctx.globalAlpha = 0.8;
          for (let i = 0; i < 5; i++) {
            const startY = y + (i * height) / 5;
            const jaggedOffset = Math.sin(i * 1.5 + elapsed / 50) * 5;
            ctx.beginPath();
            ctx.moveTo(x, startY);
            ctx.lineTo(x + width + jaggedOffset, startY + 2);
            ctx.stroke();
          }

          ctx.globalAlpha = fadeProgress * 0.7;
          ctx.fillStyle = TANK_BACKGROUND;
          ctx.fillRect(x, y, width, height);

          ctx.restore();
          break;
        }
      }
    },
    []
  );

  const renderScanline = useCallback((ctx: CanvasRenderingContext2D, y: number) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_WIDTH, y);
    ctx.stroke();
    ctx.restore();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const offscreen = offscreenCanvasRef.current;
    if (!canvas || !offscreen) return;

    const ctx = canvas.getContext('2d');
    const offscreenCtx = offscreen.getContext('2d');
    if (!ctx || !offscreenCtx || !ecosystemRef.current) return;

    const render = (currentTime: number) => {
      offscreenCtx.fillStyle = TANK_BACKGROUND;
      offscreenCtx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      ecosystemRef.current!.update(currentTime);
      ecosystemRef.current!.render(offscreenCtx);

      const activeGlitches = glitchEngine.getActiveGlitches(currentTime);
      activeGlitches.forEach((glitch) => {
        renderGlitchEffect(offscreenCtx, glitch, currentTime);
      });

      if (glitchEngine.isScanlineActive(currentTime)) {
        const scanlineY = glitchEngine.getScanlineY(currentTime);
        renderScanline(offscreenCtx, scanlineY);
      }

      ctx.drawImage(offscreen, 0, 0);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderGlitchEffect, renderScanline]);

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!ecosystemRef.current) return;
    const { x, y } = getCanvasCoords(e);
    const entity = ecosystemRef.current.findEntityAtPosition(x, y);

    if (entity) {
      setDragState({
        isDragging: true,
        entityType: entity.type,
        entityId: entity.id,
        offsetX: x,
        offsetY: y,
      });

      if (entity.type === 'creature') {
        ecosystemRef.current.setCreaturePaused(entity.id, true);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragState.isDragging || !ecosystemRef.current) return;
    const { x, y } = getCanvasCoords(e);

    if (dragState.entityType && dragState.entityId) {
      ecosystemRef.current.updateEntityPosition(dragState.entityType, dragState.entityId, x, y);
    }
  };

  const handleMouseUp = () => {
    if (dragState.isDragging && dragState.entityType === 'creature' && dragState.entityId && ecosystemRef.current) {
      ecosystemRef.current.setCreaturePaused(dragState.entityId, false);
    }
    setDragState({
      isDragging: false,
      entityType: null,
      entityId: null,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const handleMouseLeave = () => {
    if (dragState.isDragging && dragState.entityType === 'creature' && dragState.entityId && ecosystemRef.current) {
      ecosystemRef.current.setCreaturePaused(dragState.entityId, false);
    }
    setDragState({
      isDragging: false,
      entityType: null,
      entityId: null,
      offsetX: 0,
      offsetY: 0,
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      style={{
        display: 'block',
        borderRadius: '8px',
        boxShadow: '0 0 30px rgba(0, 255, 136, 0.2)',
        cursor: dragState.isDragging ? 'grabbing' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
    />
  );
};

export default EcosystemContainer;
