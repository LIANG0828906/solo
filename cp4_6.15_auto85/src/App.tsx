import React, { useState, useRef, useCallback, useEffect } from 'react';
import Toolbar from './components/Toolbar';
import RegionSelector from './components/RegionSelector';
import CanvasOverlay from './components/CanvasOverlay';
import Recorder from './components/Recorder';
import PreviewPlayer from './components/PreviewPlayer';
import { useLocalStorage } from './hooks/useLocalStorage';
import { exportSRT } from './utils/AnnotationEngine';
import type { Annotation, ToolType, Region } from './types';
import { FPS_OPTIONS } from './types';

type AppMode = 'idle' | 'selecting' | 'recording' | 'preview';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('idle');
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [recordingTime, setRecordingTime] = useState(0);
  const [fps, setFps] = useState<15 | 30 | 60>(30);
  const [captureType, setCaptureType] = useState<'screen' | 'window' | 'region'>('screen');

  const [currentTool, setCurrentTool] = useState<ToolType>('brush');
  const [color, setColor] = useState('#e94560');
  const [brushSize, setBrushSize] = useState<3 | 6 | 10>(6);
  const [highlightOpacity, setHighlightOpacity] = useState(0.4);
  const [showColorPanel, setShowColorPanel] = useState(false);

  const [previewZoom, setPreviewZoom] = useLocalStorage<number>('previewZoom', 100);
  const [previewPosition, setPreviewPosition] = useLocalStorage<{ x: number; y: number }>('previewPosition', { x: 0, y: 0 });
  const [isDraggingPreview, setIsDraggingPreview] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const canvasAreaRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const recordingStartTimeRef = useRef<number>(0);
  const isRecordingRef = useRef(false);

  const CANVAS_WIDTH = 1280;
  const CANVAS_HEIGHT = 720;

  const handlePreviewDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingPreview(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: previewPosition.x,
      posY: previewPosition.y,
    };
  }, [previewPosition]);

  const handlePreviewDragMove = useCallback((e: MouseEvent) => {
    if (!isDraggingPreview) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPreviewPosition({
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy,
    });
  }, [isDraggingPreview, setPreviewPosition]);

  const handlePreviewDragEnd = useCallback(() => {
    setIsDraggingPreview(false);
  }, []);

  useEffect(() => {
    if (isDraggingPreview) {
      window.addEventListener('mousemove', handlePreviewDragMove);
      window.addEventListener('mouseup', handlePreviewDragEnd);
      return () => {
        window.removeEventListener('mousemove', handlePreviewDragMove);
        window.removeEventListener('mouseup', handlePreviewDragEnd);
      };
    }
  }, [isDraggingPreview, handlePreviewDragMove, handlePreviewDragEnd]);

  const getCurrentTime = useCallback(() => {
    if (!isRecordingRef.current) return 0;
    return performance.now() - recordingStartTimeRef.current;
  }, []);

  const handleAnnotationAdd = useCallback((annotation: Annotation) => {
    setAnnotations((prev) => [...prev, annotation]);
  }, []);

  const handleRecordingStart = useCallback(() => {
    recordingStartTimeRef.current = performance.now();
    isRecordingRef.current = true;
    setRecordingTime(0);
    setMode('recording');
  }, []);

  const handleRecordingStop = useCallback((blob: Blob) => {
    isRecordingRef.current = false;
    setVideoBlob(blob);
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
    setMode('preview');
  }, [mediaStream]);

  const handleRecordingTimeUpdate = useCallback((timeMs: number) => {
    setRecordingTime(timeMs);
  }, []);

  const startCapture = async () => {
    try {
      let constraints: DisplayMediaStreamOptions = {
        video: {
          frameRate: { ideal: fps },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints);

      stream.getVideoTracks()[0].addEventListener('ended', () => {
        if (isRecordingRef.current) {
          const stopFn = (window as unknown as { __stopRecording?: () => void }).__stopRecording;
          if (stopFn) stopFn();
        } else {
          stream.getTracks().forEach((t) => t.stop());
          setMediaStream(null);
          setMode('idle');
        }
      });

      setMediaStream(stream);

      if (captureType === 'region') {
        setMode('selecting');
      } else {
        setTimeout(() => {
          const startFn = (window as unknown as { __startRecording?: () => void }).__startRecording;
          if (startFn) startFn();
        }, 300);
      }
    } catch (err) {
      console.error('Failed to get display media:', err);
    }
  };

  const handleRegionSelect = useCallback((_region: Region | null) => {
    setTimeout(() => {
      const startFn = (window as unknown as { __startRecording?: () => void }).__startRecording;
      if (startFn) startFn();
    }, 300);
  }, []);

  const handleRegionCancel = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      setMediaStream(null);
    }
    setMode('idle');
  }, [mediaStream]);

  const stopRecording = () => {
    const stopFn = (window as unknown as { __stopRecording?: () => void }).__stopRecording;
    if (stopFn) stopFn();
  };

  const resetApp = () => {
    setMode('idle');
    setVideoBlob(null);
    setAnnotations([]);
    setRecordingTime(0);
  };

  const handleExportSRT = () => {
    if (annotations.length === 0) return;
    const dateStr = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    exportSRT(annotations, `annotations-${dateStr}.srt`);
  };

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      videoRef.current.srcObject = mediaStream;
      videoRef.current.play().catch(console.error);
    }
  }, [mediaStream]);

  const renderMainContent = () => {
    if (mode === 'preview') {
      return (
        <div className="canvas-area" style={{ flexDirection: 'column', padding: 24, gap: 20, overflow: 'auto' }}>
          <PreviewPlayer
            videoBlob={videoBlob}
            annotations={annotations}
            onSeek={() => {}}
          />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={handleExportSRT} disabled={annotations.length === 0}>
              📝 导出字幕 (SRT)
            </button>
            <button className="btn" onClick={resetApp}>
              🔄 重新录制
            </button>
          </div>
          {annotations.length > 0 && (
            <div style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
              共 {annotations.length} 条注释 · 点击时间轴上的圆点可快速跳转
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="canvas-area" ref={canvasAreaRef}>
        {(mode === 'idle') && (
          <div className="placeholder-hint">
            <div className="placeholder-icon">🎥</div>
            <div className="placeholder-text">
              <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                开始录制课程片段
              </div>
              选择下方的捕获方式和帧率，然后点击"开始录制"按钮
              <br />
              录制过程中可使用画笔、高亮和文本工具进行实时注释
            </div>
          </div>
        )}

        {(mode === 'recording' || mode === 'selecting') && mediaStream && (
          <div
            className="canvas-container"
            style={{
              width: '100%',
              height: '100%',
            }}
          >
            <video
              ref={videoRef}
              className="video-element"
              style={{
                width: CANVAS_WIDTH,
                height: CANVAS_HEIGHT,
                objectFit: 'contain',
              }}
              muted
              playsInline
            />
            {mode === 'recording' && (
              <CanvasOverlay
                width={CANVAS_WIDTH}
                height={CANVAS_HEIGHT}
                isRecording={mode === 'recording'}
                currentTool={currentTool}
                color={color}
                brushSize={brushSize}
                highlightOpacity={highlightOpacity}
                getCurrentTime={getCurrentTime}
                onAnnotationAdd={handleAnnotationAdd}
                annotations={annotations}
              />
            )}
            {mode === 'selecting' && (
              <RegionSelector
                onSelect={handleRegionSelect}
                onCancel={handleRegionCancel}
                containerRef={canvasAreaRef as React.RefObject<HTMLDivElement>}
              />
            )}
          </div>
        )}

        {(mode === 'recording' || mode === 'selecting') && (
          <>
            <Toolbar
              currentTool={currentTool}
              onToolChange={setCurrentTool}
              color={color}
              onColorChange={setColor}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              highlightOpacity={highlightOpacity}
              onHighlightOpacityChange={setHighlightOpacity}
              showColorPanel={showColorPanel}
              onToggleColorPanel={() => setShowColorPanel(!showColorPanel)}
              disabled={mode !== 'recording'}
            />

            <div className="preview-panel" style={{ transform: `translate(${previewPosition.x}px, ${previewPosition.y}px)` }}>
              <div className={`preview-window ${isDraggingPreview ? 'dragging' : ''}`}>
                <div
                  className="preview-header"
                  onMouseDown={handlePreviewDragStart}
                  style={{ cursor: isDraggingPreview ? 'grabbing' : 'grab' }}
                >
                  <span className="preview-title">实时预览</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {mode === 'recording' ? '🔴 录制中' : '⏸️ 准备中'}
                  </span>
                </div>
                <div
                  className="preview-body"
                  style={{
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: 'center',
                  }}
                >
                  {mediaStream && (
                    <video
                      className="preview-video"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      ref={(el) => {
                        if (el && el.srcObject !== mediaStream) {
                          el.srcObject = mediaStream;
                          el.play().catch(() => {});
                        }
                      }}
                      muted
                      playsInline
                    />
                  )}
                  <canvas
                    className="preview-canvas"
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    ref={(canvasEl) => {
                      if (!canvasEl || !annotations) return;
                      const ctx = canvasEl.getContext('2d');
                      if (!ctx) return;
                      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
                      const t = getCurrentTime();
                      annotations.forEach((ann) => {
                        if (ann.timestamp > t) return;
                        if (ann.endTime > 0 && ann.endTime < t - 3000) return;
                        ctx.save();
                        switch (ann.type) {
                          case 'brush':
                            if (ann.points.length < 2) break;
                            ctx.strokeStyle = ann.color;
                            ctx.lineWidth = ann.size;
                            ctx.lineCap = 'round';
                            ctx.lineJoin = 'round';
                            ctx.beginPath();
                            ctx.moveTo(ann.points[0].x, ann.points[0].y);
                            for (let i = 1; i < ann.points.length; i++) {
                              ctx.lineTo(ann.points[i].x, ann.points[i].y);
                            }
                            ctx.stroke();
                            break;
                          case 'highlight':
                            ctx.fillStyle = ann.color;
                            ctx.globalAlpha = ann.opacity;
                            ctx.fillRect(ann.rect.x, ann.rect.y, ann.rect.width, ann.rect.height);
                            break;
                          case 'text':
                            ctx.fillStyle = ann.color;
                            ctx.font = `bold ${ann.fontSize}px Inter, sans-serif`;
                            ctx.fillText(ann.content, ann.position.x, ann.position.y);
                            break;
                        }
                        ctx.restore();
                      });
                    }}
                  />
                </div>
                <div className="preview-controls">
                  <div className="zoom-control">
                    <span className="zoom-label">缩放</span>
                    <input
                      type="range"
                      min="50"
                      max="200"
                      value={previewZoom}
                      onChange={(e) => setPreviewZoom(parseInt(e.target.value))}
                      className="zoom-slider"
                    />
                    <span className="zoom-value">{previewZoom}%</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    注释数量: {annotations.length}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-title">🎬 录屏注释工具</div>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          轻量级在线课程录制与实时注释
        </div>
      </header>

      <main className="app-main">
        <Recorder
          mediaStream={mediaStream}
          fps={fps}
          onRecordingStart={handleRecordingStart}
          onRecordingStop={handleRecordingStop}
          onRecordingTimeUpdate={handleRecordingTimeUpdate}
        />
        {renderMainContent()}
      </main>

      <div className="bottom-bar">
        {mode === 'recording' && (
          <div className="recording-indicator">
            <div className="recording-dot" />
            <span className="recording-time">{formatTime(recordingTime)}</span>
          </div>
        )}

        {mode === 'idle' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>捕获:</span>
              <select
                className="fps-select"
                value={captureType}
                onChange={(e) => setCaptureType(e.target.value as 'screen' | 'window' | 'region')}
              >
                <option value="screen">🖥️ 整个屏幕</option>
                <option value="window">🪟 应用窗口</option>
                <option value="region">⬛ 自定义区域</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>帧率:</span>
              <div style={{ display: 'flex', gap: 4 }}>
                {FPS_OPTIONS.map((f) => (
                  <button
                    key={f}
                    className={`size-btn ${fps === f ? 'active' : ''}`}
                    onClick={() => setFps(f)}
                    style={{ minWidth: 50, padding: '8px 12px' }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <button className="btn btn-primary" onClick={startCapture}>
              ● 开始录制
            </button>
          </>
        )}

        {mode === 'selecting' && (
          <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
            拖拽选择录制区域，按 Enter 确认，按 Escape 取消
          </div>
        )}

        {mode === 'recording' && (
          <button className="btn btn-danger" onClick={stopRecording}>
            ⏹ 停止录制
          </button>
        )}

        {mode === 'preview' && (
          <>
            <div style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
              ✅ 录制完成 · {annotations.length} 条注释
            </div>
            <button className="btn btn-primary" onClick={handleExportSRT} disabled={annotations.length === 0}>
              📝 导出 SRT 字幕
            </button>
            <button className="btn" onClick={resetApp}>
              🔄 新录制
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
