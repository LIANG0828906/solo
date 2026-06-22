import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import type { Note, TrackIndex, NoteType, Beatmap, TimeSignature } from '../types';
import { TRACK_COLORS, TRACK_KEYS, NOTE_TYPE_LABELS } from '../types';
import type { NoteEditor } from '../NoteEditor';

interface EditorPanelProps {
  editor: NoteEditor;
  beatmap: Beatmap;
  waveData: number[];
  audioDuration: number;
  selectedNoteId: string | null;
  selectedNoteType: NoteType;
  snapDivision: number;
  zoom: number;
  scrollX: number;
  onSelectNote: (id: string | null) => void;
  onSelectNoteType: (t: NoteType) => void;
  onZoomChange: (z: number) => void;
  onScrollXChange: (x: number) => void;
  onSnapChange: (d: number) => void;
  onAddNote: (time: number, track: TrackIndex) => void;
  onUpdateNote: (id: string, patch: Partial<Pick<Note, 'time' | 'track' | 'type' | 'duration'>>) => void;
  onRemoveNote: (id: string) => void;
  onBeatmapChange: () => void;
  onPlayPreview: (time: number) => void;
  onStopPreview: () => void;
  previewTime: number;
}

const TRACK_LABELS: Record<TrackIndex, string> = {
  0: 'L (A/←)',
  1: 'D (S/↓)',
  2: 'U (D/↑)',
  3: 'R (F/→)',
};

const MS_PER_PIXEL_BASE = 5;
const TRACK_HEIGHT = 48;
const HEADER_HEIGHT = 60;
const WAVEFORM_HEIGHT = 60;
const TRACK_LABEL_WIDTH = 80;

export const EditorPanel: React.FC<EditorPanelProps> = ({
  editor,
  beatmap,
  waveData,
  audioDuration,
  selectedNoteId,
  selectedNoteType,
  snapDivision,
  zoom,
  scrollX,
  onSelectNote,
  onSelectNoteType,
  onZoomChange,
  onScrollXChange,
  onSnapChange,
  onAddNote,
  onUpdateNote,
  onRemoveNote,
  onBeatmapChange,
  onPlayPreview,
  onStopPreview,
  previewTime,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragInfo, setDragInfo] = useState<{
    noteId: string;
    startX: number;
    startY: number;
    origTime: number;
    origTrack: TrackIndex;
    hasMoved: boolean;
  } | null>(null);

  const msPerPixel = MS_PER_PIXEL_BASE / zoom;

  const beatmapDuration = useMemo(() => {
    const ed = editor.getDuration();
    const ad = audioDuration || 0;
    return Math.max(ed, ad, 60000);
  }, [editor, audioDuration]);

  const timelineWidth = useMemo(() => {
    return Math.ceil(beatmapDuration / msPerPixel) + 200;
  }, [beatmapDuration, msPerPixel]);

  const contentHeight = HEADER_HEIGHT + WAVEFORM_HEIGHT + 4 * TRACK_HEIGHT + 20;

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    update();
    const ro = new ResizeObserver(update);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      if (scrollRef.current.scrollLeft !== scrollX) {
        scrollRef.current.scrollLeft = scrollX;
      }
    }
  }, [scrollX]);

  const measureBeats = useMemo(() => editor.getMeasureBeats(), [editor]);

  const notes = beatmap.notes;

  const timeToX = (time: number): number => {
    return time / msPerPixel;
  };

  const xToTime = (x: number): number => {
    return Math.max(0, Math.round(x * msPerPixel));
  };

  const trackToY = (track: TrackIndex): number => {
    return HEADER_HEIGHT + WAVEFORM_HEIGHT + track * TRACK_HEIGHT;
  };

  const yToTrack = (y: number): TrackIndex => {
    const offset = y - HEADER_HEIGHT - WAVEFORM_HEIGHT;
    const t = Math.max(0, Math.min(3, Math.floor(offset / TRACK_HEIGHT)));
    return t as TrackIndex;
  };

  const handleTimelineClick = (e: React.MouseEvent) => {
    if (dragInfo?.hasMoved) return;
    if (e.button !== 0) return;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft ?? 0);
    const y = e.clientY - rect.top;
    if (y < HEADER_HEIGHT + WAVEFORM_HEIGHT) return;
    if (y >= HEADER_HEIGHT + WAVEFORM_HEIGHT + 4 * TRACK_HEIGHT) return;

    const track = yToTrack(y);
    let time = xToTime(x);
    time = editor.snapToGrid(time, snapDivision);
    onAddNote(time, track);
  };

  const handleNoteMouseDown = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    onSelectNote(note.id);
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    setDragInfo({
      noteId: note.id,
      startX: e.clientX - rect.left + (scrollRef.current?.scrollLeft ?? 0),
      startY: e.clientY - rect.top,
      origTime: note.time,
      origTrack: note.track,
      hasMoved: false,
    });
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!dragInfo) return;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left + (scrollRef.current?.scrollLeft ?? 0);
    const y = e.clientY - rect.top;
    const dx = x - dragInfo.startX;
    const dy = y - dragInfo.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragInfo.hasMoved = true;
    }
    if (!dragInfo.hasMoved) return;

    let newTime = dragInfo.origTime + xToTime(dx) - xToTime(0);
    newTime = editor.snapToGrid(newTime, snapDivision);
    const newTrack = yToTrack(Math.max(HEADER_HEIGHT + WAVEFORM_HEIGHT, y));
    onUpdateNote(dragInfo.noteId, { time: newTime, track: newTrack });
  }, [dragInfo, editor, snapDivision, onUpdateNote]);

  const handleMouseUp = useCallback(() => {
    setDragInfo(null);
  }, []);

  useEffect(() => {
    if (dragInfo) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragInfo, handleMouseMove, handleMouseUp]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    onScrollXChange((e.target as HTMLDivElement).scrollLeft);
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.002;
      onZoomChange(zoom + delta);
    }
  };

  const selectedNote = notes.find((n) => n.id === selectedNoteId) || null;

  const formatTime = (ms: number): string => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const millis = Math.floor(ms % 1000);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  };

  const renderWaveform = () => {
    if (waveData.length === 0) return null;
    const samples = waveData;
    const barCount = Math.min(samples.length, Math.floor(timelineWidth / 3));
    const step = Math.floor(samples.length / barCount);
    const bars: JSX.Element[] = [];
    for (let i = 0; i < barCount; i++) {
      const idx = i * step;
      const val = samples[idx] || 0;
      const h = Math.max(2, val * (WAVEFORM_HEIGHT - 12));
      bars.push(
        <div
          key={i}
          style={{
            position: 'absolute',
            left: (i / barCount) * timelineWidth,
            bottom: (WAVEFORM_HEIGHT - h) / 2,
            width: 2,
            height: h,
            borderRadius: 1,
            background: 'linear-gradient(to top, rgba(233,69,96,0.4), rgba(233,69,96,0.8))',
            opacity: 0.7,
          }}
        />
      );
    }
    return bars;
  };

  const renderNoteCard = (note: Note) => {
    const x = timeToX(note.time);
    const y = trackToY(note.track);
    const color = TRACK_COLORS[note.track];
    const isSelected = note.id === selectedNoteId;
    const isHold = note.type === 'hold' && note.duration;
    const width = isHold ? Math.max(80, note.duration! / msPerPixel) : 80;

    return (
      <div
        key={note.id}
        onMouseDown={(e) => handleNoteMouseDown(e, note)}
        style={{
          position: 'absolute',
          left: x - width / 2,
          top: y + 6,
          width,
          height: TRACK_HEIGHT - 12,
          borderRadius: 8,
          background: `linear-gradient(135deg, ${color}, ${color}cc 60%, #ffffff40)`,
          boxShadow: isSelected
            ? `0 0 0 2px #e94560, 0 0 20px ${color}aa`
            : `0 0 10px ${color}60, inset 0 1px 2px rgba(255,255,255,0.3), inset 0 -2px 4px rgba(0,0,0,0.3)`,
          border: `1px solid ${isSelected ? '#ffffff' : 'rgba(255,255,255,0.25)'}`,
          cursor: dragInfo?.noteId === note.id ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          color: 'white',
          fontWeight: 700,
          textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          zIndex: isSelected ? 10 : 5,
          userSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: 8,
            right: 8,
            height: 3,
            borderRadius: 2,
            background: 'rgba(255,255,255,0.5)',
          }}
        />
        <span style={{ marginTop: 2 }}>
          {note.type === 'tap' ? formatTime(note.time) : note.type === 'hold' ? `HOLD ${note.duration}ms` : 'SWIPE'}
        </span>
        {isHold && (
          <div
            style={{
              position: 'absolute',
              right: 4,
              top: '50%',
              transform: 'translateY(-50%)',
              width: 8,
              height: 16,
              borderRadius: 4,
              background: 'rgba(255,255,255,0.4)',
              cursor: 'ew-resize',
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              const startX = e.clientX;
              const startDur = note.duration!;
              const onMove = (ev: MouseEvent) => {
                const delta = (ev.clientX - startX) * msPerPixel;
                const newDur = Math.max(100, Math.round(startDur + delta));
                onUpdateNote(note.id, { duration: newDur });
              };
              const onUp = () => {
                window.removeEventListener('mousemove', onMove);
                window.removeEventListener('mouseup', onUp);
              };
              window.addEventListener('mousemove', onMove);
              window.addEventListener('mouseup', onUp);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="panel" style={{ padding: 12, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
          <span className="label-text">谱面标题</span>
          <input
            className="input-field"
            value={beatmap.title}
            onChange={(e) => {
              editor.setTitle(e.target.value);
              onBeatmapChange();
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="label-text">BPM (60-200)</span>
          <input
            type="number"
            min={60}
            max={200}
            className="input-field"
            style={{ width: 80 }}
            value={beatmap.bpm}
            onChange={(e) => {
              editor.setBpm(Number(e.target.value));
              onBeatmapChange();
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="label-text">节拍</span>
          <select
            className="input-field"
            value={beatmap.timeSignature}
            onChange={(e) => {
              editor.setTimeSignature(e.target.value as TimeSignature);
              onBeatmapChange();
            }}
          >
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="6/8">6/8</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="label-text">吸附精度</span>
          <select
            className="input-field"
            value={snapDivision}
            onChange={(e) => onSnapChange(Number(e.target.value))}
          >
            <option value={1}>1/1 拍</option>
            <option value={2}>1/2 拍</option>
            <option value={4}>1/4 拍</option>
            <option value={8}>1/8 拍</option>
            <option value={16}>1/16 拍</option>
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="label-text">音符类型</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['tap', 'hold', 'swipe'] as NoteType[]).map((t) => (
              <button
                key={t}
                onClick={() => onSelectNoteType(t)}
                className={selectedNoteType === t ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 10px', fontSize: 12 }}
              >
                {NOTE_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span className="label-text">缩放 (Ctrl+滚轮)</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={() => onZoomChange(zoom * 0.8)}>−</button>
            <span className="font-display" style={{ minWidth: 48, textAlign: 'center' }}>{(zoom * 100).toFixed(0)}%</span>
            <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={() => onZoomChange(zoom * 1.25)}>+</button>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 8 }}>
          <span className="label-text" style={{ alignSelf: 'center' }}>
            音符: {notes.length}
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin"
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'hidden',
          borderRadius: 12,
          background: 'linear-gradient(180deg, rgba(22,33,62,0.8), rgba(15,52,96,0.6))',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
        onScroll={handleScroll}
        onWheel={handleWheel}
      >
        <div
          ref={timelineRef}
          style={{
            position: 'relative',
            width: timelineWidth,
            height: contentHeight,
            minWidth: '100%',
          }}
          onClick={handleTimelineClick}
        >
          <div
            style={{
              position: 'sticky',
              left: 0,
              top: 0,
              width: TRACK_LABEL_WIDTH,
              height: contentHeight,
              background: 'rgba(26,26,46,0.95)',
              borderRight: '1px solid rgba(255,255,255,0.1)',
              zIndex: 20,
            }}
          >
            <div
              style={{
                height: HEADER_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              时间轴
            </div>
            <div
              style={{
                height: WAVEFORM_HEIGHT,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                color: 'rgba(255,255,255,0.5)',
                borderBottom: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              波形
            </div>
            {([0, 1, 2, 3] as TrackIndex[]).map((t) => (
              <div
                key={t}
                style={{
                  height: TRACK_HEIGHT,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingLeft: 8,
                  paddingRight: 8,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontFamily: 'Orbitron, sans-serif',
                  fontSize: 11,
                  fontWeight: 700,
                  color: TRACK_COLORS[t],
                  background: `linear-gradient(90deg, ${TRACK_COLORS[t]}10, transparent)`,
                }}
              >
                {TRACK_LABELS[t]}
              </div>
            ))}
          </div>

          <div
            style={{
              position: 'absolute',
              left: TRACK_LABEL_WIDTH,
              top: 0,
              right: 0,
              bottom: 0,
              pointerEvents: 'none',
            }}
          >
            {measureBeats.map((mb, idx) => {
              const x = timeToX(mb.time);
              return (
                <React.Fragment key={idx}>
                  <div
                    style={{
                      position: 'absolute',
                      left: x,
                      top: 0,
                      bottom: 0,
                      width: mb.isMeasureStart ? 2 : 1,
                      background: mb.isMeasureStart
                        ? 'rgba(233,69,96,0.5)'
                        : 'rgba(255,255,255,0.08)',
                    }}
                  />
                  {mb.isMeasureStart && (
                    <div
                      style={{
                        position: 'absolute',
                        left: x + 4,
                        top: 20,
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(233,69,96,0.8)',
                      }}
                    >
                      {mb.measure + 1}
                    </div>
                  )}
                  {mb.isMeasureStart && (
                    <div
                      style={{
                        position: 'absolute',
                        left: x + 4,
                        top: 2,
                        fontFamily: 'Orbitron, sans-serif',
                        fontSize: 10,
                        color: 'rgba(255,255,255,0.35)',
                      }}
                    >
                      {formatTime(mb.time)}
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          <div
            style={{
              position: 'absolute',
              left: TRACK_LABEL_WIDTH,
              top: HEADER_HEIGHT,
              right: 0,
              height: WAVEFORM_HEIGHT,
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              pointerEvents: 'none',
            }}
          >
            {renderWaveform()}
          </div>

          {([0, 1, 2, 3] as TrackIndex[]).map((t) => {
            const y = trackToY(t);
            return (
              <div
                key={t}
                style={{
                  position: 'absolute',
                  left: TRACK_LABEL_WIDTH,
                  top: y,
                  right: 0,
                  height: TRACK_HEIGHT,
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  background: `linear-gradient(90deg, ${TRACK_COLORS[t]}05, ${TRACK_COLORS[t]}02)`,
                }}
              />
            );
          })}

          {notes.map(renderNoteCard)}

          {previewTime >= 0 && (
            <div
              style={{
                position: 'absolute',
                left: TRACK_LABEL_WIDTH + timeToX(previewTime),
                top: 0,
                bottom: 0,
                width: 2,
                background: 'linear-gradient(to bottom, #e94560, #e94560)',
                boxShadow: '0 0 15px #e94560, 0 0 30px rgba(233,69,96,0.5)',
                zIndex: 15,
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -8,
                  left: -6,
                  width: 14,
                  height: 14,
                  transform: 'rotate(45deg)',
                  background: '#e94560',
                  boxShadow: '0 0 10px #e94560',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {selectedNote && (
        <div className="panel" style={{ padding: 12, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 13, fontWeight: 700, color: '#e94560' }}>
            已选中音符
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="label-text">时间 (ms)</span>
            <input
              type="number"
              className="input-field"
              style={{ width: 100 }}
              value={selectedNote.time}
              min={0}
              onChange={(e) => {
                let t = Number(e.target.value);
                t = editor.snapToGrid(t, snapDivision);
                onUpdateNote(selectedNote.id, { time: t });
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="label-text">轨道</span>
            <select
              className="input-field"
              value={selectedNote.track}
              onChange={(e) => onUpdateNote(selectedNote.id, { track: Number(e.target.value) as TrackIndex })}
            >
              {([0, 1, 2, 3] as TrackIndex[]).map((t) => (
                <option key={t} value={t}>
                  {t} - {TRACK_KEYS[t].label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="label-text">类型</span>
            <select
              className="input-field"
              value={selectedNote.type}
              onChange={(e) => {
                const newType = e.target.value as NoteType;
                const patch: Partial<Pick<Note, 'time' | 'track' | 'type' | 'duration'>> = { type: newType };
                if (newType === 'hold' && !selectedNote.duration) patch.duration = 500;
                if (newType !== 'hold') patch.duration = undefined;
                onUpdateNote(selectedNote.id, patch);
              }}
            >
              <option value="tap">{NOTE_TYPE_LABELS.tap}</option>
              <option value="hold">{NOTE_TYPE_LABELS.hold}</option>
              <option value="swipe">{NOTE_TYPE_LABELS.swipe}</option>
            </select>
          </div>

          {selectedNote.type === 'hold' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="label-text">时长 (ms)</span>
              <input
                type="number"
                min={100}
                step={50}
                className="input-field"
                style={{ width: 100 }}
                value={selectedNote.duration ?? 500}
                onChange={(e) => onUpdateNote(selectedNote.id, { duration: Math.max(100, Number(e.target.value)) })}
              />
            </div>
          )}

          <div style={{ flex: 1 }} />

          <button
            className="btn-secondary"
            onClick={() => {
              onRemoveNote(selectedNote.id);
              onSelectNote(null);
            }}
            style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}
          >
            删除音符
          </button>
        </div>
      )}
    </div>
  );
};
