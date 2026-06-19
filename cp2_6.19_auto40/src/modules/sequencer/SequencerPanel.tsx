import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
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

const getPitchColor = (pitch: number): string => {
  const hue = ((pitch - PITCH_MIN) / TOTAL_PITCHES) * 300;
  return `hsl(${hue}, 70%, 55%)`;
};

const getPitchGradient = (pitch: number): string => {
  const hue = ((pitch - PITCH_MIN) / TOTAL_PITCHES) * 300;
  return `linear-gradient(180deg, hsl(${hue}, 80%, 65%) 0%, hsl(${hue}, 70%, 45%) 100%)`;
};

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

export const SequencerPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
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
      return sequencerEngine.snapToGrid(relX / pixelsPerBeat);
    },
    [pixelsPerBeat]
  );

  const getPitchFromY = useCallback((y: number, track: Track): number => {
    const pitchHeight = track.height / TOTAL_PITCHES;
    const relY = y - 28;
    const pitchIndex = Math.floor(relY / pitchHeight);
    return PITCH_MAX - pitchIndex;
  }, []);

  const getXFromBeat = useCallback(
    (beat: number): number => {
      return pianoWidth + beat * pixelsPerBeat;
    },
    [pixelsPerBeat]
  );

  const getYFromPitch = useCallback(
    (pitch: number, track: Track): number => {
      const pitchHeight = track.height / TOTAL_PITCHES;
      const pitchIndex = PITCH_MAX - pitch;
      return 28 + pitchIndex * pitchHeight;
    },
    []
  );

  const snapPitch = useCallback((pitch: number): number => {
    return Math.max(PITCH_MIN, Math.min(PITCH_MAX, Math.round(pitch)));
  }, []);

  const scrollToCursor = useCallback(() => {
    if (!scrollContainerRef.current || !isPlaying) return;
    const container = scrollContainerRef.current;
    const cursorX = getXFromBeat(cursorPosition);
    const viewportCenter = container.clientWidth / 2;
    const targetScroll = Math.max(0, cursorX - viewportCenter);
    container.scrollTo({ left: targetScroll, behavior: 'smooth' });
  }, [cursorPosition, isPlaying, getXFromBeat]);

  useEffect(() => {
    if (isPlaying) {
      scrollToCursor();
    }
  }, [cursorPosition, isPlaying, scrollToCursor]);

  const handleGridMouseDown = useCallback(
    (e: React.MouseEvent, track: Track) => {
      if (e.button !== 0) return;

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

      if (drawingNote) {
        setDrawingNote((prev) =>
          prev ? { ...prev, currentBeat: Math.max(prev.startBeat, beat), currentPitch: pitch } : null
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

      sequencerEngine.addNote({
        trackId: drawingNote.trackId,
        pitch,
        start,
        duration,
        velocity: 0.8,
      });

      setDrawingNote(null);
    }
  }, [drawingNote]);

  const handleNoteMouseDown = useCallback(
    (e: React.MouseEvent, note: Note) => {
      e.stopPropagation();
      if (e.button !== 0) return;

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
        const deltaPitches = -deltaY / 10;

        let newStart = draggingNote.originalStart;
        let newPitch = draggingNote.originalPitch;
        let newDuration = draggingNote.originalDuration;

        if (draggingNote.mode === 'move') {
          newStart = sequencerEngine.snapToGrid(draggingNote.originalStart + deltaBeats);
          newPitch = snapPitch(draggingNote.originalPitch + deltaPitches);
        } else if (draggingNote.mode === 'resize-left') {
          const resizedStart = sequencerEngine.snapToGrid(draggingNote.originalStart + deltaBeats);
          newDuration = Math.max(0.25, draggingNote.originalStart + draggingNote.originalDuration - resizedStart);
          newStart = resizedStart;
        } else if (draggingNote.mode === 'resize-right') {
          newDuration = Math.max(
            0.25,
            sequencerEngine.snapToGrid(draggingNote.originalDuration + deltaBeats)
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
  }, [draggingNote, resizingTrack, drawingNote, pixelsPerBeat, snapPitch, setTrackHeight, handleGridMouseUp]);

  const handleGridClick = useCallback(() => {
    if (!draggingNote && !drawingNote) {
      setSelectedNoteId(null);
    }
  }, [draggingNote, drawingNote, setSelectedNoteId]);

  const renderGrid = (track: Track) => {
    const pitchHeight = track.height / TOTAL_PITCHES;
    const lines = [];

    for (let i = 0; i <= TOTAL_PITCHES; i++) {
      const y = 28 + i * pitchHeight;
      const pitch = PITCH_MAX - i;
      const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
      lines.push(
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: y,
            height: pitchHeight,
            backgroundColor: isBlackKey ? 'rgba(255,255,255,0.03)' : 'transparent',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />
      );
    }

    for (let i = 0; i <= TOTAL_BEATS; i++) {
      const x = pianoWidth + i * pixelsPerBeat;
      const isBar = i % BEATS_PER_BAR === 0;
      const isBeat = i % 1 === 0;
      const opacity = isBar ? 0.3 : isBeat ? 0.15 : 0.08;
      lines.push(
        <div
          key={`v-${i}`}
          style={{
            position: 'absolute',
            left: x,
            top: 28,
            bottom: 0,
            width: isBar ? 2 : 1,
            backgroundColor: `rgba(255,255,255,${opacity})`,
            pointerEvents: 'none',
          }}
        />
      );
    }

    return lines;
  };

  const renderPianoRoll = (track: Track) => {
    const pitchHeight = track.height / TOTAL_PITCHES;
    const keys = [];

    for (let i = 0; i < TOTAL_PITCHES; i++) {
      const pitch = PITCH_MAX - i;
      const isBlackKey = [1, 3, 6, 8, 10].includes(pitch % 12);
      const y = 28 + i * pitchHeight;

      keys.push(
        <div
          key={pitch}
          style={{
            position: 'absolute',
            left: 0,
            top: y,
            width: pianoWidth,
            height: pitchHeight,
            backgroundColor: isBlackKey ? '#2a2a4a' : '#3a3a5a',
            borderBottom: '1px solid rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: 4,
            fontSize: 9,
            color: isBlackKey ? '#888' : '#aaa',
            pointerEvents: 'none',
          }}
        >
          {pitch % 12 === 0 && getPitchName(pitch)}
        </div>
      );
    }

    return keys;
  };

  const renderNotes = (track: Track) => {
    const trackNotes = notes.filter((n) => n.trackId === track.id);
    const pitchHeight = track.height / TOTAL_PITCHES;

    return trackNotes.map((note) => {
      const x = getXFromBeat(note.start);
      const y = getYFromPitch(note.pitch, track);
      const width = note.duration * pixelsPerBeat - 2;
      const height = pitchHeight - 1;
      const isSelected = selectedNoteId === note.id;
      const isDragging = draggingNote?.noteId === note.id;

      return (
        <div
          key={note.id}
          onMouseDown={(e) => handleNoteMouseDown(e, note)}
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
            transition: isDragging ? 'none' : 'all 0.1s ease',
            boxShadow: isSelected
              ? `0 0 0 2px ${track.color}, 0 4px 12px rgba(0,0,0,0.4)`
              : '0 2px 6px rgba(0,0,0,0.3)',
            zIndex: isSelected ? 10 : isDragging ? 9 : 1,
            transform: isDragging ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 4,
              top: 2,
              fontSize: 9,
              color: 'rgba(255,255,255,0.9)',
              fontWeight: 500,
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
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
    });
  };

  const renderDrawingPreview = (track: Track) => {
    if (!drawingNote || drawingNote.trackId !== track.id) return null;

    const start = Math.min(drawingNote.startBeat, drawingNote.currentBeat);
    const duration = Math.max(0.25, Math.abs(drawingNote.currentBeat - drawingNote.startBeat) + 0.25);
    const pitch = drawingNote.currentPitch;
    const pitchHeight = track.height / TOTAL_PITCHES;

    const x = getXFromBeat(start);
    const y = getYFromPitch(pitch, track);
    const width = duration * pixelsPerBeat - 2;
    const height = pitchHeight - 1;

    return (
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: Math.max(8, width),
          height,
          background: getPitchGradient(pitch),
          opacity: 0.5,
          borderRadius: 3,
          pointerEvents: 'none',
          boxShadow: `0 0 12px ${getPitchColor(pitch)}`,
          zIndex: 100,
        }}
      />
    );
  };

  const renderPlayhead = () => {
    const x = getXFromBeat(cursorPosition);
    return (
      <div
        style={{
          position: 'absolute',
          left: x,
          top: 0,
          bottom: 0,
          width: 2,
          backgroundColor: '#ff4444',
          boxShadow: '0 0 8px rgba(255,68,68,0.6)',
          pointerEvents: 'none',
          zIndex: 50,
          transition: isPlaying ? 'none' : 'left 0.1s ease',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: -6,
            width: 14,
            height: 14,
            backgroundColor: '#ff4444',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
          }}
        />
      </div>
    );
  };

  const renderBarNumbers = () => {
    const numbers = [];
    for (let i = 0; i < BARS; i++) {
      const x = pianoWidth + i * BEATS_PER_BAR * pixelsPerBeat;
      numbers.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: x + 4,
            top: 6,
            fontSize: 10,
            color: 'rgba(255,255,255,0.4)',
            fontWeight: 600,
          }}
        >
          {i + 1}
        </div>
      );
    }
    return numbers;
  };

  const renderPositionTooltip = () => {
    if (!hoverInfo || draggingNote || drawingNote) return null;

    let acc = 0;
    const track = tracks.find((_t) => {
      let found = false;
      for (const tr of tracks) {
        if (hoverInfo.y >= acc && hoverInfo.y < acc + tr.height + 28) {
          found = true;
          break;
        }
        acc += tr.height + 28;
      }
      return found;
    });

    if (!track) return null;

    return (
      <div
        style={{
          position: 'absolute',
          left: hoverInfo.x + pianoWidth + 10,
          top: hoverInfo.y - 20,
          backgroundColor: 'rgba(0,0,0,0.9)',
          color: '#fff',
          padding: '4px 8px',
          borderRadius: 4,
          fontSize: 11,
          pointerEvents: 'none',
          zIndex: 200,
          boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
        }}
      >
        {getPitchName(hoverInfo.pitch)} | {hoverInfo.beat.toFixed(2)}
      </div>
    );
  };

  const totalHeight = tracks.reduce((acc, t) => acc + t.height + 28, 0);

  return (
    <div
      ref={containerRef}
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
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 28,
          backgroundColor: '#16213e',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          zIndex: 5,
        }}
      >
        {renderBarNumbers()}
      </div>

      <div
        ref={scrollContainerRef}
        onClick={handleGridClick}
        onMouseLeave={() => setHoverInfo(null)}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          marginTop: 28,
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
          {renderPlayhead()}

          {tracks.map((track, trackIndex) => {
            let trackOffset = 0;
            for (let i = 0; i < trackIndex; i++) {
              trackOffset += tracks[i].height + 28;
            }

            return (
              <div key={track.id}>
                <div
                  style={{
                    position: 'absolute',
                    top: trackOffset,
                    left: 0,
                    right: 0,
                    height: 28,
                    backgroundColor: '#16213e',
                    borderBottom: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: pianoWidth + 8,
                    gap: 8,
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
                  onMouseDown={(e) => handleGridMouseDown(e, track)}
                  onMouseMove={(e) => handleGridMouseMove(e, track)}
                  onMouseUp={handleGridMouseUp}
                  style={{
                    position: 'absolute',
                    top: trackOffset + 28,
                    left: 0,
                    width: totalWidth + pianoWidth,
                    height: track.height,
                    cursor: 'crosshair',
                    userSelect: 'none',
                  }}
                >
                  {renderPianoRoll(track)}
                  {renderGrid(track)}
                  {renderNotes(track)}
                  {renderDrawingPreview(track)}
                </div>

                <div
                  onMouseDown={(e) => handleTrackResizeStart(e, track)}
                  style={{
                    position: 'absolute',
                    top: trackOffset + 28 + track.height - 3,
                    left: 0,
                    right: 0,
                    height: 6,
                    cursor: 'ns-resize',
                    zIndex: 20,
                    transition: 'background-color 0.2s',
                    backgroundColor: resizingTrack?.trackId === track.id ? 'rgba(79,205,196,0.5)' : 'transparent',
                  }}
                />
              </div>
            );
          })}

          {renderPositionTooltip()}
        </div>
      </div>
    </div>
  );
};
