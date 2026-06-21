import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, Square, Music, Download, Upload, Gamepad2, Target, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { NoteEditor } from './NoteEditor';
import { GameEngine, matchKeyToTrack } from './GameEngine';
import { AudioManager } from './AudioManager';
import { PlayField } from './components/PlayField';
import { EditorPanel } from './components/EditorPanel';
import { useGameStore } from './store/useGameStore';
import type { Note, TrackIndex, NoteType, GameMode, PlaybackSpeed } from './types';

const App: React.FC = () => {
  const {
    beatmap,
    gameState,
    editor: editorState,
    waveData,
    audioDuration,
    audioFileName,
    audioError,
    setBeatmap,
    setNotes,
    setGameState,
    setSelectedNoteId,
    setSelectedNoteType,
    setEditorZoom,
    setEditorScrollX,
    setSnapDivision,
    setWaveData,
    setAudioDuration,
    setAudioFileName,
    setAudioError,
  } = useGameStore();

  const noteEditorRef = useRef<NoteEditor>(new NoteEditor());
  const gameEngineRef = useRef<GameEngine | null>(null);
  const audioManagerRef = useRef<AudioManager>(new AudioManager({
    onLoaded: (duration) => {
      const wd = audioManagerRef.current?.getWaveformData() || [];
      setAudioDuration(duration);
      setWaveData(wd);
      setAudioError(null);
      const name = audioManagerRef.current?.getFileName();
      if (name) {
        setAudioFileName(name);
        noteEditorRef.current.setAudioFileName(name);
      }
    },
    onError: (err) => {
      setAudioError(err.message);
    },
    onTimeUpdate: (t) => {
    },
  }));

  const [mode, setMode] = useState<GameMode>('editor');
  const [previewPlaying, setPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(-1);
  const [playbackSpeed, setPlaybackSpeedState] = useState<PlaybackSpeed>(1.0);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [loopRange, setLoopRange] = useState<{ start: number; end: number }>({ start: 0, end: 10000 });
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);

  const importFileRef = useRef<HTMLInputElement>(null);
  const audioFileRef = useRef<HTMLInputElement>(null);
  const previewRafRef = useRef<number | null>(null);
  const [renderTick, setRenderTick] = useState(0);

  useEffect(() => {
    const engine = new GameEngine({
      onStateUpdate: (s) => {
        setGameState(s);
        setRenderTick((t) => (t + 1) % 1000000);
      },
      onHit: () => {},
      onComboMilestone: () => {},
    });
    engine.setAudioManager(audioManagerRef.current);
    gameEngineRef.current = engine;
    engine.loadNotes(noteEditorRef.current.getNotes());

    const sub = noteEditorRef.current.subscribe(() => {
      setBeatmap(noteEditorRef.current.getBeatmap());
      const newNotes = noteEditorRef.current.getNotes();
      setNotes(newNotes);
      if (gameEngineRef.current) {
        gameEngineRef.current.loadNotes(newNotes);
      }
    });
    setBeatmap(noteEditorRef.current.getBeatmap());
    setNotes(noteEditorRef.current.getNotes());

    return () => {
      sub();
      engine.destroy();
      if (previewRafRef.current !== null) {
        cancelAnimationFrame(previewRafRef.current);
      }
      audioManagerRef.current.cleanup();
    };
  }, []);

  useEffect(() => {
    audioManagerRef.current.setVolume(muted ? 0 : volume);
  }, [volume, muted]);

  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setMode(mode);
    }
  }, [mode]);

  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setPlaybackSpeed(playbackSpeed);
    }
  }, [playbackSpeed]);

  useEffect(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.setLoop(loopEnabled, loopRange.start, loopRange.end);
    }
  }, [loopEnabled, loopRange]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.repeat) return;
    const track = matchKeyToTrack(e.code, e.key);
    if (track !== null) {
      e.preventDefault();
      if (mode === 'playing' || mode === 'practice') {
        gameEngineRef.current?.handleTrackPress(track);
      }
    }
    if (e.code === 'Escape') {
      if (mode === 'playing' || mode === 'practice') {
        handleExitPlayMode();
      }
    }
    if (e.code === 'Space' && mode === 'editor') {
      e.preventDefault();
      if (previewPlaying) handleStopPreview();
      else handlePlayPreview();
    }
  }, [mode]);

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const track = matchKeyToTrack(e.code, e.key);
    if (track !== null) {
      if (mode === 'playing' || mode === 'practice') {
        gameEngineRef.current?.handleTrackRelease(track);
      }
    }
  }, [mode]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  const handleAddNote = (time: number, track: TrackIndex) => {
    const type = editorState.selectedNoteType;
    noteEditorRef.current.addNote(time, track, type, type === 'hold' ? 500 : undefined, true);
  };

  const handleUpdateNote = (id: string, patch: Partial<Pick<Note, 'time' | 'track' | 'type' | 'duration'>>) => {
    noteEditorRef.current.updateNote(id, patch);
  };

  const handleRemoveNote = (id: string) => {
    noteEditorRef.current.removeNote(id);
  };

  const handleBeatmapChange = () => {
    noteEditorRef.current.getBeatmap();
  };

  const handlePlayPreview = () => {
    if (previewRafRef.current !== null) {
      cancelAnimationFrame(previewRafRef.current);
    }
    setPreviewPlaying(true);
    const startTime = performance.now();
    const startPreview = previewTime >= 0 ? previewTime : 0;
    audioManagerRef.current.seek(startPreview);
    audioManagerRef.current.play(playbackSpeed);
    const tick = () => {
      const t = startPreview + (performance.now() - startTime) * playbackSpeed;
      setPreviewTime(t);
      const duration = Math.max(noteEditorRef.current.getDuration(), audioDuration || 0);
      if (t > duration) {
        handleStopPreview();
        return;
      }
      previewRafRef.current = requestAnimationFrame(tick);
    };
    previewRafRef.current = requestAnimationFrame(tick);
  };

  const handleStopPreview = () => {
    if (previewRafRef.current !== null) {
      cancelAnimationFrame(previewRafRef.current);
      previewRafRef.current = null;
    }
    setPreviewPlaying(false);
    setPreviewTime(-1);
    audioManagerRef.current.stop();
  };

  const handleEnterPlayMode = (gameMode: 'playing' | 'practice') => {
    setMode(gameMode);
    setTimeout(() => {
      const notes = noteEditorRef.current.getNotes();
      if (gameEngineRef.current) {
        gameEngineRef.current.loadNotes(notes);
        gameEngineRef.current.setMode(gameMode);
        gameEngineRef.current.start(0);
      }
    }, 50);
  };

  const handleExitPlayMode = () => {
    if (gameEngineRef.current) {
      gameEngineRef.current.stop();
    }
    setMode('editor');
  };

  const handleExportJSON = () => {
    noteEditorRef.current.downloadJSON();
  };

  const handleImportJSON = async (file: File) => {
    const result = await noteEditorRef.current.loadFromFile(file);
    if (result) {
      setBeatmap(result);
      setNotes(result.notes);
      gameEngineRef.current?.loadNotes(result.notes);
    } else {
      alert('谱面文件导入失败，格式不正确');
    }
  };

  const handleUploadAudio = async (file: File) => {
    setAudioError(null);
    await audioManagerRef.current.loadFromFile(file);
  };

  const handleGenerateDemo = () => {
    noteEditorRef.current.clearNotes();
    noteEditorRef.current.setBpm(120);
    noteEditorRef.current.setTitle('Demo 谱面 - 120 BPM');
    const msPerBeat = noteEditorRef.current.getMsPerBeat();
    const patterns: Array<{ time: number; track: TrackIndex; type: NoteType }> = [];
    for (let i = 0; i < 8; i++) {
      for (let beat = 0; beat < 4; beat++) {
        const time = (i * 4 + beat) * msPerBeat;
        const baseTrack = ((i * 4 + beat) % 4) as TrackIndex;
        patterns.push({ time, track: baseTrack, type: 'tap' });
        if (beat === 1 && i % 2 === 0) {
          const extra = ((i + 2) % 4) as TrackIndex;
          if (extra !== baseTrack) {
            patterns.push({ time: time + msPerBeat / 2, track: extra, type: 'tap' });
          }
        }
        if (beat === 3 && i % 3 === 0) {
          patterns.push({ time, track: baseTrack, type: 'hold' });
        }
      }
    }
    for (const p of patterns) {
      noteEditorRef.current.addNote(p.time, p.track, p.type, p.type === 'hold' ? msPerBeat : undefined, false);
    }
  };

  const formatTime = (ms: number): string => {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const millis = Math.floor((ms % 1000) / 10);
    return `${m}:${sec.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
  };

  const speedOptions: PlaybackSpeed[] = [0.5, 0.75, 1.0, 1.5];
  const gs = gameState;
  const gameIsPlaying = gs.isPlaying ?? false;

  return (
    <div style={{ width: '100%', height: '100%', background: '#1a1a2e', color: 'white', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'linear-gradient(180deg, rgba(233,69,96,0.12), transparent)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #e94560, #ff6b88)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 15px rgba(233,69,96,0.4)',
            }}
          >
            <Music size={22} />
          </div>
          <div>
            <div className="font-display" style={{ fontSize: 18, fontWeight: 900, letterSpacing: '0.05em' }}>
              节奏音游工作室
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              RHYTHM GAME STUDIO
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        <div className="panel" style={{ padding: '6px 8px', display: 'flex', gap: 4 }}>
          <button
            onClick={() => setMode('editor')}
            className={mode === 'editor' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Target size={14} />
            编辑器
          </button>
          <button
            onClick={() => handleEnterPlayMode('playing')}
            className={mode === 'playing' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <Gamepad2 size={14} />
            演奏
          </button>
          <button
            onClick={() => handleEnterPlayMode('practice')}
            className={mode === 'practice' ? 'btn-primary' : 'btn-secondary'}
            style={{ padding: '6px 12px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RotateCcw size={14} />
            练习
          </button>
        </div>
      </div>

      {mode === 'editor' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 16, gap: 12, overflow: 'hidden' }}>
          <div className="panel" style={{ padding: 12, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="panel" style={{ padding: '4px', display: 'flex', gap: 2 }}>
              <button
                onClick={previewPlaying ? handleStopPreview : handlePlayPreview}
                className={previewPlaying ? 'btn-primary' : 'btn-secondary'}
                style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                title={previewPlaying ? '停止 (Space)' : '播放预览 (Space)'}
              >
                {previewPlaying ? <Square size={14} /> : <Play size={14} />}
                {previewPlaying ? '停止' : '预览'}
              </button>
              <button
                onClick={() => setPreviewTime(0)}
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: 12 }}
              >
                回到开头
              </button>
            </div>

            {previewTime >= 0 && (
              <div className="font-display" style={{ fontSize: 13, color: '#e94560', minWidth: 80 }}>
                {formatTime(previewTime)}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="label-text">倍速</span>
              <div className="panel" style={{ padding: '2px', display: 'flex', gap: 2 }}>
                {speedOptions.map((s) => (
                  <button
                    key={s}
                    onClick={() => setPlaybackSpeedState(s)}
                    className={playbackSpeed === s ? 'btn-primary' : 'btn-secondary'}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="label-text">音量</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  className="btn-secondary"
                  style={{ padding: '4px 6px' }}
                  onClick={() => setMuted(!muted)}
                >
                  {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={volume}
                  onChange={(e) => {
                    setMuted(false);
                    setVolume(Number(e.target.value));
                  }}
                  style={{ width: 100 }}
                />
              </div>
            </div>

            <div
              style={{
                width: 1,
                height: 36,
                background: 'rgba(255,255,255,0.1)',
                margin: '0 8px',
              }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span className="label-text">循环</span>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <button
                  onClick={() => setLoopEnabled(!loopEnabled)}
                  className={loopEnabled ? 'btn-primary' : 'btn-secondary'}
                  style={{ padding: '4px 10px', fontSize: 12 }}
                >
                  {loopEnabled ? '开启' : '关闭'}
                </button>
                {loopEnabled && (
                  <>
                    <span className="label-text">起</span>
                    <input
                      type="number"
                      className="input-field"
                      style={{ width: 80 }}
                      value={loopRange.start}
                      step={100}
                      onChange={(e) => setLoopRange((r) => ({ ...r, start: Math.max(0, Number(e.target.value)) }))}
                    />
                    <span className="label-text">止</span>
                    <input
                      type="number"
                      className="input-field"
                      style={{ width: 80 }}
                      value={loopRange.end}
                      step={100}
                      onChange={(e) => setLoopRange((r) => ({ ...r, end: Math.max(Number(e.target.value), r.start + 1000) }))}
                    />
                  </>
                )}
              </div>
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <span className="label-text">{audioFileName || '未绑定音频'}</span>
              {audioError && <span style={{ fontSize: 12, color: '#ef4444' }}>{audioError}</span>}
              <input
                ref={audioFileRef}
                type="file"
                accept="audio/mp3,audio/wav,audio/mpeg,audio/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUploadAudio(f);
                  e.target.value = '';
                }}
              />
              <button
                className="btn-secondary"
                style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                onClick={() => audioFileRef.current?.click()}
              >
                <Music size={14} />
                上传音频
              </button>
            </div>

            <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />

            <input
              ref={importFileRef}
              type="file"
              accept="application/json,.json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportJSON(f);
                e.target.value = '';
              }}
            />
            <button
              className="btn-secondary"
              style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => importFileRef.current?.click()}
            >
              <Upload size={14} />
              导入
            </button>
            <button
              className="btn-primary"
              style={{ padding: '6px 10px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={handleExportJSON}
            >
              <Download size={14} />
              导出JSON
            </button>

            <button className="btn-secondary" style={{ padding: '6px 10px', fontSize: 12 }} onClick={handleGenerateDemo}>
              生成Demo
            </button>
          </div>

          <div style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
            <EditorPanel
              editor={noteEditorRef.current}
              beatmap={beatmap}
              waveData={waveData}
              audioDuration={audioDuration}
              selectedNoteId={editorState.selectedNoteId}
              selectedNoteType={editorState.selectedNoteType}
              snapDivision={editorState.snapDivision}
              zoom={editorState.zoom}
              scrollX={editorState.scrollX}
              onSelectNote={setSelectedNoteId}
              onSelectNoteType={setSelectedNoteType}
              onZoomChange={setEditorZoom}
              onScrollXChange={setEditorScrollX}
              onSnapChange={setSnapDivision}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onRemoveNote={handleRemoveNote}
              onBeatmapChange={handleBeatmapChange}
              onPlayPreview={handlePlayPreview}
              onStopPreview={handleStopPreview}
              previewTime={previewTime}
            />
          </div>

          <div className="panel" style={{ padding: 12, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <span className="label-text">总音符</span>
              <span className="font-display" style={{ fontSize: 18, fontWeight: 700, marginLeft: 8, color: '#e94560' }}>
                {beatmap.notes.length}
              </span>
            </div>
            <div>
              <span className="label-text">谱面时长</span>
              <span className="font-display" style={{ fontSize: 16, fontWeight: 700, marginLeft: 8 }}>
                {formatTime(Math.max(noteEditorRef.current.getDuration(), audioDuration))}
              </span>
            </div>
            <div>
              <span className="label-text">提示</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginLeft: 8 }}>
                点击轨道放置音符 · 拖动改变位置 · Ctrl+滚轮缩放 · Space 预览播放 · A/S/D/F 或方向键演奏
              </span>
            </div>
          </div>
        </div>
      )}

      {(mode === 'playing' || mode === 'practice') && (
        <PlayField
          gameState={gs}
          isTrackPressed={(t) => gameEngineRef.current?.isTrackPressed(t) ?? false}
          fallDuration={2000}
          onExit={handleExitPlayMode}
        />
      )}
    </div>
  );
};

export default App;
