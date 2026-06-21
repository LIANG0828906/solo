import {
  useRef,
  useEffect,
  useState,
  forwardRef,
  useImperativeHandle,
  useCallback,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { DrawPath, Point, ToolSettings, TextItem, HistoryAction } from '../../shared/types';

interface CanvasProps {
  toolSettings: ToolSettings;
  onDrawPath: (path: DrawPath) => void;
  onClear: () => void;
  onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  fontSize: number;
  onTextAdd: (text: TextItem) => void;
  onTextMove: (data: { id: string; x: number; y: number }) => void;
  onTextDelete: (id: string) => void;
}

export interface CanvasWithMethods extends HTMLCanvasElement {
  undo: () => void;
  redo: () => void;
  clearCanvas: () => void;
  clearSelection: () => void;
}

interface TextEditorState {
  isEditing: boolean;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
}

interface TextDragState {
  isDragging: boolean;
  id: string;
  offsetX: number;
  offsetY: number;
  startX: number;
  startY: number;
}

const Canvas = forwardRef<HTMLCanvasElement, CanvasProps>(
  (
    {
      toolSettings,
      onDrawPath,
      onClear,
      onHistoryChange,
      fontSize,
      onTextAdd,
      onTextMove,
      onTextDelete,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
    const historyRef = useRef<HistoryAction[]>([]);
    const historyIndexRef = useRef(-1);

    const textsRef = useRef<Map<string, TextItem>>(new Map());

    const [selectedTextId, setSelectedTextId] = useState<string | null>(null);
    const [textEditor, setTextEditor] = useState<TextEditorState | null>(null);
    const textDragRef = useRef<TextDragState | null>(null);
    const textInputRef = useRef<HTMLTextAreaElement>(null);

    useImperativeHandle(ref, () => canvasRef.current as HTMLCanvasElement);

    const notifyHistoryChange = useCallback(() => {
      if (onHistoryChange) {
        onHistoryChange(
          historyIndexRef.current >= 0,
          historyIndexRef.current < historyRef.current.length - 1
        );
      }
    }, [onHistoryChange]);

    const pushHistory = useCallback(
      (action: HistoryAction) => {
        const newHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
        newHistory.push(action);
        historyRef.current = newHistory;
        historyIndexRef.current = newHistory.length - 1;
        notifyHistoryChange();
      },
      [notifyHistoryChange]
    );

    const renderAllTexts = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      textsRef.current.forEach((text) => {
        ctx.save();
        ctx.fillStyle = text.color;
        ctx.font = `${text.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(text.text, text.x, text.y);
        ctx.restore();
      });
    }, []);

    const redrawCanvas = useCallback(
      (actions: HistoryAction[]) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        textsRef.current.clear();

        for (let i = 0; i < actions.length; i++) {
          const action = actions[i];
          if (action.type === 'draw') {
            const path = action.data;
            if (path.points.length < 2) continue;

            ctx.save();
            ctx.strokeStyle = path.isEraser ? '#ffffff' : path.color;
            ctx.lineWidth = path.size;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            if (path.isEraser) {
              ctx.globalCompositeOperation = 'destination-out';
            }

            ctx.beginPath();
            ctx.moveTo(path.points[0].x, path.points[0].y);
            for (let j = 1; j < path.points.length; j++) {
              ctx.lineTo(path.points[j].x, path.points[j].y);
            }
            ctx.stroke();
            ctx.restore();
          } else if (action.type === 'text-add') {
            textsRef.current.set(action.data.id, { ...action.data });
          } else if (action.type === 'text-move') {
              const { id, toX, toY } = action.data;
              const text = textsRef.current.get(id);
              if (text) {
                text.x = toX;
                text.y = toY;
              }
            } else if (action.type === 'text-delete') {
            textsRef.current.delete(action.data.id);
          }
        }

        renderAllTexts();
      },
      [renderAllTexts]
    );

    const renderTextSelectionBorder = useCallback((text: TextItem) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.save();
      ctx.font = `${text.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      const metrics = ctx.measureText(text.text);
      const textWidth = metrics.width;
      const textHeight = text.fontSize + 4;

      ctx.strokeStyle = '#1976D2';
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(text.x - 4, text.y - 4, textWidth + 8, textHeight + 8);

      ctx.setLineDash([]);
      ctx.fillStyle = '#1976D2';
      ctx.fillRect(text.x + textWidth + 2, text.y - 10, 12, 12);
      ctx.fillStyle = '#fff';
      ctx.font = '10px sans-serif';
      ctx.textBaseline = 'middle';
      ctx.fillText('×', text.x + textWidth + 4, text.y - 4);

      ctx.restore();
    }, []);

    const renderCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.drawImage(canvas, 0, 0);
      }

      if (selectedTextId) {
        const selectedText = textsRef.current.get(selectedTextId);
        if (selectedText) {
          renderTextSelectionBorder(selectedText);
        }
      }
    }, [selectedTextId, renderTextSelectionBorder]);

    const resizeCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const parent = canvas.parentElement;
      if (!parent) return;

      canvas.width = parent.clientWidth;
      canvas.height = parent.clientHeight;

      const histories = historyRef.current.slice(0, historyIndexRef.current + 1);
      redrawCanvas(histories);
      renderCanvas();
    }, [redrawCanvas, renderCanvas]);

    useEffect(() => {
      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);
      return () => window.removeEventListener('resize', resizeCanvas);
    }, [resizeCanvas]);

    const getMousePos = (e: React.MouseEvent | React.TouchEvent): Point => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();

      let clientX: number, clientY: number;
      if ('touches' in e) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const hitTestText = (x: number, y: number): TextItem | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      let hit: TextItem | null = null;
      textsRef.current.forEach((text) => {
        ctx.font = `${text.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
        const metrics = ctx.measureText(text.text);
        const textWidth = metrics.width;
        const textHeight = text.fontSize + 4;

        if (
          x >= text.x - 4 &&
          x <= text.x + textWidth + 18 &&
          y >= text.y - 14 &&
          y <= text.y + textHeight + 8
        ) {
          hit = text;
        }
      });
      return hit;
    };

    const hitTestDeleteButton = (text: TextItem, x: number, y: number): boolean => {
      const canvas = canvasRef.current;
      if (!canvas) return false;
      const ctx = canvas.getContext('2d');
      if (!ctx) return false;

      ctx.font = `${text.fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`;
      const metrics = ctx.measureText(text.text);
      const textWidth = metrics.width;

      const delX = text.x + textWidth + 2;
      const delY = text.y - 10;

      return x >= delX && x <= delX + 12 && y >= delY && y <= delY + 12;
    };

    const handleCanvasMouseDown = (e: React.MouseEvent) => {
      const pos = getMousePos(e);

      if (toolSettings.type === 'text') {
        const hitText = hitTestText(pos.x, pos.y);

        if (hitText) {
          if (hitTestDeleteButton(hitText, pos.x, pos.y)) {
            const deletedText = { ...hitText };
            textsRef.current.delete(hitText.id);
            pushHistory({ type: 'text-delete', data: deletedText });
            onTextDelete(hitText.id);
            setSelectedTextId(null);
            const histories = historyRef.current.slice(0, historyIndexRef.current + 1);
            redrawCanvas(histories);
            renderCanvas();
            return;
          }

          setSelectedTextId(hitText.id);
          textDragRef.current = {
            isDragging: true,
            id: hitText.id,
            offsetX: pos.x - hitText.x,
            offsetY: pos.y - hitText.y,
            startX: hitText.x,
            startY: hitText.y,
          };
          renderCanvas();
          return;
        }

        if (selectedTextId) {
          setSelectedTextId(null);
          const histories = historyRef.current.slice(0, historyIndexRef.current + 1);
          redrawCanvas(histories);
          renderCanvas();
          return;
        }

        setTextEditor({
          isEditing: true,
          x: pos.x,
          y: pos.y,
          text: '',
          fontSize: fontSize,
          color: toolSettings.color,
        });
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 0);
        return;
      }

      if (toolSettings.type === 'pen' || toolSettings.type === 'eraser') {
        if (selectedTextId) {
          setSelectedTextId(null);
          const histories = historyRef.current.slice(0, historyIndexRef.current + 1);
          redrawCanvas(histories);
          renderCanvas();
        }

        e.preventDefault();
        const path: DrawPath = {
          id: uuidv4(),
          userId: 'local',
          points: [pos],
          color: toolSettings.color,
          size: toolSettings.size,
          isEraser: toolSettings.type === 'eraser',
        };
        setCurrentPath(path);
        setIsDrawing(true);
      }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent) => {
      if (toolSettings.type === 'text' && textDragRef.current?.isDragging) {
        const pos = getMousePos(e);
        const text = textsRef.current.get(textDragRef.current.id);
        if (text) {
          text.x = pos.x - textDragRef.current.offsetX;
          text.y = pos.y - textDragRef.current.offsetY;
          const histories = historyRef.current.slice(0, historyIndexRef.current + 1);
          redrawCanvas(histories);
          renderCanvas();
        }
        return;
      }

      if (!isDrawing || !currentPath) return;
      e.preventDefault();

      const pos = getMousePos(e);
      const newPath = {
        ...currentPath,
        points: [...currentPath.points, pos],
      };

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const points = newPath.points;
      if (points.length >= 2) {
        ctx.save();
        ctx.strokeStyle = newPath.isEraser ? '#ffffff' : newPath.color;
        ctx.lineWidth = newPath.size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        if (newPath.isEraser) {
          ctx.globalCompositeOperation = 'destination-out';
        }

        ctx.beginPath();
        const startIdx = Math.max(0, points.length - 2);
        ctx.moveTo(points[startIdx].x, points[startIdx].y);
        ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
        ctx.stroke();
        ctx.restore();
      }

      setCurrentPath(newPath);
    };

    const handleCanvasMouseUp = () => {
      if (toolSettings.type === 'text' && textDragRef.current?.isDragging) {
        const drag = textDragRef.current;
        const text = textsRef.current.get(drag.id);
        if (text && (text.x !== drag.startX || text.y !== drag.startY)) {
          pushHistory({
            type: 'text-move',
            data: {
              id: drag.id,
              fromX: drag.startX,
              fromY: drag.startY,
              toX: text.x,
              toY: text.y,
            },
          });
          onTextMove({ id: drag.id, x: text.x, y: text.y });
        }
        textDragRef.current = null;
        return;
      }

      if (!isDrawing || !currentPath) return;

      if (currentPath.points.length > 1) {
        pushHistory({ type: 'draw', data: currentPath });
        onDrawPath(currentPath);
      }

      setIsDrawing(false);
      setCurrentPath(null);
    };

    const confirmText = useCallback(() => {
      if (!textEditor || textEditor.text.trim() === '') {
        setTextEditor(null);
        return;
      }

      const newText: TextItem = {
        id: uuidv4(),
        userId: 'local',
        x: textEditor!.x,
        y: textEditor!.y,
        text: textEditor!.text.trim(),
        color: textEditor!.color,
        fontSize: textEditor!.fontSize,
      };

      textsRef.current.set(newText.id, newText);
      pushHistory({ type: 'text-add', data: newText });
      onTextAdd(newText);

      const histories = historyRef.current.slice(0, historyIndexRef.current + 1);
      redrawCanvas(histories);
      setTextEditor(null);
    }, [textEditor, pushHistory, onTextAdd, redrawCanvas]);

    const undo = useCallback(() => {
      if (historyIndexRef.current < 0) return;

      historyIndexRef.current = historyIndexRef.current - 1;

      const paths = historyRef.current.slice(0, historyIndexRef.current + 1);
      redrawCanvas(paths);
      setSelectedTextId(null);
      renderCanvas();
      notifyHistoryChange();
    }, [redrawCanvas, renderCanvas, notifyHistoryChange]);

    const redo = useCallback(() => {
      if (historyIndexRef.current >= historyRef.current.length - 1) return;

      historyIndexRef.current = historyIndexRef.current + 1;

      const paths = historyRef.current.slice(0, historyIndexRef.current + 1);
      redrawCanvas(paths);
      setSelectedTextId(null);
      renderCanvas();
      notifyHistoryChange();
    }, [redrawCanvas, renderCanvas, notifyHistoryChange]);

    const clearCanvas = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      historyRef.current = [];
      historyIndexRef.current = -1;
      textsRef.current.clear();
      setSelectedTextId(null);
      setTextEditor(null);
      onClear();
      notifyHistoryChange();
    }, [onClear, notifyHistoryChange]);

    const clearSelection = useCallback(() => {
      if (selectedTextId) {
        setSelectedTextId(null);
        const histories = historyRef.current.slice(0, historyIndexRef.current + 1);
        redrawCanvas(histories);
      }
    }, [selectedTextId, redrawCanvas]);

    useEffect(() => {
      const canvas = canvasRef.current as CanvasWithMethods | null;
      if (!canvas) return;
      canvas.undo = undo;
      canvas.redo = redo;
      canvas.clearCanvas = clearCanvas;
      canvas.clearSelection = clearSelection;
    }, [undo, redo, clearCanvas, clearSelection]);

    useEffect(() => {
      notifyHistoryChange();
    }, [notifyHistoryChange]);

    useEffect(() => {
      renderCanvas();
    }, [renderCanvas, selectedTextId]);

    return (
      <div ref={overlayRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas
          ref={canvasRef}
          className="whiteboard-canvas"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          style={{ cursor: toolSettings.type === 'text' ? 'text' : 'crosshair' }}
        />
        {textEditor && (
          <div
          style={{
            position: 'absolute',
            left: textEditor.x,
            top: textEditor.y,
            zIndex: 10,
          }}
        >
          <textarea
            ref={textInputRef}
            value={textEditor.text}
            onChange={(e) => setTextEditor({ ...textEditor, text: e.target.value })}
            onBlur={confirmText}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                confirmText();
              }
              if (e.key === 'Escape') {
                setTextEditor(null);
              }
            }}
            style={{
              fontSize: `${textEditor.fontSize}px`,
              color: textEditor.color,
              border: '2px dashed #1976D2',
              borderRadius: '4px',
              padding: '4px 8px',
              outline: 'none',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
              background: 'rgba(255, 255, 255, 0.95',
              minWidth: '120px',
              minHeight: `${textEditor.fontSize + 16}px`,
              resize: 'none',
              overflow: 'hidden',
            }}
            placeholder="输入文字..."
            rows={1}
          />
        </div>
        )}
      </div>
    );
  }
);

Canvas.displayName = 'Canvas';

export default Canvas;
