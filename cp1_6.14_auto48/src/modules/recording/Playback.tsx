import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RecordedAction, Stroke, StickyNote, BoardImage, GRID_SIZE } from '../../types';

interface PlaybackProps {
  onClose: () => void;
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
  const startTimeRef = useRef(0);
  const pauseTimeRef = useRef(0);
  const actionIndexRef = useRef(0);
  const actionsRef = useRef(actions);

  useEffect(() => { actionsRef.current = actions; }, [actions]);

  const redrawCanvas = useCallback((strokes: Stroke[], stickies: StickyNote[], images: BoardImage[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    strokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.tool === 'eraser' ? '#FFFFFF' : stroke.color;
      ctx.lineWidth = stroke.tool === 'eraser' ? stroke.width * 3 : stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (stroke.tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';
      const pts = stroke.points;
      ctx.moveTo(pts[0].x, pts[0].y);
      if (pts.length === 2) {
        ctx.lineTo(pts[1].x, pts[1].y);
      } else {
        for (let i = 1; i < pts.length - 1; i++) {
          const midX = (pts[i].x + pts[i + 1].x) / 2;
          const midY = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, midX, midY);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      }
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    });

    stickies.forEach((note) => {
      ctx.fillStyle = note.color || '#FEF08A';
      ctx.shadowColor = 'rgba(0,0,0,0.1)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetY = 2;
      ctx.fillRect(note.x, note.y, 180, 140);
      ctx.shadowColor = 'transparent';
      ctx.fillStyle = '#334155';
      ctx.font = '14px sans-serif';
      const lines = (note.text || '').split('\n');
      lines.slice(0, 8).forEach((line, i) => {
        ctx.fillText(line.slice(0, 20), note.x + 8, note.y + 24 + i * 18, 164);
      });
    });

    images.forEach((img) => {
      const image = new window.Image();
      image.src = img.src;
      try {
        ctx.drawImage(image, img.x, img.y, img.width, img.height);
      } catch {}
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const resize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const loadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const data: RecordedAction[] = JSON.parse(text);
      setActions(data);
      if (data.length > 0) {
        setTotalDuration(data[data.length - 1].timestamp);
      }
    } catch {
      alert('无效的录制文件');
    }
  };

  const play = useCallback(() => {
    if (actions.length === 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const localStrokes: Stroke[] = [];
    const localStickies: StickyNote[] = [];
    const localImages: BoardImage[] = [];
    let idx = 0;

    if (pauseTimeRef.current > 0) {
      startTimeRef.current = performance.now() - pauseTimeRef.current / speed;
      idx = actionIndexRef.current;
    } else {
      startTimeRef.current = performance.now();
      idx = 0;
    }

    setPlaying(true);

    const tick = () => {
      const elapsed = (performance.now() - startTimeRef.current) * speed;

      while (idx < actionsRef.current.length && actionsRef.current[idx].timestamp <= elapsed) {
        const action = actionsRef.current[idx];
        switch (action.type) {
          case 'draw':
          case 'erase':
            if (action.params.stroke) localStrokes.push(action.params.stroke as Stroke);
            break;
          case 'addSticky':
            if (action.params.note) localStickies.push(action.params.note as StickyNote);
            break;
          case 'moveSticky': {
            const { id, x, y } = action.params as { id: string; x: number; y: number };
            const s = localStickies.find((n) => n.id === id);
            if (s) { s.x = x; s.y = y; }
            break;
          }
          case 'updateStickyText': {
            const { id, text } = action.params as { id: string; text: string };
            const s = localStickies.find((n) => n.id === id);
            if (s) s.text = text;
            break;
          }
          case 'deleteSticky': {
            const { id } = action.params as { id: string };
            const i = localStickies.findIndex((n) => n.id === id);
            if (i >= 0) localStickies.splice(i, 1);
            break;
          }
          case 'addImage':
            if (action.params.image) localImages.push(action.params.image as BoardImage);
            break;
          case 'moveImage': {
            const { id, x, y } = action.params as { id: string; x: number; y: number };
            const im = localImages.find((n) => n.id === id);
            if (im) { im.x = x; im.y = y; }
            break;
          }
          case 'deleteImage': {
            const { id } = action.params as { id: string };
            const i = localImages.findIndex((n) => n.id === id);
            if (i >= 0) localImages.splice(i, 1);
            break;
          }
        }
        idx++;
      }

      actionIndexRef.current = idx;
      setCurrentTime(elapsed);
      setProgress(totalDuration > 0 ? (elapsed / totalDuration) * 100 : 0);

      redrawCanvas(localStrokes, localStickies, localImages);

      if (idx < actionsRef.current.length) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setPlaying(false);
        pauseTimeRef.current = 0;
        actionIndexRef.current = 0;
      }
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, [actions, speed, totalDuration, redrawCanvas]);

  const pause = () => {
    cancelAnimationFrame(animFrameRef.current);
    setPlaying(false);
    pauseTimeRef.current = (performance.now() - startTimeRef.current) * speed;
  };

  const seekTo = (pct: number) => {
    pause();
    pauseTimeRef.current = 0;
    actionIndexRef.current = 0;
    setCurrentTime((pct / 100) * totalDuration);
    setProgress(pct);

    const targetTime = (pct / 100) * totalDuration;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const localStrokes: Stroke[] = [];
    const localStickies: StickyNote[] = [];
    const localImages: BoardImage[] = [];

    for (const action of actions) {
      if (action.timestamp > targetTime) break;
      switch (action.type) {
        case 'draw':
        case 'erase':
          if (action.params.stroke) localStrokes.push(action.params.stroke as Stroke);
          break;
        case 'addSticky':
          if (action.params.note) localStickies.push(action.params.note as StickyNote);
          break;
        case 'moveSticky': {
          const { id, x, y } = action.params as { id: string; x: number; y: number };
          const s = localStickies.find((n) => n.id === id);
          if (s) { s.x = x; s.y = y; }
          break;
        }
        case 'updateStickyText': {
          const { id, text } = action.params as { id: string; text: string };
          const s = localStickies.find((n) => n.id === id);
          if (s) s.text = text;
          break;
        }
        case 'deleteSticky': {
          const { id } = action.params as { id: string };
          const i = localStickies.findIndex((n) => n.id === id);
          if (i >= 0) localStickies.splice(i, 1);
          break;
        }
        case 'addImage':
          if (action.params.image) localImages.push(action.params.image as BoardImage);
          break;
        case 'moveImage': {
          const { id, x, y } = action.params as { id: string; x: number; y: number };
          const im = localImages.find((n) => n.id === id);
          if (im) { im.x = x; im.y = y; }
          break;
        }
        case 'deleteImage': {
          const { id } = action.params as { id: string };
          const i = localImages.findIndex((n) => n.id === id);
          if (i >= 0) localImages.splice(i, 1);
          break;
        }
      }
    }

    redrawCanvas(localStrokes, localStickies, localImages);
    actionIndexRef.current = actions.filter((a) => a.timestamp <= targetTime).length;
    pauseTimeRef.current = targetTime;
  };

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const formatTime = (ms: number) => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
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
