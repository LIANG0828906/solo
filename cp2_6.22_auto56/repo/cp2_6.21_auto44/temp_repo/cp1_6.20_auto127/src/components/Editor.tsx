import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { CanvasElement, GuideLines } from '../types';
import { calculateSnapGuidelines } from '../utils/snapGuide';
import { generateHTML, downloadHTML } from '../utils/exportHtml';
import PropertyPanel from './PropertyPanel';
import './Editor.css';

interface DraggableElementProps {
  element: CanvasElement;
  isSelected: boolean;
  scale: number;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent, element: CanvasElement) => void;
  onResizeStart: (e: React.MouseEvent, element: CanvasElement) => void;
}

function DraggableElement({
  element,
  isSelected,
  scale,
  onSelect,
  onDragStart,
  onResizeStart,
}: DraggableElementProps) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
    onDragStart(e, element);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onResizeStart(e, element);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: `${element.x}px`,
    top: `${element.y}px`,
    width: `${element.width}px`,
    height: `${element.height}px`,
    cursor: 'move',
    userSelect: 'none',
    boxSizing: 'border-box',
  };

  const renderElementContent = () => {
    switch (element.type) {
      case 'image': {
        const imgEl = element as any;
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: imgEl.backgroundColor || '#e0e0e0',
              borderRadius: `${imgEl.borderRadius || 0}px`,
              backgroundImage: `radial-gradient(circle, #bbb 1.5px, transparent 1.5px)`,
              backgroundSize: '10px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: '14px',
              overflow: 'hidden',
            }}
          >
            <span style={{ pointerEvents: 'none' }}>图片占位</span>
          </div>
        );
      }
      case 'text': {
        const txtEl = element as any;
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              fontSize: `${txtEl.fontSize}px`,
              fontFamily: txtEl.fontFamily,
              color: txtEl.color,
              fontWeight: txtEl.fontWeight,
              textAlign: txtEl.textAlign,
              lineHeight: txtEl.lineHeight,
              border: '1px dashed #ccc',
              padding: '4px',
              boxSizing: 'border-box',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent:
                txtEl.textAlign === 'center'
                  ? 'center'
                  : txtEl.textAlign === 'right'
                  ? 'flex-end'
                  : 'flex-start',
            }}
          >
            {txtEl.content}
          </div>
        );
      }
      case 'button': {
        const btnEl = element as any;
        return (
          <button
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: btnEl.backgroundColor,
              color: btnEl.textColor,
              fontSize: `${btnEl.fontSize}px`,
              borderRadius: `${btnEl.borderRadius}px`,
              border: `${btnEl.borderWidth}px solid ${btnEl.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 500,
              cursor: 'move',
            }}
          >
            {btnEl.text}
          </button>
        );
      }
      case 'divider': {
        const divEl = element as any;
        return (
          <div
            style={{
              width: '100%',
              height: '100%',
              borderTop: `${divEl.thickness}px ${divEl.style} ${divEl.color}`,
              position: 'relative',
              top: '50%',
              transform: 'translateY(-50%)',
            }}
          />
        );
      }
      default:
        return null;
    }
  };

  return (
    <div
      className={`canvas-element ${isSelected ? 'selected' : ''}`}
      style={style}
      onMouseDown={handleMouseDown}
    >
      {renderElementContent()}
      {isSelected && (
        <>
          <div className="resize-handle resize-handle-nw" />
          <div className="resize-handle resize-handle-ne" />
          <div className="resize-handle resize-handle-sw" />
          <div
            className="resize-handle resize-handle-se"
            onMouseDown={handleResizeMouseDown}
          />
        </>
      )}
    </div>
  );
}

function GuideLinesOverlay({ guidelines, canvasWidth, canvasHeight }: {
  guidelines: GuideLines;
  canvasWidth: number;
  canvasHeight: number;
}) {
  return (
    <svg
      className="guidelines-overlay"
      width={canvasWidth}
      height={canvasHeight}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 100,
      }}
    >
      {guidelines.vertical.map((x, i) => (
        <line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={canvasHeight}
          stroke="#3B82F6"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      ))}
      {guidelines.horizontal.map((y, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={canvasWidth}
          y2={y}
          stroke="#3B82F6"
          strokeWidth="1"
          strokeDasharray="4,4"
        />
      ))}
    </svg>
  );
}

export default function Editor() {
  const {
    currentElements,
    setCurrentElements,
    selectedElementId,
    setSelectedElementId,
    selectedTemplate,
    saveVersion,
    setView,
    project,
  } = useApp();

  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [elementStartPos, setElementStartPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [guidelines, setGuidelines] = useState<GuideLines>({ vertical: [], horizontal: [] });
  const [scale, setScale] = useState(1);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const canvasWidth = selectedTemplate?.canvasWidth || 800;
  const canvasHeight = selectedTemplate?.canvasHeight || 600;

  const updateElement = useCallback((id: string, updates: Partial<CanvasElement>) => {
    setCurrentElements(
      currentElements.map((el) =>
        el.id === id ? { ...el, ...updates } as CanvasElement : el
      )
    );
  }, [currentElements, setCurrentElements]);

  const handleSelectElement = useCallback((id: string) => {
    setSelectedElementId(id);
  }, [setSelectedElementId]);

  const handleCanvasClick = useCallback(() => {
    setSelectedElementId(null);
  }, [setSelectedElementId]);

  const handleDragStart = useCallback((e: React.MouseEvent, element: CanvasElement) => {
    setIsDragging(true);
    setDraggedElementId(element.id);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setElementStartPos({ x: element.x, y: element.y, width: element.width, height: element.height });
  }, []);

  const handleResizeStart = useCallback((e: React.MouseEvent, element: CanvasElement) => {
    setIsResizing(true);
    setDraggedElementId(element.id);
    setDragStartPos({ x: e.clientX, y: e.clientY });
    setElementStartPos({ x: element.x, y: element.y, width: element.width, height: element.height });
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggedElementId) return;

      const deltaX = (e.clientX - dragStartPos.x) / scale;
      const deltaY = (e.clientY - dragStartPos.y) / scale;

      if (isDragging) {
        const newX = elementStartPos.x + deltaX;
        const newY = elementStartPos.y + deltaY;

        const tempElement = {
          ...currentElements.find((el) => el.id === draggedElementId)!,
          x: newX,
          y: newY,
        };

        const { guidelines: newGuidelines, snappedX, snappedY } = calculateSnapGuidelines(
          tempElement,
          currentElements,
          canvasWidth,
          canvasHeight
        );

        setGuidelines(newGuidelines);
        updateElement(draggedElementId, { x: snappedX, y: snappedY });
      }

      if (isResizing) {
        const aspectRatio = elementStartPos.width / elementStartPos.height;
        let newWidth = elementStartPos.width + deltaX;
        let newHeight = elementStartPos.height + deltaY;

        if (e.shiftKey) {
          newHeight = newWidth / aspectRatio;
        }

        const minWidth = 20;
        const minHeight = 20;
        newWidth = Math.max(minWidth, newWidth);
        newHeight = Math.max(minHeight, newHeight);

        updateElement(draggedElementId, {
          width: newWidth,
          height: newHeight,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setDraggedElementId(null);
      setGuidelines({ vertical: [], horizontal: [] });
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, draggedElementId, dragStartPos, elementStartPos, scale, currentElements, updateElement, canvasWidth, canvasHeight]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedElementId) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        setCurrentElements(currentElements.filter(el => el.id !== selectedElementId));
        setSelectedElementId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, currentElements, setCurrentElements, setSelectedElementId]);

  const handleSaveVersion = async () => {
    try {
      await saveVersion();
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 2000);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleExport = () => {
    setShowExportModal(true);
    setExportProgress(0);

    const interval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 90) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    setTimeout(() => {
      const html = generateHTML(currentElements, canvasWidth, canvasHeight, selectedTemplate?.name || '作品集');
      downloadHTML(html, `portfolio-${Date.now()}.html`);
      setExportProgress(100);
      clearInterval(interval);
    }, 1000);
  };

  const selectedElement = currentElements.find((el) => el.id === selectedElementId);

  return (
    <div className="editor-container">
      <div className="editor-toolbar">
        <div className="toolbar-left">
          <button className="toolbar-btn" onClick={() => setView('templates')}>
            ← 返回模板
          </button>
          <span className="toolbar-title">{selectedTemplate?.name || '编辑器'}</span>
          {project && (
            <span className="version-count">
              版本 {project.versions.length}
            </span>
          )}
        </div>
        <div className="toolbar-right">
          <button className="toolbar-btn primary" onClick={handleSaveVersion}>
            保存版本
          </button>
          <button 
            className="toolbar-btn success"
            onClick={handleExport}
          >
            导出 HTML
          </button>
        </div>
      </div>

      {showSaveSuccess && (
        <div className="save-success-toast">
          ✓ 版本保存成功
        </div>
      )}

      <div className="editor-content">
        <div className="canvas-container">
          <div
            className="canvas-wrapper"
            ref={canvasRef}
            onClick={handleCanvasClick}
          >
            <div
              className="canvas"
              style={{
                width: canvasWidth,
                height: canvasHeight,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
            >
              {currentElements.map((element) => (
                <DraggableElement
                  key={element.id}
                  element={element}
                  isSelected={element.id === selectedElementId}
                  scale={scale}
                  onSelect={() => handleSelectElement(element.id)}
                  onDragStart={handleDragStart}
                  onResizeStart={handleResizeStart}
                />
              ))}
              <GuideLinesOverlay
                guidelines={guidelines}
                canvasWidth={canvasWidth}
                canvasHeight={canvasHeight}
              />
            </div>
          </div>

          <div className="zoom-controls">
            <button onClick={() => setScale(s => Math.min(2, s + 0.1))}>+</button>
            <span>{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale(s => Math.max(0.25, s - 0.1))}>-</button>
          </div>
        </div>

        <PropertyPanel element={selectedElement || null} onUpdate={updateElement} />
      </div>

      {showExportModal && (
        <div className="modal-overlay" onClick={() => {
          if (exportProgress === 100) {
            setShowExportModal(false);
            setExportProgress(0);
          }
        }}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>导出 HTML</h3>
            {exportProgress < 100 ? (
              <div className="export-progress">
                <div 
                  className="progress-bar" 
                  style={{ width: `${exportProgress}%` }}
                />
                <span>{exportProgress}%</span>
              </div>
            ) : (
              <div className="export-success">
                <p>✓ 导出完成！</p>
                <button 
                  className="toolbar-btn success"
                  onClick={() => {
                    setShowExportModal(false);
                    setExportProgress(0);
                  }}
                >
                  关闭
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
