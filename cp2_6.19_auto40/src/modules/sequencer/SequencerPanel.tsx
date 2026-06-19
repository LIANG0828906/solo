import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react';
import { useSequencerStore } from '../../store/useSequencerStore';
import { sequencerEngine } from './SequencerEngine';
import {
  TOTAL_BEATS,
  BEATS_PER_BAR,
  BARS,
  PITCH_MIN,
  PITCH_MAX,
  TOTAL_PITCHES,
  GRID_SIZE,
  MIN_TRACK_HEIGHT,
  MAX_TRACK_HEIGHT,
  Note,
  Track,
} from '../../types';

const PITCH_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const getPitchName = (pitch: number): string => {
  const octave = Math.floor(pitch / 12) - 1;
  const note = PITCH_NAMES[pitch % 12];
  return `${note}${octave}`;
};

const getPitchHue = (pitch: number): number => {
  return ((pitch - PITCH_MIN) / TOTAL_PITCHES) * 300;
};

const getPitchColor = (pitch: number): string => {
  const hue = getPitchHue(pitch);
  return `hsl(${hue}, 70%, 55%)`;
};

const getPitchGradient = (pitch: number): string => {
  const hue = getPitchHue(pitch);
  return `linear-gradient(180deg, hsl(${hue}, 80%, 65%) 0%, hsl(${hue}, 70%, 45%) 100%)`;
};

interface NoteBlockProps {
  note: Note;
  track: Track;
  pixelsPerBeat: number;
  pitchHeight: number;
  pianoWidth: number;
  isSelected: boolean;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent, note: Note) => void;
}

const NoteBlock = memo<NoteBlockProps>(
  ({ note, track, pixelsPerBeat, pitchHeight, pianoWidth, isSelected, isDragging, onMouseDown }) => {
    const x = pianoWidth + note.start * pixelsPerBeat;
    const y = 28 + (PITCH_MAX - note.pitch) * pitchHeight;
    const width = note.duration * pixelsPerBeat - 2;
    const height = pitchHeight - 1;

    return (
      <div
        onMouseDown={(e) => onMouseDown(e, note)}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: Math.max(8, width),
          height,
          background: getPitchGradient(note.pitch),
          borderRadius: 3,
          cursor: isDragging ? 'grabbing' : 'grab',
          opacity: track.muted ? 0.3 : 1,
          transition: isDragging ? 'none' : 'box-shadow 0.15s ease, transform 0.15s ease',
          boxShadow: isSelected
            ? `0 0 0 2px ${track.color}, 0 6px 16px rgba(0,0,0,0.5)`
            : '0 3px 8px rgba(0,0,0,0.35)',
          zIndex: isSelected ? 10 : isDragging ? 9 : 1,
          transform: isDragging ? 'scale(1.03)' : 'scale(1)',
          willChange: isDragging ? 'transform, left, top' : 'auto',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: 4,
            top: 2,
            fontSize: 9,
            color: 'rgba(255,255,255,0.95)',
            fontWeight: 500,
            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
            pointerEvents: 'none',
          }}
        >
          {getPitchName(note.pitch)}
        </div>
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: 'ew-resize',
          }}
        />
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: 6,
            cursor: 'ew-resize',
          }}
        />
      </div>
    );
  }
);

NoteBlock.displayName = 'NoteBlock';

interface DraggingNote {
  noteId: string;
  startX: number;
  startY: number;
  originalStart: number;
  originalPitch: number;
  originalDuration: number;
  mode: 'move' | 'resize-left' | 'resize-right' | 'none';
}

interface ResizingTrack {
  trackId: string;
  startY: number;
  originalHeight: number;
}

interface DrawingNote {
  trackId: string;
  startBeat: number;
  startPitch: number;
  currentBeat: number;
  currentPitch: number;
}

interface TrackRowProps {
  track: Track;
  trackOffset: number;
  pixelsPerBeat: number;
  totalWidth: number;
  pianoWidth: number;
  notes: Note[];
  selectedNoteId: string | null;
  draggingNote: DraggingNote | null;
  resizingTrack: ResizingTrack | null;
  onGridMouseDown: (e: React.MouseEvent, track: Track) => void;
  onGridMouseMove: (e: React.MouseEvent, track: Track) => void;
  onGridMouseUp: () => void;
  onNoteMouseDown: (e: React.MouseEvent, note: Note) => void;
  onTrackResizeStart: (e: React.MouseEvent, track: Track) => void;
}

const TrackRow = memo<TrackRowProps>(
  ({
    track,
    trackOffset,
    pixelsPerBeat,
    totalWidth,
    pianoWidth,
    notes,
    selectedNoteId,
    draggingNote,
    resizingTrack,
    onGridMouseDown,
    onGridMouseMove,
    onGridMouseUp,
    onNoteMouseDown,
    onTrackResizeStart,
  }) => {
    const pitchHeight = track.height / TOTAL_PITCHES;

    const gridLines = useMemo(() => {
      const lines: { key: string; style: React.CSSProperties }[] = [];

      for (let i = 0; i < TOTAL_PITCHES; i++) {
        const y = 28 + i * pitchHeight;
        const pitch = PITCH_MAX - i - 1;
        const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
        lines.push({
          key: `h-${i}`,
          style: {
            position: 'absolute',
            left: 0,
            right: 0,
            top: y,
            height: pitchHeight,
            backgroundColor: isBlackKey ? 'rgba(255,255,255,0.04)' : 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            pointerEvents: 'none',
          },
        });
      }

      for (let i = 0; i <= TOTAL_BEATS; i++) {
        const x = pianoWidth + i * pixelsPerBeat;
        const isBar = i % BEATS_PER_BAR === 0;
        const isBeat = i % 1 === 0;
        const opacity = isBar ? 0.35 : isBeat ? 0.15 : 0.08;
        const width = isBar ? 2 : 1;
        lines.push({
          key: `v-${i}`,
          style: {
            position: 'absolute',
            left: x,
            top: 28,
            bottom: 0,
            width,
            backgroundColor: `rgba(255,255,255,${opacity})`,
            pointerEvents: 'none',
          },
        });
      }

      return lines;
    }, [pitchHeight, pixelsPerBeat, pianoWidth]);

    const pianoKeys = useMemo(() => {
      const keys: { key: string; style: React.CSSProperties; label: string }[] = [];

      for (let i = 0; i < TOTAL_PITCHES; i++) {
        const pitch = PITCH_MAX - i - 1;
        const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
        const y = 28 + i * pitchHeight;
        keys.push({
          key: `key-${pitch}`,
          style: {
            position: 'absolute',
            left: 0,
            top: y,
            width: pianoWidth,
            height: pitchHeight,
            backgroundColor: isBlackKey ? '#252545' : '#3a3a5a',
            borderBottom: '1px solid rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 4,
            fontSize: 9,
            color: isBlackKey ? '#888' : '#bbb',
            pointerEvents: 'none',
          },
          label: pitch % 12 === 0 ? getPitchName(pitch) : '',
        });
      }

      return keys;
    }, [pitchHeight, pianoWidth]);

    const trackNotes = useMemo(
      () => notes.filter((n) => n.trackId === track.id),
      [notes, track.id]
    );

    return (
      <div style={{ position: 'absolute', left: 0, right: 0, top: trackOffset }}>
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 28,
            backgroundColor: '#16213e',
            borderBottom: '1px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: pianoWidth + 8,
            gap: 8,
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 3,
              height: 16,
              backgroundColor: track.color,
              borderRadius: 2,
            }}
          />
          <span
            style={{
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {track.name}
          </span>
        </div>

        <div
          onMouseDown={(e) => onGridMouseDown(e, track)}
          onMouseMove={(e) => onGridMouseMove(e, track)}
          onMouseUp={onGridMouseUp}
          style={{
            position: 'absolute',
            top: 28,
            left: 0,
            width: totalWidth + pianoWidth,
            height: track.height,
            cursor: 'crosshair',
            userSelect: 'none',
          }}
        >
          {pianoKeys.map((key) => (
            <div key={key.key} style={key.style}>
              {key.label}
            </div>
          ))}
          {gridLines.map((line) => (
            <div key={line.key} style={line.style} />
          ))}
          {trackNotes.map((note) => (
            <NoteBlock
              key={note.id}
              note={note}
              track={track}
              pixelsPerBeat={pixelsPerBeat}
              pitchHeight={pitchHeight}
              pianoWidth={pianoWidth}
              isSelected={selectedNoteId === note.id}
              isDragging={draggingNote?.noteId === note.id}
              onMouseDown={onNoteMouseDown}
            />
          ))}
        </div>

        <div
          onMouseDown={(e) => onTrackResizeStart(e, track)}
          style={{
            position: 'absolute',
            top: 28 + track.height - 3,
            left: 0,
            right: 0,
            height: 6,
            cursor: 'ns-resize',
            zIndex: 20,
            transition: 'background-color 0.2s ease',
            backgroundColor: resizingTrack?.trackId === track.id ? 'rgba(79,205,196,0.5)' : 'transparent',
          }}
        />
      </div>
    );
  }
);

TrackRow.displayName = 'TrackRow';

export const SequencerPanel: React.FC = () => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [draggingNote, setDraggingNote] = useState<DraggingNote | null>(null);
  const [resizingTrack, setResizingTrack] = useState<ResizingTrack | null>(null);
  const [drawingNote, setDrawingNote] = useState<DrawingNote | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ beat: number; pitch: number; x: number; y: number } | null>(null);

  const {
    tracks,
    notes,
    cursorPosition,
    isPlaying,
    zoomLevel,
    selectedNoteId,
    setSelectedNoteId,
    setTrackHeight,
  } = useSequencerStore();

  const pixelsPerBeat = useMemo(() => GRID_SIZE * zoomLevel, [zoomLevel]);
  const totalWidth = TOTAL_BEATS * pixelsPerBeat;
  const pianoWidth = 60;

  const getBeatFromX = useCallback(
    (x: number): number => {
      const relX = x - pianoWidth;
      return sequencerEngine.snapToGrid(relX / pixelsPerBeat, 0.25);
    },
    [pixelsPerBeat]
  );

  const getPitchFromY = useCallback((y: number, track: Track): number => {
    const pitchHeight = track.height / TOTAL_PITCHES;
    const relY = y - 28;
    const pitchIndex = Math.floor(relY / pitchHeight);
    return PITCH_MAX - pitchIndex;
  }, []);

  const snapPitch = useCallback((pitch: number): number => {
    return sequencerEngine.snapPitch(pitch);
  }, []);

  const scrollToCursor = useCallback(() => {
    if (!scrollContainerRef.current || !isPlaying) return;
    const container = scrollContainerRef.current;
    const cursorX = pianoWidth + cursorPosition * pixelsPerBeat;
    const viewportCenter = container.clientWidth / 2;
    const targetScroll = Math.max(0, cursorX - viewportCenter);

    const currentScroll = container.scrollLeft;
    const distance = targetScroll - currentScroll;
    if (Math.abs(distance) > 1) {
      container.scrollLeft = currentScroll + distance * 0.15;
    }
  }, [cursorPosition, isPlaying, pixelsPerBeat]);

  useEffect(() => {
    if (isPlaying) {
      const frame = requestAnimationFrame(scrollToCursor);
      return () => cancelAnimationFrame(frame);
    }
  }, [cursorPosition, isPlaying, scrollToCursor]);

  const handleGridMouseDown = useCallback(
    (e: React.MouseEvent, track: Track) => {
      if (e.button !== 0) return;
      e.preventDefault();

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const beat = getBeatFromX(x);
      const pitch = snapPitch(getPitchFromY(y, track));

      if (beat < 0 || beat >= TOTAL_BEATS) return;

      setDrawingNote({
        trackId: track.id,
        startBeat: beat,
        startPitch: pitch,
        currentBeat: beat,
        currentPitch: pitch,
      });

      setHoverInfo({ beat, pitch, x, y });
    },
    [getBeatFromX, getPitchFromY, snapPitch]
  );

  const handleGridMouseMove = useCallback(
    (e: React.MouseEvent, track: Track) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const beat = getBeatFromX(x);
      const pitch = snapPitch(getPitchFromY(y, track));

      if (drawingNote && drawingNote.trackId === track.id) {
        const snappedBeat = getBeatFromX(x);
        setDrawingNote((prev) =>
          prev
            ? {
                ...prev,
                currentBeat: Math.max(prev.startBeat, snappedBeat),
                currentPitch: pitch,
              }
            : null
        );
      }

      if (!draggingNote) {
        setHoverInfo({ beat, pitch, x, y });
      }
    },
    [drawingNote, draggingNote, getBeatFromX, getPitchFromY, snapPitch]
  );

  const handleGridMouseUp = useCallback(() => {
    if (drawingNote) {
      const start = Math.min(drawingNote.startBeat, drawingNote.currentBeat);
      const duration = Math.max(0.25, Math.abs(drawingNote.currentBeat - drawingNote.startBeat) + 0.25);
      const pitch = drawingNote.currentPitch;

      const trackNotes = notes.filter((n) => n.trackId === drawingNote.trackId);
      if (trackNotes.length < 128) {
        sequencerEngine.addNote({
          trackId: drawingNote.trackId,
          pitch,
          start,
          duration: sequencerEngine.snapToGrid(duration, 0.25),
          velocity: 0.8,
        });
      }

      setDrawingNote(null);
    }
  }, [drawingNote, notes]);

  const handleNoteMouseDown = useCallback(
    (e: React.MouseEvent, note: Note) => {
      e.stopPropagation();
      if (e.button !== 0) return;
      e.preventDefault();

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;

      setSelectedNoteId(note.id);

      let mode: DraggingNote['mode'] = 'move';
      if (x < 8) mode = 'resize-left';
      if (x > width - 8) mode = 'resize-right';

      setDraggingNote({
        noteId: note.id,
        startX: e.clientX,
        startY: e.clientY,
        originalStart: note.start,
        originalPitch: note.pitch,
        originalDuration: note.duration,
        mode,
      });
    },
    [setSelectedNoteId]
  );

  const handleTrackResizeStart = useCallback(
    (e: React.MouseEvent, track: Track) => {
      e.stopPropagation();
      e.preventDefault();
      setResizingTrack({
        trackId: track.id,
        startY: e.clientY,
        originalHeight: track.height,
      });
    },
    []
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (draggingNote) {
        const deltaX = e.clientX - draggingNote.startX;
        const deltaY = e.clientY - draggingNote.startY;
        const deltaBeats = deltaX / pixelsPerBeat;

        const track = tracks.find((t) => {
          const note = notes.find((n) => n.id === draggingNote.noteId);
          return note ? t.id === note.trackId : false;
        });

        let deltaPitches = 0;
        if (track) {
          const pitchHeight = track.height / TOTAL_PITCHES;
          deltaPitches = -deltaY / pitchHeight;
        }

        let newStart = draggingNote.originalStart;
        let newPitch = draggingNote.originalPitch;
        let newDuration = draggingNote.originalDuration;

        if (draggingNote.mode === 'move') {
          newStart = sequencerEngine.snapToGrid(draggingNote.originalStart + deltaBeats, 0.25);
          newPitch = snapPitch(draggingNote.originalPitch + deltaPitches);
        } else if (draggingNote.mode === 'resize-left') {
          const resizedStart = sequencerEngine.snapToGrid(draggingNote.originalStart + deltaBeats, 0.25);
          newDuration = Math.max(0.25, draggingNote.originalStart + draggingNote.originalDuration - resizedStart);
          newStart = resizedStart;
        } else if (draggingNote.mode === 'resize-right') {
          newDuration = Math.max(
            0.25,
            sequencerEngine.snapToGrid(draggingNote.originalDuration + deltaBeats, 0.25)
          );
        }

        sequencerEngine.moveNote(draggingNote.noteId, newStart, newPitch, newDuration);
      }

      if (resizingTrack) {
        const deltaY = e.clientY - resizingTrack.startY;
        const newHeight = Math.max(
          MIN_TRACK_HEIGHT,
          Math.min(MAX_TRACK_HEIGHT, resizingTrack.originalHeight + deltaY)
        );
        setTrackHeight(resizingTrack.trackId, newHeight);
      }
    };

    const handleMouseUp = () => {
      if (draggingNote) setDraggingNote(null);
      if (resizingTrack) setResizingTrack(null);
      if (drawingNote) handleGridMouseUp();
    };

    if (draggingNote || resizingTrack || drawingNote) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingNote, resizingTrack, drawingNote, pixelsPerBeat, snapPitch, setTrackHeight, handleGridMouseUp, tracks, notes]);

  const handleGridClick = useCallback(() => {
    if (!draggingNote && !drawingNote) {
      setSelectedNoteId(null);
    }
  }, [draggingNote, drawingNote, setSelectedNoteId]);

  const renderDrawingPreview = useMemo(() => {
    if (!drawingNote) return null;

    const track = tracks.find((t) => t.id === drawingNote.trackId);
    if (!track) return null;

    const pitchHeight = track.height / TOTAL_PITCHES;
    const start = Math.min(drawingNote.startBeat, drawingNote.currentBeat);
    const duration = Math.max(0.25, Math.abs(drawingNote.currentBeat - drawingNote.startBeat) + 0.25);
    const pitch = drawingNote.currentPitch;

    const x = pianoWidth + start * pixelsPerBeat;
    const y = 28 + (PITCH_MAX - pitch) * pitchHeight;
    const width = duration * pixelsPerBeat - 2;
    const height = pitchHeight - 1;

    let trackOffset = 0;
    const trackIndex = tracks.findIndex((t) => t.id === drawingNote.trackId);
    for (let i = 0; i < trackIndex; i++) {
      trackOffset += tracks[i].height + 28;
    }

    return (
      <div
        style={{
          position: 'absolute',
          left: x,
          top: trackOffset + y,
          width: Math.max(8, width),
          height,
          background: getPitchGradient(pitch),
          opacity: 0.45,
          borderRadius: 3,
          pointerEvents: 'none',
          boxShadow: `0 0 20px ${getPitchColor(pitch)}`,
          zIndex: 100,
          border: `2px solid ${getPitchColor(pitch)}`,
        }}
      />
    );
  }, [drawingNote, tracks, pixelsPerBeat]);

  const renderPlayhead = useMemo(() => {
    const x = pianoWidth + cursorPosition * pixelsPerBeat;
    return (
      <div
        style={{
          position: 'absolute',
          left: x,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: '#ff4444',
          boxShadow: '0 0 10px rgba(255,68,68,0.7)',
          pointerEvents: 'none',
          zIndex: 50,
          willChange: 'left',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -1,
            left: -7,
            width: 16,
            height: 16,
            backgroundColor: '#ff4444',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            boxShadow: '0 -2px 8px rgba(255,68,68,0.6)',
          }}
        />
      </div>
    );
  }, [cursorPosition, pixelsPerBeat]);

  const renderBarNumbers = useMemo(() => {
    const numbers = [];
    for (let i = 0; i < BARS; i++) {
      const x = pianoWidth + i * BEATS_PER_BAR * pixelsPerBeat;
      numbers.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x + 6,
            top: 7,
            fontSize: 10,
            color: 'rgba(255,255,255,0.45)',
            fontWeight: 600,
            pointerEvents: 'none',
          }}
        >
          {i + 1}
        </div>
      );
    }
    return numbers;
  }, [pixelsPerBeat]);

  const totalHeight = useMemo(() => tracks.reduce((acc, t) => acc + t.height + 28, 0), [tracks]);

  const trackOffsets = useMemo(() => {
    const offsets: number[] = [];
    let acc = 0;
    for (const track of tracks) {
      offsets.push(acc);
      acc += track.height + 28;
    }
    return offsets;
  }, [tracks]);

  const renderPositionTooltip = useCallback(() => {
    if (!hoverInfo || draggingNote || drawingNote) return null;
    return null;
  }, [hoverInfo, draggingNote, drawingNote]);

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a2e',
        minWidth: 0,
        position: 'relative',
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 28,
          backgroundColor: '#16213e',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          zIndex: 5,
          flexShrink: 0,
        }}
      >
        {renderBarNumbers}
      </div>

      <div
        ref={scrollContainerRef}
        onClick={handleGridClick}
        onMouseLeave={() => setHoverInfo(null)}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: totalWidth + pianoWidth,
            height: totalHeight,
            minWidth: '100%',
          }}
        >
          {renderPlayhead}

          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              trackOffset={trackOffsets[index]}
              pixelsPerBeat={pixelsPerBeat}
              totalWidth={totalWidth}
              pianoWidth={pianoWidth}
              notes={notes}
              selectedNoteId={selectedNoteId}
              draggingNote={draggingNote}
              resizingTrack={resizingTrack}
              onGridMouseDown={handleGridMouseDown}
              onGridMouseMove={handleGridMouseMove}
              onGridMouseUp={handleGridMouseUp}
              onNoteMouseDown={handleNoteMouseDown}
              onTrackResizeStart={handleTrackResizeStart}
            />
          ))}

          {renderDrawingPreview}
          {renderPositionTooltip()}
        </div>
      </div>
    </div>
  );
};
