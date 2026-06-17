import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  useCanvasStore,
  Point,
  ToolType,
  CanvasElement,
  StickyElement,
  RectangleElement,
  useEraserAtPoint
} from './CanvasEngine';
import { renderCanvas } from './CanvasRenderer';
import { useSyncStore, getLastActionByMember } from './SyncModule';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  generateFileName,
  downloadJSON
} from './utils';

const CANVAS_MIN_WIDTH = 2000;
const CANVAS_MIN_HEIGHT = 2000;

type ConfirmDialogState = {
  open: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
} | null;

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderLoopRef = useRef<number | null>(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStrokeId, setCurrentStrokeId] = useState<string | null>(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [editingStickyId, setEditingStickyId] = useState<string | null>(null);
  const [resizingRectId, setResizingRectId] = useState<string | null>(null);
  const [resizeStart, setResizeStart] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>(null);
  const [saveFlash, setSaveFlash] = useState(false);

  const {
    elements,
    selectedId,
    currentTool,
    penColor,
    penWidth,
    viewport,
    isSpacePressed,
    isPanning,
    setCurrentTool,
    addStroke,
    appendStrokePoint,
    addSticky,
    addRectangle,
    selectElement,
    moveElement,
    updateStickyContent,
    resizeRectangle,
    deleteSelected,
    clearAll,
    setSpacePressed,
    startPanning,
    updatePanning,
    stopPanning,
    hitTest,
    setZoom,
    loadState,
    getSerializableState
  } = useCanvasStore();

  const { members, actionLogs, startPolling, stopPolling, addActionLog } = useSyncStore();

  const getCanvasSize = useCallback(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      return {
        width: Math.max(CANVAS_MIN_WIDTH, rect.width),
        height: Math.max(CANVAS_MIN_HEIGHT, rect.height),
        viewWidth: rect.width,
        viewHeight: rect.height
      };
    }
    return { width: CANVAS_MIN_WIDTH, height: CANVAS_MIN_HEIGHT, viewWidth: window.innerWidth, viewHeight: window.innerHeight };
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { viewWidth, viewHeight } = getCanvasSize();
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== viewWidth * dpr || canvas.height !== viewHeight * dpr) {
      canvas.width = viewWidth * dpr;
      canvas.height = viewHeight * dpr;
      canvas.style.width = `${viewWidth}px`;
      canvas.style.height = `${viewHeight}px`;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    renderCanvas(ctx, elements, selectedId, viewport, viewWidth, viewHeight);

    renderLoopRef.current = requestAnimationFrame(render);
  }, [elements, selectedId, viewport, getCanvasSize]);

  useEffect(() => {
    renderLoopRef.current = requestAnimationFrame(render);
    return () => {
      if (renderLoopRef.current) {
        cancelAnimationFrame(renderLoopRef.current);
      }
    };
  }, [render]);

  useEffect(() => {
    const saved = loadFromLocalStorage<{ elements: CanvasElement[]; viewport: typeof viewport }>();
    if (saved && saved.elements) {
      loadState(saved.elements);
    }
  }, [loadState]);

  useEffect(() => {
    startPolling();
    return () => stopPolling();
  }, [startPolling, stopPolling]);

  const screenToWorld = useCallback((screenX: number, screenY: number): Point => {
    const rect = canvasRef.current?.getBoundingClientRect();
    const offsetRectX = rect ? rect.left : 0;
    const offsetRectY = rect ? rect.top : 0;
    const x = (screenX - offsetRectX - viewport.offsetX) / viewport.zoom;
    const y = (screenY - offsetRectY - viewport.offsetY) / viewport.zoom;
    return { x, y };
  }, [viewport]);

  const getVisibleCenterWorld = useCallback((): Point => {
    const { viewWidth, viewHeight } = getCanvasSize();
    return screenToWorld(
      (canvasRef.current?.getBoundingClientRect().left || 0) + viewWidth / 2,
      (canvasRef.current?.getBoundingClientRect().top || 0) + viewHeight / 2
    );
  }, [screenToWorld, getCanvasSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
      }
      if (e.code === 'Delete' || e.code === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
          return;
        }
        e.preventDefault();
        if (selectedId) {
          deleteSelected();
          addActionLog('alice', '删除了元素');
        }
      }
      if (e.code === 'Escape') {
        selectElement(null);
        setEditingStickyId(null);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        if (isPanning) stopPanning();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setSpacePressed, isPanning, stopPanning, selectedId, deleteSelected, selectElement, addActionLog]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const rect = canvasRef.current!.getBoundingClientRect();
    const screenX = e.clientX;
    const screenY = e.clientY;
    const canvasScreenX = e.clientX - rect.left;
    const canvasScreenY = e.clientY - rect.top;
    const worldPoint = screenToWorld(screenX, screenY);

    if (editingStickyId) {
      setEditingStickyId(null);
    }

    if (isSpacePressed || currentTool === 'pan') {
      startPanning({ x: canvasScreenX, y: canvasScreenY });
      return;
    }

    if (resizingRectId && resizeStart) {
      return;
    }

    if (currentTool === 'pen') {
      const id = addStroke([worldPoint], penColor, penWidth);
      setCurrentStrokeId(id);
      setIsDrawing(true);
      return;
    }

    if (currentTool === 'eraser') {
      setIsDrawing(true);
      useEraserAtPoint(worldPoint.x, worldPoint.y);
      return;
    }

    const hitId = hitTest(worldPoint.x, worldPoint.y);
    if (hitId) {
      const el = elements.find((e) => e.id === hitId);
      if (el && (el.type === 'sticky' || el.type === 'rectangle')) {
        const worldElX = el.x;
        const worldElY = el.y;
        const worldElRight = el.x + (el as StickyElement | RectangleElement).width;
        const worldElBottom = el.y + (el as StickyElement | RectangleElement).height;

        const resizeHitbox = 12 / viewport.zoom;
        if (
          worldPoint.x >= worldElRight - resizeHitbox &&
          worldPoint.x <= worldElRight + resizeHitbox &&
          worldPoint.y >= worldElBottom - resizeHitbox &&
          worldPoint.y <= worldElBottom + resizeHitbox &&
          el.type === 'rectangle'
        ) {
          const rectEl = el as RectangleElement;
          setResizingRectId(el.id);
          setResizeStart({ x: worldPoint.x, y: worldPoint.y, w: rectEl.width, h: rectEl.height });
          selectElement(hitId);
          return;
        }
      }

      selectElement(hitId);
      setIsDraggingElement(true);
      setDraggedElementId(hitId);
      setDragStartPoint(worldPoint);
    } else {
      selectElement(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    const screenX = e.clientX;
    const screenY = e.clientY;
    const canvasScreenX = e.clientX - rect.left;
    const canvasScreenY = e.clientY - rect.top;
    const worldPoint = screenToWorld(screenX, screenY);

    if (isPanning || (isSpacePressed && e.buttons === 1)) {
      updatePanning({ x: canvasScreenX, y: canvasScreenY });
      return;
    }

    if (resizingRectId && resizeStart) {
      const newW = resizeStart.w + (worldPoint.x - resizeStart.x);
      const newH = resizeStart.h + (worldPoint.y - resizeStart.y);
      resizeRectangle(resizingRectId, newW, newH);
      return;
    }

    if (isDrawing && currentStrokeId) {
      appendStrokePoint(currentStrokeId, worldPoint);
    }

    if (isDrawing && currentTool === 'eraser') {
      useEraserAtPoint(worldPoint.x, worldPoint.y);
    }

    if (isDraggingElement && draggedElementId && dragStartPoint) {
      const dx = worldPoint.x - dragStartPoint.x;
      const dy = worldPoint.y - dragStartPoint.y;
      moveElement(draggedElementId, dx, dy);
      setDragStartPoint(worldPoint);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      stopPanning();
    }

    if (resizingRectId) {
      addActionLog('alice', '调整了大小');
      setResizingRectId(null);
      setResizeStart(null);
    }

    if (isDrawing && currentStrokeId) {
      addActionLog('alice', '画了一条线');
    }

    if (isDraggingElement && draggedElementId) {
      addActionLog('alice', '移动了元素');
    }

    setIsDrawing(false);
    setCurrentStrokeId(null);
    setIsDraggingElement(false);
    setDraggedElementId(null);
    setDragStartPoint(null);
  };

  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPoint = screenToWorld(e.clientX, e.clientY);
    const hitId = hitTest(worldPoint.x, worldPoint.y);
    if (hitId) {
      const el = elements.find((elem) => elem.id === hitId);
      if (el && el.type === 'sticky') {
        setEditingStickyId(hitId);
      }
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      const newZoom = Math.max(0.2, Math.min(5, viewport.zoom + delta));
      setZoom(newZoom);
    }
  };

  const handleToolClick = (tool: ToolType) => {
    setCurrentTool(tool);
    setEditingStickyId(null);
  };

  const handleAddSticky = () => {
    const center = getVisibleCenterWorld();
    addSticky(center.x - 100, center.y - 100, '');
    addActionLog('alice', '添加了便利贴');
  };

  const handleAddRectangle = () => {
    const center = getVisibleCenterWorld();
    addRectangle(center.x - 50, center.y - 40);
    addActionLog('alice', '绘制了矩形');
  };

  const handleClearClick = () => {
    setConfirmDialog({
      open: true,
      title: '确认清空',
      message: '确定要清空画布上的所有内容吗？此操作不可撤销。',
      onConfirm: () => {
        clearAll();
        addActionLog('alice', '清空了画布');
        setConfirmDialog(null);
      }
    });
  };

  const handleSave = () => {
    const state = getSerializableState();
    saveToLocalStorage(state);
    const fileName = generateFileName();
    downloadJSON(state, fileName);
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 800);
  };

  const getEditingSticky = (): StickyElement | null => {
    if (!editingStickyId) return null;
    const el = elements.find((e) => e.id === editingStickyId);
    return el && el.type === 'sticky' ? el : null;
  };

  const editingSticky = getEditingSticky();
  const resizingRect = resizingRectId ? elements.find((e) => e.id === resizingRectId && e.type === 'rectangle') as RectangleElement | undefined : undefined;

  return (
    <div className="app-container">
      <button
        className={`save-button ${saveFlash ? 'save-flash' : ''}`}
        onClick={handleSave}
        title="保存画布"
      >
        💾 保存
      </button>

      <div className="toolbar" ref={containerRef}>
        <div className="toolbar-inner">
          <ToolButton
            active={currentTool === 'pen'}
            onClick={() => handleToolClick('pen')}
            title="画笔"
            icon="✏️"
          />
          <ToolButton
            active={currentTool === 'eraser'}
            onClick={() => handleToolClick('eraser')}
            title="橡皮擦"
            icon="🧽"
          />
          <div className="toolbar-divider" />
          <ToolButton
            active={false}
            onClick={handleAddSticky}
            title="便利贴"
            icon="📝"
          />
          <ToolButton
            active={false}
            onClick={handleAddRectangle}
            title="矩形"
            icon="▢"
          />
          <div className="toolbar-divider" />
          <ToolButton
            active={currentTool === 'select' || (!isSpacePressed && currentTool !== 'pen' && currentTool !== 'eraser' && currentTool !== 'pan')}
            onClick={() => handleToolClick('select')}
            title="选择"
            icon="🖱️"
          />
          <div className="toolbar-divider" />
          <ToolButton
            active={false}
            onClick={handleClearClick}
            title="清空画布"
            icon="🗑️"
            danger
          />
        </div>
      </div>

      <div
        className="canvas-container"
        ref={containerRef}
        style={{ cursor: isPanning || isSpacePressed ? 'grabbing' : currentTool === 'pen' ? 'crosshair' : currentTool === 'eraser' ? 'cell' : 'default' }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onDoubleClick={handleDoubleClick}
          onWheel={handleWheel}
          className="main-canvas"
        />

        {editingSticky && (
          <StickyEditor
            sticky={editingSticky}
            viewport={viewport}
            canvasRect={canvasRef.current?.getBoundingClientRect()}
            onClose={() => setEditingStickyId(null)}
            onChange={(content) => {
              updateStickyContent(editingSticky.id, content);
            }}
            onEditFinish={() => addActionLog('alice', '修改了文字')}
          />
        )}

        {resizingRect && (
          <ResizeHandle
            rect={resizingRect}
            viewport={viewport}
            canvasRect={canvasRef.current?.getBoundingClientRect()}
          />
        )}
      </div>

      <div className="members-panel">
        <div className="panel-header">
          <span className="panel-title">团队成员</span>
          <span className="online-count">{members.filter(m => m.online).length} 在线</span>
        </div>
        <div className="members-list">
          {members.map((member) => {
            const lastAction = getLastActionByMember(member.id, actionLogs);
            return (
              <div key={member.id} className="member-item">
                <div className="member-avatar-wrapper">
                  <div
                    className="member-avatar"
                    style={{ backgroundColor: member.avatarColor }}
                  >
                    {member.name.charAt(0)}
                  </div>
                  {member.online && <div className="online-dot" />}
                </div>
                <div className="member-info">
                  <div className="member-name">{member.name}</div>
                  <div className="member-last-action">
                    {lastAction ? lastAction.action : '等待中...'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="panel-header activity-header">
          <span className="panel-title">最近活动</span>
        </div>
        <div className="activity-list">
          {[...actionLogs].reverse().slice(0, 10).map((log) => (
            <div key={log.id} className="activity-item">
              <span className="activity-name">{log.memberName}</span>
              <span className="activity-text">{log.action}</span>
            </div>
          ))}
          {actionLogs.length === 0 && (
            <div className="activity-empty">暂无活动记录</div>
          )}
        </div>
      </div>

      {confirmDialog && confirmDialog.open && (
        <div className="dialog-overlay" onClick={() => setConfirmDialog(null)}>
          <div className="confirm-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dialog-title">{confirmDialog.title}</div>
            <div className="dialog-message">{confirmDialog.message}</div>
            <div className="dialog-actions">
              <button
                className="dialog-btn dialog-btn-cancel"
                onClick={() => setConfirmDialog(null)}
              >
                取消
              </button>
              <button
                className="dialog-btn dialog-btn-confirm"
                onClick={confirmDialog.onConfirm}
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: string;
  danger?: boolean;
}

function ToolButton({ active, onClick, title, icon, danger }: ToolButtonProps) {
  return (
    <button
      className={`tool-button ${active ? 'active' : ''} ${danger ? 'danger' : ''}`}
      onClick={onClick}
      title={title}
    >
      <span className="tool-icon">{icon}</span>
    </button>
  );
}

interface StickyEditorProps {
  sticky: StickyElement;
  viewport: { offsetX: number; offsetY: number; zoom: number };
  canvasRect: DOMRect | undefined;
  onClose: () => void;
  onChange: (content: string) => void;
  onEditFinish: () => void;
}

function StickyEditor({ sticky, viewport, canvasRect, onClose, onChange, onEditFinish }: StickyEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(sticky.content);

  useEffect(() => {
    setContent(sticky.content);
  }, [sticky.content]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleBlur = () => {
    onEditFinish();
    onClose();
  };

  if (!canvasRect) return null;

  const { offsetX, offsetY, zoom } = viewport;
  const x = sticky.x * zoom + offsetX;
  const y = sticky.y * zoom + offsetY;
  const w = sticky.width * zoom;
  const h = sticky.height * zoom;
  const padding = 16 * zoom;
  const fontSize = 14 * zoom;

  return (
    <textarea
      ref={textareaRef}
      value={content}
      onChange={(e) => {
        setContent(e.target.value);
        onChange(e.target.value);
      }}
      onBlur={handleBlur}
      className="sticky-editor"
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${w - padding * 2}px`,
        height: `${h - padding * 2}px`,
        padding: `${padding}px`,
        borderRadius: '8px',
        backgroundColor: sticky.bgColor,
        fontSize: `${fontSize}px`,
        lineHeight: 1.5,
        border: '2px solid #4A90D9',
        outline: 'none',
        resize: 'none',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        color: '#2C2C3A',
        boxSizing: 'content-box',
        boxShadow: '0 0 0 4px rgba(74, 144, 217, 0.2)'
      }}
      placeholder="在此输入内容，支持 *斜体*、**粗体**、***粗斜体***..."
    />
  );
}

interface ResizeHandleProps {
  rect: RectangleElement;
  viewport: { offsetX: number; offsetY: number; zoom: number };
  canvasRect: DOMRect | undefined;
}

function ResizeHandle({ rect, viewport, canvasRect }: ResizeHandleProps) {
  if (!canvasRect) return null;
  const { offsetX, offsetY, zoom } = viewport;
  const handleSize = 12;
  const x = (rect.x + rect.width) * zoom + offsetX - handleSize / 2;
  const y = (rect.y + rect.height) * zoom + offsetY - handleSize / 2;

  return (
    <div
      className="resize-handle"
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        width: `${handleSize}px`,
        height: `${handleSize}px`,
        backgroundColor: '#4A90D9',
        borderRadius: '2px',
        cursor: 'nwse-resize',
        boxShadow: '0 0 0 2px rgba(255,255,255,0.8)'
      }}
    />
  );
}

export default App;
