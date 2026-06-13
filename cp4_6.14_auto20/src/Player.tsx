import React, { useRef, useEffect, useCallback, useState } from 'react';
import * as Tone from 'tone';
import { Score, Note } from './types';

interface PlayerProps {
  score: Score;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onHighlightNote: (noteId: string | null) => void;
  onPositionUpdate: (position: number) => void;
}

const Player: React.FC<PlayerProps> = ({
  score,
  isPlaying,
  setIsPlaying,
  onHighlightNote,
  onPositionUpdate
}) => {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  const transportRef = useRef<Tone.Transport | null>(null);
  const scheduledHighlightsRef = useRef<Array<{ id: number; noteId: string }>>([]);
  const animationFrameRef = useRef<number | null>(null);
  const startPositionRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const [totalDuration, setTotalDuration] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [highlightOpacity, setHighlightOpacity] = useState(0);
  const highlightFadeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (score.notes.length === 0) {
      setTotalDuration(8);
      return;
    }
    const maxEnd = Math.max(...score.notes.map(n => n.position + n.duration));
    setTotalDuration(Math.max(maxEnd, 8));
  }, [score.notes]);

  const initAudio = useCallback(async () => {
    if (!isAudioReady) {
      await Tone.start();
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: {
          type: 'triangle'
        },
        envelope: {
          attack: 0.02,
          decay: 0.3,
          sustain: 0.4,
          release: 1.2
        }
      }).toDestination();

      synthRef.current.volume.value = -8;
      setIsAudioReady(true);
    }
    return synthRef.current;
  }, [isAudioReady]);

  const midiToNoteName = (pitch: number, octave: number): string => {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    return `${noteNames[pitch]}${octave}`;
  };

  const doHighlight = useCallback((noteId: string | null) => {
    if (highlightFadeTimerRef.current) {
      clearTimeout(highlightFadeTimerRef.current);
      highlightFadeTimerRef.current = null;
    }

    if (noteId) {
      setHighlightedId(noteId);
      onHighlightNote(noteId);

      requestAnimationFrame(() => {
        setHighlightOpacity(0);
        let start = performance.now();
        const fadeIn = (now: number) => {
          const elapsed = now - start;
          const progress = Math.min(1, elapsed / 200);
          setHighlightOpacity(progress);
          if (progress < 1) {
            requestAnimationFrame(fadeIn);
          }
        };
        requestAnimationFrame(fadeIn);
      });
    } else {
      let start = performance.now();
      const startOpacity = highlightOpacity;
      const fadeOut = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / 400);
        const newOpacity = startOpacity * (1 - progress);
        setHighlightOpacity(newOpacity);
        if (progress < 1) {
          requestAnimationFrame(fadeOut);
        } else {
          setHighlightedId(null);
          onHighlightNote(null);
          setHighlightOpacity(0);
        }
      };
      requestAnimationFrame(fadeOut);
    }
  }, [onHighlightNote, highlightOpacity]);

  const buildAndSchedulePart = useCallback(async (startBeat: number) => {
    if (!synthRef.current) {
      await initAudio();
    }
    if (!synthRef.current) return;

    if (partRef.current) {
      partRef.current.dispose();
      partRef.current = null;
    }

    scheduledHighlightsRef.current = [];

    const partEvents: Array<{ time: number; note: Note }> = [];

    const beatDuration = 60 / score.tempo;
    score.notes.forEach(note => {
      if (note.position + note.duration > startBeat) {
        partEvents.push({
          time: note.position - startBeat,
          note
        });
      }
    });

    if (partEvents.length === 0) return;

    partRef.current = new Tone.Part((time, value: { note: Note }) => {
      const { note } = value;
      const noteName = midiToNoteName(note.pitch, note.octave);
      const durationSec = note.duration * beatDuration;

      if (synthRef.current) {
        synthRef.current.triggerAttackRelease(noteName, durationSec, time, 0.8);
      }

      const scheduledTime = Tone.immediate() + (time - Tone.now());
      const delayMs = Math.max(0, scheduledTime * 1000 - Tone.now() * 1000);

      const highlightStartId = window.setTimeout(() => {
        doHighlight(note.id);
      }, Math.max(0, delayMs - 20));

      const durationMs = durationSec * 1000;
      const highlightEndId = window.setTimeout(() => {
        doHighlight(null);
      }, Math.max(0, delayMs + durationMs * 0.7));

      scheduledHighlightsRef.current.push(
        { id: highlightStartId, noteId: note.id },
        { id: highlightEndId, noteId: note.id }
      );
    }, partEvents.map(e => [e.time, e]));

    partRef.current.start(0);
  }, [score.notes, score.tempo, initAudio, doHighlight]);

  useEffect(() => {
    const getCurrentPos = () => {
      if (!isPlaying) return startPositionRef.current;
      const elapsedMs = performance.now() - startTimeRef.current;
      const beatsElapsed = (elapsedMs / 1000) * (score.tempo / 60);
      return startPositionRef.current + beatsElapsed;
    };

    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const tick = () => {
      const pos = getCurrentPos();
      onPositionUpdate(pos);
      setCurrentProgress(Math.min(1, pos / totalDuration));

      if (pos >= totalDuration + 0.5) {
        handleStopInternal();
        return;
      }

      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying, score.tempo, onPositionUpdate, totalDuration]);

  const handlePlay = async () => {
    await initAudio();

    let startBeat = currentProgress * totalDuration;
    if (startBeat >= totalDuration - 0.1) {
      startBeat = 0;
      setCurrentProgress(0);
      onPositionUpdate(0);
    }

    startPositionRef.current = startBeat;
    startTimeRef.current = performance.now();

    await buildAndSchedulePart(startBeat);
    Tone.Transport.bpm.value = score.tempo;
    Tone.Transport.start();

    setIsPlaying(true);
  };

  const handlePause = () => {
    Tone.Transport.pause();
    if (partRef.current) {
      partRef.current.stop();
    }

    scheduledHighlightsRef.current.forEach(s => clearTimeout(s.id));
    scheduledHighlightsRef.current = [];
    doHighlight(null);

    setIsPlaying(false);
  };

  const handleStopInternal = useCallback(() => {
    Tone.Transport.stop();
    if (partRef.current) {
      partRef.current.stop();
      partRef.current.dispose();
      partRef.current = null;
    }

    scheduledHighlightsRef.current.forEach(s => clearTimeout(s.id));
    scheduledHighlightsRef.current = [];
    doHighlight(null);

    setIsPlaying(false);
    setCurrentProgress(0);
    onPositionUpdate(0);
    startPositionRef.current = 0;
  }, [setIsPlaying, onPositionUpdate, doHighlight]);

  const handleStop = () => {
    handleStopInternal();
  };

  const handleSeek = async (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const newPosition = ratio * totalDuration;

    const wasPlaying = isPlaying;
    if (wasPlaying) {
      Tone.Transport.pause();
      if (partRef.current) {
        partRef.current.stop();
        partRef.current.dispose();
        partRef.current = null;
      }
      scheduledHighlightsRef.current.forEach(s => clearTimeout(s.id));
      scheduledHighlightsRef.current = [];
      doHighlight(null);
    }

    setCurrentProgress(ratio);
    onPositionUpdate(newPosition);

    if (wasPlaying) {
      startPositionRef.current = newPosition;
      startTimeRef.current = performance.now();

      await buildAndSchedulePart(newPosition);
      Tone.Transport.bpm.value = score.tempo;
      Tone.Transport.start();
    }
  };

  const formatTime = (beats: number): string => {
    const seconds = beats * (60 / score.tempo);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentBeats = currentProgress * totalDuration;

  return (
    <div style={styles.playerContainer}>
      <div style={{ display: 'none' }}>
        <span data-highlight={highlightedId || ''} data-opacity={highlightOpacity} />
      </div>

      <div style={styles.progressInfo}>
        <span style={styles.timeText}>{formatTime(currentBeats)}</span>
        <span style={styles.timeDivider}>/</span>
        <span style={styles.timeText}>{formatTime(totalDuration)}</span>
        <span style={{ ...styles.tempoBadge, marginLeft: 'auto' }}>
          ♩ = {score.tempo}
        </span>
      </div>

      <div
        style={styles.progressBarContainer}
        onClick={handleSeek}
      >
        <div style={styles.progressBarBg}>
          <div
            style={{
              ...styles.progressBarFill,
              width: `${currentProgress * 100}%`,
              transition: isPlaying ? 'none' : 'width 300ms ease-out'
            }}
          />
          <div
            style={{
              ...styles.progressHandle,
              left: `calc(${currentProgress * 100}% - 7px)`,
              opacity: isPlaying ? 1 : 0.8
            }}
          />
        </div>
      </div>

      <div style={styles.controls}>
        <button
          style={styles.controlBtnSecondary}
          onClick={handleStop}
          title="停止"
        >
          <span style={{ fontSize: 14 }}>■</span>
        </button>

        <button
          style={{
            ...styles.controlBtnPrimary,
            ...(isPlaying ? styles.controlBtnPlaying : {})
          }}
          onClick={isPlaying ? handlePause : handlePlay}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="5" width="4" height="14" rx="1" />
              <rect x="14" y="5" width="4" height="14" rx="1" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!isAudioReady ? (
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
              点击播放初始化音频
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  playerContainer: {
    padding: '16px 20px',
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0
  },
  progressInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontFamily: 'monospace'
  },
  timeDivider: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 12
  },
  tempoBadge: {
    backgroundColor: 'rgba(74, 158, 255, 0.15)',
    color: '#4a9eff',
    padding: '3px 10px',
    borderRadius: 12,
    fontSize: 11,
    fontWeight: 500
  },
  progressBarContainer: {
    cursor: 'pointer',
    padding: '8px 0',
    marginBottom: 16
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    position: 'relative',
    overflow: 'visible'
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4a9eff 0%, #7c3aed 100%)',
    borderRadius: 3,
    position: 'absolute',
    left: 0,
    top: 0
  },
  progressHandle: {
    position: 'absolute',
    top: '50%',
    width: 14,
    height: 14,
    borderRadius: '50%',
    backgroundColor: '#fff',
    border: '2px solid #4a9eff',
    transform: 'translateY(-50%)',
    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    transition: 'transform 0.2s ease'
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16
  },
  controlBtnPrimary: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #4a9eff, #7c3aed)',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(74, 158, 255, 0.4)',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
  },
  controlBtnPlaying: {
    boxShadow: '0 4px 20px rgba(74, 158, 255, 0.6)',
    transform: 'scale(1.02)',
    animation: 'pulse 2s ease-in-out infinite'
  },
  controlBtnSecondary: {
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease'
  }
};

export default Player;
