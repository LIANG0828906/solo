import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Score, Note } from './types';

interface PlayerProps {
  score: Score;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onHighlightNote: (noteId: string | null) => void;
  onPositionUpdate: (position: number) => void;
}

const NOTE_FREQUENCIES: Record<number, number> = {};
for (let i = 0; i < 128; i++) {
  NOTE_FREQUENCIES[i] = 440 * Math.pow(2, (i - 69) / 12);
}

const Player: React.FC<PlayerProps> = ({
  score,
  isPlaying,
  setIsPlaying,
  onHighlightNote,
  onPositionUpdate
}) => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const activeOscillatorsRef = useRef<Map<string, { osc: OscillatorNode; gain: GainNode }>>(new Map());
  const playbackStateRef = useRef<{
    startTime: number;
    startPosition: number;
    scheduledNotes: Set<string>;
  }>({
    startTime: 0,
    startPosition: 0,
    scheduledNotes: new Set()
  });
  const animationFrameRef = useRef<number | null>(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);

  useEffect(() => {
    if (score.notes.length === 0) {
      setTotalDuration(8);
      return;
    }
    const maxEnd = Math.max(...score.notes.map(n => n.position + n.duration));
    setTotalDuration(Math.max(maxEnd, 8));
  }, [score.notes]);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    return audioContextRef.current;
  }, []);

  const playNote = useCallback((note: Note, startTime: number, ctx: AudioContext) => {
    const midiPitch = note.octave * 12 + note.pitch;
    const frequency = NOTE_FREQUENCIES[Math.min(127, Math.max(0, midiPitch))] || 440;
    const duration = (60 / score.tempo) * note.duration;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, startTime);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(3000, startTime);
    filter.Q.setValueAtTime(1, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.25, startTime + 0.01);
    gain.gain.linearRampToValueAtTime(0.2, startTime + 0.1);
    gain.gain.setValueAtTime(0.2, startTime + duration - 0.05);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.02);

    const noteKey = `${note.id}-${startTime}`;
    activeOscillatorsRef.current.set(noteKey, { osc, gain });

    osc.onended = () => {
      activeOscillatorsRef.current.delete(noteKey);
    };
  }, [score.tempo]);

  const stopAllNotes = useCallback(() => {
    const now = audioContextRef.current?.currentTime || 0;
    activeOscillatorsRef.current.forEach(({ osc, gain }) => {
      try {
        gain.gain.cancelScheduledValues(now);
        gain.gain.setValueAtTime(gain.gain.value, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.03);
        osc.stop(now + 0.05);
      } catch (e) {}
    });
    activeOscillatorsRef.current.clear();
  }, []);

  const getCurrentPlaybackPosition = useCallback(() => {
    if (!audioContextRef.current || !isPlaying) return 0;
    const ctx = audioContextRef.current;
    const elapsed = ctx.currentTime - playbackStateRef.current.startTime;
    const beatsElapsed = elapsed * (score.tempo / 60);
    return playbackStateRef.current.startPosition + beatsElapsed;
  }, [isPlaying, score.tempo]);

  const scheduleNotes = useCallback(() => {
    if (!audioContextRef.current || !isPlaying) return;

    const ctx = audioContextRef.current;
    const currentPos = getCurrentPlaybackPosition();
    const lookAhead = 0.1;
    const scheduleWindow = currentPos + lookAhead;

    const beatDuration = 60 / score.tempo;

    score.notes.forEach(note => {
      const noteKey = note.id;
      if (playbackStateRef.current.scheduledNotes.has(noteKey)) return;

      const noteStartBeat = note.position;
      if (noteStartBeat >= currentPos && noteStartBeat <= scheduleWindow) {
        const delayBeats = noteStartBeat - currentPos;
        const delaySeconds = delayBeats * beatDuration;
        const noteStartTime = ctx.currentTime + delaySeconds;

        playNote(note, noteStartTime, ctx);
        playbackStateRef.current.scheduledNotes.add(noteKey);

        setTimeout(() => {
          onHighlightNote(note.id);
        }, Math.max(0, delaySeconds * 1000 - 10));

        const noteDurationMs = note.duration * beatDuration * 1000;
        setTimeout(() => {
          onHighlightNote(null);
        }, Math.max(0, delaySeconds * 1000 + noteDurationMs * 0.3));
      }
    });
  }, [isPlaying, score.notes, score.tempo, getCurrentPlaybackPosition, playNote, onHighlightNote]);

  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const tick = () => {
      scheduleNotes();
      const pos = getCurrentPlaybackPosition();
      onPositionUpdate(pos);
      setCurrentProgress(Math.min(1, pos / totalDuration));

      if (pos >= totalDuration) {
        handleStop();
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
  }, [isPlaying, scheduleNotes, getCurrentPlaybackPosition, onPositionUpdate, totalDuration]);

  const handlePlay = useCallback(() => {
    const ctx = initAudioContext();
    if (!ctx) return;

    if (currentProgress >= 1) {
      setCurrentProgress(0);
      onPositionUpdate(0);
      playbackStateRef.current.startPosition = 0;
    }

    playbackStateRef.current.startTime = ctx.currentTime;
    playbackStateRef.current.startPosition = currentProgress * totalDuration;
    playbackStateRef.current.scheduledNotes = new Set();

    score.notes.forEach(note => {
      if (note.position + note.duration <= playbackStateRef.current.startPosition) {
        playbackStateRef.current.scheduledNotes.add(note.id);
      }
    });

    setIsPlaying(true);
  }, [initAudioContext, currentProgress, totalDuration, score.notes, setIsPlaying, onPositionUpdate]);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
    stopAllNotes();
    onHighlightNote(null);
  }, [setIsPlaying, stopAllNotes, onHighlightNote]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    stopAllNotes();
    onHighlightNote(null);
    setCurrentProgress(0);
    onPositionUpdate(0);
  }, [setIsPlaying, stopAllNotes, onHighlightNote, onPositionUpdate]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const newPosition = ratio * totalDuration;

    setCurrentProgress(ratio);
    onPositionUpdate(newPosition);

    if (isPlaying) {
      if (!audioContextRef.current) return;
      const ctx = audioContextRef.current;
      stopAllNotes();

      playbackStateRef.current.startTime = ctx.currentTime;
      playbackStateRef.current.startPosition = newPosition;
      playbackStateRef.current.scheduledNotes = new Set();

      score.notes.forEach(note => {
        if (note.position + note.duration <= newPosition) {
          playbackStateRef.current.scheduledNotes.add(note.id);
        }
      });
    }
  }, [totalDuration, isPlaying, score.notes, stopAllNotes, onPositionUpdate]);

  const formatTime = (beats: number): string => {
    const seconds = beats * (60 / score.tempo);
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentBeats = currentProgress * totalDuration;

  return (
    <div style={styles.playerContainer}>
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
              transition: isPlaying ? 'none' : 'width 100ms ease-out'
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
    gap: 20
  },
  controlBtnPrimary: {
    width: 52,
    height: 52,
    borderRadius: '50%',
    backgroundColor: 'linear-gradient(135deg, #4a9eff, #7c3aed)',
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
    transform: 'scale(1.02)'
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
