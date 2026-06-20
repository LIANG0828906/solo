import React, { useState, useRef, useEffect, useCallback } from 'react';
import { saveAs } from 'file-saver';
import { X, Check, AlertTriangle, Download } from 'lucide-react';
import { AudioEngine, Track } from './AudioEngine';
import { PresetManager, Preset, Comment } from './PresetManager';
import Toolbar from './components/Toolbar';
import TrackArea from './components/TrackArea';
import MixerUI from './MixerUI';
import PresetPanel from './components/PresetPanel';
import CommentPanel from './components/CommentPanel';
import './styles.css';

const App: React.FC = () => {
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const presetManagerRef = useRef<PresetManager | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafIdRef = useRef<number | null>(null);
  const sharePresetRef = useRef<Preset | null>(null);

  const [tracks, setTracks] = useState<Track[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [bpm, setBpm] = useState(120);
  const [loopEnabled, setLoopEnabled] = useState(false);
  const [masterVolume, setMasterVolume] = useState(80);
  const [vuLevels, setVuLevels] = useState<[number, number]>([-Infinity, -Infinity]);
  const [isSaving, setIsSaving] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [exportProgress, setExportProgress] = useState<number | null>(null);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [currentPresetId, setCurrentPresetId] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [storageFull, setStorageFull] = useState(false);
  const [trackPeaks, setTrackPeaks] = useState<Map<string, number[]>>(new Map());
  const [pixelsPerSecond] = useState(100);
  const [showStorageAlert, setShowStorageAlert] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const updateTimeLoop = useCallback(() => {
    if (audioEngineRef.current) {
      const time = audioEngineRef.current.getCurrentTime();
      setCurrentTime(time);
      rafIdRef.current = requestAnimationFrame(updateTimeLoop);
    }
  }, []);

  const startUpdateLoop = useCallback(() => {
    if (rafIdRef.current === null) {
      rafIdRef.current = requestAnimationFrame(updateTimeLoop);
    }
  }, [updateTimeLoop]);

  const stopUpdateLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    audioEngineRef.current = new AudioEngine();
    presetManagerRef.current = PresetManager.instance();

    const engine = audioEngineRef.current;
    const manager = presetManagerRef.current;

    engine.on('onStateChange', (state) => {
      setIsPlaying(state.isPlaying);
      setBpm(state.bpm);
      setLoopEnabled(state.loopEnabled);
      setMasterVolume(state.masterVolume);
      setTracks(engine.getTracks());
    });

    engine.on('onVUUpdate', (levels) => {
      setVuLevels(levels);
    });

    engine.on('onPlaybackEnd', () => {
      stopUpdateLoop();
      setCurrentTime(0);
    });

    const allPresets = manager.getAllPresets();
    setPresets(allPresets);

    const sharePreset = manager.parseShareLink();
    if (sharePreset) {
      sharePresetRef.current = sharePreset;
      setReadOnly(true);
      setCurrentPresetId(sharePreset.id);
      setBpm(sharePreset.bpm);
      setLoopEnabled(sharePreset.loopEnabled);
      const shareComments = manager.getComments(sharePreset.id);
      setComments(shareComments);
    }

    return () => {
      stopUpdateLoop();
      engine.destroy();
    };
  }, [stopUpdateLoop]);

  useEffect(() => {
    if (isPlaying) {
      startUpdateLoop();
    } else {
      stopUpdateLoop();
    }
  }, [isPlaying, startUpdateLoop, stopUpdateLoop]);

  useEffect(() => {
    if (!presetManagerRef.current || !currentPresetId) return;
    if (sharePresetRef.current) return;
    const manager = presetManagerRef.current;
    const loadedComments = manager.getComments(currentPresetId);
    setComments(loadedComments);
  }, [currentPresetId]);

  const handleImportFiles = useCallback(async (files: FileList | null) => {
    if (!files || !audioEngineRef.current || readOnly) return;
    const engine = audioEngineRef.current;
    const newPeaks = new Map(trackPeaks);

    for (let i = 0; i < files.length; i++) {
      try {
        const track = await engine.addTrackFromFile(files[i]);
        const peaks = engine.snapshotWaveform(track.id, 800);
        newPeaks.set(track.id, peaks);
      } catch (e) {
        console.error('Failed to add track:', e);
      }
    }

    setTrackPeaks(newPeaks);
    setTracks(engine.getTracks());
  }, [readOnly, trackPeaks]);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleImportFiles(e.target.files);
    e.target.value = '';
  }, [handleImportFiles]);

  const handleSavePreset = useCallback((name: string) => {
    if (!audioEngineRef.current || !presetManagerRef.current || readOnly) return;

    setIsSaving(true);
    setTimeout(() => {
      const engine = audioEngineRef.current!;
      const manager = presetManagerRef.current!;
      const state = engine.getState();
      const trackList = engine.getTracks();

      const preset = manager.savePreset(name, {
        bpm: state.bpm,
        loopEnabled: state.loopEnabled,
        tracks: trackList,
      });

      setIsSaving(false);

      if (preset) {
        setPresets(manager.getAllPresets());
        setCurrentPresetId(preset.id);
        setStorageFull(false);
      } else {
        setStorageFull(true);
        setShowStorageAlert(true);
      }
    }, 300);
  }, [readOnly]);

  const handleLoadPreset = useCallback((id: string) => {
    if (!presetManagerRef.current || !audioEngineRef.current) return;

    const manager = presetManagerRef.current;
    const engine = audioEngineRef.current;
    const preset = manager.loadPreset(id);

    if (!preset) return;

    setCurrentPresetId(preset.id);
    setBpm(preset.bpm);
    setLoopEnabled(preset.loopEnabled);
    setComments(manager.getComments(preset.id));

    engine.setBPM(preset.bpm);
    if (preset.loopEnabled !== engine.getState().loopEnabled) {
      engine.toggleLoop();
    }

    const currentTracks = engine.getTracks();
    for (const presetTrack of preset.tracks) {
      const existingTrack = currentTracks.find((t) => t.id === presetTrack.id);
      if (existingTrack) {
        engine.setVolume(presetTrack.id, presetTrack.volume);
        engine.setPan(presetTrack.id, presetTrack.pan);
        engine.setReverb(presetTrack.id, presetTrack.reverb);
        engine.setDelay(presetTrack.id, presetTrack.delay);
        engine.setCompression(presetTrack.id, presetTrack.compression);
        engine.setTrackStartTime(presetTrack.id, presetTrack.startTime);
        if (presetTrack.muted !== existingTrack.muted) {
          engine.muteTrack(presetTrack.id);
        }
        if (presetTrack.soloed !== existingTrack.soloed) {
          engine.soloTrack(presetTrack.id);
        }
      }
    }

    setTracks(engine.getTracks());
    setShowPresets(false);
  }, []);

  const handleDeletePreset = useCallback((id: string) => {
    if (!presetManagerRef.current || readOnly) return;

    const manager = presetManagerRef.current;
    manager.deletePreset(id);
    setPresets(manager.getAllPresets());

    if (currentPresetId === id) {
      setCurrentPresetId(null);
    }
  }, [readOnly, currentPresetId]);

  const handleExport = useCallback(async () => {
    if (!audioEngineRef.current || readOnly) return;

    const engine = audioEngineRef.current;
    setExportProgress(0);
    setShowExportModal(true);

    try {
      const blob = await engine.offlineRender((progress) => {
        setExportProgress(progress);
      });
      saveAs(blob, 'mix-down.wav');
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setTimeout(() => {
        setExportProgress(null);
        setShowExportModal(false);
      }, 500);
    }
  }, [readOnly]);

  const handleShare = useCallback(() => {
    if (!presetManagerRef.current || !audioEngineRef.current || readOnly) return;

    const manager = presetManagerRef.current;
    const engine = audioEngineRef.current;
    const state = engine.getState();
    const trackList = engine.getTracks();

    const tempPreset: Preset = {
      id: currentPresetId || 'share-' + Date.now(),
      name: '分享预设',
      createdAt: Date.now(),
      bpm: state.bpm,
      loopEnabled: state.loopEnabled,
      tracks: trackList,
      comments: comments,
    };

    const link = manager.generateShareLink(tempPreset);
    setShareLink(link);
    setShowShareModal(true);
    setShareCopied(false);
  }, [readOnly, currentPresetId, comments]);

  const handleCopyShareLink = useCallback(async () => {
    if (!shareLink) return;
    try {
      await navigator.clipboard.writeText(shareLink);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch (e) {
      console.error('Copy failed:', e);
    }
  }, [shareLink]);

  const handleAddComment = useCallback((time: number, text: string) => {
    if (!presetManagerRef.current) return;

    const manager = presetManagerRef.current;
    const shareId = currentPresetId;
    if (!shareId) return;

    const author = readOnly ? 'viewer' : 'creator';
    const newComment = manager.addComment(shareId, { time, text, author });
    if (newComment) {
      setComments(manager.getComments(shareId));
    }
  }, [currentPresetId, readOnly]);

  const handleDeleteComment = useCallback((id: string) => {
    if (!presetManagerRef.current) return;

    const manager = presetManagerRef.current;
    const shareId = sharePresetRef.current?.id || currentPresetId;
    if (!shareId) return;

    const success = manager.deleteComment(shareId, id);
    if (success) {
      setComments(manager.getComments(shareId));
    }
  }, [currentPresetId]);

  const handleToggleLoop = useCallback(() => {
    if (!audioEngineRef.current || readOnly) return;
    audioEngineRef.current.toggleLoop();
  }, [readOnly]);

  const handleSetBPM = useCallback((newBpm: number) => {
    if (!audioEngineRef.current || readOnly) return;
    audioEngineRef.current.setBPM(newBpm);
  }, [readOnly]);

  const handlePlayPause = useCallback(() => {
    if (!audioEngineRef.current) return;
    const engine = audioEngineRef.current;
    if (engine.getState().isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
  }, []);

  const handleMuteTrack = useCallback((id: string) => {
    if (!audioEngineRef.current || readOnly) return;
    audioEngineRef.current.muteTrack(id);
    setTracks(audioEngineRef.current.getTracks());
  }, [readOnly]);

  const handleSoloTrack = useCallback((id: string) => {
    if (!audioEngineRef.current || readOnly) return;
    audioEngineRef.current.soloTrack(id);
    setTracks(audioEngineRef.current.getTracks());
  }, [readOnly]);

  const handleTrackVolumeChange = useCallback((id: string, volume: number) => {
    if (!audioEngineRef.current || readOnly) return;
    audioEngineRef.current.setVolume(id, volume);
    setTracks(audioEngineRef.current.getTracks());
  }, [readOnly]);

  const handleTrackPanChange = useCallback((id: string, pan: number) => {
    if (!audioEngineRef.current || readOnly) return;
    audioEngineRef.current.setPan(id, pan);
    setTracks(audioEngineRef.current.getTracks());
  }, [readOnly]);

  const handleTrackReverbChange = useCallback((id: string, value: number) => {
    if (!audioEngineRef.current || readOnly) return;
    audioEngineRef.current.setReverb(id, value);
    setTracks(audioEngineRef.current.getTracks());
  }, [readOnly]);

  const handleTrackDelayChange = useCallback((id: string, value: number) => {
    if (!audioEngineRef.current || readOnly) return;
    audioEngineRef.current.setDelay(id, value);
    setTracks(audioEngineRef.current.getTracks());
  }, [readOnly]);

  const handleTrackCompressionChange = useCallback((id: string, value: number) => {
    if (!audioEngineRef.current || readOnly) return;
    audioEngineRef.current.setCompression(id, value);
    setTracks(audioEngineRef.current.getTracks());
  }, [readOnly]);

  const handleMasterVolumeChange = useCallback((volume: number) => {
    if (!audioEngineRef.current || readOnly) return;
    audioEngineRef.current.setMasterVolume(volume);
    setMasterVolume(volume);
  }, [readOnly]);

  const handleTrackDragStart = useCallback((id: string) => {
  }, []);

  const handleTrackDragMove = useCallback((id: string, deltaSeconds: number) => {
    if (!audioEngineRef.current || readOnly) return;
    const engine = audioEngineRef.current;
    const track = engine.getTracks().find((t) => t.id === id);
    if (track) {
      engine.setTrackStartTime(id, Math.max(0, track.startTime + deltaSeconds));
      setTracks(engine.getTracks());
    }
  }, [readOnly]);

  const handleTrackDragEnd = useCallback((id: string) => {
  }, []);

  const handleJumpToTime = useCallback((time: number) => {
    if (!audioEngineRef.current) return;
    audioEngineRef.current.seek(time);
    setCurrentTime(time);
  }, []);

  const handleCloseStorageAlert = useCallback(() => {
    setShowStorageAlert(false);
  }, []);

  const handleCloseShareModal = useCallback(() => {
    setShowShareModal(false);
    setShareLink(null);
  }, []);

  const handleTogglePresets = useCallback(() => {
    setShowPresets((prev) => !prev);
  }, []);

  const handleToggleComments = useCallback(() => {
    setShowComments((prev) => !prev);
  }, []);

  const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
  };

  const modalContentStyle: React.CSSProperties = {
    background: '#16213e',
    borderRadius: 12,
    padding: 24,
    minWidth: 400,
    maxWidth: 500,
    maxHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  };

  const modalHeaderStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  };

  const modalTitleStyle: React.CSSProperties = {
    color: '#e0e0e0',
    fontSize: 18,
    fontWeight: 600,
  };

  const modalCloseBtnStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#a0a0b8',
    cursor: 'pointer',
    padding: 4,
    borderRadius: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const renderStorageAlert = () => {
    if (!showStorageAlert) return null;

    const sortedPresets = [...presets].sort((a, b) => a.createdAt - b.createdAt);

    return (
      <div style={modalOverlayStyle} onClick={handleCloseStorageAlert}>
        <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
          <div style={modalHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={20} color="#ef4444" />
              <span style={modalTitleStyle}>存储空间不足</span>
            </div>
            <button style={modalCloseBtnStyle} onClick={handleCloseStorageAlert}>
              <X size={18} />
            </button>
          </div>
          <div style={{ color: '#a0a0b8', fontSize: 14 }}>
            本地预设存储空间已满，请删除一些旧预设以释放空间。
          </div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300 }}>
            {sortedPresets.map((preset) => (
              <div
                key={preset.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: '#0f172a',
                  borderRadius: 6,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 500 }}>{preset.name}</span>
                  <span style={{ color: '#6b7280', fontSize: 12 }}>
                    {new Date(preset.createdAt).toLocaleString()}
                  </span>
                </div>
                <button
                  className="btn"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={() => handleDeletePreset(preset.id)}
                >
                  删除
                </button>
              </div>
            ))}
          </div>
          <button className="btn" style={{ marginTop: 8 }} onClick={handleCloseStorageAlert}>
            关闭
          </button>
        </div>
      </div>
    );
  };

  const renderExportModal = () => {
    if (!showExportModal) return null;

    const progress = exportProgress ?? 0;

    return (
      <div style={modalOverlayStyle}>
        <div style={{ ...modalContentStyle, minWidth: 360 }} onClick={(e) => e.stopPropagation()}>
          <div style={modalHeaderStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Download size={20} color="#60a5fa" />
              <span style={modalTitleStyle}>导出混音</span>
            </div>
          </div>
          <div style={{ color: '#a0a0b8', fontSize: 14, marginBottom: 8 }}>
            正在渲染音频，请稍候...
          </div>
          <div
            style={{
              height: 8,
              background: '#0f172a',
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                width: `${progress * 100}%`,
                background: 'linear-gradient(90deg, #60a5fa, #93c5fd)',
                transition: 'width 0.1s ease',
              }}
            />
          </div>
          <div style={{ color: '#a0a0b8', fontSize: 12, textAlign: 'center' }}>
            {Math.round(progress * 100)}%
          </div>
        </div>
      </div>
    );
  };

  const renderShareModal = () => {
    if (!showShareModal || !shareLink) return null;

    return (
      <div style={modalOverlayStyle} onClick={handleCloseShareModal}>
        <div style={{ ...modalContentStyle, minWidth: 420 }} onClick={(e) => e.stopPropagation()}>
          <div style={modalHeaderStyle}>
            <span style={modalTitleStyle}>分享链接</span>
            <button style={modalCloseBtnStyle} onClick={handleCloseShareModal}>
              <X size={18} />
            </button>
          </div>
          <div style={{ color: '#a0a0b8', fontSize: 14 }}>
            复制以下链接分享给他人：
          </div>
          <div
            style={{
              padding: '10px 12px',
              background: '#0f172a',
              borderRadius: 6,
              color: '#e0e0e0',
              fontSize: 12,
              wordBreak: 'break-all',
              fontFamily: 'monospace',
            }}
          >
            {shareLink}
          </div>
          <button
            className="btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              background: shareCopied
                ? 'linear-gradient(90deg, #22c55e, #16a34a)'
                : undefined,
            }}
            onClick={handleCopyShareLink}
          >
            {shareCopied ? (
              <>
                <Check size={16} />
                <span>已复制</span>
              </>
            ) : (
              <>
                <span>复制链接</span>
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderReadOnlyBanner = () => {
    if (!readOnly) return null;

    return (
      <div
        style={{
          padding: '10px 24px',
          background: 'rgba(234, 179, 8, 0.15)',
          borderBottom: '1px solid rgba(234, 179, 8, 0.3)',
          color: '#fcd34d',
          fontSize: 13,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <AlertTriangle size={16} />
        <span>
          这是只读分享模式，音频数据未包含，请上传对应音轨以试听效果。
        </span>
      </div>
    );
  };

  return (
    <div className="app-root">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".mp3,.wav,audio/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <Toolbar
        onImport={handleImportClick}
        onSave={() => {}}
        onExport={handleExport}
        onShare={handleShare}
        onTogglePresets={handleTogglePresets}
        onToggleComments={handleToggleComments}
        isSaving={isSaving}
        presetCount={presets.length}
        commentCount={comments.length}
        readOnly={readOnly}
      />

      {renderReadOnlyBanner()}

      <TrackArea
        tracks={tracks}
        trackPeaks={trackPeaks}
        pixelsPerSecond={pixelsPerSecond}
        isPlaying={isPlaying}
        currentTime={currentTime}
        readOnly={readOnly}
        onMuteTrack={handleMuteTrack}
        onSoloTrack={handleSoloTrack}
        onTrackDragStart={handleTrackDragStart}
        onTrackDragMove={handleTrackDragMove}
        onTrackDragEnd={handleTrackDragEnd}
        onAddTrack={handleImportClick}
      />

      <MixerUI
        tracks={tracks}
        masterVolume={masterVolume}
        vuLevels={vuLevels}
        readOnly={readOnly}
        onTrackVolumeChange={handleTrackVolumeChange}
        onTrackPanChange={handleTrackPanChange}
        onTrackReverbChange={handleTrackReverbChange}
        onTrackDelayChange={handleTrackDelayChange}
        onTrackCompressionChange={handleTrackCompressionChange}
        onMasterVolumeChange={handleMasterVolumeChange}
      />

      <PresetPanel
        isOpen={showPresets}
        presets={presets}
        currentPresetId={currentPresetId ?? undefined}
        readOnly={readOnly}
        onClose={handleTogglePresets}
        onLoadPreset={handleLoadPreset}
        onDeletePreset={handleDeletePreset}
        onSaveNewPreset={handleSavePreset}
        storageFull={storageFull}
        onClearSpace={() => setShowStorageAlert(true)}
      />

      <CommentPanel
        isOpen={showComments}
        comments={comments}
        readOnly={readOnly}
        currentTime={currentTime}
        onClose={handleToggleComments}
        onJumpToTime={handleJumpToTime}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
      />

      {renderStorageAlert()}
      {renderExportModal()}
      {renderShareModal()}
    </div>
  );
};

export default App;
