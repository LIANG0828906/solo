import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useStore } from './store';
import {
  drawCheckerboard,
  drawLayer,
  drawSelectionBox,
  getHandleAtPosition,
  HandlePosition,
  loadImage,
} from './utils/canvasUtils';

const CanvasPreview: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>(0);
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
  const updateLayer = useStore((state) => state.updateLayer);
  const selectLayer = useStore((state) => state.selectLayer);

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
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };
    animationFrameRef.current = requestAnimationFrame(renderFrame);
    return () => cancelAnimationFrame(animationFrameRef.current);
  }, [render]);

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

  return (
    <div
      ref={containerRef}
      className="flex-1 flex items-center justify-center p-5 overflow-hidden"
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
      </div>
    </div>
  );
};

export default CanvasPreview;
