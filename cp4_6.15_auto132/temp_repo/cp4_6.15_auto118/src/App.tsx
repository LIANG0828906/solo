import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Plus, Trash2, Settings, Music, Gauge, Zap } from 'lucide-react';
import { GameEngine } from './gameEngine';
import { drawFrame } from './renderer';
import { TimelineEditor } from './editor';
import type { Note, EditorNote, GameState, TrackType } from './types';
import { TRACK_COLORS, TRACK_LABELS, generateId } from './types';
import './App.css';

const MOBILE_BREAKPOINT = 768;
const DESKTOP_JUDGEMENT_LINE_X = 33;
const MOBILE_JUDGEMENT_LINE_X = 15;
const DEFAULT_BPM = 120;
const DEFAULT_NOTE_FLY_TIME = 2;

function createDefaultNotes(): Note[] {
  const notes: Note[] = [];
  const tracks: TrackType[] = ['melody', 'drum', 'harmony'];
  const beatDuration = 60 / DEFAULT_BPM;

  for (let i = 0; i < 32; i++) {
    const track = tracks[i % 3];
    const baseY = track === 'melody' ? 25 : track === 'drum' ? 50 : 75;
    const yVariation = (Math.random() - 0.5) * 15;

    notes.push({
      id: generateId(),
      time: i * beatDuration * 0.5 + 0.5,
      track,
      y: Math.max(10, Math.min(90, baseY + yVariation)),
    });
  }

  return notes;
}

function getJudgementLineX(isMobile: boolean): number {
  return isMobile ? MOBILE_JUDGEMENT_LINE_X : DESKTOP_JUDGEMENT_LINE_X;
}

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const editorRef = useRef<TimelineEditor | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [bpm, setBpm] = useState(DEFAULT_BPM);
  const [selectedTrack, setSelectedTrack] = useState<TrackType>('melody');
  const [performanceMode, setPerformanceMode] = useState<'normal' | 'low'>('normal');
  const [particleCount, setParticleCount] = useState(0);
  const [currentFps, setCurrentFps] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const timelineScrollRef = useRef<HTMLDivElement>(null);
  const [timelineScrollLeft, setTimelineScrollLeft] = useState(0);
  const [pixelsPerSecond] = useState(100);
  const [editorNotes, setEditorNotes] = useState<EditorNote[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const defaultNotes = createDefaultNotes();
    setNotes(defaultNotes);

    const judgementLineX = getJudgementLineX(window.innerWidth < MOBILE_BREAKPOINT);
    const engine = new GameEngine(
      {
        bpm: DEFAULT_BPM,
        noteFlyTime: DEFAULT_NOTE_FLY_TIME,
        judgementLineX,
      },
      defaultNotes
    );
    engineRef.current = engine;

    const editor = new TimelineEditor(DEFAULT_BPM, pixelsPerSecond, defaultNotes);
    editorRef.current = editor;
    setEditorNotes(editor.getNotes());

    editor.onNoteUpdate(() => {
      const allNotes = editor.getNotes();
      setEditorNotes([...allNotes]);
      engine.setNotes(allNotes);
      setNotes([...allNotes]);
    });

    return () => {
      engine.stop();
      editor.destroy();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [pixelsPerSecond]);

  useEffect(() => {
    if (!engineRef.current) return;

    const handleFrame = (state: GameState) => {
      setCurrentTime(state.currentTime);
      setPerformanceMode(state.performanceMode);
      setParticleCount(state.particles.length);
      setCurrentFps(engineRef.current?.getCurrentFps() ?? null);

      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const judgementLineX = getJudgementLineX(isMobile);

      drawFrame(ctx, {
        width: canvas.width,
        height: canvas.height,
        currentTime: state.currentTime,
        notes: state.notes,
        particles: state.particles,
        isPlaying: state.isPlaying,
        bpm,
        performanceMode: state.performanceMode,
        judgementLineX,
        noteFlyTime: DEFAULT_NOTE_FLY_TIME,
      });

      if (editorRef.current && timelineScrollRef.current) {
        editorRef.current.setCurrentTime(state.currentTime);
        const scrollTarget = Math.max(
          0,
          editorRef.current.timeToPixel(state.currentTime) - timelineScrollRef.current.clientWidth * 0.3
        );
        timelineScrollRef.current.scrollLeft = scrollTarget;
        setTimelineScrollLeft(scrollTarget);
      }
    };

    engineRef.current.onFrame(handleFrame);

    return () => {
      if (engineRef.current) {
        engineRef.current.onFrame(() => {});
      }
    };
  }, [bpm, isMobile]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  useEffect(() => {
    if (isPlaying || !engineRef.current) return;

    const engine = engineRef.current;
    const state = engine.getState();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const judgementLineX = getJudgementLineX(isMobile);
    drawFrame(ctx, {
      width: canvas.width / (window.devicePixelRatio || 1),
      height: canvas.height / (window.devicePixelRatio || 1),
      currentTime: state.currentTime,
      notes: state.notes,
      particles: state.particles,
      isPlaying: state.isPlaying,
      bpm,
      performanceMode: state.performanceMode,
      judgementLineX,
      noteFlyTime: DEFAULT_NOTE_FLY_TIME,
    });
  }, [isPlaying, bpm, isMobile, notes]);

  const handlePlayPause = useCallback(() => {
    if (!engineRef.current) return;

    if (isPlaying) {
      engineRef.current.pause();
      setIsPlaying(false);
    } else {
      engineRef.current.start();
      setIsPlaying(true);
    }
  }, [isPlaying]);

  const handleStop = useCallback(() => {
    if (!engineRef.current) return;
    engineRef.current.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    if (timelineScrollRef.current) {
      timelineScrollRef.current.scrollLeft = 0;
      setTimelineScrollLeft(0);
    }
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    if (engineRef.current) {
      engineRef.current.setSpeed(newSpeed);
    }
  }, []);

  const handleBpmChange = useCallback((newBpm: number) => {
    setBpm(newBpm);
    if (editorRef.current) {
      editorRef.current.setBpm(newBpm);
      setEditorNotes(editorRef.current.getNotes());
    }
  }, []);

  const handleTimelineScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setTimelineScrollLeft(e.currentTarget.scrollLeft);
    if (editorRef.current) {
      editorRef.current.setScrollLeft(e.currentTarget.scrollLeft);
    }
  }, []);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!editorRef.current || !timelineScrollRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const scrollLeft = timelineScrollRef.current.scrollLeft;
      const time = editorRef.current.pixelToTime(x + scrollLeft);

      if (e.detail === 2) {
        const y = e.clientY - rect.top;
        const height = rect.height;
        const yPercent = (y / height) * 100;
        editorRef.current.addNote(time, selectedTrack, yPercent);
        const allNotes = editorRef.current.getNotes();
        setEditorNotes([...allNotes]);
        setNotes([...allNotes]);
        if (engineRef.current) {
          engineRef.current.setNotes(allNotes);
        }
      } else {
        if (!isPlaying && engineRef.current) {
          engineRef.current.setCurrentTime(time);
          setCurrentTime(time);
        }
      }
    },
    [selectedTrack, isPlaying]
  );

  const handleNoteMouseDown = useCallback(
    (e: React.MouseEvent, noteId: string) => {
      e.stopPropagation();
      if (!editorRef.current || !timelineScrollRef.current) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;

      editorRef.current.startDrag(noteId, offsetX);
      setEditorNotes(editorRef.current.getNotes());

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!editorRef.current || !timelineScrollRef.current) return;
        const timelineRect = timelineScrollRef.current.getBoundingClientRect();
        const x = moveEvent.clientX - timelineRect.left;
        editorRef.current.updateDrag(x, timelineScrollRef.current.scrollLeft);
        setEditorNotes(editorRef.current.getNotes());
      };

      const handleMouseUp = () => {
        if (!editorRef.current) return;
        editorRef.current.endDrag();
        const allNotes = editorRef.current.getNotes();
        setEditorNotes([...allNotes]);
        setNotes([...allNotes]);
        if (engineRef.current) {
          engineRef.current.setNotes(allNotes);
        }
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    []
  );

  const handleDeleteNote = useCallback(
    (noteId: string) => {
      if (!editorRef.current) return;
      editorRef.current.removeNote(noteId);
      const allNotes = editorRef.current.getNotes();
      setEditorNotes([...allNotes]);
      setNotes([...allNotes]);
      if (engineRef.current) {
        engineRef.current.setNotes(allNotes);
      }
    },
    []
  );

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = (): number => {
    return editorRef.current?.getTotalDuration() ?? 10;
  };

  const getGridLines = () => {
    if (!editorRef.current || !timelineScrollRef.current) return [];
    const startTime = editorRef.current.pixelToTime(timelineScrollLeft);
    const endTime = editorRef.current.pixelToTime(
      timelineScrollLeft + timelineScrollRef.current.clientWidth
    );
    return editorRef.current.getGridLines(startTime, endTime);
  };

  const gridLines = getGridLines();
  const totalDuration = getTotalDuration();
  const timelineWidth = totalDuration * pixelsPerSecond;

  return (
    <div className="app-container">
      <div className="top-toolbar">
        <div className="toolbar-left">
          <div className="logo">
            <Zap className="logo-icon" />
            <span className="logo-text">节奏光剑打点器</span>
          </div>
        </div>

        <div className="toolbar-center">
          <button
            className={`control-btn ${isPlaying ? 'pause' : 'play'}`}
            onClick={handlePlayPause}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <button className="control-btn stop" onClick={handleStop} title="停止">
            <RotateCcw size={20} />
          </button>

          <div className="time-display">
            <span className="time-current">{formatTime(currentTime)}</span>
            <span className="time-separator">/</span>
            <span className="time-total">{formatTime(totalDuration)}</span>
          </div>
        </div>

        <div className="toolbar-right">
          <div className="speed-control">
            <Gauge size={16} className="control-icon" />
            <input
              type="range"
              min="0.25"
              max="2"
              step="0.25"
              value={speed}
              onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
              className="speed-slider"
            />
            <span className="speed-value">{speed.toFixed(2)}x</span>
          </div>

          <div className="track-selector">
            <Music size={16} className="control-icon" />
            {(['melody', 'drum', 'harmony'] as TrackType[]).map((track) => (
              <button
                key={track}
                className={`track-btn ${selectedTrack === track ? 'active' : ''}`}
                style={{ borderColor: TRACK_COLORS[track] }}
                onClick={() => setSelectedTrack(track)}
                title={TRACK_LABELS[track]}
              >
                <span
                  className="track-dot"
                  style={{ backgroundColor: TRACK_COLORS[track] }}
                />
                <span className="track-label">{TRACK_LABELS[track]}</span>
              </button>
            ))}
          </div>

          <button
            className={`settings-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <Settings size={18} />
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="settings-panel">
          <div className="setting-item">
            <label>BPM: {bpm}</label>
            <input
              type="range"
              min="60"
              max="200"
              value={bpm}
              onChange={(e) => handleBpmChange(parseInt(e.target.value))}
            />
          </div>
          <div className="setting-item">
            <span>性能模式: {performanceMode === 'normal' ? '正常' : '低配'}</span>
          </div>
          <div className="setting-item">
            <span>粒子数量: {particleCount}</span>
          </div>
          <div className="setting-item">
            <span>帧率: {currentFps ? currentFps.toFixed(0) : '--'} FPS</span>
          </div>
        </div>
      )}

      <div className="main-content">
        {!isMobile && (
          <div className="side-panel">
            <h3 className="panel-title">编辑面板</h3>
            <div className="panel-section">
              <h4>操作说明</h4>
              <ul className="help-list">
                <li>双击时间轴添加音符</li>
                <li>拖拽音符调整位置</li>
                <li>音符自动吸附1/16拍</li>
                <li>右键点击音符删除</li>
              </ul>
            </div>
            <div className="panel-section">
              <h4>音符统计</h4>
              <div className="stats-grid">
                {(['melody', 'drum', 'harmony'] as TrackType[]).map((track) => (
                  <div key={track} className="stat-item">
                    <span
                      className="stat-color"
                      style={{ backgroundColor: TRACK_COLORS[track] }}
                    />
                    <span className="stat-label">{TRACK_LABELS[track]}</span>
                    <span className="stat-value">
                      {notes.filter((n) => n.track === track).length}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="panel-section">
              <button
                className="add-note-btn"
                onClick={() => {
                  if (!editorRef.current) return;
                  const y = selectedTrack === 'melody' ? 25 : selectedTrack === 'drum' ? 50 : 75;
                  const newNote = editorRef.current.addNote(currentTime + 0.5, selectedTrack, y);
                  const allNotes = editorRef.current.getNotes();
                  setEditorNotes([...allNotes]);
                  setNotes([...allNotes]);
                  if (engineRef.current) {
                    engineRef.current.setNotes(allNotes);
                  }
                }}
              >
                <Plus size={16} />
                添加音符
              </button>
            </div>
          </div>
        )}

        <div className="canvas-wrapper">
          <div ref={containerRef} className="canvas-container">
            <canvas ref={canvasRef} className="game-canvas" />
          </div>
        </div>
      </div>

      <div className="timeline-container">
        <div className="timeline-header">
          <span className="timeline-label">时间轴</span>
          <span className="timeline-bpm">BPM: {bpm}</span>
        </div>

        <div
          ref={timelineScrollRef}
          className="timeline-scroll"
          onScroll={handleTimelineScroll}
          onClick={handleTimelineClick}
        >
          <div
            className="timeline-content"
            style={{ width: `${timelineWidth}px` }}
          >
            {gridLines.map((line, index) => (
              <div
                key={index}
                className={`grid-line ${line.type}`}
                style={{
                  left: `${line.pixel}px`,
                  height: `${line.height * 100}%`,
                }}
              />
            ))}

            <div
              className="playhead-line"
              style={{
                left: `${(currentTime * pixelsPerSecond)}px`,
              }}
            />

            {editorNotes.map((note) => (
              <div
                key={note.id}
                className={`timeline-note ${note.isDragging ? 'dragging' : ''} ${
                  note.snappingTarget !== undefined ? 'snapping' : ''
                }`}
                style={{
                  left: `${note.time * pixelsPerSecond - 12}px`,
                  top: `${note.y - 8}%`,
                  backgroundColor: TRACK_COLORS[note.track],
                  boxShadow: `0 0 10px ${TRACK_COLORS[note.track]}80`,
                }}
                onMouseDown={(e) => handleNoteMouseDown(e, note.id)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  handleDeleteNote(note.id);
                }}
                title={`${TRACK_LABELS[note.track]} - ${formatTime(note.time)}`}
              >
                {note.snappingTarget !== undefined && (
                  <div
                    className="snap-indicator"
                    style={{
                      left: `${(note.snappingTarget - note.time) * pixelsPerSecond}px`,
                    }}
                  />
                )}
                <button
                  className="note-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteNote(note.id);
                  }}
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {isMobile && (
          <div className="mobile-toolbar">
            {(['melody', 'drum', 'harmony'] as TrackType[]).map((track) => (
              <button
                key={track}
                className={`mobile-track-btn ${selectedTrack === track ? 'active' : ''}`}
                style={{ borderColor: TRACK_COLORS[track] }}
                onClick={() => setSelectedTrack(track)}
              >
                <span
                  className="track-dot"
                  style={{ backgroundColor: TRACK_COLORS[track] }}
                />
                {TRACK_LABELS[track]}
              </button>
            ))}
            <button
              className="mobile-add-btn"
              onClick={() => {
                if (!editorRef.current) return;
                const y = selectedTrack === 'melody' ? 25 : selectedTrack === 'drum' ? 50 : 75;
                const newNote = editorRef.current.addNote(currentTime + 0.5, selectedTrack, y);
                const allNotes = editorRef.current.getNotes();
                setEditorNotes([...allNotes]);
                setNotes([...allNotes]);
                if (engineRef.current) {
                  engineRef.current.setNotes(allNotes);
                }
              }}
            >
              <Plus size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
