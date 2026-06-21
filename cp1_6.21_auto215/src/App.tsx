import { useState, useRef, useCallback, useEffect } from 'react';
import GesturePad from './GesturePad';
import ScoreDisplay from './ScoreDisplay';
import type { Note } from './types';
import { getFrequency, getNoteName } from './types';

const PRECOMPUTED_FREQUENCIES = Array.from({ length: 12 }, (_, i) => getFrequency(i));

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const playbackTimeoutsRef = useRef<number[]>([]);
  const lastNoteTimeRef = useRef<number>(0);

  useEffect(() => {
    const initAudio = () => {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
    };
    initAudio();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playTone = useCallback((frequency: number, velocity: number, startTime?: number) => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    const startAt = startTime ?? ctx.currentTime;
    const volume = 0.3 * velocity;

    gainNode.gain.setValueAtTime(0, startAt);
    gainNode.gain.linearRampToValueAtTime(volume, startAt + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(startAt);
    oscillator.stop(startAt + 0.5);

    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }, []);

  const handlePlayNote = useCallback((pitch: number, velocity: number) => {
    const frequency = PRECOMPUTED_FREQUENCIES[pitch];
    const now = performance.now();

    playTone(frequency, velocity);

    const newNote: Note = {
      id: `${now}-${pitch}`,
      pitch,
      frequency,
      velocity,
      timestamp: now,
      duration: 500
    };

    setNotes(prev => [...prev, newNote]);
    lastNoteTimeRef.current = now;
  }, [playTone]);

  const handleClear = useCallback(() => {
    setNotes([]);
  }, []);

  const handlePlayback = useCallback(async () => {
    if (notes.length === 0 || isPlaying) return;

    setIsPlaying(true);
    playbackTimeoutsRef.current = [];

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const startTime = notes[0].timestamp;
    const ctxStartTime = ctx.currentTime;

    for (let i = 0; i < notes.length; i++) {
      const note = notes[i];
      const relativeTime = (note.timestamp - startTime) / 1000;
      const scheduledTime = ctxStartTime + relativeTime;

      const timeoutId = window.setTimeout(() => {
        if (audioContextRef.current) {
          playTone(note.frequency, note.velocity, scheduledTime);
        }
      }, Math.max(0, relativeTime * 1000 - 5));

      playbackTimeoutsRef.current.push(timeoutId);

      if (i === notes.length - 1) {
        const finalTimeoutId = window.setTimeout(() => {
          setIsPlaying(false);
        }, relativeTime * 1000 + 600);
        playbackTimeoutsRef.current.push(finalTimeoutId);
      }
    }
  }, [notes, isPlaying, playTone]);

  const handleExport = useCallback(() => {
    if (notes.length === 0) return;

    const exportData = {
      title: '手势乐谱导出',
      exportTime: new Date().toISOString(),
      noteCount: notes.length,
      notes: notes.map(n => ({
        pitch: n.pitch,
        noteName: getNoteName(n.pitch),
        frequency: n.frequency,
        velocity: n.velocity,
        relativeTime: n.timestamp - (notes[0]?.timestamp ?? 0),
        duration: n.duration
      }))
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gesture-score-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [notes]);

  const buttonBaseStyle: React.CSSProperties = {
    width: '80px',
    height: '40px',
    borderRadius: '8px',
    background: '#1E293B',
    color: '#E2E8F0',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: 500,
    transition: 'background-color 0.2s ease-out, transform 0.1s ease-out',
    userSelect: 'none'
  };

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#0F172A'
      }}
    >
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid #334155',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <h1
          style={{
            color: '#E2E8F0',
            fontSize: '20px',
            fontWeight: 600,
            margin: 0
          }}
        >
          🎹 手势乐谱
        </h1>
        <div
          style={{
            display: 'flex',
            gap: '12px'
          }}
        >
          <button
            onClick={handleClear}
            style={buttonBaseStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#334155';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1E293B';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            清空乐谱
          </button>
          <button
            onClick={handlePlayback}
            disabled={isPlaying || notes.length === 0}
            style={{
              ...buttonBaseStyle,
              opacity: isPlaying || notes.length === 0 ? 0.5 : 1,
              cursor: isPlaying || notes.length === 0 ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (!isPlaying && notes.length > 0) {
                e.currentTarget.style.background = '#334155';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1E293B';
            }}
            onMouseDown={(e) => {
              if (!isPlaying && notes.length > 0) {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {isPlaying ? '播放中...' : '回放'}
          </button>
          <button
            onClick={handleExport}
            disabled={notes.length === 0}
            style={{
              ...buttonBaseStyle,
              opacity: notes.length === 0 ? 0.5 : 1,
              cursor: notes.length === 0 ? 'not-allowed' : 'pointer'
            }}
            onMouseEnter={(e) => {
              if (notes.length > 0) {
                e.currentTarget.style.background = '#334155';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#1E293B';
            }}
            onMouseDown={(e) => {
              if (notes.length > 0) {
                e.currentTarget.style.transform = 'scale(0.95)';
              }
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            导出JSON
          </button>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}
      >
        <GesturePad onPlayNote={handlePlayNote} />
        <div
          style={{
            height: '1px',
            background: '#334155',
            margin: '0 16px'
          }}
        />
        <ScoreDisplay notes={notes} />
      </div>

      <style>{`
        @media (max-width: 768px) {
          .gesture-pad {
            flex: 1 !important;
          }
          .score-display {
            flex: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
