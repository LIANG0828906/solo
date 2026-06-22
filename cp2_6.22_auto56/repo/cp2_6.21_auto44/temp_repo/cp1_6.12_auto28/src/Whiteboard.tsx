import React, { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import Toolbar from './Toolbar';
import { ToolType, Point, BoardElement, PenElement, RectangleElement, CircleElement, TextElement, UserCursor } from './types';

const MAX_HISTORY = 50;
const ANIMATION_DURATION = 300;
const CURSOR_COLORS = ['#e53935', '#1e88e5', '#43a047', '#fb8c00', '#8e24aa', '#00acc1', '#f06292', '#6d4c41'];
const USER_NAMES = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十'];

const getCursorStyle = (tool: ToolType): React.CSSProperties['cursor'] => {
  switch (tool) {
    case 'pen':
    case 'rectangle':
    case 'circle':
      return 'crosshair';
    case 'text':
      return 'text';
    case 'eraser':
      return 'cell';
    default:
      return 'default';
  }
};

const Whiteboard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const [elements, setElements] = useState<BoardElement[]>([]);
  const [animatingElements, setAnimatingElements] = useState<Set<string>>(new Set());
  const [currentTool, setCurrentTool] = useState<ToolType>('pen');
  const [color, setColor] = useState<string>('#000000');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [previewRect, setPreviewRect] = useState<RectangleElement | null>(null);
  const [previewCircle, setPreviewCircle] = useState<CircleElement | null>(null);
  const [previewPen, setPreviewPen] = useState<PenElement | null>(null);
  const [otherCursors, setOtherCursors] = useState<Map<string, UserCursor>>(new Map());
  const [undoStack, setUndoStack] = useState<BoardElement[][]>([]);
  const [redoStack, setRedoStack] = useState<BoardElement[][]>([]);
  const [textInputPos, setTextInputPos] = useState<Point | null>(null);
  const [textValue, setTextValue] = useState<string>('');
  const textInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const userIdRef = useRef<string>(uuidv4());
  const userNameRef = useRef<string>(USER_NAMES[Math.floor(Math.random() * USER_NAMES.length)]);
  const userColorRef = useRef<string>(CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]);
  const canvasOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const saveToHistory = useCallback((prevElements: BoardElement[]) => {
    setUndoStack((prev) => {
      const newStack = [...prev, prevElements];
      if (newStack.length > MAX_HISTORY) newStack.shift();
      return newStack;
    });
    setRedoStack([]);
  }, []);

  useEffect(() => {
    const socket = io('http://localhost:3001', {
      transports: ['websocket'],
      pingInterval: 5000,
      pingTimeout: 10000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join', {
        userId: userIdRef.current,
        userName: userNameRef.current,
        color: userColorRef.current,
      });
    });

    socket.on('init-elements', (initElements: BoardElement[]) => {
      setElements(initElements);
    });

    socket.on('element-added', (element: BoardElement) => {
      setElements((prev) => {
        if (prev.find((e) => e.id === element.id)) return prev;
        const animateElement = async () => {
          setAnimatingElements((prevAnim) => new Set(prevAnim).add(element.id));
          await new Promise((r) => setTimeout(r, ANIMATION_DURATION));
          setAnimatingElements((prevAnim) => {
            const next = new Set(prevAnim);
            next.delete(element.id);
            return next;
          });
        };
        animateElement();
        return [...prev, element];
      });
    });

    socket.on('element-removed', (elementId: string) => {
      setElements((prev) => prev.filter((e) => e.id !== elementId));
    });

    socket.on('cursor-move', (cursor: UserCursor) => {
      if (cursor.userId === userIdRef.current) return;
      setOtherCursors((prev) => {
        const next = new Map(prev);
        next.set(cursor.userId, cursor);
        return next;
      });
    });

    socket.on('user-disconnect', (disconnectedUserId: string) => {
      setOtherCursors((prev) => {
        const next = new Map(prev);
        next.delete(disconnectedUserId);
        return next;
      });
    });

    socket.on('batch-load', (loadedElements: BoardElement[]) => {
      setElements([]);
      const sorted = [...loadedElements].sort((a, b) => a.createdAt - b.createdAt);
      sorted.forEach((el, idx) => {
        setTimeout(() => {
          setElements((prev) => {
            setAnimatingElements((prevAnim) => new Set(prevAnim).add(el.id));
            setTimeout(() => {
              setAnimatingElements((prevAnim) => {
                const next = new Set(prevAnim);
                next.delete(el.id);
                return next;
              });
            }, ANIMATION_DURATION);
            return [...prev, el];
          });
        }, idx * 200);
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const rect = canvas.getBoundingClientRect();
      canvasOffsetRef.current = { x: rect.left, y: rect.top };
      renderCanvas();
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const gridSize = 50;
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    const drawElement = (el: BoardElement, customOpacity?: number) => {
      ctx.save();
      ctx.globalAlpha = customOpacity ?? el.opacity ?? 1;
      ctx.strokeStyle = el.color;
      ctx.fillStyle = el.color;
      ctx.lineWidth = el.strokeWidth;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (el.type === 'pen') {
        if (el.points.length < 2) return;
        ctx.beginPath();
        ctx.moveTo(el.points[0].x, el.points[0].y);
        for (let i = 1; i < el.points.length; i++) {
          ctx.lineTo(el.points[i].x, el.points[i].y);
        }
        ctx.stroke();
      } else if (el.type === 'rectangle') {
        ctx.strokeRect(el.x, el.y, el.width, el.height);
      } else if (el.type === 'circle') {
        ctx.beginPath();
        ctx.arc(el.cx, el.cy, el.r, 0, Math.PI * 2);
        ctx.stroke();
      } else if (el.type === 'text') {
        ctx.font = `${el.fontSize}px sans-serif`;
        ctx.textBaseline = 'top';
        ctx.fillText(el.text, el.x, el.y);
      }
      ctx.restore();
    };

    elements.forEach((el) => {
      const isAnimating = animatingElements.has(el.id);
      if (isAnimating) {
        const startTime = animationStartTimes.current.get(el.id) ?? Date.now();
        if (!animationStartTimes.current.has(el.id)) {
          animationStartTimes.current.set(el.id, Date.now());
        }
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / ANIMATION_DURATION, 1);
        drawElement(el, progress);
        if (progress < 1) {
          requestAnimationFrame(renderCanvas);
        } else {
          animationStartTimes.current.delete(el.id);
        }
      } else {
        drawElement(el);
      }
    });

    if (previewPen && previewPen.points.length > 1) drawElement(previewPen);
    if (previewRect) drawElement(previewRect);
    if (previewCircle) drawElement(previewCircle);
  }, [elements, animatingElements, previewPen, previewRect, previewCircle]);

  const animationStartTimes = useRef<Map<string, number>>(new Map());

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  useEffect(() => {
    if (textInputPos && textInputRef.current) {
      textInputRef.current.focus();
    }
  }, [textInputPos]);

  const getMousePos = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current!;
    return { x: e.clientX - canvasOffsetRef.current.x, y: e.clientY - canvasOffsetRef.current.y };
  };

  const emitCursorMove = (pos: Point) => {
    socketRef.current?.emit('cursor-move', {
      userId: userIdRef.current,
      userName: userNameRef.current,
      x: pos.x,
      y: pos.y,
      color: userColorRef.current,
    });
  };

  const addElement = useCallback(
    (element: BoardElement) => {
      saveToHistory(elements);
      setElements((prev) => [...prev, element]);
      socketRef.current?.emit('add-element', element);
    },
    [elements, saveToHistory]
  );

  const handleMouseDown = (e: React.MouseEvent) => {
    if (currentTool === 'text') return;
    const pos = getMousePos(e);
    setStartPoint(pos);
    setIsDrawing(true);

    if (currentTool === 'pen') {
      setCurrentPoints([pos]);
    } else if (currentTool === 'eraser') {
      const clickedElement = findElementAtPoint(pos);
      if (clickedElement) {
        saveToHistory(elements);
        setElements((prev) => prev.filter((el) => el.id !== clickedElement.id));
        socketRef.current?.emit('remove-element', clickedElement.id);
        setIsDrawing(false);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    emitCursorMove(pos);

    if (!isDrawing || !startPoint) return;

    if (currentTool === 'pen') {
      const newPoints = [...currentPoints, pos];
      setCurrentPoints(newPoints);
      setPreviewPen({
        id: 'preview',
        type: 'pen',
        points: newPoints,
        color,
        strokeWidth,
        createdAt: Date.now(),
        userId: userIdRef.current,
        userName: userNameRef.current,
      });
    } else if (currentTool === 'rectangle') {
      const x = Math.min(startPoint.x, pos.x);
      const y = Math.min(startPoint.y, pos.y);
      const width = Math.abs(pos.x - startPoint.x);
      const height = Math.abs(pos.y - startPoint.y);
      setPreviewRect({
        id: 'preview',
        type: 'rectangle',
        x,
        y,
        width,
        height,
        color,
        strokeWidth,
        createdAt: Date.now(),
        userId: userIdRef.current,
        userName: userNameRef.current,
      });
    } else if (currentTool === 'circle') {
      const dx = pos.x - startPoint.x;
      const dy = pos.y - startPoint.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      setPreviewCircle({
        id: 'preview',
        type: 'circle',
        cx: startPoint.x,
        cy: startPoint.y,
        r,
        color,
        strokeWidth,
        createdAt: Date.now(),
        userId: userIdRef.current,
        userName: userNameRef.current,
      });
    } else if (currentTool === 'eraser') {
      const hitElement = findElementAtPoint(pos);
      if (hitElement) {
        saveToHistory(elements);
        setElements((prev) => prev.filter((el) => el.id !== hitElement.id));
        socketRef.current?.emit('remove-element', hitElement.id);
      }
    }
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (currentTool === 'pen' && currentPoints.length > 1) {
      const element: PenElement = {
        id: uuidv4(),
        type: 'pen',
        points: currentPoints,
        color,
        strokeWidth,
        createdAt: Date.now(),
        userId: userIdRef.current,
        userName: userNameRef.current,
      };
      addElement(element);
    } else if (currentTool === 'rectangle' && previewRect && previewRect.width > 0 && previewRect.height > 0) {
      const element: RectangleElement = { ...previewRect, id: uuidv4() };
      addElement(element);
    } else if (currentTool === 'circle' && previewCircle && previewCircle.r > 0) {
      const element: CircleElement = { ...previewCircle, id: uuidv4() };
      addElement(element);
    }

    setCurrentPoints([]);
    setPreviewPen(null);
    setPreviewRect(null);
    setPreviewCircle(null);
    setStartPoint(null);
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (currentTool === 'text' && !textInputPos) {
      setTextInputPos(getMousePos(e));
    }
  };

  const handleTextSubmit = () => {
    if (!textInputPos || !textValue.trim()) {
      setTextInputPos(null);
      setTextValue('');
      return;
    }
    const element: TextElement = {
      id: uuidv4(),
      type: 'text',
      x: textInputPos.x,
      y: textInputPos.y,
      text: textValue.trim(),
      fontSize: 16 + strokeWidth * 2,
      color,
      strokeWidth,
      createdAt: Date.now(),
      userId: userIdRef.current,
      userName: userNameRef.current,
    };
    addElement(element);
    setTextInputPos(null);
    setTextValue('');
  };

  const findElementAtPoint = (point: Point): BoardElement | null => {
    for (let i = elements.length - 1; i >= 0; i--) {
      const el = elements[i];
      if (isPointInElement(point, el)) return el;
    }
    return null;
  };

  const isPointInElement = (point: Point, el: BoardElement): boolean => {
    const hitPadding = Math.max(el.strokeWidth, 5);
    if (el.type === 'pen') {
      for (const p of el.points) {
        const dx = point.x - p.x;
        const dy = point.y - p.y;
        if (Math.sqrt(dx * dx + dy * dy) <= hitPadding) return true;
      }
      return false;
    } else if (el.type === 'rectangle') {
      return (
        point.x >= el.x - hitPadding &&
        point.x <= el.x + el.width + hitPadding &&
        point.y >= el.y - hitPadding &&
        point.y <= el.y + el.height + hitPadding
      );
    } else if (el.type === 'circle') {
      const dx = point.x - el.cx;
      const dy = point.y - el.cy;
      return Math.sqrt(dx * dx + dy * dy) <= el.r + hitPadding;
    } else if (el.type === 'text') {
      const approxWidth = el.text.length * el.fontSize * 0.6;
      return (
        point.x >= el.x - hitPadding &&
        point.x <= el.x + approxWidth + hitPadding &&
        point.y >= el.y - hitPadding &&
        point.y <= el.y + el.fontSize + hitPadding
      );
    }
    return false;
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((s) => s.slice(0, -1));
    setRedoStack((s) => {
      const next = [...s, elements];
      if (next.length > MAX_HISTORY) next.shift();
      return next;
    });
    const removedIds = elements.filter((el) => !prev.find((p) => p.id === el.id)).map((el) => el.id);
    removedIds.forEach((id) => {
      setAnimatingElements((prevAnim) => new Set(prevAnim).add(id));
      socketRef.current?.emit('remove-element', id);
    });
    setTimeout(() => {
      setElements(prev);
      setAnimatingElements((prevAnim) => {
        const next = new Set(prevAnim);
        removedIds.forEach((id) => next.delete(id));
        return next;
      });
    }, ANIMATION_DURATION);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setRedoStack((s) => s.slice(0, -1));
    setUndoStack((s) => {
      const stack = [...s, elements];
      if (stack.length > MAX_HISTORY) stack.shift();
      return stack;
    });
    const addedIds = next.filter((el) => !elements.find((p) => p.id === el.id)).map((el) => el.id);
    addedIds.forEach((id) => {
      setAnimatingElements((prevAnim) => new Set(prevAnim).add(id));
    });
    setElements(next);
    next.forEach((el) => socketRef.current?.emit('add-element', el));
    setTimeout(() => {
      setAnimatingElements((prevAnim) => {
        const out = new Set(prevAnim);
        addedIds.forEach((id) => out.delete(id));
        return out;
      });
    }, ANIMATION_DURATION);
  };

  const handleSave = () => {
    const data = JSON.stringify(elements, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whiteboard-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoadClick = () => {
    fileInputRef.current?.click();
  };

  const handleLoadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const loaded = JSON.parse(ev.target?.result as string) as BoardElement[];
        saveToHistory(elements);
        const sorted = [...loaded].sort((a, b) => a.createdAt - b.createdAt);
        setElements([]);
        sorted.forEach((el, idx) => {
          setTimeout(() => {
            setElements((prev) => {
              setAnimatingElements((prevAnim) => new Set(prevAnim).add(el.id));
              setTimeout(() => {
                setAnimatingElements((prevAnim) => {
                  const next = new Set(prevAnim);
                  next.delete(el.id);
                  return next;
                });
              }, ANIMATION_DURATION);
              return [...prev, el];
            });
            socketRef.current?.emit('add-element', el);
          }, idx * 200);
        });
      } catch {
        alert('文件格式错误');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Toolbar
        currentTool={currentTool}
        setCurrentTool={setCurrentTool}
        color={color}
        setColor={setColor}
        strokeWidth={strokeWidth}
        setStrokeWidth={setStrokeWidth}
      />

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          cursor: getCursorStyle(currentTool),
        }}
      />

      {[...otherCursors.values()].map((cursor) => (
        <div
          key={cursor.userId}
          style={{
            position: 'absolute',
            left: cursor.x + 72,
            top: cursor.y,
            pointerEvents: 'none',
            zIndex: 200,
            transform: 'translate(-2px, -2px)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16">
            <path d="M2 2 L14 8 L8 9 L6 14 Z" fill={cursor.color} stroke="#fff" strokeWidth="1" />
          </svg>
          <div
            style={{
              position: 'absolute',
              left: 14,
              top: -2,
              backgroundColor: 'rgba(51,51,51,0.85)',
              color: '#fff',
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
            }}
          >
            {cursor.userName}
          </div>
        </div>
      ))}

      {textInputPos && (
        <input
          ref={textInputRef}
          type="text"
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          onBlur={handleTextSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTextSubmit();
            if (e.key === 'Escape') {
              setTextInputPos(null);
              setTextValue('');
            }
          }}
          style={{
            position: 'absolute',
            left: textInputPos.x + 72,
            top: textInputPos.y,
            fontSize: `${16 + strokeWidth * 2}px`,
            color,
            border: `1px dashed ${color}`,
            background: 'transparent',
            outline: 'none',
            padding: '2px',
            zIndex: 300,
            fontFamily: 'sans-serif',
          }}
          autoFocus
        />
      )}

      <div
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          zIndex: 100,
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            padding: '8px 16px',
            borderRadius: 8,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            fontSize: '13px',
            color: '#555',
          }}
        >
          元素数量: <strong style={{ color: '#1976d2' }}>{elements.length}</strong>
        </div>

        <button
          onClick={handleUndo}
          disabled={undoStack.length === 0}
          title="撤销 (Ctrl+Z)"
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            border: 'none',
            backgroundColor: undoStack.length === 0 ? '#e0e0e0' : '#fff',
            color: undoStack.length === 0 ? '#9e9e9e' : '#333',
            fontSize: 20,
            cursor: undoStack.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.15s ease',
          }}
          onMouseDown={(e) => {
            if (undoStack.length > 0) e.currentTarget.style.transform = 'scale(0.92)';
          }}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          ↶
        </button>

        <button
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          title="重做 (Ctrl+Y)"
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            border: 'none',
            backgroundColor: redoStack.length === 0 ? '#e0e0e0' : '#fff',
            color: redoStack.length === 0 ? '#9e9e9e' : '#333',
            fontSize: 20,
            cursor: redoStack.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.15s ease',
          }}
          onMouseDown={(e) => {
            if (redoStack.length > 0) e.currentTarget.style.transform = 'scale(0.92)';
          }}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          ↷
        </button>

        <div style={{ width: 8 }} />

        <button
          onClick={handleSave}
          title="保存为JSON"
          style={{
            padding: '0 16px',
            height: 44,
            borderRadius: 8,
            border: 'none',
            backgroundColor: '#1976d2',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(25,118,210,0.3)',
            transition: 'all 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          💾 保存
        </button>

        <button
          onClick={handleLoadClick}
          title="加载JSON"
          style={{
            padding: '0 16px',
            height: 44,
            borderRadius: 8,
            border: '1px solid #1976d2',
            backgroundColor: '#fff',
            color: '#1976d2',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            transition: 'all 0.15s ease',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.96)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          📂 加载
        </button>

        <input ref={fileInputRef} type="file" accept=".json" onChange={handleLoadFile} style={{ display: 'none' }} />
      </div>

      <div
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          backgroundColor: 'rgba(255,255,255,0.9)',
          padding: '10px 16px',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '12px',
          color: '#555',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: userColorRef.current }} />
        <span>
          用户: <strong style={{ color: userColorRef.current }}>{userNameRef.current}</strong>
        </span>
        <span style={{ color: '#aaa', margin: '0 4px' }}>|</span>
        <span>在线: {otherCursors.size + 1}</span>
      </div>
    </div>
  );
};

export default Whiteboard;
