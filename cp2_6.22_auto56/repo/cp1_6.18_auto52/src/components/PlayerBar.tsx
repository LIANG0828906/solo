import { useState, useRef, useCallback, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { usePlayerStore } from '@/stores/playerStore';

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function PlayerBar() {
  const { currentSong, isPlaying, progress, duration, togglePlay, next, prev, setProgress } = usePlayerStore();
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [hoverProgress, setHoverProgress] = useState<number | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (!isPlaying || !currentSong || dragging) {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
        animRef.current = null;
      }
      return;
    }

    const tick = (timestamp: number) => {
      if (lastTickRef.current === 0) lastTickRef.current = timestamp;
      const delta = (timestamp - lastTickRef.current) / 1000;
      lastTickRef.current = timestamp;

      const cur = usePlayerStore.getState().progress;
      const dur = usePlayerStore.getState().duration;
      const nextVal = cur + delta;

      if (nextVal >= dur) {
        usePlayerStore.getState().next();
        lastTickRef.current = 0;
      } else {
        setProgress(nextVal);
      }

      animRef.current = requestAnimationFrame(tick);
    };

    lastTickRef.current = 0;
    animRef.current = requestAnimationFrame(tick);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [isPlaying, currentSong, dragging, setProgress, next]);

  const getProgressFromEvent = useCallback((clientX: number) => {
    if (!barRef.current) return 0;
    const rect = barRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return ratio * (duration || 0);
  }, [duration]);

  const handleBarMouseDown = (e: React.MouseEvent) => {
    if (!currentSong) return;
    setDragging(true);
    const val = getProgressFromEvent(e.clientX);
    setDragValue(val);
  };

  const handleBarMouseMove = (e: React.MouseEvent) => {
    if (!barRef.current || !currentSong) return;
    const val = getProgressFromEvent(e.clientX);
    setHoverProgress(val);
  };

  const handleBarMouseLeave = () => {
    setHoverProgress(null);
  };

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e: MouseEvent) => {
      const val = getProgressFromEvent(e.clientX);
      setDragValue(val);
    };

    const onMouseUp = (e: MouseEvent) => {
      const val = getProgressFromEvent(e.clientX);
      setProgress(val);
      setDragging(false);
      lastTickRef.current = 0;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [dragging, getProgressFromEvent, setProgress]);

  const displayProgress = dragging ? dragValue : progress;
  const progressPct = duration > 0 ? (displayProgress / duration) * 100 : 0;
  const hoverPct = duration > 0 && hoverProgress !== null ? (hoverProgress / duration) * 100 : null;

  if (!currentSong) {
    return (
      <div className="player-bar">
        <div className="player-empty">选择一首歌曲开始播放</div>
      </div>
    );
  }

  return (
    <div className="player-bar">
      <div className="player-song-info">
        <img src={currentSong.cover} alt={currentSong.name} className="player-cover" />
        <div className="player-meta">
          <span className="player-song-name">{currentSong.name}</span>
          <span className="player-artist">{currentSong.artist}</span>
        </div>
      </div>

      <div className="player-controls">
        <div className="player-buttons">
          <button className="player-btn ripple-effect" onClick={prev} title="上一首">
            <SkipBack size={18} />
          </button>
          <button className="player-btn player-btn-main ripple-effect" onClick={togglePlay} title={isPlaying ? '暂停' : '播放'}>
            {isPlaying ? <Pause size={22} /> : <Play size={22} style={{ marginLeft: 2 }} />}
          </button>
          <button className="player-btn ripple-effect" onClick={next} title="下一首">
            <SkipForward size={18} />
          </button>
        </div>
        <div className="player-progress-row">
          <span className="player-time">{formatTime(displayProgress)}</span>
          <div
            className="player-progress-bar"
            ref={barRef}
            onMouseDown={handleBarMouseDown}
            onMouseMove={handleBarMouseMove}
            onMouseLeave={handleBarMouseLeave}
          >
            <div className="player-progress-track">
              <div className="player-progress-fill" style={{ width: `${progressPct}%` }} />
              {hoverPct !== null && (
                <div className="player-progress-hover" style={{ left: `${hoverPct}%` }} />
              )}
              <div
                className={`player-progress-thumb ${dragging ? 'dragging' : ''}`}
                style={{ left: `${progressPct}%` }}
              >
                {dragging && (
                  <span className="player-thumb-tooltip">{formatTime(displayProgress)}</span>
                )}
              </div>
            </div>
          </div>
          <span className="player-time">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="player-extra">
        <Volume2 size={18} className="player-volume-icon" />
      </div>
    </div>
  );
}
