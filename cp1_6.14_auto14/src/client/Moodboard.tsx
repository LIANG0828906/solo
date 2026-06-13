import React, { useState, useEffect, useRef, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Project, CanvasElement, ColorSwatch, ToolType } from '../shared/types';

interface MoodboardProps {
  project: Project;
  elements: CanvasElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddElements: (elements: CanvasElement[]) => void;
  onImagesUpload: (files: FileList) => void;
  onColorExtracted: (colors: ColorSwatch[]) => void;
  onSave: () => void;
  onExportHtml: () => void;
}

const Moodboard: React.FC<MoodboardProps> = ({
  project,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onAddElements,
  onImagesUpload,
  onColorExtracted,
  onSave,
  onExportHtml
}) => {
  const [tool, setTool] = useState<ToolType>('select');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [previewTooltip, setPreviewTooltip] = useState<{ element: CanvasElement; x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [isRotating, setIsRotating] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<{ x: number; y: number }[]>([]);
  const [drawColor, setDrawColor] = useState('#000000');
  const [drawSize, setDrawSize] = useState(3);
  const [extractingImage, setExtractingImage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const drawingCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragAnimationRef = useRef<number | null>(null);
  const targetPositionRef = useRef<{ x: number; y: number } | null>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./ColorExtractor.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const colors = e.data as ColorSwatch[];
      onColorExtracted(colors);
      setExtractingImage(null);
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, [onColorExtracted]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        togglePreviewMode();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && !isPreviewMode && document.activeElement?.tagName !== 'INPUT') {
          onDeleteElement(selectedElementId);
        }
      }
      if (e.key === 'Escape') {
        onSelectElement(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, isPreviewMode, onDeleteElement, onSelectElement]);

  const togglePreviewMode = () => {
    setIsFading(true);
    setTimeout(() => {
      setIsPreviewMode(prev => !prev);
      setIsFading(false);
      setPreviewTooltip(null);
      onSelectElement(null);
    }, 150);
  };

  const createRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = e.currentTarget;
    const ripple = document.createElement('span');
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    
    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';
    ripple.className = 'ripple';
    
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const extractColors = async (imageSrc: string) => {
    if (!workerRef.current) return;
    
    setExtractingImage(imageSrc);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        workerRef.current!.postMessage({ imageData, colorCount: 6 });
      }
    };
    
    img.src = imageSrc;
  };

  const handleElementMouseDown = (e: React.MouseEvent, element: CanvasElement) => {
    if (isPreviewMode) return;
    if (tool !== 'select') return;
    
    e.stopPropagation();
    onSelectElement(element.id);
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    setIsDragging(true);
    targetPositionRef.current = { x: element.x, y: element.y };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!selectedElementId) return;

    if (isDragging && targetPositionRef.current) {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const targetX = e.clientX - canvasRect.left - dragOffset.x;
      const targetY = e.clientY - canvasRect.top - dragOffset.y;

      targetPositionRef.current = { x: targetX, y: targetY };

      if (!dragAnimationRef.current) {
        const animate = () => {
          if (!targetPositionRef.current || !selectedElementId) {
            dragAnimationRef.current = null;
            return;
          }

          const element = elements.find(el => el.id === selectedElementId);
          if (!element) {
            dragAnimationRef.current = null;
            return;
          }

          const dx = targetPositionRef.current.x - element.x;
          const dy = targetPositionRef.current.y - element.y;

          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) {
            onUpdateElement(selectedElementId, {
              x: targetPositionRef.current.x,
              y: targetPositionRef.current.y
            });
            dragAnimationRef.current = null;
            return;
          }

          const stiffness = 0.25;
          const damping = 0.85;
          const newX = element.x + dx * stiffness;
          const newY = element.y + dy * stiffness;

          onUpdateElement(selectedElementId, { x: newX, y: newY });
          dragAnimationRef.current = requestAnimationFrame(animate);
        };
        dragAnimationRef.current = requestAnimationFrame(animate);
      }
    }

    if (isResizing && selectedElementId) {
      const element = elements.find(el => el.id === selectedElementId);
      if (!element || element.type === 'text') return;

      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const mouseX = e.clientX - canvasRect.left;
      const mouseY = e.clientY - canvasRect.top;

      let newWidth = element.width;
      let newHeight = element.height;
      let newX = element.x;
      let newY = element.y;

      const aspectRatio = element.width / element.height;

      if (resizeHandle.includes('e')) {
        newWidth = Math.max(50, mouseX - element.x);
        if (resizeHandle.includes('s')) {
          newHeight = newWidth / aspectRatio;
        }
      }
      if (resizeHandle.includes('w')) {
        newWidth = Math.max(50, element.x + element.width - mouseX);
        newX = element.x + element.width - newWidth;
        if (resizeHandle.includes('s')) {
          newHeight = newWidth / aspectRatio;
        }
      }
      if (resizeHandle.includes('s') && !resizeHandle.includes('e') && !resizeHandle.includes('w')) {
        newHeight = Math.max(50, mouseY - element.y);
        newWidth = newHeight * aspectRatio;
      }
      if (resizeHandle.includes('n') && !resizeHandle.includes('e') && !resizeHandle.includes('w')) {
        newHeight = Math.max(50, element.y + element.height - mouseY);
        newY = element.y + element.height - newHeight;
        newWidth = newHeight * aspectRatio;
      }

      onUpdateElement(selectedElementId, {
        width: newWidth,
        height: newHeight,
        x: newX,
        y: newY
      });
    }

    if (isRotating && selectedElementId) {
      const element = elements.find(el => el.id === selectedElementId);
      if (!element) return;

      const centerX = element.x + element.width / 2;
      const centerY = element.y + element.height / 2;
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const mouseX = e.clientX - canvasRect.left;
      const mouseY = e.clientY - canvasRect.top;

      const angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI) + 90;
      onUpdateElement(selectedElementId, { rotation: angle });
    }

    if (isDrawing && drawingCanvasRef.current) {
      const canvas = drawingCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const canvasRect = canvas.getBoundingClientRect();
      
      const x = e.clientX - canvasRect.left;
      const y = e.clientY - canvasRect.top;

      setDrawPoints(prev => [...prev, { x, y }]);

      if (ctx && drawPoints.length > 0) {
        const lastPoint = drawPoints[drawPoints.length - 1];
        
        ctx.beginPath();
        ctx.moveTo(lastPoint.x, lastPoint.y);
        ctx.lineTo(x, y);
        ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : drawColor;
        ctx.lineWidth = tool === 'eraser' ? drawSize * 3 : drawSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
        ctx.stroke();
      }
    }
  }, [isDragging, isResizing, isRotating, isDrawing, dragOffset, resizeHandle, selectedElementId, elements, drawPoints, drawColor, drawSize, tool, onUpdateElement]);

  const handleMouseUp = useCallback(() => {
    if (dragAnimationRef.current) {
      cancelAnimationFrame(dragAnimationRef.current);
      dragAnimationRef.current = null;
    }
    
    setIsDragging(false);
    setIsResizing(false);
    setIsRotating(false);
    
    if (isDrawing && drawPoints.length > 2 && drawingCanvasRef.current) {
      const canvas = drawingCanvasRef.current;
      const dataUrl = canvas.toDataURL();
      
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const point of drawPoints) {
        minX = Math.min(minX, point.x);
        minY = Math.min(minY, point.y);
        maxX = Math.max(maxX, point.x);
        maxY = Math.max(maxY, point.y);
      }
      
      const padding = 10;
      minX -= padding;
      minY -= padding;
      maxX += padding;
      maxY += padding;
      
      const newDrawing: CanvasElement = {
        id: uuidv4(),
        type: 'drawing',
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY,
        dataUrl,
        name: '涂鸦'
      };
      
      onAddElements([newDrawing]);
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setDrawPoints([]);
    }
    
    setIsDrawing(false);
    setDrawPoints([]);
  }, [isDrawing, drawPoints, onAddElements]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  const handleResizeStart = (e: React.MouseEvent, handle: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeHandle(handle);
  };

  const handleRotateStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsRotating(true);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    if (e.target === canvasRef.current || (e.target as HTMLElement).classList.contains('canvas')) {
      onSelectElement(null);
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isPreviewMode) return;
    
    if (tool === 'text') {
      const canvasRect = canvasRef.current?.getBoundingClientRect();
      if (!canvasRect) return;

      const newText: CanvasElement = {
        id: uuidv4(),
        type: 'text',
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top,
        text: '双击编辑文字',
        fontSize: 16,
        fontFamily: 'sans-serif',
        color: '#333333',
        name: '文字标签'
      };

      onAddElements([newText]);
      setTool('select');
      onSelectElement(newText.id);
    }

    if ((tool === 'draw' || tool === 'eraser') && drawingCanvasRef.current) {
      const canvas = drawingCanvasRef.current;
      const canvasRect = canvas.getBoundingClientRect();
      
      setIsDrawing(true);
      setDrawPoints([{
        x: e.clientX - canvasRect.left,
        y: e.clientY - canvasRect.top
      }]);
    }
  };

  const handleDoubleClick = (e: React.MouseEvent, element: CanvasElement) => {
    if (isPreviewMode) return;
    if (element.type === 'text') {
      const newText = prompt('编辑文字:', element.text);
      if (newText !== null) {
        onUpdateElement(element.id, { text: newText });
      }
    }
    if (element.type === 'image' && !extractingImage) {
      extractColors(element.src);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent, element: CanvasElement) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPreviewTooltip({
      element,
      x: rect.left + rect.width / 2,
      y: rect.top - 10
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onImagesUpload(e.target.files);
      e.target.value = '';
    }
  };

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedElementId === element.id;
    const isImage = element.type === 'image';
    const isText = element.type === 'text';
    const isDrawing = element.type === 'drawing';

    const commonStyle: React.CSSProperties = {
      left: element.x,
      top: element.y,
      transform: `rotate(${(element as any).rotation || 0}deg)`,
      width: isText ? 'auto' : element.width,
      height: isText ? 'auto' : element.height
    };

    return (
      <div
        key={element.id}
        className={`canvas-element ${isSelected ? 'selected' : ''} ${isDragging && isSelected ? 'dragging' : ''}`}
        style={commonStyle}
        onMouseDown={e => handleElementMouseDown(e, element)}
        onDoubleClick={e => handleDoubleClick(e, element)}
        onClick={isPreviewMode ? e => handlePreviewClick(e, element) : undefined}
      >
        {isImage && (
          <img
            src={element.src}
            alt={element.name}
            className="canvas-element-image"
            draggable={false}
          />
        )}
        {isText && (
          <div
            className="canvas-element-text"
            style={{
              fontSize: element.fontSize,
              fontFamily: element.fontFamily,
              color: element.color
            }}
          >
            {element.text}
          </div>
        )}
        {isDrawing && (
          <img
            src={element.dataUrl}
            alt={element.name}
            className="canvas-element-drawing"
            draggable={false}
          />
        )}

        {isSelected && !isPreviewMode && tool === 'select' && (
          <>
            {!isText && (
              <>
                <div className="resize-handle nw" onMouseDown={e => handleResizeStart(e, 'nw')} />
                <div className="resize-handle ne" onMouseDown={e => handleResizeStart(e, 'ne')} />
                <div className="resize-handle sw" onMouseDown={e => handleResizeStart(e, 'sw')} />
                <div className="resize-handle se" onMouseDown={e => handleResizeStart(e, 'se')} />
                <div className="rotate-handle" onMouseDown={handleRotateStart}>↻</div>
              </>
            )}
          </>
        )}
      </div>
    );
  };

  const renderPreviewTooltip = () => {
    if (!previewTooltip) return null;

    return (
      <div
        className="element-tooltip"
        style={{
          left: previewTooltip.x,
          top: previewTooltip.y,
          transform: 'translate(-50%, -100%)'
        }}
      >
        <h4>{previewTooltip.element.name}</h4>
        {(previewTooltip.element as any).note && (
          <p>{(previewTooltip.element as any).note}</p>
        )}
        {previewTooltip.element.type === 'text' && (
          <p>内容: {(previewTooltip.element as any).text}</p>
        )}
      </div>
    );
  };

  if (isPreviewMode) {
    return (
      <div className={`preview-mode ${isFading ? 'fade-out' : ''}`} onClick={() => setPreviewTooltip(null)}>
        <div
          className="preview-canvas"
          style={{
            width: Math.min(window.innerWidth * 0.8, 1200),
            height: Math.min(window.innerHeight * 0.8, 900),
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {elements.map(el => {
            const scale = Math.min(1200 / 2000, 900 / 1500);
            const scaled: React.CSSProperties = {
              position: 'absolute',
              left: el.x * scale,
              top: el.y * scale,
              transform: `rotate(${(el as any).rotation || 0}deg)`,
              transformOrigin: 'center center'
            };

            if (el.type === 'image') {
              return (
                <div
                  key={el.id}
                  style={{
                    ...scaled,
                    width: el.width * scale,
                    height: el.height * scale
                  }}
                  onClick={e => handlePreviewClick(e, el)}
                >
                  <img src={el.src} alt={el.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              );
            }
            if (el.type === 'text') {
              return (
                <div
                  key={el.id}
                  style={{
                    ...scaled,
                    fontSize: el.fontSize * scale,
                    fontFamily: el.fontFamily,
                    color: el.color
                  }}
                  onClick={e => handlePreviewClick(e, el)}
                >
                  {el.text}
                </div>
              );
            }
            if (el.type === 'drawing') {
              return (
                <div
                  key={el.id}
                  style={{
                    ...scaled,
                    width: el.width * scale,
                    height: el.height * scale
                  }}
                  onClick={e => handlePreviewClick(e, el)}
                >
                  <img src={el.dataUrl} alt={el.name} style={{ width: '100%', height: '100%' }} />
                </div>
              );
            }
            return null;
          })}
        </div>
        {renderPreviewTooltip()}
        <div className="preview-hint">
          按空格键退出预览模式 | 点击元素查看详情
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="toolbar">
        <button
          className={`tool-btn ${tool === 'select' ? 'active' : ''}`}
          onClick={() => setTool('select')}
          title="选择工具 (V)"
        >
          👆
        </button>
        <button
          className={`tool-btn ${tool === 'text' ? 'active' : ''}`}
          onClick={() => setTool('text')}
          title="文字工具 (T)"
        >
          T
        </button>
        <button
          className={`tool-btn ${tool === 'draw' ? 'active' : ''}`}
          onClick={() => setTool('draw')}
          title="画笔工具 (B)"
        >
          ✏️
        </button>
        <button
          className={`tool-btn ${tool === 'eraser' ? 'active' : ''}`}
          onClick={() => setTool('eraser')}
          title="橡皮擦 (E)"
        >
          🧽
        </button>

        {(tool === 'draw' || tool === 'eraser') && (
          <>
            <div style={{ width: '1px', height: '24px', background: '#e2e8f0', margin: '0 8px' }} />
            <input
              type="color"
              value={drawColor}
              onChange={e => setDrawColor(e.target.value)}
              style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              disabled={tool === 'eraser'}
            />
            <input
              type="range"
              min="1"
              max="20"
              value={drawSize}
              onChange={e => setDrawSize(Number(e.target.value))}
              style={{ width: '80px' }}
            />
            <span style={{ fontSize: '12px', color: '#718096' }}>{drawSize}px</span>
          </>
        )}

        <div className="spacer" />

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="file-input"
          onChange={handleFileUpload}
        />
        <button
          className="secondary-btn"
          onClick={() => fileInputRef.current?.click()}
        >
          📷 上传图片
        </button>
        <button
          className="secondary-btn"
          onClick={onExportHtml}
        >
          📄 导出HTML
        </button>
        <button
          className="secondary-btn"
          onClick={togglePreviewMode}
        >
          👁️ 预览
        </button>
        <button
          className="primary-btn"
          onClick={(e) => {
            createRipple(e);
            onSave();
          }}
        >
          💾 保存
        </button>
      </div>

      <div className="canvas-container">
        <div
          ref={canvasRef}
          className="canvas"
          onClick={handleCanvasClick}
          onMouseDown={handleCanvasMouseDown}
        >
          {elements.map(renderElement)}

          {(tool === 'draw' || tool === 'eraser') && (
            <canvas
              ref={drawingCanvasRef}
              className="drawing-canvas"
              width={2000}
              height={1500}
            />
          )}
        </div>
      </div>

      {extractingImage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          fontSize: '14px',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{
            width: '20px',
            height: '20px',
            border: '2px solid #4A90D9',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite'
          }} />
          正在提取色板...
        </div>
      )}
    </>
  );
};

export default Moodboard;
