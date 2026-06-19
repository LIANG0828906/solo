import { useState, useRef, useEffect, useCallback } from 'react';

type DrawPoint = {
  x: number;
  y: number;
  color: string;
  size: number;
  timestamp: number;
};

type OnlineUser = {
  id: string;
  name: string;
  avatarColor: string;
  avatarPattern: number[];
};

type RecordingData = {
  strokes: { strokeId: string; userId: string; points: DrawPoint[] }[];
  startTime: number;
  endTime: number;
};

const PRESET_COLORS = [
  '#000000', '#e53935', '#fb8c00', '#fdd835',
  '#43a047', '#00acc1', '#1e88e5', '#8e24aa',
  '#ec407a', '#6d4c41', '#757575', '#424242',
];

const AVATAR_COLORS = ['#e53935', '#fb8c00', '#43a047', '#1e88e5', '#8e24aa', '#ec407a'];

function generatePattern(): number[] {
  return Array.from({ length: 9 }, () => Math.random() > 0.5 ? 1 : 0);
}

function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

function generateUserName(): string {
  const names = ['用户A', '用户B', '用户C', '用户D', '用户E', '用户F', '用户G', '用户H'];
  return names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(Math.random() * 100);
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<DrawPoint[]>([]);
  const currentStrokeIdRef = useRef<string>('');
  const recordingStartRef = useRef<number>(0);
  const playbackRafRef = useRef<number>(0);

  const [currentColor, setCurrentColor] = useState('#000000');
  const [currentSize, setCurrentSize] = useState(3);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [myUser] = useState<OnlineUser>(() => ({
    id: generateUserId(),
    name: generateUserName(),
    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
    avatarPattern: generatePattern(),
  }));
  const [isRecording, setIsRecording] = useState(false);
  const [recordingData, setRecordingData] = useState<RecordingData | null>(null);
  const [recordedStrokes, setRecordedStrokes] = useState<{ strokeId: string; userId: string; points: DrawPoint[] }[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);

  const drawPoint = useCallback((ctx: CanvasRenderingContext2D, point: DrawPoint, alpha = 1) => {
    ctx.globalAlpha = alpha;
    ctx.fillStyle = point.color;
    ctx.strokeStyle = point.color;
    ctx.lineWidth = point.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const drawStroke = useCallback((ctx: CanvasRenderingContext2D, points: DrawPoint[], alpha = 1) => {
    if (points.length < 1) return;
    if (points.length === 1) {
      drawPoint(ctx, points[0], alpha);
      return;
    }
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = points[0].color;
    ctx.lineWidth = points[0].size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
  }, [drawPoint]);

  const redrawAll = useCallback((extraAlpha = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (recordingData) {
      recordingData.strokes.forEach(stroke => {
        drawStroke(ctx, stroke.points, 0.15 * extraAlpha);
      });
    }
  }, [drawStroke, recordingData]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawAll();
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [redrawAll]);

  useEffect(() => {
    const bc = new BroadcastChannel('collab-draw');
    bcRef.current = bc;

    bc.onmessage = (event) => {
      const { type, data } = event.data;
      if (type === 'user-join') {
        setOnlineUsers(prev => {
          if (prev.find(u => u.id === data.user.id)) return prev;
          return [...prev, data.user];
        });
        bc.postMessage({ type: 'user-ack', data: { user: myUser, to: data.user.id } });
      } else if (type === 'user-ack') {
        if (data.to === myUser.id) {
          setOnlineUsers(prev => {
            if (prev.find(u => u.id === data.user.id)) return prev;
            return [...prev, data.user];
          });
        }
      } else if (type === 'user-leave') {
        setOnlineUsers(prev => prev.filter(u => u.id !== data.user.id));
      } else if (type === 'draw-stroke') {
        if (data.userId === myUser.id) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        drawStroke(ctx, data.points);
        if (isRecording) {
          setRecordedStrokes(prev => [...prev, {
            strokeId: data.strokeId,
            userId: data.userId,
            points: data.points,
          }]);
        }
      }
    };

    bc.postMessage({ type: 'user-join', data: { user: myUser } });

    const handleBeforeUnload = () => {
      bc.postMessage({ type: 'user-leave', data: { user: myUser } });
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      bc.postMessage({ type: 'user-leave', data: { user: myUser } });
      bc.close();
    };
  }, [myUser, drawStroke, isRecording]);

  const getCanvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): DrawPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      color: currentColor,
      size: currentSize,
      timestamp: Date.now(),
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isPlaying) return;
    isDrawingRef.current = true;
    currentStrokeIdRef.current = 'stroke_' + Math.random().toString(36).substr(2, 9);
    const point = getCanvasPoint(e);
    if (!point) return;
    currentStrokeRef.current = [point];
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) drawPoint(ctx, point);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || isPlaying) return;
    const point = getCanvasPoint(e);
    if (!point) return;
    const prevPoints = currentStrokeRef.current;
    currentStrokeRef.current = [...prevPoints, point];
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    if (prevPoints.length > 0) {
      ctx.strokeStyle = point.color;
      ctx.lineWidth = point.size;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(prevPoints[prevPoints.length - 1].x, prevPoints[prevPoints.length - 1].y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    } else {
      drawPoint(ctx, point);
    }
  };

  const handleMouseUp = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const points = currentStrokeRef.current;
    if (points.length === 0) return;
    const strokeId = currentStrokeIdRef.current;
    bcRef.current?.postMessage({
      type: 'draw-stroke',
      data: { strokeId, userId: myUser.id, points },
    });
    if (isRecording) {
      setRecordedStrokes(prev => [...prev, { strokeId, userId: myUser.id, points }]);
    }
    currentStrokeRef.current = [];
    currentStrokeIdRef.current = '';
  };

  const handleMouseLeave = () => {
    handleMouseUp();
  };

  const startRecording = () => {
    setIsRecording(true);
    setRecordedStrokes([]);
    recordingStartRef.current = Date.now();
  };

  const stopRecording = () => {
    const endTime = Date.now();
    setIsRecording(false);
    setRecordingData({
      strokes: recordedStrokes,
      startTime: recordingStartRef.current,
      endTime,
    });
  };

  const clearCanvas = () => {
    setRecordingData(null);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const startPlayback = useCallback(() => {
    if (!recordingData || recordingData.strokes.length === 0) return;
    setIsPlaying(true);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const allPoints: { point: DrawPoint; strokeIdx: number; pointIdx: number; totalStrokes: number }[] = [];
    recordingData.strokes.forEach((stroke, sIdx) => {
      stroke.points.forEach((pt, pIdx) => {
        allPoints.push({ point: pt, strokeIdx: sIdx, pointIdx: pIdx, totalStrokes: recordingData.strokes.length });
      });
    });
    allPoints.sort((a, b) => a.point.timestamp - b.point.timestamp);

    const startTime = recordingData.startTime;
    const endTime = recordingData.endTime;
    const totalDuration = (endTime - startTime) / 5;
    const startedAt = performance.now();

    const drawnStrokes: Map<string, DrawPoint[]> = new Map();
    let drawnCount = 0;

    const animate = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / totalDuration, 1);
      const targetTimestamp = startTime + (endTime - startTime) * progress;

      while (drawnCount < allPoints.length && allPoints[drawnCount].point.timestamp <= targetTimestamp) {
        const { strokeIdx, pointIdx } = allPoints[drawnCount];
        const stroke = recordingData.strokes[strokeIdx];
        const key = stroke.strokeId;
        if (!drawnStrokes.has(key)) {
          drawnStrokes.set(key, []);
        }
        drawnStrokes.get(key)!.push(stroke.points[pointIdx]);
        drawnCount++;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        playbackRafRef.current = requestAnimationFrame(animate);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        playbackRafRef.current = requestAnimationFrame(animate);
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const fadeStart = Math.max(0, drawnCount - 150);
      drawnStrokes.forEach((pts, key, idx) => {
        const firstPt = pts[0];
        const globalIdx = allPoints.findIndex(p => recordingData.strokes[p.strokeIdx].strokeId === key && p.pointIdx === 0);
        let alpha = 1;
        if (globalIdx < fadeStart) {
          alpha = Math.max(0.15, (globalIdx + 150 - fadeStart) / 150);
        }
        drawStroke(ctx, pts, alpha);
      });

      if (progress < 1) {
        playbackRafRef.current = requestAnimationFrame(animate);
      } else {
        setIsPlaying(false);
      }
    };

    playbackRafRef.current = requestAnimationFrame(animate);
  }, [recordingData, drawStroke]);

  useEffect(() => {
    return () => {
      if (playbackRafRef.current) {
        cancelAnimationFrame(playbackRafRef.current);
      }
    };
  }, []);

  const renderAvatar = (user: OnlineUser, size = 32) => (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 user-avatar"
      style={{
        width: size,
        height: size,
        backgroundColor: user.avatarColor,
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gridTemplateRows: 'repeat(3, 1fr)',
        padding: 3,
      }}
      title={user.name}
    >
      {user.avatarPattern.map((v, i) => (
        <div
          key={i}
          style={{
            backgroundColor: v ? 'rgba(255,255,255,0.5)' : 'transparent',
          }}
        />
      ))}
    </div>
  );

  return (
    <div className="app-container">
      <header className="top-bar">
        <h1 className="app-title">协同画板</h1>
        <div className="user-list">
          <span className="user-label">在线 ({onlineUsers.length + 1})：</span>
          {renderAvatar(myUser)}
          {onlineUsers.map(user => (
            <div key={user.id} className="user-item">
              {renderAvatar(user)}
            </div>
          ))}
        </div>
      </header>

      <main className="main-area">
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            className="draw-canvas"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />
        </div>

        <div className="color-picker">
          {PRESET_COLORS.map(color => (
            <button
              key={color}
              className={`color-swatch ${currentColor === color ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setCurrentColor(color)}
              title={color}
            />
          ))}
          <div className="size-control">
            <span className="size-label">大小</span>
            <input
              type="range"
              min="1"
              max="30"
              value={currentSize}
              onChange={(e) => setCurrentSize(Number(e.target.value))}
              className="size-slider"
            />
            <span className="size-value">{currentSize}px</span>
          </div>
        </div>
      </main>

      <footer className="bottom-bar">
        {!isRecording ? (
          <button className="btn btn-primary" onClick={startRecording} disabled={isPlaying}>
            开始录制
          </button>
        ) : (
          <button className="btn btn-danger" onClick={stopRecording}>
            停止录制
          </button>
        )}
        <button
          className="btn btn-secondary"
          onClick={startPlayback}
          disabled={!recordingData || isPlaying || isRecording}
        >
          {isPlaying ? '回放中...' : '5倍速回放'}
        </button>
        <button className="btn btn-secondary" onClick={clearCanvas} disabled={isPlaying}>
          清空画布
        </button>
        {recordingData && (
          <span className="recording-info">
            已录制 {recordingData.strokes.length} 笔
          </span>
        )}
      </footer>
    </div>
  );
}
