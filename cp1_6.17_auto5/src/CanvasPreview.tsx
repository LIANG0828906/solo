import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from './store';
import {
  drawCheckerboard,
  drawLayer,
  drawSelectionBox,
  getHandleAtPosition,
  HandlePosition,
  loadImage,
  clearFilterCache,
} from './utils/canvasUtils';

const CanvasPreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const frameCountRef = useRef<number>(0);
  const fpsUpdateTimeRef = useRef<number>(performance.now());

  const [canvasScale, setCanvasScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [currentHandle, setCurrentHandle] = useState<HandlePosition>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialLayerState, setInitialLayerState] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    rotation: number;
  } | null>(null);

  const layers = useStore((state) => state.layers);
  const selectedLayerId = useStore((state) => state.selectedLayerId);
  const canvas = useStore((state) => state.canvas);
  const fps = useStore((state) => state.fps);
  const updateLayer = useStore((state) => state.updateLayer);
  const selectLayer = useStore((state) => state.selectLayer);
  const setFps = useStore((state) => state.setFps);

  const sortedLayers = [...layers].sort((a, b) => a.zIndex - b.zIndex);
  const selectedLayer = layers.find((l) => l.id === selectedLayerId);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth - 40;
        const containerHeight = containerRef.current.clientHeight - 40;
        const maxCanvasWidth = Math.min(containerWidth, 900);
        const maxCanvasHeight = containerHeight;
        
        const scaleX = maxCanvasWidth / canvas.width;
        const scaleY = maxCanvasHeight / canvas.height;
        const newScale = Math.min(scaleX, scaleY, 1);
        
        setCanvasScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [canvas.width, canvas.height]);

  const render = useCallback(async () => {
    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const ctx = canvasEl.getContext('2d');
    if (!ctx) return;

    const displayWidth = canvas.width * canvasScale;
    const displayHeight = canvas.height * canvasScale;

    canvasEl.width = displayWidth;
    canvasEl.height = displayHeight;

    ctx.clearRect(0, 0, displayWidth, displayHeight);
    drawCheckerboard(ctx, displayWidth, displayHeight);

    for (const layer of sortedLayers) {
      await drawLayer(ctx, layer, canvasScale);
    }

    if (selectedLayer) {
      drawSelectionBox(ctx, selectedLayer, canvasScale);
    }
  }, [sortedLayers, selectedLayer, canvasScale, canvas.width, canvas.height]);

  useEffect(() => {
    const renderFrame = () => {
      render();

      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - fpsUpdateTimeRef.current;

      if (elapsed >= 500) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        console.log(`[Canvas FPS] ${currentFps}fps - Layers: ${sortedLayers.length}`);
        frameCountRef.current = 0;
        fpsUpdateTimeRef.current = now;
      }

      lastTimeRef.current = now;
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    fpsUpdateTimeRef.current = performance.now();
    frameCountRef.current = 0;
    animationFrameRef.current = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [render, setFps, sortedLayers.length]);

  useEffect(() => {
    if (selectedLayerId) {
      clearFilterCache(selectedLayerId);
    }
  }, [layers]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCanvasCoordinates(e);

    if (selectedLayer) {
      const handle = getHandleAtPosition(x, y, selectedLayer, canvasScale);
      if (handle) {
        setIsDragging(true);
        setCurrentHandle(handle);
        setDragStart({ x, y });
        setInitialLayerState({
          x: selectedLayer.x,
          y: selectedLayer.y,
          width: selectedLayer.width,
          height: selectedLayer.height,
          scale: selectedLayer.scale,
          rotation: selectedLayer.rotation,
        });
        return;
      }
    }

    for (let i = sortedLayers.length - 1; i >= 0; i--) {
      const layer = sortedLayers[i];
      const handle = getHandleAtPosition(x, y, layer, canvasScale);
      if (handle === 'move') {
        selectLayer(layer.id);
        setIsDragging(true);
        setCurrentHandle('move');
        setDragStart({ x, y });
        setInitialLayerState({
          x: layer.x,
          y: layer.y,
          width: layer.width,
          height: layer.height,
          scale: layer.scale,
          rotation: layer.rotation,
        });
        return;
      }
    }

    selectLayer(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedLayerId || !currentHandle || !initialLayerState) {
      const { x, y } = getCanvasCoordinates(e);
      if (selectedLayer) {
        const handle = getHandleAtPosition(x, y, selectedLayer, canvasScale);
        if (handle === 'rotate') {
          canvasRef.current!.style.cursor = 'grab';
        } else if (handle && handle !== 'move') {
          canvasRef.current!.style.cursor = `${handle}-resize`;
        } else if (handle === 'move') {
          canvasRef.current!.style.cursor = 'move';
        } else {
          canvasRef.current!.style.cursor = 'default';
        }
      }
      return;
    }

    const { x, y } = getCanvasCoordinates(e);
    const deltaX = (x - dragStart.x) / canvasScale;
    const deltaY = (y - dragStart.y) / canvasScale;

    if (currentHandle === 'move') {
      updateLayer(selectedLayerId, {
        x: initialLayerState.x + deltaX,
        y: initialLayerState.y + deltaY,
      });
    } else if (currentHandle === 'rotate') {
      const centerX = initialLayerState.x * canvasScale;
      const centerY = initialLayerState.y * canvasScale;
      const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;
      updateLayer(selectedLayerId, {
        rotation: Math.max(-90, Math.min(90, angle)),
      });
    } else {
      const aspectRatio = initialLayerState.width / initialLayerState.height;
      let newScale = initialLayerState.scale;
      
      switch (currentHandle) {
        case 'e':
          newScale = initialLayerState.scale + (deltaX / initialLayerState.width) * 2;
          break;
        case 'w':
          newScale = initialLayerState.scale - (deltaX / initialLayerState.width) * 2;
          break;
        case 's':
          newScale = initialLayerState.scale + (deltaY / initialLayerState.height) * 2;
          break;
        case 'n':
          newScale = initialLayerState.scale - (deltaY / initialLayerState.height) * 2;
          break;
        case 'se':
          newScale = initialLayerState.scale + ((deltaX / initialLayerState.width) + (deltaY / initialLayerState.height)) * 0.5;
          break;
        case 'nw':
          newScale = initialLayerState.scale - ((deltaX / initialLayerState.width) + (deltaY / initialLayerState.height)) * 0.5;
          break;
        case 'ne':
          newScale = initialLayerState.scale + ((deltaX / initialLayerState.width) - (deltaY / initialLayerState.height)) * 0.5;
          break;
        case 'sw':
          newScale = initialLayerState.scale + ((-deltaX / initialLayerState.width) + (deltaY / initialLayerState.height)) * 0.5;
          break;
      }
      
      newScale = Math.max(0.1, Math.min(5, newScale));
      clearFilterCache(selectedLayerId);
      updateLayer(selectedLayerId, {
        scale: newScale,
        width: initialLayerState.width,
        height: initialLayerState.width / aspectRatio,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setCurrentHandle(null);
    setInitialLayerState(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  };

  useEffect(() => {
    const preloadImages = async () => {
      for (const layer of layers) {
        if (layer.type === 'image' && layer.imageSrc) {
          try {
            await loadImage(layer.imageSrc);
          } catch (e) {
            console.error('Failed to preload image:', e);
          }
        }
      }
    };
    preloadImages();
  }, [layers]);

  const fpsColor = fps >= 40 ? '#4CAF50' : fps >= 25 ? '#FF9800' : '#F44336';

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center p-5 overflow-hidden relative"
      style={{ backgroundColor: '#F5F5F5' }}
    >
      <div className="relative">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            borderRadius: '4px',
          }}
        />
        
        <div
          className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#FFFFFF',
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: fpsColor }}
          />
          <span style={{ color: fpsColor, fontWeight: 700 }}>{fps}</span>
          <span style={{ opacity: 0.8 }}>FPS</span>
        </div>

        <div
          className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#FFFFFF',
          }}
        >
          {canvas.width} × {canvas.height}
        </div>
      </div>
    </div>
  );
};

export default CanvasPreview;
