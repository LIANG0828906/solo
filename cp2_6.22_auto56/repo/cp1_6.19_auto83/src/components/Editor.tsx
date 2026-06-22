import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Track,
  Note,
  QUARTER_NOTE_WIDTH,
  MIN_PITCH,
  MAX_PITCH,
  TOTAL_PITCHES,
  midiToNoteName
} from '../data/project';

interface EditorProps {
  tracks: Track[];
  selectedTrackId: string | null;
  onSelectTrack: (id: string) => void;
  playhead: number;
  isPlaying: boolean;
  playingNotes: Set<string>;
  remoteNoteIds: Set<string>;
  onAddNote: (trackId: string, pitch: number, start: number) => void;
  onDeleteNote: (trackId: string, noteId: string) => void;
  onSetPlayhead: (pos: number) => void;
  bpm: number;
}

const PITCH_HEIGHT = 14;
const EDITOR_PADDING_LEFT = 70;
const PIANO_HEIGHT = 120;
const VISIBLE_BARS = 16;
const TOTAL_BARS = 64;
const EDITOR_WIDTH = TOTAL_BARS * 4 * QUARTER_NOTE_WIDTH + EDITOR_PADDING_LEFT;

const isBlackKey = (pitch: number): boolean => {
  const n = pitch % 12;
  return n === 1 || n === 3 || n === 6 || n === 8 || n === 10;
};

const isOnStaffLine = (pitch: number): boolean => {
  const trebleTop = 77;
  const stepsFromTop = trebleTop - pitch;
  return stepsFromTop % 2 === 0 && stepsFromTop >= 0 && stepsFromTop <= 8;
};

const isBetweenStaffLines = (pitch: number): boolean => {
  const trebleTop = 77;
  const stepsFromTop = trebleTop - pitch;
  return stepsFromTop % 2 === 1 && stepsFromTop >= 0 && stepsFromTop <= 8;
};

const Editor: React.FC<EditorProps> = ({
  tracks,
  selectedTrackId,
  onSelectTrack,
  playhead,
  isPlaying,
  playingNotes,
  remoteNoteIds,
  onAddNote,
  onDeleteNote,
  onSetPlayhead,
  bpm
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number; pitch: number; beat: number } | null>(null);
  const [highlightedPianoKeys, setHighlightedPianoKeys] = useState<Set<number>>(new Set());
  const [scrollLeft, setScrollLeft] = useState(0);
  const playheadRef = useRef<number>(playhead);

  useEffect(() => {
    playheadRef.current = playhead;
  }, [playhead]);

  const totalHeight = useMemo(() => {
    return TOTAL_PITCHES * PITCH_HEIGHT + PIANO_HEIGHT + 60;
  }, []);

  const playheadPixelX = playhead * QUARTER_NOTE_WIDTH + EDITOR_PADDING_LEFT;

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const containerWidth = container.clientWidth;

    if (playheadPixelX > scrollLeft + containerWidth - 100) {
      container.scrollLeft = playheadPixelX - containerWidth + 100;
    } else if (playheadPixelX < scrollLeft + 50 && playheadPixelX > EDITOR_PADDING_LEFT) {
      container.scrollLeft = playheadPixelX - 50;
    }
  }, [playheadPixelX, scrollLeft]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const getPitchFromY = (y: number, containerTop: number): number => {
    const staffTop = 30;
    const relativeY = y - containerTop - staffTop;
    const topPitch = MAX_PITCH;
    const pitchOffset = Math.round(relativeY / PITCH_HEIGHT);
    const pitch = topPitch - pitchOffset;
    return Math.max(MIN_PITCH, Math.min(MAX_PITCH, pitch));
  };

  const getBeatFromX = (x: number, containerLeft: number): number => {
    const relativeX = x - containerLeft - EDITOR_PADDING_LEFT;
    const beats = Math.round(relativeX / QUARTER_NOTE_WIDTH * 4) / 4;
    return Math.max(0, beats);
  };

  const handleEditorClick = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const beat = getBeatFromX(e.clientX, rect.left);
    const pitch = getPitchFromY(e.clientY, rect.top);

    if (e.clientX - rect.left < EDITOR_PADDING_LEFT) return;
    if (e.clientY - rect.top > TOTAL_PITCHES * PITCH_HEIGHT + 30) {
      const clickedX = e.clientX - rect.left - EDITOR_PADDING_LEFT;
      const position = Math.max(0, clickedX / QUARTER_NOTE_WIDTH);
      onSetPlayhead(Math.round(position * 4) / 4);
      return;
    }

    if (selectedTrackId) {
      onAddNote(selectedTrackId, pitch, beat);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (e.clientX - rect.left < EDITOR_PADDING_LEFT) {
      setHoverPos(null);
      return;
    }
    const beat = getBeatFromX(e.clientX, rect.left);
    const pitch = getPitchFromY(e.clientY, rect.top);
    const x = beat * QUARTER_NOTE_WIDTH + EDITOR_PADDING_LEFT;
    const staffTop = 30;
    const y = staffTop + (MAX_PITCH - pitch) * PITCH_HEIGHT;
    setHoverPos({ x, y, pitch, beat });
  };

  const handleMouseLeave = () => {
    setHoverPos(null);
  };

  useEffect(() => {
    const keys = new Set<number>();
    tracks.forEach(track => {
      if (track.muted) return;
      track.notes.forEach(note => {
        const key = `${track.id}-${note.id}`;
        if (playingNotes.has(key)) {
          keys.add(note.pitch);
        }
      });
    });
    setHighlightedPianoKeys(prev => {
      if (keys.size === 0 && prev.size === 0) return prev;
      return keys;
    });
  }, [playingNotes, tracks]);

  const staffLines = useMemo(() => {
    const lines: number[] = [];
    const trebleTop = 77;
    for (let i = 0; i < 5; i++) {
      lines.push(trebleTop - i * 2);
    }
    return lines;
  }, []);

  const renderStaffBackground = () => {
    const elements: JSX.Element[] = [];
    const staffTop = 30;

    staffLines.forEach((pitch, idx) => {
      const y = staffTop + (MAX_PITCH - pitch) * PITCH_HEIGHT + PITCH_HEIGHT / 2;
      elements.push(
        <line
          key={`staff-${idx}`}
          x1={EDITOR_PADDING_LEFT}
          y1={y}
          x2={EDITOR_WIDTH}
          y2={y}
          stroke="#D3C9C0"
          strokeWidth={1}
        />
      );
    });

    for (let i = 0; i < TOTAL_BARS; i++) {
      const x = EDITOR_PADDING_LEFT + i * 4 * QUARTER_NOTE_WIDTH;
      elements.push(
        <line
          key={`bar-${i}`}
          x1={x}
          y1={staffTop}
          x2={x}
          y2={staffTop + TOTAL_PITCHES * PITCH_HEIGHT}
          stroke="#D3C9C0"
          strokeWidth={i % 4 === 0 ? 2 : 0.5}
          opacity={i % 4 === 0 ? 0.6 : 0.25}
        />
      );
      if (i % 4 === 0) {
        elements.push(
          <text
            key={`bar-num-${i}`}
            x={x + 6}
            y={22}
            fill="#A6ADC8"
            fontSize={10}
            fontFamily="monospace"
          >
            {i / 4 + 1}
          </text>
        );
      }
    }

    for (let beat = 0; beat < TOTAL_BARS * 4; beat++) {
      const x = EDITOR_PADDING_LEFT + beat * QUARTER_NOTE_WIDTH;
      elements.push(
        <line
          key={`beat-${beat}`}
          x1={x}
          y1={staffTop}
          x2={x}
          y2={staffTop + TOTAL_PITCHES * PITCH_HEIGHT}
          stroke="#D3C9C0"
          strokeWidth={0.5}
          opacity={0.15}
          strokeDasharray="2,4"
        />
      );
    }

    return elements;
  };

  const renderPitchLabels = () => {
    const elements: JSX.Element[] = [];
    const staffTop = 30;

    for (let pitch = MAX_PITCH; pitch >= MIN_PITCH; pitch--) {
      if (pitch % 12 === 0 || pitch === MIN_PITCH || pitch === MAX_PITCH) {
        const y = staffTop + (MAX_PITCH - pitch) * PITCH_HEIGHT + PITCH_HEIGHT / 2 + 4;
        elements.push(
          <text
            key={`pitch-label-${pitch}`}
            x={4}
            y={y}
            fill={isBlackKey(pitch) ? '#6C7086' : '#A6ADC8'}
            fontSize={9}
            fontFamily="monospace"
            fontWeight={pitch % 12 === 0 ? 600 : 400}
          >
            {midiToNoteName(pitch)}
          </text>
        );
      }
    }
    return elements;
  };

  const renderNotes = () => {
    const elements: JSX.Element[] = [];
    const staffTop = 30;

    tracks.forEach((track) => {
      const isSelected = track.id === selectedTrackId;
      track.notes.forEach((note) => {
        const y = staffTop + (MAX_PITCH - note.pitch) * PITCH_HEIGHT;
        const x = note.start * QUARTER_NOTE_WIDTH + EDITOR_PADDING_LEFT;
        const width = note.duration * QUARTER_NOTE_WIDTH - 2;
        const noteKey = `${track.id}-${note.id}`;
        const isPlaying = playingNotes.has(noteKey);
        const isRemote = remoteNoteIds.has(note.id);
        const needsLedger = !isOnStaffLine(note.pitch) && !isBetweenStaffLines(note.pitch);

        if (needsLedger) {
          const staffTopPitch = 77;
          const staffBottomPitch = 69;
          if (note.pitch > staffTopPitch) {
            for (let p = staffTopPitch + 2; p <= note.pitch; p += 2) {
              const ly = staffTop + (MAX_PITCH - p) * PITCH_HEIGHT + PITCH_HEIGHT / 2;
              elements.push(
                <line
                  key={`ledger-top-${note.id}-${p}`}
                  x1={x - 4}
                  y1={ly}
                  x2={x + width + 4}
                  y2={ly}
                  stroke="#D3C9C0"
                  strokeWidth={1}
                />
              );
            }
          } else if (note.pitch < staffBottomPitch) {
            for (let p = staffBottomPitch - 2; p >= note.pitch; p -= 2) {
              const ly = staffTop + (MAX_PITCH - p) * PITCH_HEIGHT + PITCH_HEIGHT / 2;
              elements.push(
                <line
                  key={`ledger-bot-${note.id}-${p}`}
                  x1={x - 4}
                  y1={ly}
                  x2={x + width + 4}
                  y2={ly}
                  stroke="#D3C9C0"
                  strokeWidth={1}
                />
              );
            }
          }
        }

        elements.push(
          <motion.div
            key={`note-${note.id}`}
            layout
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{
              scale: 1,
              opacity: isSelected ? 1 : 0.75,
              boxShadow: isRemote
                ? '0 0 16px 4px rgba(171, 235, 198, 0.7)'
                : isPlaying
                ? '0 0 12px 2px rgba(255,255,255,0.5)'
                : 'none'
            }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 20,
              duration: 0.15,
              boxShadow: { duration: 0.2 }
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (e.shiftKey || e.button === 2) {
                onDeleteNote(track.id, note.id);
              } else {
                onSelectTrack(track.id);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              onDeleteNote(track.id, note.id);
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              onDeleteNote(track.id, note.id);
            }}
            style={{
              position: 'absolute',
              left: x,
              top: y,
              width: width,
              height: PITCH_HEIGHT - 2,
              background: isPlaying
                ? '#FFFFFF'
                : isRemote
                ? '#ABEBC6'
                : track.color,
              borderRadius: 4,
              border: isSelected ? `2px solid #FFFFFF80` : '1px solid rgba(0,0,0,0.2)',
              cursor: 'pointer',
              zIndex: isPlaying ? 50 : isSelected ? 30 : 10,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: 4,
              fontSize: 9,
              color: isPlaying ? track.color : '#1E1E2E',
              fontWeight: 600,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s ease-out, color 0.2s ease-out',
              boxSizing: 'border-box'
            }}
            title={`${midiToNoteName(note.pitch)} · Shift+点击或右键删除`}
          >
            {width > 30 && midiToNoteName(note.pitch)}
          </motion.div>
        );
      });
    });

    return elements;
  };

  const renderPiano = () => {
    const keys: JSX.Element[] = [];
    const pianoKeyWidth = 28;
    const whiteKeyHeight = PIANO_HEIGHT - 10;
    const blackKeyHeight = whiteKeyHeight * 0.6;
    const pianoY = TOTAL_PITCHES * PITCH_HEIGHT + 40;

    const whiteKeys: number[] = [];
    for (let p = MIN_PITCH; p <= MAX_PITCH; p++) {
      if (!isBlackKey(p)) whiteKeys.push(p);
    }

    const whiteKeyMap = new Map<number, number>();
    whiteKeys.forEach((p, idx) => whiteKeyMap.set(p, idx));

    whiteKeys.forEach((pitch, idx) => {
      const x = EDITOR_PADDING_LEFT + idx * pianoKeyWidth;
      const highlighted = highlightedPianoKeys.has(pitch);
      keys.push(
        <motion.div
          key={`white-${pitch}`}
          animate={{
            background: highlighted ? '#F1C40F' : '#FFFFFF',
            boxShadow: highlighted ? '0 0 12px 2px rgba(241,196,15,0.6)' : 'inset 0 -2px 0 rgba(0,0,0,0.1)'
          }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'absolute',
            left: x,
            top: pianoY,
            width: pianoKeyWidth - 1,
            height: whiteKeyHeight,
            border: '1px solid #45475A',
            borderRight: 'none',
            borderRadius: '0 0 4px 4px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 4,
            fontSize: 8,
            color: '#6C7086',
            cursor: 'pointer',
            zIndex: 1,
            fontFamily: 'monospace'
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (selectedTrackId) {
              const beat = Math.max(0, Math.round(playheadRef.current * 4) / 4);
              onAddNote(selectedTrackId, pitch, beat);
            }
          }}
          title={midiToNoteName(pitch)}
        >
          {pitch % 12 === 0 && midiToNoteName(pitch)}
        </motion.div>
      );
    });

    whiteKeys.slice(0, -1).forEach((pitch, idx) => {
      const nextPitch = whiteKeys[idx + 1];
      if (nextPitch - pitch === 2) {
        const blackPitch = pitch + 1;
        const x = EDITOR_PADDING_LEFT + (idx + 1) * pianoKeyWidth - pianoKeyWidth * 0.35;
        const highlighted = highlightedPianoKeys.has(blackPitch);
        keys.push(
          <motion.div
            key={`black-${blackPitch}`}
            animate={{
              background: highlighted ? '#F1C40F' : '#2D2D44',
              boxShadow: highlighted ? '0 0 12px 2px rgba(241,196,15,0.6)' : '0 2px 4px rgba(0,0,0,0.4)'
            }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute',
              left: x,
              top: pianoY,
              width: pianoKeyWidth * 0.7,
              height: blackKeyHeight,
              borderRadius: '0 0 3px 3px',
              zIndex: 5,
              cursor: 'pointer',
              border: '1px solid #1E1E2E'
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (selectedTrackId) {
                const beat = Math.max(0, Math.round(playheadRef.current * 4) / 4);
                onAddNote(selectedTrackId, blackPitch, beat);
              }
            }}
            title={midiToNoteName(blackPitch)}
          />
        );
      }
    });

    return keys;
  };

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'auto',
        position: 'relative',
        background: '#1E1E2E'
      }}
    >
      <div
        ref={containerRef}
        onClick={handleEditorClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          position: 'relative',
          width: EDITOR_WIDTH,
          height: totalHeight,
          background: '#FAF3E0',
          margin: 16,
          borderRadius: 12,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          overflow: 'hidden',
          cursor: selectedTrackId ? 'crosshair' : 'default',
          minWidth: 'calc(100% - 32px)'
        }}
      >
        <svg
          width={EDITOR_WIDTH}
          height={totalHeight}
          style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
        >
          {renderStaffBackground()}
          {renderPitchLabels()}
        </svg>

        {renderNotes()}

        {hoverPos && selectedTrackId && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 0.6, scale: 1 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute',
              left: hoverPos.x,
              top: hoverPos.y,
              width: QUARTER_NOTE_WIDTH - 2,
              height: PITCH_HEIGHT - 2,
              background: tracks.find(t => t.id === selectedTrackId)?.color || '#888',
              borderRadius: 4,
              pointerEvents: 'none',
              zIndex: 5,
              border: '2px dashed rgba(255,255,255,0.5)'
            }}
          />
        )}

        {hoverPos && (
          <div
            style={{
              position: 'absolute',
              left: hoverPos.x - 30,
              top: hoverPos.y - 22,
              background: '#2D2D44',
              color: '#CDD6F4',
              fontSize: 10,
              padding: '3px 6px',
              borderRadius: 4,
              pointerEvents: 'none',
              zIndex: 60,
              whiteSpace: 'nowrap',
              fontFamily: 'monospace',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}
          >
            {midiToNoteName(hoverPos.pitch)} · 第{(hoverPos.beat / 4 | 0) + 1}小节
          </div>
        )}

        <motion.div
          style={{
            position: 'absolute',
            top: 0,
            width: 2,
            height: TOTAL_PITCHES * PITCH_HEIGHT + 30,
            background: '#E74C3C',
            zIndex: 100,
            boxShadow: '0 0 8px 1px rgba(231,76,60,0.5)',
            pointerEvents: 'none'
          }}
          initial={false}
          animate={{ x: playheadPixelX }}
          transition={{
            type: 'tween',
            ease: 'linear',
            duration: isPlaying ? 0.03 : 0.1
          }}
        >
          <div style={{
            position: 'absolute',
            top: -6,
            left: -5,
            width: 12,
            height: 12,
            background: '#E74C3C',
            transform: 'rotate(45deg)',
            borderRadius: 2
          }} />
        </motion.div>

        {renderPiano()}

        {tracks.length === 0 && (
          <div style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 12,
            color: '#7F849C',
            pointerEvents: 'none'
          }}>
            <div style={{ fontSize: 48, opacity: 0.5 }}>🎼</div>
            <div style={{ fontSize: 14 }}>请先添加一条轨道开始创作</div>
          </div>
        )}

        {tracks.length > 0 && !selectedTrackId && (
          <div style={{
            position: 'absolute',
            top: 50,
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#E67E22CC',
            color: '#fff',
            fontSize: 12,
            padding: '8px 16px',
            borderRadius: 20,
            pointerEvents: 'none',
            zIndex: 90,
            backdropFilter: 'blur(4px)'
          }}>
            👈 请先从左侧选择一条轨道
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
