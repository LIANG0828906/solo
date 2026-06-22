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

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const FADE_IN_DURATION = 200;
const FADE_OUT_DURATION = 400;

const Player: React.FC<PlayerProps> = ({
  score,
  isPlaying,
  setIsPlaying,
  onHighlightNote,
  onPositionUpdate
}) => {
  const synthRef = useRef<Tone.PolySynth | null>(null);
  const partRef = useRef<Tone.Part | null>(null);
  const drawEventsRef = useRef<number[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const highlightStateRef = useRef<{
    currentId: string | null;
    targetId: string | null;
    opacity: number;
    fadeStart: number;
    fadeFrom: number;
    fadeTo: number;
    fadeDuration: number;
  }>({
    currentId: null,
    targetId: null,
    opacity: 0,
    fadeStart: 0,
    fadeFrom: 0,
    fadeTo: 0,
    fadeDuration: 0
  });

  const [totalDurationBeats, setTotalDurationBeats] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [, forceRender] = useState(0);

  const beatsToSeconds = useCallback((beats: number): number => {
    return beats * (60 / score.tempo);
  }, [score.tempo]);

  const secondsToBeats = useCallback((seconds: number): number => {
    return seconds * (score.tempo / 60);
  }, [score.tempo]);

  useEffect(() => {
    if (score.notes.length === 0) {
      setTotalDurationBeats(8);
      return;
    }
    const maxEnd = Math.max(...score.notes.map(n => n.position + n.duration));
    setTotalDurationBeats(Math.max(maxEnd, 8));
  }, [score.notes]);

  const initAudio = useCallback(async (): Promise<Tone.PolySynth | null> => {
    if (synthRef.current) {
      return synthRef.current;
    }
    await Tone.start();
    const synth = new Tone.PolySynth(Tone.Synth, {
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
    synth.volume.value = -8;
    synthRef.current = synth;
    setIsAudioReady(true);
    return synth;
  }, []);

  const midiToNoteName = (pitch: number, octave: number): string => {
    const safePitch = Math.max(0, Math.min(11, Math.floor(pitch)));
    return `${NOTE_NAMES[safePitch]}${octave}`;
  };

  const clearDrawEvents = useCallback(() => {
    drawEventsRef.current.forEach(id => Tone.Draw.clear(id));
    drawEventsRef.current = [];
  }, []);

  const runHighlightAnimation = useCallback(() => {
    const state = highlightStateRef.current;
    const now = performance.now();
    const elapsed = now - state.fadeStart;

    if (elapsed >= state.fadeDuration) {
      state.opacity = state.fadeTo;
    } else {
      const t = elapsed / state.fadeDuration;
      state.opacity = state.fadeFrom + (state.fadeTo - state.fadeFrom) * t;
    }

    forceRender(x => x + 1);

    if (elapsed < state.fadeDuration) {
      requestAnimationFrame(runHighlightAnimation);
    } else {
      if (state.fadeTo === 0) {
        state.currentId = null;
        onHighlightNote(null);
      }
    }
  }, [onHighlightNote]);

  const doHighlight = useCallback((noteId: string | null) => {
    const state = highlightStateRef.current;
    const now = performance.now();

    if (noteId) {
      if (state.currentId === noteId) return;
      state.targetId = noteId;
      state.currentId = noteId;
      onHighlightNote(noteId);
      state.fadeFrom = state.opacity;
      state.fadeTo = 1;
      state.fadeStart = now;
      state.fadeDuration = FADE_IN_DURATION;
      requestAnimationFrame(runHighlightAnimation);
    } else {
      if (state.opacity <= 0.001) return;
      state.targetId = null;
      state.fadeFrom = state.opacity;
      state.fadeTo = 0;
      state.fadeStart = now;
      state.fadeDuration = FADE_OUT_DURATION;
      requestAnimationFrame(runHighlightAnimation);
    }
  }, [onHighlightNote, runHighlightAnimation]);

  const buildAndSchedulePart = useCallback(async (startBeat: number) => {
    const synth = await initAudio();
    if (!synth) return;

    if (partRef.current) {
      partRef.current.stop();
      partRef.current.dispose();
      partRef.current = null;
    }
    clearDrawEvents();

    const startSeconds = beatsToSeconds(startBeat);
    const partEvents: Array<{ time: number; note: Note }> = [];

    score.notes.forEach(note => {
      const noteStartBeat = note.position;
      const noteEndBeat = note.position + note.duration;
      if (noteEndBeat > startBeat) {
        partEvents.push({
          time: beatsToSeconds(noteStartBeat) - startSeconds,
          note
        });
      }
    });

    if (partEvents.length === 0) return;

    const totalDurationSeconds = beatsToSeconds(totalDurationBeats);

    partRef.current = new Tone.Part((time, value: { note: Note }) => {
      const { note } = value;
      const noteName = midiToNoteName(note.pitch, note.octave);
      const durationSec = beatsToSeconds(note.duration);

      synth.triggerAttackRelease(noteName, durationSec, time, 0.8);

      const highlightStartId = Tone.Draw.schedule(() => {
        doHighlight(note.id);
      }, time);
      drawEventsRef.current.push(highlightStartId);

      const highlightEndTime = time + durationSec * 0.7;
      const highlightEndId = Tone.Draw.schedule(() => {
        doHighlight(null);
      }, highlightEndTime);
      drawEventsRef.current.push(highlightEndId);
    }, partEvents.map(e => [e.time, e]));

    const endId = Tone.Draw.schedule(() => {
      handleStopInternal();
    }, totalDurationSeconds - startSeconds + 0.5);
    drawEventsRef.current.push(endId);

    partRef.current.start(0);
  }, [score.notes, score.tempo, totalDurationBeats, beatsToSeconds, initAudio, doHighlight, clearDrawEvents]);

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const tick = () => {
      const transportSeconds = Tone.Transport.seconds;
      const posBeats = secondsToBeats(transportSeconds);
      onPositionUpdate(posBeats);
      setCurrentProgress(Math.min(1, posBeats / totalDurationBeats));
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPlaying, secondsToBeats, onPositionUpdate, totalDurationBeats]);

  const handleStopInternal = useCallback(() => {
    Tone.Transport.stop();
    Tone.Transport.seconds = 0;

    if (partRef.current) {
      partRef.current.stop();
      partRef.current.dispose();
      partRef.current = null;
    }

    clearDrawEvents();
    doHighlight(null);

    setIsPlaying(false);
    setCurrentProgress(0);
    onPositionUpdate(0);
  }, [setIsPlaying, onPositionUpdate, doHighlight, clearDrawEvents]);

  const handlePlay = async () => {
    await initAudio();

    let startBeat = currentProgress * totalDurationBeats;
    if (startBeat >= totalDurationBeats - 0.1) {
      startBeat = 0;
      setCurrentProgress(0);
      onPositionUpdate(0);
    }

    Tone.Transport.bpm.value = score.tempo;
    Tone.Transport.seconds = beatsToSeconds(startBeat);

    await buildAndSchedulePart(startBeat);

    Tone.Transport.start();
    setIsPlaying(true);
  };

  const handlePause = () => {
    Tone.Transport.pause();

    if (partRef.current) {
      partRef.current.stop();
    }

    clearDrawEvents();
    doHighlight(null);
    setIsPlaying(false);
  };

  const handleStop = () => {
    handleStopInternal();
  };

  const handleSeek = async (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const newPositionBeats = ratio * totalDurationBeats;
    const newPositionSeconds = beatsToSeconds(newPositionBeats);

    const wasPlaying = isPlaying;

    if (wasPlaying) {
      Tone.Transport.pause();
    }

    if (partRef.current) {
      partRef.current.stop();
      partRef.current.dispose();
      partRef.current = null;
    }

    clearDrawEvents();
    doHighlight(null);

    Tone.Transport.seconds = newPositionSeconds;
    setCurrentProgress(ratio);
    onPositionUpdate(newPositionBeats);

    if (wasPlaying) {
      Tone.Transport.bpm.value = score.tempo;
      await buildAndSchedulePart(newPositionBeats);
      Tone.Transport.start();
    }
  };

  const formatTime = (beats: number): string => {
    const seconds = beatsToSeconds(beats);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentBeats = currentProgress * totalDurationBeats;
  const highlightState = highlightStateRef.current;

  return (
    <div style={styles.playerContainer}>
      <div style={{ display: 'none' }}>
        <span
          data-highlight={highlightState.currentId || ''}
          data-opacity={highlightState.opacity}
        />
      </div>

      <div style={styles.progressInfo}>
        <span style={styles.timeText}>{formatTime(currentBeats)}</span>
        <span style={styles.timeDivider}>/</span>
        <span style={styles.timeText}>{formatTime(totalDurationBeats)}</span>
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
