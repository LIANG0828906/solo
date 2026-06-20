import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { ThumbsUp, MessageSquare } from 'lucide-react';
import type { CanvasElement, DrawPath, Note, Point, ToolType, Comment } from '../types';

interface CanvasProps {
  elements: CanvasElement[];
  currentTool: ToolType;
  currentColor: string;
  brushSize: number;
  selfId: string;
  selfUsername: string;
  onDrawComplete: (path: Omit<DrawPath, 'id' | 'userId' | 'likes' | 'comments' | 'type'>) => void;
  onAddNote: (x: number, y: number) => void;
  onUpdateNote: (id: string, updates: Partial<Note>) => void;
  onLike: (elementId: string) => void;
  onComment: (elementId: string, text: string) => void;
  viewTarget: { x: number; y: number } | null;
}

interface ViewState {
  offsetX: number;
  offsetY: number;
  scale: number;
}

interface HoveredElement {
  id: string;
  type: 'path' | 'note';
  position: { x: number; y: number };
}

export function Canvas({
  elements,
  currentTool,
  currentColor,
  brushSize,
  selfId,
  selfUsername,
  onDrawComplete,
  onAddNote,
  onUpdateNote,
  onLike,
  onComment,
  viewTarget
}: CanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<ViewState>({ offsetX: 0, offsetY: 0, scale: 1 });
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [isPanning, setIsPanning] = useState(false);
  const [spacePressed, setSpacePressed] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<HoveredElement | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [commentForElement, setCommentForElement] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');

  const viewRef = useRef(view);
  viewRef.current = view;

  const paths = useMemo(() => elements.filter((el): el is DrawPath => el.type === 'path'), [elements]);
  const notes = useMemo(() => elements.filter((el): el is Note => el.type === 'note'), [elements]);

  const screenToCanvas = useCallback((screenX: number, screenY: number): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const v = viewRef.current;
    return {
      x: (screenX - rect.left - v.offsetX) / v.scale,
      y: (screenY - rect.top - v.offsetY) / v.scale
    };
  }, []);

  const redrawOffscreen = useCallback(() => {
    const offscreen = offscreenCanvasRef.current;
    const canvas = canvasRef.current;
    if (!offscreen || !canvas) return;

    const ctx = offscreen.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, offscreen.width, offscreen.height);

    for (const path of paths) {
      if (path.points.length < 2) continue;

      ctx.strokeStyle = path.color;
      ctx.lineWidth = path.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(path.points[0].x, path.points[0].y);

      for (let i = 1; i < path.points.length - 1; i++) {
        const xc = (path.points[i].x + path.points[i + 1].x) / 2;
        const yc = (path.points[i].y + path.points[i + 1].y) / 2;
        ctx.quadraticCurveTo(path.points[i].x, path.points[i].y, xc, yc);
      }

      if (path.points.length >= 2) {
        const last = path.points[path.points.length - 1];
        ctx.lineTo(last.x, last.y);
      }

      ctx.stroke();
    }
  }, [paths]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const offscreen = offscreenCanvasRef.current;
    if (!canvas || !offscreen) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const v = viewRef.current;

    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(v.offsetX, v.offsetY);
    ctx.scale(v.scale, v.scale);

    ctx.drawImage(offscreen, 0, 0);

    if (isDrawing && currentPath.length > 1) {
      ctx.strokeStyle = currentTool === 'eraser' ? '#1e1e1e' : currentColor;
      ctx.lineWidth = currentTool === 'eraser' ? brushSize * 3 : brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.globalCompositeOperation = currentTool === 'eraser' ? 'destination-out' : 'source-over';

      ctx.beginPath();
      ctx.moveTo(currentPath[0].x, currentPath[0].y);

      for (let i = 1; i < currentPath.length - 1; i++) {
        const xc = (currentPath[i].x + currentPath[i + 1].x) / 2;
        const yc = (currentPath[i].y + currentPath[i + 1].y) / 2;
        ctx.quadraticCurveTo(currentPath[i].x, currentPath[i].y, xc, yc);
      }

      if (currentPath.length >= 2) {
        const last = currentPath[currentPath.length - 1];
        ctx.lineTo(last.x, last.y);
      }

      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
  }, [isDrawing, currentPath, currentColor, brushSize, currentTool]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      if (!offscreenCanvasRef.current) {
        offscreenCanvasRef.current = document.createElement('canvas');
      }
      offscreenCanvasRef.current.width = 4000;
      offscreenCanvasRef.current.height = 4000;

      redrawOffscreen();
      render();
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redrawOffscreen, render]);

  useEffect(() => {
    redrawOffscreen();
    render();
  }, [redrawOffscreen, render]);

  useEffect(() => {
    let animFrame: number;
    const animate = () => {
      render();
      animFrame = requestAnimationFrame(animate);
    };
    animFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrame);
  }, [render]);

  useEffect(() => {
    if (!viewTarget) return;

    const startX = viewRef.current.offsetX;
    const startY = viewRef.current.offsetY;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const targetX = rect.width / 2 - viewTarget.x * viewRef.current.scale;
    const targetY = rect.height / 2 - viewTarget.y * viewRef.current.scale;

    const duration = 500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      setView((v) => ({
        ...v,
        offsetX: startX + (targetX - startX) * easeProgress,
        offsetY: startY + (targetY - startY) * easeProgress
      }));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [viewTarget]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;

    const canvasPoint = screenToCanvas(e.clientX, e.clientY);

    if (spacePressed) {
      setIsPanning(true);
      return;
    }

    if (currentTool === 'brush' || currentTool === 'eraser') {
      setIsDrawing(true);
      setCurrentPath([canvasPoint]);
    } else if (currentTool === 'note') {
      onAddNote(canvasPoint.x, canvasPoint.y);
    } else if (currentTool === 'like' && hoveredElement) {
      onLike(hoveredElement.id);
    } else if (currentTool === 'comment' && hoveredElement) {
      setCommentForElement(hoveredElement.id);
      setCommentText('');
    }
  }, [currentTool, spacePressed, screenToCanvas, hoveredElement, onAddNote, onLike]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const canvasPoint = screenToCanvas(e.clientX, e.clientY);

    if (isPanning) {
      setView((v) => ({
        ...v,
        offsetX: v.offsetX + e.movementX,
        offsetY: v.offsetY + e.movementY
      }));
      return;
    }

    if (isDrawing) {
      setCurrentPath((prev) => [...prev, canvasPoint]);
      return;
    }

    let found: HoveredElement | null = null;

    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i];
      if (
        canvasPoint.x >= note.x &&
        canvasPoint.x <= note.x + note.width &&
        canvasPoint.y >= note.y &&
        canvasPoint.y <= note.y + note.height
      ) {
        found = {
          id: note.id,
          type: 'note',
          position: { x: note.x + note.width / 2, y: note.y }
        };
        break;
      }
    }

    if (!found) {
      for (let i = paths.length - 1; i >= 0; i--) {
        const path = paths[i];
        if (path.points.length === 0) continue;

        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const p of path.points) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }

        const padding = path.width + 10;
        if (
          canvasPoint.x >= minX - padding &&
          canvasPoint.x <= maxX + padding &&
          canvasPoint.y >= minY - padding &&
          canvasPoint.y <= maxY + padding
        ) {
          found = {
            id: path.id,
            type: 'path',
            position: { x: (minX + maxX) / 2, y: minY - 10 }
          };
          break;
        }
      }
    }

    setHoveredElement(found);
  }, [isDrawing, isPanning, screenToCanvas, paths, notes]);

  const handleMouseUp = useCallback(() => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (isDrawing && currentPath.length > 1) {
      onDrawComplete({
        points: currentPath,
        color: currentTool === 'eraser' ? '#1e1e1e' : currentColor,
        width: currentTool === 'eraser' ? brushSize * 3 : brushSize
      });
    }

    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, isPanning, currentPath, currentColor, brushSize, currentTool, onDrawComplete]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;

    setView((v) => {
      const newScale = Math.max(0.5, Math.min(5, v.scale * zoomFactor));
      const scaleDiff = newScale / v.scale;

      return {
        scale: newScale,
        offsetX: mouseX - (mouseX - v.offsetX) * scaleDiff,
        offsetY: mouseY - (mouseY - v.offsetY) * scaleDiff
      };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        setSpacePressed(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const handleNoteDoubleClick = useCallback((noteId: string) => {
    setEditingNoteId(noteId);
  }, []);

  const handleNoteTextChange = useCallback((noteId: string, text: string) => {
    onUpdateNote(noteId, { text: text.slice(0, 200) });
  }, [onUpdateNote]);

  const handleNoteDragStart = useCallback((noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingNoteId === noteId) return;

    const note = notes.find((n) => n.id === noteId);
    if (!note) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const startNoteX = note.x;
    const startNoteY = note.y;

    const handleMove = (moveEvent: MouseEvent) => {
      const dx = (moveEvent.clientX - startX) / viewRef.current.scale;
      const dy = (moveEvent.clientY - startY) / viewRef.current.scale;
      onUpdateNote(noteId, { x: startNoteX + dx, y: startNoteY + dy });
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  }, [notes, editingNoteId, onUpdateNote]);

  const handleSubmitComment = useCallback(() => {
    if (commentForElement && commentText.trim() && commentText.length <= 100) {
      onComment(commentForElement, commentText.trim());
      setCommentText('');
      setCommentForElement(null);
    }
  }, [commentForElement, commentText, onComment]);

  const getElementById = useCallback(
    (id: string): CanvasElement | undefined => {
      return elements.find((el) => el.id === id);
    },
    [elements]
  );

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        cursor: spacePressed ? 'grab' : isPanning ? 'grabbing' : 'crosshair',
        backgroundColor: '#1e1e1e'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          pointerEvents: 'none',
          transform: `translate(${view.offsetX}px, ${view.offsetY}px) scale(${view.scale})`,
          transformOrigin: '0 0',
          width: 4000,
          height: 4000
        }}
      >
        {notes.map((note) => (
          <div
            key={note.id}
            style={{
              position: 'absolute',
              left: note.x,
              top: note.y,
              width: editingNoteId === note.id ? 200 : note.width,
              height: editingNoteId === note.id ? 200 : note.height,
              backgroundColor: note.color,
              boxShadow: '4px 4px 12px rgba(0,0,0,0.3)',
              borderRadius: 4,
              padding: 12,
              cursor: editingNoteId === note.id ? 'text' : 'move',
              transition: 'width 250ms ease, height 250ms ease',
              pointerEvents: 'auto',
              userSelect: 'none',
              color: '#333',
              fontSize: 13,
              lineHeight: 1.4,
              overflow: 'hidden'
            }}
            onMouseDown={(e) => handleNoteDragStart(note.id, e)}
            onDoubleClick={() => handleNoteDoubleClick(note.id)}
          >
            {editingNoteId === note.id ? (
              <textarea
                value={note.text}
                onChange={(e) => handleNoteTextChange(note.id, e.target.value)}
                onBlur={() => setEditingNoteId(null)}
                autoFocus
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  background: 'transparent',
                  resize: 'none',
                  outline: 'none',
                  fontSize: 13,
                  color: '#333',
                  fontFamily: 'inherit'
                }}
                maxLength={200}
              />
            ) : (
              <div style={{ wordWrap: 'break-word', whiteSpace: 'pre-wrap' }}>
                {note.text || '双击编辑便签'}
              </div>
            )}

            {note.likes.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 6,
                  left: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  color: 'rgba(0,0,0,0.6)'
                }}
              >
                <ThumbsUp size={12} fill="currentColor" />
                {note.likes.length}
              </div>
            )}

            {note.comments.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 6,
                  right: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  maxWidth: 'calc(100% - 16px)'
                }}
              >
                {note.comments.slice(-3).map((c) => (
                  <div
                    key={c.id}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      borderRadius: 4,
                      padding: '4px 8px',
                      fontSize: 11,
                      color: '#333',
                      wordBreak: 'break-word'
                    }}
                  >
                    <b>{c.username}:</b> {c.text}
                  </div>
                ))}
                {note.comments.length > 3 && (
                  <div style={{ fontSize: 10, color: 'rgba(0,0,0,0.5)', textAlign: 'right' }}>
                    +{note.comments.length - 3} 更多
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {hoveredElement && (currentTool === 'like' || currentTool === 'comment') && (
        <div
          style={{
            position: 'absolute',
            left:
              view.offsetX +
              hoveredElement.position.x * view.scale,
            top:
              view.offsetY +
              hoveredElement.position.y * view.scale -
              40,
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 8,
            pointerEvents: 'auto',
            zIndex: 10
          }}
        >
          <button
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: getElementById(hoveredElement.id)?.likes.includes(selfId)
                ? '#64b5f6'
                : 'rgba(50, 50, 50, 0.9)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 200ms ease, background-color 200ms ease'
            }}
            onClick={() => onLike(hoveredElement.id)}
            title="点赞"
          >
            <ThumbsUp size={16} fill={getElementById(hoveredElement.id)?.likes.includes(selfId) ? 'white' : 'none'} />
          </button>
          <button
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              backgroundColor: 'rgba(50, 50, 50, 0.9)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 200ms ease, background-color 200ms ease'
            }}
            onClick={() => {
              setCommentForElement(hoveredElement.id);
              setCommentText('');
            }}
            title="评论"
          >
            <MessageSquare size={16} />
          </button>
        </div>
      )}

      {commentForElement && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: '#2a2a2a',
            borderRadius: 8,
            padding: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            zIndex: 100,
            width: 300,
            pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ marginBottom: 12, color: '#e0e0e0', fontSize: 14, fontWeight: 600 }}>添加评论</div>
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value.slice(0, 100))}
            placeholder="输入评论内容..."
            autoFocus
            style={{
              width: '100%',
              height: 80,
              padding: 8,
              borderRadius: 4,
              border: '1px solid #444',
              backgroundColor: '#1e1e1e',
              color: '#e0e0e0',
              resize: 'none',
              outline: 'none',
              fontSize: 13,
              fontFamily: 'inherit'
            }}
            maxLength={100}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: '#666' }}>{commentText.length}/100</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => {
                  setCommentForElement(null);
                  setCommentText('');
                }}
                style={{
                  padding: '6px 16px',
                  borderRadius: 4,
                  border: '1px solid #444',
                  backgroundColor: 'transparent',
                  color: '#aaa',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                取消
              </button>
              <button
                onClick={handleSubmitComment}
                style={{
                  padding: '6px 16px',
                  borderRadius: 4,
                  border: 'none',
                  backgroundColor: '#64b5f6',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 12
                }}
              >
                发送
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          backgroundColor: 'rgba(30, 30, 30, 0.8)',
          padding: '6px 12px',
          borderRadius: 4,
          fontSize: 12,
          color: '#aaa'
        }}
      >
        {Math.round(view.scale * 100)}%
      </div>
    </div>
  );
}
