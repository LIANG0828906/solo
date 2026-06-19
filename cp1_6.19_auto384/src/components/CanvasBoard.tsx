import React, { useRef, useEffect, useCallback, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import useDrawingStore, { Point, DrawAction, CursorInfo } from '@/store/drawingStore';

const ERASER_SIZE = 50;

interface CanvasBoardProps {
  socketRef: React.MutableRefObject<Socket | null>;
}

const CanvasBoard: React.FC<CanvasBoardProps> = ({ socketRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<Point | null>(null);
  const currentActionIdRef = useRef<string | null>(null);
  const currentActionRef = useRef<DrawAction | null>(null);

  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  const {
    color,
    thickness,
    mode,
    actions,
    remoteActions,
    remoteCursors,
    currentSessionId,
    userId,
    isPlaying,
    playActions,
    playIndex,
    setUserId,
    addLocalAction,
    initRemoteAction,
    addRemoteActionPart,
    addRemoteAction,
    setActions,
    clearCanvas,
    setRemoteCursor,
    removeRemoteCursor,
    setCursors,
    setSessions,
    setCurrentSession,
    updateSessionActionCount,
    setIsPlaying,
    setPlayIndex,
    stopPlayback,
  } = useDrawingStore();

  const getCanvasPoint = useCallback((e: MouseEvent | TouchEvent): Point | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
      timestamp: Date.now(),
    };
  }, []);

  const drawLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: Point,
      to: Point,
      actionColor: string,
      actionThickness: number,
      actionMode: 'brush' | 'eraser'
    ) => {
      ctx.save();
      ctx.beginPath();

      if (actionMode === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = ERASER_SIZE;
        ctx.strokeStyle = 'rgba(255,255,255,1)';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = actionThickness;
        ctx.strokeStyle = actionColor;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }

      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  const drawPoint = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      point: Point,
      actionColor: string,
      actionThickness: number,
      actionMode: 'brush' | 'eraser'
    ) => {
      ctx.save();
      ctx.beginPath();

      if (actionMode === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.arc(point.x, point.y, ERASER_SIZE / 2, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,1)';
        ctx.fill();
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.arc(point.x, point.y, actionThickness / 2, 0, Math.PI * 2);
        ctx.fillStyle = actionColor;
        ctx.fill();
      }

      ctx.restore();
    },
    []
  );

  const drawAction = useCallback(
    (ctx: CanvasRenderingContext2D, action: DrawAction) => {
      if (action.points.length === 0) return;

      if (action.points.length === 1) {
        drawPoint(ctx, action.points[0], action.color, action.thickness, action.mode);
        return;
      }

      for (let i = 1; i < action.points.length; i++) {
        drawLine(ctx, action.points[i - 1], action.points[i], action.color, action.thickness, action.mode);
      }
    },
    [drawLine, drawPoint]
  );

  const redrawAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const allActions = [...actions, ...remoteActions];

    if (isPlaying) {
      for (let i = 0; i <= playIndex && i < playActions.length; i++) {
        drawAction(ctx, playActions[i]);
      }
    } else {
      allActions.forEach((action) => {
        drawAction(ctx, action);
      });
    }
  }, [actions, remoteActions, isPlaying, playActions, playIndex, drawAction]);

  useEffect(() => {
    const updateSize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const width = container.clientWidth;
      const height = container.clientHeight;

      const tempCanvas = document.createElement('canvas');
      const tempCtx = tempCanvas.getContext('2d');
      if (tempCtx) {
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        tempCtx.drawImage(canvas, 0, 0);
      }

      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;

      setCanvasSize({ width: canvas.width, height: canvas.height });
      redrawAll();
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    redrawAll();
  }, [actions, remoteActions, isPlaying, playIndex, playActions, redrawAll]);

  useEffect(() => {
    if (!isPlaying) return;

    if (playIndex >= playActions.length - 1) {
      setIsPlaying(false);
      return;
    }

    const currentAction = playActions[playIndex];
    const nextAction = playActions[playIndex + 1];

    if (!currentAction || !nextAction) {
      setPlayIndex(playIndex + 1);
      return;
    }

    const delay = Math.min(nextAction.startTime - currentAction.endTime, 100);
    const adjustedDelay = Math.max(delay, 30);

    const timer = setTimeout(() => {
      setPlayIndex(playIndex + 1);
    }, adjustedDelay);

    return () => clearTimeout(timer);
  }, [isPlaying, playIndex, playActions, setIsPlaying, setPlayIndex]);

  useEffect(() => {
    const socket: Socket = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('user-connected', ({ userId: id, color }: { userId: string; color: string }) => {
      setUserId(id, color);
    });

    socket.on('sessions-list', (sessions: any[]) => {
      setSessions(sessions);
      if (sessions.length > 0 && !currentSessionId) {
        const first = sessions[0];
        setCurrentSession(first.id, first.name);
        socket.emit('join-session', first.id);
      }
    });

    socket.on('session-data', (data: { id: string; name: string; actions: DrawAction[] }) => {
      setActions(data.actions);
    });

    socket.on('cursors-update', (cursors: CursorInfo[]) => {
      setCursors(cursors);
    });

    socket.on('cursor-move', (cursor: CursorInfo) => {
      setRemoteCursor(cursor);
    });

    socket.on('cursor-disconnected', (uid: string) => {
      removeRemoteCursor(uid);
    });

    socket.on('draw-start', (action: DrawAction) => {
      initRemoteAction(action);
    });

    socket.on('draw-continue', ({ actionId, point }: { actionId: string; point: Point }) => {
      addRemoteActionPart(actionId, point);
    });

    socket.on('draw-end', ({ actionId, point }: { actionId: string; point: Point }) => {
      addRemoteActionPart(actionId, point);
    });

    socket.on('canvas-cleared', () => {
      clearCanvas();
    });

    socket.on('session-updated', ({ id, actionCount }: { id: string; actionCount: number }) => {
      updateSessionActionCount(id, actionCount);
    });

    socket.on('session-created', (sessionId: string) => {
      setCurrentSession(sessionId, '新画布');
      socket.emit('join-session', sessionId);
    });

    return () => {
      socket.disconnect();
    };
  }, [socketRef, setUserId, setSessions, setCurrentSession, setActions, setCursors, setRemoteCursor, removeRemoteCursor, initRemoteAction, addRemoteActionPart, clearCanvas, updateSessionActionCount, currentSessionId]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (isPlaying) return;

      const point = getCanvasPoint(e.nativeEvent as MouseEvent | TouchEvent);
      if (!point) return;

      isDrawingRef.current = true;
      lastPointRef.current = point;

      const actionId = uuidv4();
      currentActionIdRef.current = actionId;

      const drawAction: DrawAction = {
        id: actionId,
        sessionId: currentSessionId || '',
        userId: userId || '',
        color,
        thickness,
        mode,
        points: [point],
        startTime: point.timestamp,
        endTime: point.timestamp,
      };

      currentActionRef.current = drawAction;

      socketRef.current?.emit('draw-start', {
        color,
        thickness,
        mode,
        point,
      });

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawPoint(ctx, point, color, thickness, mode);
        }
      }
    },
    [isPlaying, getCanvasPoint, currentSessionId, userId, color, thickness, mode, socketRef, drawPoint]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const point = getCanvasPoint(e.nativeEvent as MouseEvent | TouchEvent);
      if (!point) return;

      socketRef.current?.emit('cursor-move', { x: point.x, y: point.y });

      if (!isDrawingRef.current || !lastPointRef.current) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      drawLine(ctx, lastPointRef.current, point, color, thickness, mode);

      if (currentActionRef.current) {
        currentActionRef.current.points.push(point);
        currentActionRef.current.endTime = point.timestamp;
      }

      socketRef.current?.emit('draw-continue', point);

      lastPointRef.current = point;
    },
    [getCanvasPoint, socketRef, color, thickness, mode, drawLine]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawingRef.current) return;

      let point = getCanvasPoint(e.nativeEvent as MouseEvent | TouchEvent);
      if (!point) {
        point = lastPointRef.current || { x: 0, y: 0, timestamp: Date.now() };
      }

      isDrawingRef.current = false;

      if (currentActionRef.current) {
        currentActionRef.current.points.push(point);
        currentActionRef.current.endTime = point.timestamp;
        addLocalAction(currentActionRef.current);
      }

      socketRef.current?.emit('draw-end', point);

      lastPointRef.current = null;
      currentActionIdRef.current = null;
      currentActionRef.current = null;
    },
    [getCanvasPoint, socketRef, addLocalAction]
  );

  const handleMouseLeave = useCallback(
    (e: React.MouseEvent) => {
      if (isDrawingRef.current) {
        handleMouseUp(e);
      }
    },
    [handleMouseUp]
  );

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        cursor: isPlaying ? 'default' : mode === 'eraser' ? 'cell' : 'crosshair',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      />

      {Object.values(remoteCursors).map((cursor) => (
        <div
          key={cursor.userId}
          style={{
            position: 'absolute',
            left: (cursor.x / canvasSize.width) * 100 + '%',
            top: (cursor.y / canvasSize.height) * 100 + '%',
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: cursor.color,
            opacity: 0.7,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 100,
            boxShadow: `0 0 8px ${cursor.color}`,
            border: '2px solid white',
          }}
        />
      ))}

      {isPlaying && (
        <div
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            backgroundColor: 'rgba(30, 30, 30, 0.9)',
            color: 'white',
            padding: '8px 16px',
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 1000,
            boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          }}
        >
          <i className="fa-solid fa-play" style={{ color: '#2196F6' }} />
          <span style={{ fontSize: 14 }}>
            回放中 {playIndex + 1} / {playActions.length}
          </span>
          <button
            onClick={() => stopPlayback()}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}
    </div>
  );
};

export default CanvasBoard;
