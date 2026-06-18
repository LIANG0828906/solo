import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useSequencerStore } from '../../store/useSequencerStore';
import { sequencerEngine } from './SequencerEngine';
import { Note, Track } from '../../types';

const BEAT_WIDTH = 60;
const NOTE_HEIGHT = 12;
const LOWEST_PITCH = 24;
const HIGHEST_PITCH = 108;
const PITCH_RANGE = HIGHEST_PITCH - LOWEST_PITCH;
const TOTAL_BEATS = 32;

const pitchToColor = (pitch: number): string => {
  const hue = ((pitch - LOWEST_PITCH) / PITCH_RANGE) * 300;
  return `hsl(${hue}, 70%, 55%)`;
};

const pitchToGradient = (pitch: number): string => {
  const hue = ((pitch - LOWEST_PITCH) / PITCH_RANGE) * 300;
  return `linear-gradient(135deg, hsl(${hue}, 80%, 65%), hsl(${hue}, 60%, 45%))`;
};

const pitchToName = (pitch: number): string => {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(pitch / 12) - 1;
  const noteIdx = pitch % 12;
  return `${noteNames[noteIdx]}${octave}`;
};

export const SequencerPanel: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const {
    tracks,
    notes,
    cursorPosition,
    isPlaying,
    zoomLevel,
    selectedNoteId,
    notePreview,
    setSelectedNoteId,
    setNotePreview,
    setDraggingNoteId,
    updateTrack,
    toggleMute,
    toggleSolo,
  } = useSequencerStore();

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ trackId: string; pitch: number; start: number } | null>(null);
  const [draggingNote, setDraggingNote] = useState<{
    noteId: string;
    mode: 'move' | 'resize';
    offsetStart: number;
    offsetPitch: number;
  } | null>(null);
  const [resizingTrack, setResizingTrack] = useState<{ trackId: string; startY: number; startHeight: number } | null>(null);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; text: string } | null>(null);

  const beatWidth = BEAT_WIDTH * zoomLevel;

  useEffect(() => {
    if (isPlaying && scrollContainerRef.current) {
      const cursorX = cursorPosition * beatWidth;
      const containerWidth = scrollContainerRef.current.clientWidth;
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const targetScroll = cursorX - containerWidth / 2;

      if (targetScroll > scrollLeft + containerWidth / 4 || targetScroll < scrollLeft - containerWidth / 4) {
        scrollContainerRef.current.scrollTo({
          left: Math.max(0, targetScroll),
          behavior: 'smooth',
        });
      }
    }
  }, [cursorPosition, isPlaying, beatWidth]);

  const getPositionFromEvent = useCallback((e: React.MouseEvent, track: Track) => {
    if (!containerRef.current) return null;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = scrollContainerRef.current?.scrollLeft || 0;
    const x = e.clientX - rect.left + scrollLeft;
    const y = e.clientY - rect.top;

    const trackTop = tracks
      .slice(0, tracks.indexOf(track))
      .reduce((sum, t) => sum + t.height, 0);
    const trackY = y - trackTop;

    const rawBeat = x / beatWidth;
    const snappedBeat = Math.round(rawBeat * 4) / 4;

    const pitchPixels = track.height - 20;
    const pitchY = trackY - 10;
    const rawPitch = HIGHEST_PITCH - (pitchY / pitchPixels) * PITCH_RANGE;
    const snappedPitch = Math.round(rawPitch);

    return {
      beat: Math.max(0, Math.min(TOTAL_BEATS - 1, snappedBeat)),
      pitch: Math.max(LOWEST_PITCH, Math.min(HIGHEST_PITCH, snappedPitch)),
      rawBeat,
      x,
      y,
    };
  }, [tracks, beatWidth]);

  const handleTrackMouseDown = (e: React.MouseEvent, track: Track) => {
    if (e.button !== 0) return;
    const pos = getPositionFromEvent(e, track);
    if (!pos) return;

    setIsDrawing(true);
    setDrawStart({ trackId: track.id, pitch: pos.pitch, start: pos.beat });
    setNotePreview({
      trackId: track.id,
      pitch: pos.pitch,
      start: pos.beat,
      duration: 0.25,
    });
  };

  const handleTrackMouseMove = (e: React.MouseEvent, track: Track) => {
    const pos = getPositionFromEvent(e, track);
    if (!pos) return;

    if (isDrawing && drawStart) {
      const duration = Math.max(0.25, Math.round((pos.beat - drawStart.start + 0.25) * 4) / 4);
      setNotePreview({
        trackId: drawStart.trackId,
        pitch: drawStart.pitch,
        start: drawStart.start,
        duration,
      });
      setHoverInfo({ x: e.clientX, y: e.clientY - 30, text: `${pitchToName(drawStart.pitch)}  ${drawStart.start.toFixed(2)} - ${(drawStart.start + duration).toFixed(2)} beats` });
    } else if (draggingNote) {
      const note = notes.find(n => n.id === draggingNote.noteId);
      if (!note) return;

      if (draggingNote.mode === 'move') {
        const newStart = Math.max(0, pos.beat - draggingNote.offsetStart);
        const newPitch = Math.max(LOWEST_PITCH, Math.min(HIGHEST_PITCH, pos.pitch - draggingNote.offsetPitch));
        sequencerEngine.moveNote(note.id, newStart, newPitch);
        setHoverInfo({ x: e.clientX, y: e.clientY - 30, text: `${pitchToName(newPitch)}  @ ${newStart.toFixed(2)} beats` });
      } else if (draggingNote.mode === 'resize') {
        const newDuration = Math.max(0.25, pos.beat - note.start + 0.25);
        sequencerEngine.resizeNote(note.id, newDuration);
        setHoverInfo({ x: e.clientX, y: e.clientY - 30, text: `Duration: ${newDuration.toFixed(2)} beats` });
      }
    } else if (!draggingNote && !isDrawing) {
      setHoverInfo({ x: e.clientX, y: e.clientY - 30, text: `${pitchToName(pos.pitch)}  Beat ${pos.beat.toFixed(2)}` });
    }
  };

  const handleMouseUp = () => {
    if (isDrawing && notePreview && notePreview.duration >= 0.25) {
      sequencerEngine.addNote({
        trackId: notePreview.trackId,
        pitch: notePreview.pitch,
        start: notePreview.start,
        duration: notePreview.duration,
        velocity: 100,
      });
    }

    setIsDrawing(false);
    setDrawStart(null);
    setNotePreview(null);
    setDraggingNote(null);
    setDraggingNoteId(null);
    setHoverInfo(null);
  };

  const handleNoteMouseDown = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (e.button !== 0) return;

    const track = tracks.find(t => t.id === note.trackId);
    if (!track) return;
    const pos = getPositionFromEvent(e, track);
    if (!pos) return;

    const isRightEdge = (pos.rawBeat - note.start) > note.duration - 0.2;
    const mode = isRightEdge ? 'resize' : 'move';

    setDraggingNote({
      noteId: note.id,
      mode,
      offsetStart: pos.beat - note.start,
      offsetPitch: pos.pitch - note.pitch,
    });
    setDraggingNoteId(note.id);
    setSelectedNoteId(note.id);
  };

  const handleNoteDoubleClick = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    sequencerEngine.removeNote(note.id);
    setSelectedNoteId(null);
  };

  const handleTrackResizeStart = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation();
    setResizingTrack({ trackId: track.id, startY: e.clientY, startHeight: track.height });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (resizingTrack) {
        const delta = e.clientY - resizingTrack.startY;
        const newHeight = Math.max(60, Math.min(300, resizingTrack.startHeight + delta));
        updateTrack(resizingTrack.trackId, { height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setResizingTrack(null);
    };

    if (resizingTrack) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingTrack, updateTrack]);

  const getTrackNotes = (trackId: string) => notes.filter(n => n.trackId === trackId);

  const renderGridLines = (track: Track) => {
    const lines = [];
    for (let beat = 0; beat <= TOTAL_BEATS; beat++) {
      const isBarLine = beat % 4 === 0;
      lines.push(
        <div
          key={`v-${beat}`}
          style={{
            position: 'absolute',
            left: beat * beatWidth,
            top: 0,
            bottom: 0,
            width: isBarLine ? 2 : 1,
            backgroundColor: isBarLine ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.05)',
            pointerEvents: 'none',
          }}
        />
      );
    }

    const pitchLines = zoomLevel > 0.7 ? 12 : 6;
    for (let i = 0; i <= pitchLines; i++) {
      const y = (i / pitchLines) * (track.height - 20) + 10;
      lines.push(
        <div
          key={`h-${i}`}
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: y,
            height: 1,
            backgroundColor: 'rgba(255,255,255,0.03)',
            pointerEvents: 'none',
          }}
        />
      );
    }
    return lines;
  };

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a1a2e',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          backgroundColor: '#16213e',
          flexShrink: 0,
        }}
      >
        <div style={{ width: 180, flexShrink: 0, padding: '8px 12px', color: '#8892b0', fontSize: 12, fontWeight: 600 }}>
          TRACK
        </div>
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <div
            ref={scrollContainerRef}
            style={{
              display: 'flex',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollbarWidth: 'thin',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: TOTAL_BEATS * beatWidth,
                height: 36,
                flexShrink: 0,
              }}
            >
              {Array.from({ length: TOTAL_BEATS }, (_, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    left: i * beatWidth,
                    top: 0,
                    bottom: 0,
                    width: beatWidth,
                    display: 'flex',
                    alignItems: 'center',
                    paddingLeft: 6,
                    fontSize: 11,
                    color: i % 4 === 0 ? '#ccd6f6' : '#5a6a8a',
                    fontWeight: i % 4 === 0 ? 600 : 400,
                    borderLeft: i % 4 === 0 ? '2px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)',
                  }}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{ flex: 1, display: 'flex', overflow: 'hidden' }}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setHoverInfo(null); }}
      >
        <div
          style={{
            width: 180,
            flexShrink: 0,
            backgroundColor: '#16213e',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {tracks.map((track) => (
            <div
              key={track.id}
              style={{
                height: track.height,
                padding: '8px 12px',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                gap: 6,
                transition: resizingTrack?.trackId === track.id ? 'none' : 'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    backgroundColor: track.color,
                    boxShadow: `0 0 8px ${track.color}50`,
                  }}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: track.muted ? '#4a5568' : '#e6f1ff', flex: 1 }}>
                  {track.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => toggleMute(track.id)}
                  style={{
                    width: 24,
                    height: 22,
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: track.muted ? '#e94560' : '#0f3460',
                    color: '#fff',
                    transition: 'all 0.15s ease',
                    boxShadow: track.muted ? '0 0 8px rgba(233,69,96,0.4)' : 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  M
                </button>
                <button
                  onClick={() => toggleSolo(track.id)}
                  style={{
                    width: 24,
                    height: 22,
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 10,
                    fontWeight: 700,
                    backgroundColor: track.solo ? '#f77f00' : '#0f3460',
                    color: '#fff',
                    transition: 'all 0.15s ease',
                    boxShadow: track.solo ? '0 0 8px rgba(247,127,0,0.4)' : 'none',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  S
                </button>

                <div
                  style={{
                    flex: 1,
                    height: 22,
                    backgroundColor: '#0a0e1a',
                    borderRadius: 4,
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: `${track.volume * 100}%`,
                      background: track.volume > 1
                        ? 'linear-gradient(90deg, #e94560, #ff6b6b)'
                        : `linear-gradient(90deg, ${track.color}80, ${track.color})`,
                      transition: 'width 0.1s ease',
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    right: 6,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: 10,
                    color: '#ccd6f6',
                    fontWeight: 600,
                  }}>
                    {Math.round(track.volume * 100)}%
                  </span>
                </div>
              </div>

              <div
                onMouseDown={(e) => handleTrackResizeStart(e, track)}
                style={{
                  position: 'absolute',
                  bottom: -3,
                  left: 0,
                  right: 0,
                  height: 6,
                  cursor: 'ns-resize',
                  zIndex: 10,
                }}
              />
            </div>
          ))}
        </div>

        <div
          style={{
            flex: 1,
            overflow: 'auto',
            position: 'relative',
            scrollbarWidth: 'thin',
          }}
          onScroll={(e) => {
            const el = e.currentTarget;
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollLeft = el.scrollLeft;
            }
          }}
        >
          <div
            style={{
              position: 'relative',
              width: TOTAL_BEATS * beatWidth,
              minWidth: '100%',
            }}
          >
            {tracks.map((track) => (
              <div
                key={track.id}
                style={{
                  height: track.height,
                  position: 'relative',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  backgroundColor: tracks.indexOf(track) % 2 === 0 ? '#1a1a2e' : '#1e1e33',
                  cursor: 'crosshair',
                  transition: resizingTrack?.trackId === track.id ? 'none' : 'height 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  userSelect: 'none',
                }}
                onMouseDown={(e) => handleTrackMouseDown(e, track)}
                onMouseMove={(e) => handleTrackMouseMove(e, track)}
              >
                {renderGridLines(track)}

                {getTrackNotes(track.id).map((note) => {
                  const left = note.start * beatWidth;
                  const width = note.duration * beatWidth;
                  const pitchY = ((HIGHEST_PITCH - note.pitch) / PITCH_RANGE) * (track.height - 20) + 10;
                  const isSelected = selectedNoteId === note.id;
                  const isDragging = draggingNote?.noteId === note.id;

                  return (
                    <div
                      key={note.id}
                      onMouseDown={(e) => handleNoteMouseDown(e, note)}
                      onDoubleClick={(e) => handleNoteDoubleClick(e, note)}
                      style={{
                        position: 'absolute',
                        left,
                        top: pitchY - NOTE_HEIGHT / 2,
                        width: Math.max(8, width - 2),
                        height: NOTE_HEIGHT,
                        background: pitchToGradient(note.pitch),
                        borderRadius: 3,
                        cursor: isDragging ? 'grabbing' : 'grab',
                        boxShadow: isSelected
                          ? `0 0 0 2px #fff, 0 4px 12px ${pitchToColor(note.pitch)}60`
                          : `0 2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)`,
                        transition: isDragging ? 'none' : 'box-shadow 0.15s ease, transform 0.1s ease',
                        transform: isDragging ? 'scale(1.02)' : 'scale(1)',
                        zIndex: isSelected || isDragging ? 5 : 1,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          right: 0,
                          top: 0,
                          bottom: 0,
                          width: 8,
                          cursor: 'ew-resize',
                          background: 'rgba(255,255,255,0.1)',
                        }}
                      />
                      {width > 40 && (
                        <span
                          style={{
                            position: 'absolute',
                            left: 6,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: 9,
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.9)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {pitchToName(note.pitch)}
                        </span>
                      )}
                    </div>
                  );
                })}

                {notePreview && notePreview.trackId === track.id && (
                  <div
                    style={{
                      position: 'absolute',
                      left: notePreview.start * beatWidth,
                      top: ((HIGHEST_PITCH - notePreview.pitch) / PITCH_RANGE) * (track.height - 20) + 10 - NOTE_HEIGHT / 2,
                      width: Math.max(8, notePreview.duration * beatWidth - 2),
                      height: NOTE_HEIGHT,
                      background: pitchToGradient(notePreview.pitch),
                      borderRadius: 3,
                      opacity: 0.4,
                      border: '2px dashed rgba(255,255,255,0.6)',
                      pointerEvents: 'none',
                      zIndex: 10,
                    }}
                  />
                )}
              </div>
            ))}

            <div
              style={{
                position: 'absolute',
                left: cursorPosition * beatWidth,
                top: 0,
                bottom: 0,
                width: 2,
                backgroundColor: '#e94560',
                boxShadow: '0 0 12px rgba(233,69,96,0.8), 0 0 24px rgba(233,69,96,0.4)',
                pointerEvents: 'none',
                zIndex: 20,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -6,
                  left: -5,
                  width: 12,
                  height: 12,
                  backgroundColor: '#e94560',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px rgba(233,69,96,0.8)',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {hoverInfo && (
        <div
          style={{
            position: 'fixed',
            left: hoverInfo.x + 12,
            top: hoverInfo.y,
            padding: '4px 10px',
            backgroundColor: 'rgba(15, 52, 96, 0.95)',
            color: '#ccd6f6',
            fontSize: 11,
            fontWeight: 600,
            borderRadius: 4,
            pointerEvents: 'none',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
            border: '1px solid rgba(255,255,255,0.1)',
            whiteSpace: 'nowrap',
          }}
        >
          {hoverInfo.text}
        </div>
      )}
    </div>
  );
};
