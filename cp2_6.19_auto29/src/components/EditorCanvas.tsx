import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useEditorStore, Layer, TextLayer, DrawLayer, StickerLayer } from '../store/editorStore';
import { v4 as uuidv4 } from 'uuid';
import './EditorCanvas.css';

const CANVAS_SIZE = 300;

interface DragState {
  isDragging: boolean;
  startX: number;
  startY: number;
  type: 'canvas' | 'layer' | 'resize' | 'rotate' | 'text';
  layerId?: string;
  originalX?: number;
  originalY?: number;
  originalScale?: number;
  originalRotation?: number;
  originalPoints?: { x: number; y: number }[];
}

const EditorCanvas: React.FC = () => {
  const {
    currentTool,
    layers,
    selectedLayerId,
    canvasScale,
    canvasOffset,
    brushSize,
    textColor,
    fontSize,
    fontFamily,
    currentSticker,
    highlightedLayerId,
    addLayer,
    updateLayer,
    setSelectedLayerId,
    setCanvasScale,
    setCanvasOffset,
  } = useEditorStore();

  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startX: 0,
    startY: 0,
    type: 'canvas',
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawPoints, setCurrentDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [bounceLayerId, setBounceLayerId] = useState<string | null>(null);

  const getCanvasPoint = useCallback(
    (clientX: number, clientY: number) => {
      if (!canvasRef.current) return { x: 0, y: 0 };
      const rect = canvasRef.current.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const x = (clientX - rect.left - centerX - canvasOffset.x) / canvasScale;
      const y = (clientY - rect.top - centerY - canvasOffset.y) / canvasScale;
      return { x, y };
    },
    [canvasOffset, canvasScale]
  );

  const handleCanvasWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      setCanvasScale(canvasScale * delta);
    },
    [canvasScale, setCanvasScale]
  );

  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.target !== canvasRef.current && !(e.target as HTMLElement).classList.contains('canvas-content')) {
        return;
      }

      const point = getCanvasPoint(e.clientX, e.clientY);

      if (currentTool === 'select') {
        setSelectedLayerId(null);
        setDragState({
          isDragging: true,
          startX: e.clientX,
          startY: e.clientY,
          type: 'canvas',
          originalX: canvasOffset.x,
          originalY: canvasOffset.y,
        });
      } else if (currentTool === 'text') {
        const newTextLayer: TextLayer = {
          id: uuidv4(),
          type: 'text',
          name: `文字 ${layers.filter((l) => l.type === 'text').length + 1}`,
          x: point.x,
          y: point.y,
          rotation: 0,
          scale: 1,
          visible: true,
          text: '',
          fontSize,
          fontFamily,
          color: textColor,
        };
        addLayer(newTextLayer);
        setEditingTextId(newTextLayer.id);
        setBounceLayerId(newTextLayer.id);
        setTimeout(() => setBounceLayerId(null), 400);
      } else if (currentTool === 'brush') {
        setIsDrawing(true);
        setCurrentDrawPoints([point]);
      } else if (currentTool === 'sticker') {
        const newStickerLayer: StickerLayer = {
          id: uuidv4(),
          type: 'sticker',
          name: `贴纸 ${layers.filter((l) => l.type === 'sticker').length + 1}`,
          x: point.x,
          y: point.y,
          rotation: 0,
          scale: 1,
          visible: true,
          emoji: currentSticker,
          size: 48,
        };
        addLayer(newStickerLayer);
        setBounceLayerId(newStickerLayer.id);
        setTimeout(() => setBounceLayerId(null), 400);
      }
    },
    [
      currentTool,
      getCanvasPoint,
      canvasOffset,
      setSelectedLayerId,
      setCanvasOffset,
      fontSize,
      fontFamily,
      textColor,
      currentSticker,
      addLayer,
      layers,
    ]
  );

  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDrawing) {
        const point = getCanvasPoint(e.clientX, e.clientY);
        setCurrentDrawPoints((prev) => [...prev, point]);
        return;
      }

      if (!dragState.isDragging) return;

      const deltaX = e.clientX - dragState.startX;
      const deltaY = e.clientY - dragState.startY;

      if (dragState.type === 'canvas') {
        setCanvasOffset({
          x: (dragState.originalX || 0) + deltaX,
          y: (dragState.originalY || 0) + deltaY,
        });
      } else if (dragState.type === 'layer' && dragState.layerId) {
        updateLayer(dragState.layerId, {
          x: (dragState.originalX || 0) + deltaX / canvasScale,
          y: (dragState.originalY || 0) + deltaY / canvasScale,
        });
      } else if (dragState.type === 'resize' && dragState.layerId) {
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const newScale = (dragState.originalScale || 1) * (1 + distance / 200);
        updateLayer(dragState.layerId, {
          scale: Math.max(0.1, Math.min(5, newScale)),
        });
      } else if (dragState.type === 'rotate' && dragState.layerId) {
        const layer = layers.find((l) => l.id === dragState.layerId);
        if (layer) {
          const canvasRect = canvasRef.current?.getBoundingClientRect();
          if (canvasRect) {
            const centerX = canvasRect.width / 2 + canvasOffset.x + layer.x * canvasScale;
            const centerY = canvasRect.height / 2 + canvasOffset.y + layer.y * canvasScale;
            const angle = Math.atan2(
              e.clientY - canvasRect.top - centerY,
              e.clientX - canvasRect.left - centerX
            );
            updateLayer(dragState.layerId, {
              rotation: (angle * 180) / Math.PI + 90,
            });
          }
        }
      }
    },
    [
      dragState,
      isDrawing,
      getCanvasPoint,
      setCanvasOffset,
      updateLayer,
      canvasScale,
      canvasOffset,
      layers,
    ]
  );

  const handleCanvasMouseUp = useCallback(() => {
    if (isDrawing && currentDrawPoints.length > 1) {
      const newDrawLayer: DrawLayer = {
        id: uuidv4(),
        type: 'draw',
        name: `涂鸦 ${layers.filter((l) => l.type === 'draw').length + 1}`,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        visible: true,
        points: currentDrawPoints,
        strokeWidth: brushSize,
        color: textColor,
      };
      addLayer(newDrawLayer);
    }
    setIsDrawing(false);
    setCurrentDrawPoints([]);
    setDragState({ isDragging: false, startX: 0, startY: 0, type: 'canvas' });
  }, [isDrawing, currentDrawPoints, brushSize, textColor, addLayer, layers]);

  const handleLayerMouseDown = useCallback(
    (e: React.MouseEvent, layerId: string) => {
      e.stopPropagation();
      if (currentTool !== 'select') return;

      setSelectedLayerId(layerId);
      const layer = layers.find((l) => l.id === layerId);
      if (!layer) return;

      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        type: 'layer',
        layerId,
        originalX: layer.x,
        originalY: layer.y,
      });
    },
    [currentTool, layers, setSelectedLayerId]
  );

  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent, layerId: string) => {
      e.stopPropagation();
      if (currentTool !== 'select') return;

      const layer = layers.find((l) => l.id === layerId);
      if (!layer) return;

      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        type: 'resize',
        layerId,
        originalScale: layer.scale,
      });
    },
    [currentTool, layers]
  );

  const handleRotateMouseDown = useCallback(
    (e: React.MouseEvent, layerId: string) => {
      e.stopPropagation();
      if (currentTool !== 'select') return;

      const layer = layers.find((l) => l.id === layerId);
      if (!layer) return;

      setDragState({
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        type: 'rotate',
        layerId,
        originalRotation: layer.rotation,
      });
    },
    [currentTool, layers]
  );

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(200 / img.width, 200 / img.height);
        const newImageLayer = {
          id: uuidv4(),
          type: 'image' as const,
          name: `底图 ${layers.filter((l) => l.type === 'image').length + 1}`,
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          visible: true,
          src: event.target?.result as string,
          width: img.width * scale,
          height: img.height * scale,
        };
        addLayer(newImageLayer);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleTextChange = (id: string, newText: string) => {
    if (newText.length <= 20) {
      updateLayer(id, { text: newText });
    }
  };

  const handleTextBlur = () => {
    setEditingTextId(null);
  };

  const handleTextKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setEditingTextId(null);
    }
  };

  const renderLayer = (layer: Layer) => {
    const isSelected = selectedLayerId === layer.id;
    const isHighlighted = highlightedLayerId === layer.id;
    const isBouncing = bounceLayerId === layer.id;
    const isEditing = editingTextId === layer.id;

    const transform = `translate(-50%, -50%) translate(${layer.x}px, ${layer.y}px) rotate(${layer.rotation}deg) scale(${layer.scale})`;

    const commonClasses = `layer-item ${isSelected ? 'selected' : ''} ${isHighlighted ? 'highlighted' : ''} ${isBouncing ? 'bounce' : ''}`;

    if (layer.type === 'image') {
      return (
        <div
          key={layer.id}
          className={`${commonClasses} layer-image`}
          style={{
            transform,
            width: layer.width,
            height: layer.height,
          }}
          onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
        >
          <img src={layer.src} alt="" draggable={false} />
          {isSelected && currentTool === 'select' && (
            <>
              <div
                className="resize-handle"
                onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
              />
              <div
                className="rotate-handle"
                onMouseDown={(e) => handleRotateMouseDown(e, layer.id)}
              />
            </>
          )}
        </div>
      );
    }

    if (layer.type === 'text') {
      return (
        <div
          key={layer.id}
          className={`${commonClasses} layer-text ${isEditing ? 'editing' : ''}`}
          style={{
            transform,
            fontSize: layer.fontSize,
            fontFamily: layer.fontFamily,
            color: layer.color,
          }}
          onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
          onDoubleClick={() => setEditingTextId(layer.id)}
        >
          {isEditing ? (
            <input
              type="text"
              value={layer.text}
              onChange={(e) => handleTextChange(layer.id, e.target.value)}
              onBlur={handleTextBlur}
              onKeyDown={handleTextKeyDown}
              autoFocus
              className="text-input"
              style={{
                fontSize: layer.fontSize,
                fontFamily: layer.fontFamily,
                color: layer.color,
              }}
              maxLength={20}
            />
          ) : (
            <span className="text-content">{layer.text || '双击编辑文字'}</span>
          )}
          {isSelected && currentTool === 'select' && !isEditing && (
            <>
              <div
                className="resize-handle"
                onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
              />
              <div
                className="rotate-handle"
                onMouseDown={(e) => handleRotateMouseDown(e, layer.id)}
              />
            </>
          )}
        </div>
      );
    }

    if (layer.type === 'draw') {
      if (layer.points.length < 2) return null;

      const minX = Math.min(...layer.points.map((p) => p.x));
      const minY = Math.min(...layer.points.map((p) => p.y));
      const maxX = Math.max(...layer.points.map((p) => p.x));
      const maxY = Math.max(...layer.points.map((p) => p.y));
      const width = maxX - minX + 20;
      const height = maxY - minY + 20;

      const pathData = layer.points
        .map((p, i) => {
          const x = p.x - minX + 10;
          const y = p.y - minY + 10;
          return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(' ');

      return (
        <div
          key={layer.id}
          className={`${commonClasses} layer-draw`}
          style={{
            transform: `translate(-50%, -50%) translate(${layer.x + (minX + maxX) / 2}px, ${layer.y + (minY + maxY) / 2}px) rotate(${layer.rotation}deg) scale(${layer.scale})`,
          }}
          onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
        >
          <svg width={width} height={height} style={{ overflow: 'visible' }}>
            <path
              d={pathData}
              stroke={layer.color}
              strokeWidth={layer.strokeWidth}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {isSelected && currentTool === 'select' && (
            <>
              <div
                className="resize-handle"
                onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
              />
              <div
                className="rotate-handle"
                onMouseDown={(e) => handleRotateMouseDown(e, layer.id)}
              />
            </>
          )}
        </div>
      );
    }

    if (layer.type === 'sticker') {
      return (
        <div
          key={layer.id}
          className={`${commonClasses} layer-sticker`}
          style={{
            transform,
            fontSize: layer.size,
          }}
          onMouseDown={(e) => handleLayerMouseDown(e, layer.id)}
        >
          <span className="sticker-emoji">{layer.emoji}</span>
          {isSelected && currentTool === 'select' && (
            <>
              <div
                className="resize-handle"
                onMouseDown={(e) => handleResizeMouseDown(e, layer.id)}
              />
              <div
                className="rotate-handle"
                onMouseDown={(e) => handleRotateMouseDown(e, layer.id)}
              />
            </>
          )}
        </div>
      );
    }

    return null;
  };

  const renderDrawingPath = () => {
    if (!isDrawing || currentDrawPoints.length < 2) return null;

    const pathData = currentDrawPoints
      .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
      .join(' ');

    return (
      <svg className="drawing-preview" style={{ overflow: 'visible' }}>
        <path
          d={pathData}
          stroke={textColor}
          strokeWidth={brushSize}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDrawing && currentDrawPoints.length > 1) {
        const newDrawLayer: DrawLayer = {
          id: uuidv4(),
          type: 'draw',
          name: `涂鸦 ${layers.filter((l) => l.type === 'draw').length + 1}`,
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          visible: true,
          points: currentDrawPoints,
          strokeWidth: brushSize,
          color: textColor,
        };
        addLayer(newDrawLayer);
      }
      setIsDrawing(false);
      setCurrentDrawPoints([]);
      setDragState({ isDragging: false, startX: 0, startY: 0, type: 'canvas' });
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, [isDrawing, currentDrawPoints, brushSize, textColor, addLayer, layers]);

  return (
    <div className="canvas-wrapper">
      <div
        ref={canvasRef}
        className={`editor-canvas ${currentTool === 'text' ? 'cursor-text' : ''} ${currentTool === 'sticker' ? 'cursor-copy' : ''} ${currentTool === 'brush' ? 'cursor-crosshair' : ''}`}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onWheel={handleCanvasWheel}
      >
        <div
          className="canvas-content"
          style={{
            transform: `scale(${canvasScale}) translate(${canvasOffset.x / canvasScale}px, ${canvasOffset.y / canvasScale}px)`,
          }}
        >
          <div className="canvas-board" style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}>
            {layers.map((layer) => layer.visible && renderLayer(layer))}
            {renderDrawingPath()}
          </div>
        </div>
      </div>

      <button
        className="upload-btn"
        onClick={() => fileInputRef.current?.click()}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        上传图片
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden-input"
      />

      <div className="zoom-controls">
        <button onClick={() => setCanvasScale(canvasScale * 0.8)} className="zoom-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <span className="zoom-level">{Math.round(canvasScale * 100)}%</span>
        <button onClick={() => setCanvasScale(canvasScale * 1.2)} className="zoom-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
        <button
          onClick={() => {
            setCanvasScale(1);
            setCanvasOffset({ x: 0, y: 0 });
          }}
          className="zoom-btn reset-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default EditorCanvas;
