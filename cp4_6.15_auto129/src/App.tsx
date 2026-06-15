import React, { useState, useCallback, useRef, useEffect } from 'react';
import AudioVisualizer from './components/AudioVisualizer';
import { useAudioEngine } from './hooks/useAudioEngine';
import { PitchPoint, Marker } from './utils/drawHelpers';

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}.${ms}`;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export default function App() {
  const engine = useAudioEngine();
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [leftPanelWidth, setLeftPanelWidth] = useState(280);
  const [editingMarkerId, setEditingMarkerId] = useState<string | null>(null);
  const [markerNoteInput, setMarkerNoteInput] = useState('');
  const [markerEditPos, setMarkerEditPos] = useState({ x: 0, y: 0 });
  const [flashMarkerId, setFlashMarkerId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [isDragResizing, setIsDragResizing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prevTimeRef = useRef<number>(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const config = params.get('config');
    if (config) {
      try {
        const decoded = JSON.parse(atob(config));
        if (decoded.pitchCurve) engine.setPitchCurve(decoded.pitchCurve);
        if (decoded.markers) setMarkers(decoded.markers);
        showToast('已还原分享配置');
      } catch {
        console.error('Failed to parse config');
      }
    }
  }, []);

  useEffect(() => {
    if (!engine.isPlaying || markers.length === 0 || engine.duration <= 0) return;
    const currentSec = Math.floor(engine.currentTime * 10);
    const prevSec = Math.floor(prevTimeRef.current * 10);
    prevTimeRef.current = engine.currentTime;
    if (currentSec !== prevSec) {
      for (const m of markers) {
        const markerSec = Math.floor(m.time * 10);
        if (markerSec === currentSec && m.id !== flashMarkerId) {
          setFlashMarkerId(m.id);
          setTimeout(() => setFlashMarkerId(null), 500);
        }
      }
    }
  }, [engine.currentTime, engine.isPlaying, markers, engine.duration]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }, []);

  const handleFileSelect = useCallback(
    async (file: File) => {
      const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/x-wav'];
      if (!validTypes.some((t) => file.type.startsWith(t.split('/')[0])) && !file.name.match(/\.(mp3|wav|ogg|webm)$/i)) {
        showToast('不支持的音频格式');
        return;
      }
      try {
        await engine.loadFile(file);
        showToast('音频加载成功');
      } catch {
        showToast('音频加载失败');
      }
    },
    [engine, showToast]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileSelect(file);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFileSelect(file);
      e.target.value = '';
    },
    [handleFileSelect]
  );

  const handleRecord = useCallback(async () => {
    if (engine.isRecording) {
      engine.stopRecording();
    } else {
      await engine.startRecording();
    }
  }, [engine]);

  const handlePlayPause = useCallback(() => {
    if (engine.isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
  }, [engine]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (engine.duration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const ratio = (e.clientX - rect.left) / rect.width;
      engine.seek(ratio * engine.duration);
    },
    [engine]
  );

  const handleAddMarker = useCallback(() => {
    if (engine.duration <= 0) return;
    const newMarker: Marker = {
      id: generateId(),
      time: engine.currentTime,
      note: '',
    };
    setMarkers((prev) => [...prev, newMarker]);
  }, [engine.currentTime, engine.duration]);

  const handleEditMarker = useCallback(
    (marker: Marker, e: React.MouseEvent) => {
      setEditingMarkerId(marker.id);
      setMarkerNoteInput(marker.note);
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setMarkerEditPos({ x: rect.right + 8, y: rect.top });
    },
    []
  );

  const handleSaveMarkerNote = useCallback(() => {
    if (editingMarkerId) {
      setMarkers((prev) =>
        prev.map((m) => (m.id === editingMarkerId ? { ...m, note: markerNoteInput } : m))
      );
    }
    setEditingMarkerId(null);
    setMarkerNoteInput('');
  }, [editingMarkerId, markerNoteInput]);

  const handleDeleteMarker = useCallback((id: string) => {
    setMarkers((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragResizing(true);
      const startX = e.clientX;
      const startWidth = leftPanelWidth;

      const onMouseMove = (ev: MouseEvent) => {
        const delta = ev.clientX - startX;
        const newWidth = Math.max(200, Math.min(500, startWidth + delta));
        setLeftPanelWidth(newWidth);
      };

      const onMouseUp = () => {
        setIsDragResizing(false);
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);
    },
    [leftPanelWidth]
  );

  const handleExport = useCallback(async () => {
    try {
      const blob = await engine.exportWav();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'exported.wav';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('导出成功');
    } catch {
      showToast('导出失败');
    }
  }, [engine, showToast]);

  const handleShare = useCallback(() => {
    const config = {
      pitchCurve: engine.pitchCurve,
      markers: markers.map((m) => ({ time: m.time, note: m.note, id: m.id })),
    };
    const encoded = btoa(JSON.stringify(config));
    const url = `${window.location.origin}${window.location.pathname}?config=${encoded}`;
    navigator.clipboard.writeText(url).then(
      () => showToast('分享链接已复制'),
      () => showToast('复制失败')
    );
  }, [engine.pitchCurve, markers, showToast]);

  const renderUploadIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 32, height: 32, margin: '0 auto 8px', opacity: 0.7, display: 'block' }}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  );

  const renderPlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );

  const renderPauseIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );

  const renderStopIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <rect x="4" y="4" width="16" height="16" />
    </svg>
  );

  const renderLoopIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </svg>
  );

  const renderRecordIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <circle cx="12" cy="12" r="6" />
    </svg>
  );

  const renderMarkerIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16" style={{ transform: 'rotate(45deg)' }}>
      <rect x="8" y="8" width="8" height="8" />
    </svg>
  );

  const progress = engine.duration > 0 ? (engine.currentTime / engine.duration) * 100 : 0;

  return (
    <div
      className="app-layout"
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className={`left-panel ${mobileMenuOpen ? 'mobile-open' : ''}`} style={{ width: leftPanelWidth }}>
        <div className="panel-title">音频控制</div>

        <div
          className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
          onClick={() => fileInputRef.current?.click()}
        >
          {renderUploadIcon()}
          <p>拖拽或点击上传音频</p>
          <p style={{ fontSize: 11, marginTop: 4, color: '#666' }}>MP3 / WAV / OGG</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,.ogg,.webm"
          style={{ display: 'none' }}
          onChange={handleFileInput}
        />

        {engine.fileName && <div className="file-name">📁 {engine.fileName}</div>}

        <button
          className={`btn btn-record ${engine.isRecording ? 'recording' : ''}`}
          onClick={handleRecord}
          style={{ width: '100%' }}
        >
          {renderRecordIcon()}
          {engine.isRecording ? '停止录制' : '开始录制'}
        </button>

        {engine.isRecording && (
          <div className="recording-progress">
            <div
              className="recording-progress-fill"
              style={{ width: `${engine.recordingProgress}%` }}
            />
          </div>
        )}

        <div className="section-divider" />

        <div className="panel-title">音调编辑</div>
        <div className="edit-mode-toggle">
          <label>
            <div
              className={`toggle-switch ${editMode ? 'active' : ''}`}
              onClick={() => setEditMode(!editMode)}
            />
            <span>编辑音调曲线</span>
          </label>
        </div>
        {editMode && (
          <div className="pitch-info">
            <div>控制点数量: <span>{engine.pitchCurve.length}</span></div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>
              点击波形添加控制点，拖拽调整，双击删除
            </div>
          </div>
        )}

        <div className="section-divider" />

        <div className="panel-title">标记点</div>
        <button className="btn" onClick={handleAddMarker} style={{ width: '100%' }}>
          {renderMarkerIcon()} 添加标记
        </button>
        <div className="marker-list">
          {markers.map((m) => (
            <div key={m.id} className="marker-item" onClick={(e) => handleEditMarker(m, e)}>
              <div className="marker-diamond" />
              <span className="marker-time">{formatTime(m.time)}</span>
              <span className="marker-note">{m.note || '无备注'}</span>
              <button
                className="marker-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteMarker(m.id);
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className="section-divider" />

        <button className="btn btn-export" onClick={handleExport} style={{ width: '100%' }} disabled={!engine.audioBuffer}>
          导出 WAV
        </button>
        <button className="btn" onClick={handleShare} style={{ width: '100%' }} disabled={!engine.audioBuffer}>
          复制分享链接
        </button>
      </div>

      <div
        className={`resize-handle ${isDragResizing ? 'active' : ''}`}
        onMouseDown={handleResizeStart}
      />

      <div className="right-area">
        <div className="mobile-nav">
          <button className="btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            ☰
          </button>
          <span style={{ fontSize: 14, fontWeight: 600 }}>声波纹工具</span>
          <div style={{ flex: 1 }} />
          <button className="btn btn-icon" onClick={handlePlayPause}>
            {engine.isPlaying ? renderPauseIcon() : renderPlayIcon()}
          </button>
        </div>

        <div className="center-area">
          {engine.audioBuffer ? (
            <>
              <AudioVisualizer
                timeData={engine.timeData}
                freqData={engine.freqData}
                pitchCurve={engine.pitchCurve}
                onPitchCurveChange={engine.setPitchCurve}
                markers={markers}
                onMarkersChange={setMarkers}
                currentTime={engine.currentTime}
                duration={engine.duration}
                isPlaying={engine.isPlaying}
                onSeek={engine.seek}
                flashMarkerId={flashMarkerId}
                editMode={editMode}
              />
              {flashMarkerId && <div className="flash-overlay" />}
            </>
          ) : (
            <div className="no-audio-hint">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48" style={{ margin: '0 auto', display: 'block', opacity: 0.3 }}>
                <path d="M9 18V5l12-2v13" />
                <circle cx="6" cy="18" r="3" />
                <circle cx="18" cy="16" r="3" />
              </svg>
              <p>请导入或录制音频以开始</p>
            </div>
          )}
        </div>

        <div className="bottom-bar">
          <div className="btn-group">
            <button className="btn btn-icon" onClick={handlePlayPause} disabled={!engine.audioBuffer}>
              {engine.isPlaying ? renderPauseIcon() : renderPlayIcon()}
            </button>
            <button className="btn btn-icon" onClick={engine.stopPlayback} disabled={!engine.audioBuffer}>
              {renderStopIcon()}
            </button>
            <button
              className={`btn btn-icon ${engine.isLooping ? 'loop-active' : ''}`}
              onClick={engine.toggleLoop}
              disabled={!engine.audioBuffer}
            >
              {renderLoopIcon()}
            </button>
          </div>

          <div className="progress-bar-container" onClick={handleProgressClick}>
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            {markers.map((m) => {
              if (engine.duration <= 0) return null;
              const pos = (m.time / engine.duration) * 100;
              return (
                <div
                  key={m.id}
                  style={{
                    position: 'absolute',
                    left: `${pos}%`,
                    top: -4,
                    width: 8,
                    height: 14,
                    transform: 'translateX(-50%) rotate(45deg)',
                    background: '#9b59b6',
                    borderRadius: 1,
                    pointerEvents: 'none',
                  }}
                />
              );
            })}
          </div>

          <div className="time-display">
            {formatTime(engine.currentTime)} / {formatTime(engine.duration)}
          </div>

          <button className="btn" onClick={handleAddMarker} disabled={!engine.audioBuffer}>
            {renderMarkerIcon()} 标记
          </button>
        </div>
      </div>

      {editingMarkerId && (
        <div
          className="marker-edit-popup"
          style={{
            left: Math.min(markerEditPos.x, window.innerWidth - 220),
            top: Math.min(markerEditPos.y, window.innerHeight - 80),
          }}
        >
          <input
            type="text"
            value={markerNoteInput}
            onChange={(e) => setMarkerNoteInput(e.target.value)}
            placeholder="输入备注..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveMarkerNote();
              if (e.key === 'Escape') {
                setEditingMarkerId(null);
                setMarkerNoteInput('');
              }
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn" onClick={handleSaveMarkerNote} style={{ flex: 1, fontSize: 12 }}>
              保存
            </button>
            <button
              className="btn btn-danger"
              onClick={() => {
                setEditingMarkerId(null);
                setMarkerNoteInput('');
              }}
              style={{ flex: 1, fontSize: 12 }}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}

      {isDragOver && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 210, 255, 0.08)',
            border: '3px dashed rgba(0, 210, 255, 0.5)',
            zIndex: 999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 20, color: 'var(--accent-cyan)' }}>松开以导入音频</span>
        </div>
      )}
    </div>
  );
}
