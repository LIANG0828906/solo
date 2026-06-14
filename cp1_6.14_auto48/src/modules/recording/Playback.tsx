import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RecordedAction, Stroke, StickyNote, BoardImage, GRID_SIZE, MAX_FPS, PLAYBACK_MIN_FPS } from '../../types';

interface PlaybackProps {
  onClose: () => void;
}

interface PlaybackRuntimeState {
  strokes: Stroke[];
  stickies: StickyNote[];
  images: BoardImage[];
}

function drawSmoothStroke(
  ctx: CanvasRenderingContext2D,
  stroke: Stroke
): void {
  if (stroke.points.length < 2) return;

  const pts = stroke.points;
  const color = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color;
  const baseWidth = stroke.tool === 'eraser' ? stroke.width * 3 : stroke.width;

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = baseWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (stroke.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out';
  }

  if (pts.length === 2) {
    const p0 = pts[0];
    const p1 = pts[1];
    const cx = (p0.x + p1.x) / 2;
    const cy = (p0.y + p1.y) / 2;
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p0.x, p0.y, cx, cy);
    ctx.quadraticCurveTo(p1.x, p1.y, p1.x, p1.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    return;
  }

  if (pts.length === 3) {
    const p0 = pts[0];
    const p1 = pts[1];
    const p2 = pts[2];
    const c1x = p0.x + (p1.x - p0.x) * 0.5;
    const c1y = p0.y + (p1.y - p0.y) * 0.5;
    const c2x = p1.x + (p2.x - p1.x) * 0.5;
    const c2y = p1.y + (p2.y - p1.y) * 0.5;
    ctx.moveTo(p0.x, p0.y);
    ctx.quadraticCurveTo(p0.x, p0.y, c1x, c1y);
    ctx.quadraticCurveTo(p1.x, p1.y, c2x, c2y);
    ctx.quadraticCurveTo(p2.x, p2.y, p2.x, p2.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    return;
  }

  ctx.moveTo(pts[0].x, pts[0].y);
  const cp1x = pts[0].x + (pts[1].x - pts[0].x) / 3;
  const cp1y = pts[0].y + (pts[1].y - pts[0].y) / 3;
  ctx.quadraticCurveTo(cp1x, cp1y, pts[1].x, pts[1].y);

  for (let i = 1; i < pts.length - 2; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    const next = pts[i + 1];
    const next2 = pts[i + 2];
    const v1x = curr.x - prev.x;
    const v1y = curr.y - prev.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const v3x = next2.x - next.x;
    const v3y = next2.y - next.y;
    const c1x = curr.x + (v2x + v1x * 0.15) / 3;
    const c1y = curr.y + (v2y + v1y * 0.15) / 3;
    const c2x = next.x - (v3x + v2x * 0.15) / 3;
    const c2y = next.y - (v3y + v2y * 0.15) / 3;
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    ctx.bezierCurveTo(c1x, c1y, c2x, c2y, midX, midY);
  }

  const last = pts[pts.length - 1];
  const lastPrev = pts[pts.length - 2];
  const cpLx = lastPrev.x + (last.x - lastPrev.x) * 2 / 3;
  const cpLy = lastPrev.y + (last.y - lastPrev.y) * 2 / 3;
  ctx.quadraticCurveTo(cpLx, cpLy, last.x, last.y);

  ctx.stroke();
  ctx.globalCompositeOperation = 'source-over';
}

function applyActionToRuntime(state: PlaybackRuntimeState, action: RecordedAction): void {
  const { type, params } = action;
  switch (type) {
    case 'draw':
    case 'erase':
      if (params.stroke) state.strokes.push(params.stroke as Stroke);
      break;
    case 'addSticky':
      if (params.note) state.stickies.push(params.note as StickyNote);
      break;
    case 'moveSticky': {
      const { id, x, y } = params as { id: string; x: number; y: number };
      const s = state.stickies.find((n) => n.id === id);
      if (s) { s.x = x; s.y = y; }
      break;
    }
    case 'updateStickyText': {
      const { id, text } = params as { id: string; text: string };
      const s = state.stickies.find((n) => n.id === id);
      if (s) s.text = text;
      break;
    }
    case 'deleteSticky': {
      const { id } = params as { id: string };
      const idx = state.stickies.findIndex((n) => n.id === id);
      if (idx >= 0) state.stickies.splice(idx, 1);
      break;
    }
    case 'addImage':
      if (params.image) state.images.push(params.image as BoardImage);
      break;
    case 'moveImage': {
      const { id, x, y } = params as { id: string; x: number; y: number };
      const im = state.images.find((n) => n.id === id);
      if (im) { im.x = x; im.y = y; }
      break;
    }
    case 'deleteImage': {
      const { id } = params as { id: string };
      const idx = state.images.findIndex((n) => n.id === id);
      if (idx >= 0) state.images.splice(idx, 1);
      break;
    }
  }
}

const Playback: React.FC<PlaybackProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [actions, setActions] = useState<RecordedAction[]>([]);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  const animFrameRef = useRef<number>(0);
  const baseTimestampRef = useRef(0);
  const virtualPlaybackMsRef = useRef(0);
  const lastFrameTimestampRef = useRef(0);
  const driftRef = useRef(0);
  const actionIndexRef = useRef(0);
  const runtimeStateRef = useRef<PlaybackRuntimeState>({ strokes: [], stickies: [], images: [] });
  const speedRef = useRef(speed);
  const actionsRef = useRef(actions);
  const totalDurationRef = useRef(totalDuration);
  const minFrameInterval = 1000 / MAX_FPS;

  useEffect(() => { actionsRef.current = actions; }, [actions]);
  useEffect(() => { speedRef.current = speed; }, [speed]);
  useEffect(() => { totalDurationRef.current = totalDuration; }, [totalDuration]);

  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = runtimeStateRef.current;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, 0);
      ctx.lineTo(x + 0.5, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }

    state.strokes.forEach((stroke) => drawSmoothStroke(ctx, stroke));

    state.stickies.forEach((note) => {
      const w = note.width || 180;
      const h = note.height || 140;
      ctx.fillStyle = note.color || '#FEF08A';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.fillRect(note.x, note.y, w, h);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#334155';
      ctx.font = '14px sans-serif';
      const lines = (note.text || '').split('\n');
      lines.slice(0, 8).forEach((line, i) => {
        ctx.fillText(line.slice(0, Math.floor((w - 16) / 9)), note.x + 8, note.y + 24 + i * 18, w - 16);
      });
    });

    state.images.forEach((imgItem) => {
      const image = new window.Image();
      image.src = imgItem.src;
      if (image.complete) {
        try { ctx.drawImage(image, imgItem.x, imgItem.y, imgItem.width, imgItem.height); } catch {}
      } else {
        image.onload = () => {
          try {
            const ctx2 = canvasRef.current?.getContext('2d');
            if (ctx2) ctx2.drawImage(image, imgItem.x, imgItem.y, imgItem.width, imgItem.height);
          } catch {}
        };
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      redrawCanvas();
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, [redrawCanvas]);

  const buildRuntimeToTarget = useCallback((targetMs: number): PlaybackRuntimeState => {
    const runtime: PlaybackRuntimeState = { strokes: [], stickies: [], images: [] };
    const list = actionsRef.current;
    for (let i = 0; i < list.length; i++) {
      if (list[i].timestamp > targetMs) break;
      applyActionToRuntime(runtime, list[i]);
    }
    return runtime;
  }, []);

  const seekTo = useCallback((pct: number) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    setPlaying(false);
    const targetMs = (pct / 100) * totalDurationRef.current;
    actionIndexRef.current = 0;
    driftRef.current = 0;
    baseTimestampRef.current = 0;
    lastFrameTimestampRef.current = 0;
    virtualPlaybackMsRef.current = targetMs;
    const runtime = buildRuntimeToTarget(targetMs);
    runtimeStateRef.current = runtime;
    setProgress(pct);
    setCurrentTime(targetMs);
    redrawCanvas();
  }, [buildRuntimeToTarget, redrawCanvas]);

  const loadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data: RecordedAction[] = JSON.parse(text);
      data.sort((a, b) => a.timestamp - b.timestamp);
      setActions(data);
      actionsRef.current = data;
      const dur = data.length > 0 ? data[data.length - 1].timestamp : 0;
      setTotalDuration(dur);
      totalDurationRef.current = dur;
      actionIndexRef.current = 0;
      virtualPlaybackMsRef.current = 0;
      driftRef.current = 0;
      runtimeStateRef.current = { strokes: [], stickies: [], images: [] };
      setProgress(0);
      setCurrentTime(0);
      setPlaying(false);
      redrawCanvas();
    } catch {
      alert('无效的录制文件');
    }
  };

  const play = useCallback(() => {
    if (actionsRef.current.length === 0) return;

    if (totalDurationRef.current > 0 && virtualPlaybackMsRef.current >= totalDurationRef.current - 1) {
      actionIndexRef.current = 0;
      virtualPlaybackMsRef.current = 0;
      runtimeStateRef.current = { strokes: [], stickies: [], images: [] };
    }

    baseTimestampRef.current = performance.now();
    driftRef.current = 0;
    lastFrameTimestampRef.current = baseTimestampRef.current;

    setPlaying(true);

    const loop = (now: number) => {
      const realElapsed = now - baseTimestampRef.current;
      const idealVirtualTime = realElapsed * speedRef.current + virtualPlaybackMsRef.current;
      driftRef.current = idealVirtualTime - virtualPlaybackMsRef.current;

      virtualPlaybackMsRef.current += driftRef.current;

      const list = actionsRef.current;
      const state = runtimeStateRef.current;
      let idx = actionIndexRef.current;
      while (idx < list.length && list[idx].timestamp <= virtualPlaybackMsRef.current) {
        applyActionToRuntime(state, list[idx]);
        idx++;
      }
      actionIndexRef.current = idx;

      const elapsed = now - lastFrameTimestampRef.current;
      if (elapsed >= minFrameInterval) {
        setCurrentTime(virtualPlaybackMsRef.current);
        const pct = totalDurationRef.current > 0 ? Math.min(100, (virtualPlaybackMsRef.current / totalDurationRef.current) * 100) : 0;
        setProgress(pct);
        redrawCanvas();
        lastFrameTimestampRef.current = now;
      }

      if (idx < list.length) {
        animFrameRef.current = requestAnimationFrame(loop);
      } else {
        if (totalDurationRef.current > 0) {
          setCurrentTime(totalDurationRef.current);
          setProgress(100);
        }
        setPlaying(false);
        virtualPlaybackMsRef.current = totalDurationRef.current;
        redrawCanvas();
        animFrameRef.current = 0;
      }
    };

    animFrameRef.current = requestAnimationFrame(loop);
  }, [redrawCanvas, minFrameInterval]);

  const pause = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = 0;
    }
    setPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const formatTime = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="playback-container">
      <div className="playback-header">
        <h3>回放</h3>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>
      <div ref={containerRef} className="playback-canvas-wrap">
        <canvas ref={canvasRef} />
      </div>
      <div className="playback-controls">
        <label className="file-load-btn">
          加载录制文件
          <input type="file" accept=".json" onChange={loadFile} hidden />
        </label>
        {actions.length > 0 && (
          <>
            <button className="play-btn" onClick={playing ? pause : play}>
              {playing ? '⏸' : '▶'}
            </button>
            <div className="progress-wrap">
              <input
                type="range"
                min="0"
                max="100"
                step="0.01"
                value={progress}
                onChange={(e) => seekTo(Number(e.target.value))}
                className="progress-bar"
              />
              <span className="time-display">{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
            </div>
            <div className="speed-controls">
              {[1, 2, 4].map((s) => (
                <button
                  key={s}
                  className={`speed-btn ${speed === s ? 'active' : ''}`}
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Playback;
