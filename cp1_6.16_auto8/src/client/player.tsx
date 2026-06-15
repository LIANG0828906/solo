import { useEffect, useRef, useState, useCallback } from 'react';
import type { Episode, Chapter } from '../server/types.js';

interface PlayerProps {
  episode: Episode;
  onTimeUpdate: (time: number) => void;
  onChapterClick: (time: number) => void;
}

export default function Player({ episode, onTimeUpdate, onChapterClick }: PlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [dragging, setDragging] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const offsetRef = useRef<number>(0);
  const playingRef = useRef(false);

  const getCurrentTime = useCallback(() => {
    if (!playingRef.current || !audioCtxRef.current) return offsetRef.current;
    return offsetRef.current + (audioCtxRef.current.currentTime - startTimeRef.current);
  }, []);

  useEffect(() => {
    const tick = () => {
      if (!dragging) {
        const ct = getCurrentTime();
        if (ct <= episode.duration) {
          setProgress((ct / episode.duration) * 100);
          onTimeUpdate(ct);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dragging, onTimeUpdate, episode.duration, getCurrentTime]);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  const startOscillator = useCallback((time: number) => {
    if (oscillatorRef.current) {
      try { oscillatorRef.current.stop(); } catch { /* ok */ }
    }
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, audioCtxRef.current.currentTime);
    const gain = audioCtxRef.current.createGain();
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    osc.start();
    oscillatorRef.current = osc;
    gainRef.current = gain;
  }, [volume]);

  const togglePlay = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    if (playingRef.current) {
      offsetRef.current = getCurrentTime();
      if (oscillatorRef.current) {
        try { oscillatorRef.current.stop(); } catch { /* ok */ }
        oscillatorRef.current = null;
      }
      playingRef.current = false;
      setPlaying(false);
    } else {
      if (offsetRef.current >= episode.duration) {
        offsetRef.current = 0;
      }
      startTimeRef.current = audioCtxRef.current.currentTime;
      startOscillator(0);
      playingRef.current = true;
      setPlaying(true);
    }
  }, [episode.duration, getCurrentTime, startOscillator]);

  const seekTo = useCallback((pct: number) => {
    const t = pct * episode.duration;
    offsetRef.current = t;
    if (playingRef.current && audioCtxRef.current) {
      startTimeRef.current = audioCtxRef.current.currentTime;
    }
    setProgress(pct * 100);
    onTimeUpdate(t);
  }, [episode.duration, onTimeUpdate]);

  const seekFromEvent = useCallback(
    (e: MouseEvent) => {
      const bar = barRef.current;
      if (!bar) return 0;
      const rect = bar.getBoundingClientRect();
      return Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    },
    []
  );

  const handleBarMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      setDragging(true);
      const pct = seekFromEvent(e.nativeEvent);
      seekTo(pct);

      const onMouseMove = (ev: MouseEvent) => {
        const p = seekFromEvent(ev);
        seekTo(p);
      };

      const onMouseUp = (ev: MouseEvent) => {
        const p = seekFromEvent(ev);
        seekTo(p);
        setDragging(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [seekFromEvent, seekTo]
  );

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handlePlayEvent = useCallback(async () => {
    try {
      await fetch(`/api/episode/${episode.id}/event`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: playing ? 'pause' : 'play', timestamp: Date.now() }),
      });
    } catch { /* fire-and-forget */ }
  }, [episode.id, playing]);

  return (
    <div className="player">
      <div className="player-controls">
        <button
          className="play-btn"
          onClick={() => {
            togglePlay();
            handlePlayEvent();
          }}
        >
          {playing ? '⏸' : '▶'}
        </button>

        <div className="player-main">
          <div className="progress-bar" ref={barRef} onMouseDown={handleBarMouseDown}>
            <div className="progress-fill" style={{ width: `${progress}%` }} />
            <div className="progress-thumb" style={{ left: `${progress}%` }} />
            {episode.chapters.map((ch: Chapter) => {
              const pct = (ch.startTime / episode.duration) * 100;
              return (
                <button
                  key={ch.id}
                  className="chapter-marker"
                  style={{ left: `${pct}%`, backgroundColor: ch.color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    seekTo(pct / 100);
                    onChapterClick(ch.startTime);
                  }}
                  title={ch.title}
                >
                  <span className="chapter-marker-label">{ch.title}</span>
                </button>
              );
            })}
          </div>

          <div className="time-display">
            <span>{formatTime((progress / 100) * episode.duration)}</span>
            <span>{formatTime(episode.duration)}</span>
          </div>
        </div>

        <div className="volume-control">
          <span className="volume-icon">{volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
          />
        </div>
      </div>
    </div>
  );
}
