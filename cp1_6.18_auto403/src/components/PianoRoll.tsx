import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  useMusicStore,
  PITCH_MIN,
  PITCH_MAX,
  TOTAL_DURATION,
  TIME_STEP,
  type Note,
} from '../store';

const SEMITONE_LABELS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getSemitoneLabel = (pitch: number): string => {
  return SEMITONE_LABELS[pitch % 12];
};

const isBlackKey = (pitch: number): boolean => {
  return SEMITONE_LABELS[pitch % 12].includes('#');
};

type DragMode = 'none' | 'create' | 'move' | 'resize-left' | 'resize-right';

interface DragState {
  mode: DragMode;
  noteId?: string;
  startPitch?: number;
  startTime?: number;
  startDuration?: number;
  initialPitch?: number;
  initialTime?: number;
  initialDuration?: number;
  startMouseX?: number;
  startMouseY?: number;
  justCreated?: boolean;
}

export const PianoRoll: React.FC = () => {
  const notes = useMusicStore((s) => s.notes);
  const playback = useMusicStore((s) => s.playback);
  const addNote = useMusicStore((s) => s.addNote);
  const deleteNote = useMusicStore((s) => s.deleteNote);
  const moveNote = useMusicStore((s) => s.moveNote);
  const resizeNote = useMusicStore((s) => s.resizeNote);
  const selectNote = useMusicStore((s) => s.selectNote);
  const clearSelection = useMusicStore((s) => s.clearSelection);
  const deleteSelectedNotes = useMusicStore((s) => s.deleteSelectedNotes);
  const setCurrentTime = useMusicStore((s) => s.setCurrentTime);

  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [hoverPitch, setHoverPitch] = useState<number | null>(null);
  const [dragState, setDragState] = useState<DragState>({ mode: 'none' });
  const [viewportWidth, setViewportWidth] = useState<number>(600);
  const [viewportHeight, setViewportHeight] = useState<number>(200);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  useEffect(() => {
    const updateViewport = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setViewportWidth(Math.min(600, width - 32));
        setViewportHeight(300);
        setIsMobile(true);
      } else if (width < 1024) {
        setViewportWidth(540);
        setViewportHeight(200);
        setIsMobile(false);
      } else {
        setViewportWidth(600);
        setViewportHeight(200);
        setIsMobile(false);
      }
    };
    updateViewport();
    window.addEventListener('resize', updateViewport);
    return () => window.removeEventListener('resize', updateViewport);
  }, []);

  const LABEL_WIDTH = 36;
  const GRID_WIDTH = viewportWidth - LABEL_WIDTH;
  const GRID_HEIGHT = viewportHeight;
  const PITCH_COUNT = PITCH_MAX - PITCH_MIN + 1;
  const CELL_HEIGHT = GRID_HEIGHT / PITCH_COUNT;
  const CELL_WIDTH = (GRID_WIDTH / TOTAL_DURATION) * TIME_STEP;
  const PX_PER_SEC = GRID_WIDTH / TOTAL_DURATION;

  const pitchToY = (pitch: number) => (PITCH_MAX - pitch) * CELL_HEIGHT;
  const yToPitch = (y: number) => PITCH_MAX - Math.floor(y / CELL_HEIGHT);
  const timeToX = (time: number) => time * PX_PER_SEC;
  const xToTime = (x: number) => Math.max(0, Math.min(TOTAL_DURATION - TIME_STEP, Math.floor(x / CELL_WIDTH) * TIME_STEP));

  const pitches = useMemo(() => {
    const arr: number[] = [];
    for (let p = PITCH_MAX; p >= PITCH_MIN; p--) arr.push(p);
    return arr;
  }, []);

  const getPosition = (e: React.MouseEvent | MouseEvent) => {
    const rect = gridRef.current!.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(GRID_WIDTH, e.clientX - rect.left)),
      y: Math.max(0, Math.min(GRID_HEIGHT, e.clientY - rect.top)),
    };
  };

  const onGridMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    const { x, y } = getPosition(e);
    const pitch = yToPitch(y);
    const startTime = xToTime(x);
    const clickedNote = findNoteAt(pitch, startTime);

    if (clickedNote) {
      const note = clickedNote;
      const isSelected = playback.selectedNoteIds.includes(note.id);
      selectNote(note.id, e.shiftKey);

      const noteLeftPx = timeToX(note.startTime);
      const noteRightPx = timeToX(note.startTime + note.duration);
      const clickXRel = x - noteLeftPx;
      const resizeMargin = Math.max(8, CELL_WIDTH * 0.4);

      let mode: DragMode = 'move';
      if (clickXRel < resizeMargin && note.startTime > 0) {
        mode = 'resize-left';
      } else if (noteRightPx - x < resizeMargin && note.startTime + note.duration < TOTAL_DURATION) {
        mode = 'resize-right';
      }

      setDragState({
        mode,
        noteId: note.id,
        startPitch: note.pitch,
        startTime: note.startTime,
        startDuration: note.duration,
        initialPitch: note.pitch,
        initialTime: note.startTime,
        initialDuration: note.duration,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
      });
      void isSelected;
    } else {
      clearSelection();
      addNote({ pitch, startTime, duration: TIME_STEP });
      const lastNote = notesRef.current[notesRef.current.length - 1];
      if (lastNote) {
        setDragState({
          mode: 'resize-right',
          noteId: lastNote.id,
          startPitch: lastNote.pitch,
          startTime: lastNote.startTime,
          startDuration: lastNote.duration,
          initialPitch: lastNote.pitch,
          initialTime: lastNote.startTime,
          initialDuration: lastNote.duration,
          startMouseX: e.clientX,
          startMouseY: e.clientY,
          justCreated: true,
        });
      }
    }
  };

  const notesRef = useRef<Note[]>(notes);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  const findNoteAt = (pitch: number, time: number): Note | null => {
    for (const n of notesRef.current) {
      if (n.pitch === pitch && time >= n.startTime && time < n.startTime + n.duration) {
        return n;
      }
    }
    return null;
  };

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (dragState.mode === 'none' || !dragState.noteId) return;
      const dx = e.clientX - (dragState.startMouseX ?? 0);
      const dy = e.clientY - (dragState.startMouseY ?? 0);
      const timeDelta = Math.round(dx / CELL_WIDTH) * TIME_STEP;
      const pitchDelta = -Math.round(dy / CELL_HEIGHT);

      if (dragState.mode === 'move') {
        if (dragState.initialPitch !== undefined && dragState.initialTime !== undefined) {
          const currentNote = notesRef.current.find((n) => n.id === dragState.noteId);
          if (currentNote) {
            const pDelta = dragState.initialPitch + pitchDelta - currentNote.pitch;
            const tDelta = dragState.initialTime + timeDelta - currentNote.startTime;
            if (pDelta !== 0 || tDelta !== 0) {
              moveNote(dragState.noteId, pDelta, tDelta);
            }
          }
        }
      } else if (dragState.mode === 'resize-right') {
        if (dragState.initialDuration !== undefined) {
          const currentNote = notesRef.current.find((n) => n.id === dragState.noteId);
          if (currentNote) {
            const targetDuration = Math.max(TIME_STEP, dragState.initialDuration + timeDelta);
            const dDelta = targetDuration - currentNote.duration;
            if (dDelta !== 0) resizeNote(dragState.noteId, dDelta);
          }
        }
      } else if (dragState.mode === 'resize-left') {
        if (dragState.initialDuration !== undefined && dragState.initialTime !== undefined) {
          const currentNote = notesRef.current.find((n) => n.id === dragState.noteId);
          if (currentNote) {
            const newStartTime = Math.max(0, Math.min(TOTAL_DURATION - TIME_STEP, dragState.initialTime + timeDelta));
            const newDuration = Math.max(TIME_STEP, dragState.initialTime + dragState.initialDuration - newStartTime);
            const tDelta = newStartTime - currentNote.startTime;
            const dDelta = newDuration - currentNote.duration;
            if (tDelta !== 0 || dDelta !== 0) {
              moveNote(dragState.noteId, 0, tDelta);
              if (dDelta !== 0) {
                setTimeout(() => resizeNote(dragState.noteId!, dDelta), 0);
              }
            }
          }
        }
      }
    },
    [dragState, CELL_WIDTH, CELL_HEIGHT, moveNote, resizeNote],
  );

  const onMouseUp = useCallback(() => {
    setDragState({ mode: 'none' });
  }, []);

  useEffect(() => {
    if (dragState.mode !== 'none') {
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
      return () => {
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    }
  }, [dragState.mode, onMouseMove, onMouseUp]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target && (e.target as HTMLElement).tagName === 'INPUT') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && playback.selectedNoteIds.length > 0) {
        e.preventDefault();
        deleteSelectedNotes();
      } else if (e.key === 'Escape') {
        clearSelection();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playback.selectedNoteIds.length, deleteSelectedNotes, clearSelection]);

  const onGridMouseMove = (e: React.MouseEvent) => {
    if (dragState.mode !== 'none') return;
    const { y } = getPosition(e);
    const p = yToPitch(y);
    if (p !== hoverPitch) setHoverPitch(p);
  };

  const playheadX = timeToX(playback.currentTime);

  return (
    <div
      ref={containerRef}
      style={{
        width: viewportWidth,
        height: viewportHeight,
        display: 'flex',
        background: '#1A1A2E',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid #2A2A3E',
        position: 'relative',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          width: LABEL_WIDTH,
          height: GRID_HEIGHT,
          background: '#16162A',
          borderRight: '1px solid #2A2A3E',
          flexShrink: 0,
        }}
      >
        {pitches.map((p) => (
          <div
            key={p}
            style={{
              height: CELL_HEIGHT,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              paddingRight: 6,
              fontSize: Math.max(9, CELL_HEIGHT * 0.55),
              color: isBlackKey(p) ? '#8888A0' : '#B8B8D0',
              background: isBlackKey(p) ? '#1E1E38' : 'transparent',
              fontWeight: p % 12 === 0 ? 600 : 400,
              boxSizing: 'border-box',
              borderBottom: '1px solid rgba(42,42,62,0.4)',
            }}
          >
            {getSemitoneLabel(p)}{p % 12 === 0 ? String(Math.floor(p / 12) - 1) : ''}
          </div>
        ))}
      </div>

      <div
        ref={gridRef}
        onMouseDown={onGridMouseDown}
        onMouseMove={onGridMouseMove}
        onMouseLeave={() => setHoverPitch(null)}
        style={{
          width: GRID_WIDTH,
          height: GRID_HEIGHT,
          position: 'relative',
          flex: 1,
          cursor: 'crosshair',
          overflow: 'hidden',
        }}
      >
        <svg
          width={GRID_WIDTH}
          height={GRID_HEIGHT}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {pitches.map((p, i) => {
            const isBlack = isBlackKey(p);
            const isOctave = p % 12 === 0;
            const isHover = p === hoverPitch;
            return (
              <g key={`row-${p}`}>
                {isBlack && (
                  <rect
                    x={0}
                    y={i * CELL_HEIGHT}
                    width={GRID_WIDTH}
                    height={CELL_HEIGHT}
                    fill="rgba(255,255,255,0.025)"
                  />
                )}
                {isHover && (
                  <rect
                    x={0}
                    y={i * CELL_HEIGHT}
                    width={GRID_WIDTH}
                    height={CELL_HEIGHT}
                    fill="rgba(255,255,255,0.06)"
                  />
                )}
                <line
                  x1={0}
                  y1={i * CELL_HEIGHT}
                  x2={GRID_WIDTH}
                  y2={i * CELL_HEIGHT}
                  stroke={isOctave ? '#3A3A5E' : 'rgba(42,42,62,0.6)'}
                  strokeWidth={isOctave ? 1 : 0.5}
                />
              </g>
            );
          })}
          {Array.from({ length: Math.floor(TOTAL_DURATION / TIME_STEP) + 1 }).map((_, i) => {
            const isSecond = i % 5 === 0;
            const x = i * CELL_WIDTH;
            return (
              <line
                key={`v-${i}`}
                x1={x}
                y1={0}
                x2={x}
                y2={GRID_HEIGHT}
                stroke={isSecond ? 'rgba(80,80,140,0.7)' : 'rgba(42,42,62,0.4)'}
                strokeWidth={isSecond ? 1 : 0.5}
              />
            );
          })}
        </svg>

        {notes.map((note) => {
          const selected = playback.selectedNoteIds.includes(note.id);
          const x = timeToX(note.startTime);
          const y = pitchToY(note.pitch);
          const w = Math.max(CELL_WIDTH - 2, note.duration * PX_PER_SEC - 2);
          const h = Math.max(2, CELL_HEIGHT - 2);
          return (
            <div
              key={note.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                onGridMouseDown(e);
              }}
              style={{
                position: 'absolute',
                left: x + 1,
                top: y + 1,
                width: w,
                height: h,
                background: selected ? '#FF6B35' : '#4A9EFF',
                borderRadius: 4,
                boxShadow: selected
                  ? '0 0 0 1px rgba(255,107,53,0.5), 0 0 12px rgba(255,107,53,0.35)'
                  : '0 0 0 1px rgba(74,158,255,0.35), inset 0 1px 0 rgba(255,255,255,0.2)',
                cursor: 'move',
                animation: 'noteFade 0.2s ease-out',
                transition: 'background 0.12s, box-shadow 0.12s',
                zIndex: selected ? 2 : 1,
              }}
            />
          );
        })}

        <div
          style={{
            position: 'absolute',
            top: 0,
            left: playheadX,
            width: 2,
            height: GRID_HEIGHT,
            background: '#FFFFFF',
            boxShadow: '0 0 8px rgba(255,255,255,0.6)',
            pointerEvents: 'none',
            transition: 'left 0.016s linear',
            zIndex: 10,
          }}
        />
      </div>

      <style>{`
        @keyframes noteFade {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
      {isMobile ? null : null}
      {void setCurrentTime}
    </div>
  );
};
