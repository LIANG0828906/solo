import React, { useRef, useEffect, useCallback, useState } from 'react';
import { useEditorStore } from './store/useEditorStore';
import { ParticleCanvas } from './canvas/ParticleCanvas';
import { getInterpolatedParticles } from './canvas/ParticleCanvas';
import { ToolPanel } from './tools/ToolPanel';
import { Timeline } from './timeline/Timeline';
import { exportKeyframesAsPngSequence } from './utils/export';
import { ArrowLeft, Download } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particleCanvasRef = useRef<ParticleCanvas | null>(null);

  const {
    particles,
    keyframes,
    selectedParticleId,
    activeTool,
    isPlaying,
    currentFrame,
    totalFrames,
    zoom,
    panOffset,
    isPreviewMode,
    canvasWidth,
    canvasHeight,
    addParticle,
    deleteParticle,
    selectParticle,
    moveParticle,
    setCurrentFrame,
    setIsPlaying,
    setZoom,
    setPanOffset,
    setIsPreviewMode,
  } = useEditorStore();

  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<{ x: number; y: number } | null>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const lastPlayTimeRef = useRef<number>(0);
  const playStartFrameRef = useRef<number>(0);
  const playStartTimeRef = useRef<number>(0);

  useEffect(() => {
    if (canvasRef.current) {
      particleCanvasRef.current = new ParticleCanvas(canvasRef.current);
      particleCanvasRef.current.resize(canvasWidth, canvasHeight);
    }
  }, [canvasWidth, canvasHeight]);

  const renderCanvas = useCallback(() => {
    const pc = particleCanvasRef.current;
    if (!pc) return;

    if (isPreviewMode) {
      const interpolated = getInterpolatedParticles(keyframes, currentFrame);
      pc.renderPreview(interpolated, zoom, panOffset);
    } else {
      pc.render(particles, selectedParticleId, zoom, panOffset, isMoving);
    }
  }, [particles, keyframes, selectedParticleId, zoom, panOffset, isPreviewMode, currentFrame, isMoving]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    if (!isPlaying) return;

    const fps = 24;
    const frameDuration = 1000 / fps;

    const animate = (timestamp: number) => {
      if (!lastPlayTimeRef.current) {
        lastPlayTimeRef.current = timestamp;
        playStartFrameRef.current = currentFrame;
        playStartTimeRef.current = timestamp;
      }

      const elapsed = timestamp - playStartTimeRef.current;
      const framesAdvanced = Math.floor(elapsed / frameDuration);
      let nextFrame = playStartFrameRef.current + framesAdvanced;

      if (nextFrame >= totalFrames) {
        nextFrame = 0;
        playStartFrameRef.current = 0;
        playStartTimeRef.current = timestamp;
      }

      if (isPreviewMode && keyframes.length > 0) {
        const interpolated = getInterpolatedParticles(keyframes, nextFrame);
        const pc = particleCanvasRef.current;
        if (pc) {
          pc.renderPreview(interpolated, zoom, panOffset);
        }
      }

      setCurrentFrame(nextFrame);
    };

    let animId: number;
    const loop = (timestamp: number) => {
      animate(timestamp);
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      lastPlayTimeRef.current = 0;
    };
  }, [isPlaying, isPreviewMode, keyframes, totalFrames, zoom, panOffset, setCurrentFrame]);

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pc = particleCanvasRef.current;
      if (!pc) return;

      if (e.button === 1) {
        setIsPanning(true);
        setPanStart({ x: e.clientX, y: e.clientY, panX: panOffset.x, panY: panOffset.y });
        e.preventDefault();
        return;
      }

      if (e.button !== 0) return;

      const hit = pc.hitTest(e.clientX, e.clientY, particles, zoom, panOffset);

      switch (activeTool) {
        case 'create': {
          const pos = pc.screenToCanvas(e.clientX, e.clientY, zoom, panOffset);
          addParticle(pos.x, pos.y);
          break;
        }
        case 'select': {
          selectParticle(hit ? hit.id : null);
          break;
        }
        case 'move': {
          if (hit) {
            selectParticle(hit.id);
            setIsDragging(true);
            setDragStartPos({ x: e.clientX, y: e.clientY });
            setIsMoving(true);
          }
          break;
        }
        case 'delete': {
          if (hit) {
            deleteParticle(hit.id);
          }
          break;
        }
      }
    },
    [activeTool, particles, zoom, panOffset, addParticle, deleteParticle, selectParticle]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (isPanning && panStart) {
        const dx = e.clientX - panStart.x;
        const dy = e.clientY - panStart.y;
        setPanOffset({ x: panStart.panX + dx / zoom, y: panStart.panY + dy / zoom });
        return;
      }

      if (isDragging && dragStartPos && selectedParticleId) {
        const pc = particleCanvasRef.current;
        if (!pc) return;
        const pos = pc.screenToCanvas(e.clientX, e.clientY, zoom, panOffset);
        moveParticle(selectedParticleId, pos.x, pos.y);
      }
    },
    [isPanning, isDragging, panStart, dragStartPos, selectedParticleId, zoom, panOffset, moveParticle, setPanOffset]
  );

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragStartPos(null);
    setIsMoving(false);
    setIsPanning(false);
    setPanStart(null);
  }, []);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(zoom + delta);
    },
    [zoom, setZoom]
  );

  const handleExport = useCallback(async () => {
    await exportKeyframesAsPngSequence(keyframes, totalFrames, canvasWidth, canvasHeight);
  }, [keyframes, totalFrames, canvasWidth, canvasHeight]);

  const canvasCursor = activeTool === 'create'
    ? 'crosshair'
    : activeTool === 'move'
    ? 'grab'
    : activeTool === 'delete'
    ? 'not-allowed'
    : 'default';

  if (isPreviewMode) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: '#000000',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{
            maxWidth: '90vw',
            maxHeight: '80vh',
            objectFit: 'contain',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 16,
          }}
        >
          <button
            onClick={() => {
              setIsPreviewMode(false);
              setIsPlaying(false);
            }}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: 'rgba(26, 26, 46, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #2E2E44',
              color: '#00E5FF',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontFamily: 'monospace',
              transition: 'all 0.3s ease-in-out',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(0, 229, 255, 0.15)';
              (e.currentTarget as HTMLElement).style.borderColor = '#00E5FF';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(26, 26, 46, 0.85)';
              (e.currentTarget as HTMLElement).style.borderColor = '#2E2E44';
            }}
          >
            <ArrowLeft size={16} /> 返回编辑
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '10px 24px',
              borderRadius: 8,
              background: 'rgba(108, 99, 255, 0.85)',
              backdropFilter: 'blur(10px)',
              border: '1px solid #6C63FF',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 13,
              fontFamily: 'monospace',
              transition: 'all 0.3s ease-in-out',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
            }}
          >
            <Download size={16} /> 导出PNG序列
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: '#0A0A1A',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          cursor: canvasCursor,
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.5)',
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
      />

      <ToolPanel />
      <Timeline />

      <div
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          color: '#555577',
          fontSize: 10,
          fontFamily: 'monospace',
          textAlign: 'right',
          lineHeight: 1.8,
          zIndex: 10,
        }}
      >
        <div>缩放: {zoom.toFixed(1)}x</div>
        <div>光粒: {particles.length}</div>
        <div>关键帧: {keyframes.length}</div>
      </div>
    </div>
  );
}
