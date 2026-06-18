import { useEffect, useRef, useState } from 'react';
import type { Artwork, DrawPoint } from '@/types';
import { emitDrawParticles, updateParticles, renderParticles, releaseParticle } from '@/services/fluidSimulator';
import type { Particle, DrawCommand, BrushConfig } from '@/types';
import { X, Play, Pause, RotateCcw, Download } from 'lucide-react';

interface PlaybackModalProps {
  artwork: Artwork;
  onClose: () => void;
}

function formatDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  return `${sec}s`;
}

export function PlaybackModal({ artwork, onClose }: PlaybackModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number | null>(null);
  const playbackRef = useRef<{
    startTime: number;
    cursor: number;
    running: boolean;
    paused: boolean;
    pauseOffset: number;
    totalDuration: number;
    seq: DrawPoint[];
  } | null>(null);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const lastTsRef = useRef(0);

  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [playbackKey, setPlaybackKey] = useState(0);

  const restartPlayback = () => {
    setPlaybackKey((k) => k + 1);
    setIsPaused(false);
  };

  const togglePause = () => {
    const pb = playbackRef.current;
    if (!pb) return;
    if (pb.paused) {
      pb.paused = false;
      pb.startTime = performance.now() - pb.pauseOffset;
      setIsPaused(false);
    } else {
      pb.paused = true;
      pb.pauseOffset = performance.now() - pb.startTime;
      setIsPaused(true);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === ' ') {
        e.preventDefault();
        togglePause();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    const targetW = 1080;
    const targetH = 720;
    canvas.width = targetW * dpr;
    canvas.height = targetH * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sizeRef.current = { width: targetW, height: targetH, dpr };
    ctx.fillStyle = '#08080d';
    ctx.fillRect(0, 0, targetW, targetH);

    particlesRef.current = [];
    playbackRef.current = {
      startTime: performance.now(),
      cursor: 0,
      running: true,
      paused: false,
      pauseOffset: 0,
      totalDuration:
        artwork.drawSequence.length > 0
          ? artwork.drawSequence[artwork.drawSequence.length - 1].timestamp + 5500
          : 5000,
      seq: artwork.drawSequence,
    };
    lastTsRef.current = 0;
    setProgress(0);

    const loop = (ts: number) => {
      const last = lastTsRef.current || ts;
      const dt = Math.min(64, ts - last);
      lastTsRef.current = ts;
      const { width, height } = sizeRef.current;

      const pb = playbackRef.current!;
      if (pb.running && !pb.paused) {
        const elapsed = ts - pb.startTime;
        while (pb.cursor < pb.seq.length && pb.seq[pb.cursor].timestamp <= elapsed) {
          const pt = pb.seq[pb.cursor];
          const absX = pt.x * width;
          const absY = pt.y * height;
          const prev = pb.cursor > 0 ? pb.seq[pb.cursor - 1] : null;
          const prevX = prev ? prev.x * width : absX;
          const prevY = prev ? prev.y * height : absY;
          const cmd: DrawCommand = {
            x: absX,
            y: absY,
            prevX,
            prevY,
            pressure: pt.pressure,
            brushConfig: pt.brushConfig as BrushConfig,
          };
          emitDrawParticles(cmd, particlesRef.current.length, particlesRef.current);
          pb.cursor++;
        }
        const prog = Math.min(1, elapsed / Math.max(1, pb.totalDuration));
        setProgress(prog);
        if (elapsed >= pb.totalDuration) {
          pb.running = false;
        }
      }

      const latestCfg: BrushConfig | undefined =
        playbackRef.current!.seq.length > 0
          ? (playbackRef.current!.seq[Math.min(playbackRef.current!.cursor, playbackRef.current!.seq.length - 1)]
              .brushConfig as BrushConfig)
          : undefined;
      const style = latestCfg?.brushStyle ?? 'ripple';
      const diffusion = latestCfg?.diffusionSpeed ?? 1;

      particlesRef.current = updateParticles(
        particlesRef.current,
        dt,
        style,
        diffusion,
        width,
        height
      );
      renderParticles(ctx, particlesRef.current, width, height);

      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current != null) cancelAnimationFrame(animRef.current);
      for (const p of particlesRef.current) releaseParticle(p);
      particlesRef.current = [];
      playbackRef.current = null;
    };
  }, [artwork, playbackKey]);

  const downloadImage = () => {
    const canvas = canvasRef.current!;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `墨迹幻境-${artwork.shareCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="modal-title">作品回放</div>
          </div>
          <div className="modal-meta">
            <span>时长 {formatDuration(artwork.duration)}</span>
            <span className="meta-code">{artwork.shareCode}</span>
            <button className="icon-btn" onClick={onClose} aria-label="关闭" title="关闭 (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          <canvas ref={canvasRef} className="playback-canvas" />
        </div>

        <div className="modal-footer">
          <button className="playback-btn" onClick={restartPlayback} title="重新播放">
            <RotateCcw size={14} />
            <span>重播</span>
          </button>
          <button className="playback-btn primary" onClick={togglePause} title="播放/暂停 (空格)">
            {isPaused ? <Play size={14} /> : <Pause size={14} />}
            <span>{isPaused ? '播放' : '暂停'}</span>
          </button>
          <div className="progress-bar" aria-label="回放进度">
            <div className="progress-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <button className="playback-btn" onClick={downloadImage} title="下载当前画面">
            <Download size={14} />
            <span>下载</span>
          </button>
        </div>
      </div>
    </div>
  );
}
