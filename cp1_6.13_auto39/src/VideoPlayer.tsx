import React from 'react';
import { FilterConfig, FilterType, TimeRange, ExportProgress, DEFAULT_FILTERS } from './types';
import { applyFilters } from './filterProcessor';
import { FilterPanel } from './FilterPanel';
import { exportGif, validateTimeRange } from './GifExporter';

interface VideoPlayerProps {}

const formatTime = (sec: number): string => {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
};

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const btnSpring = {
  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, background 0.2s ease'
};

export const VideoPlayer: React.FC<VideoPlayerProps> = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const rafRef = React.useRef<number>(0);
  const lastFrameRef = React.useRef<number>(0);
  const timelineRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const [videoSrc, setVideoSrc] = React.useState<string>('');
  const [fileName, setFileName] = React.useState<string>('');
  const [duration, setDuration] = React.useState<number>(0);
  const [currentTime, setCurrentTime] = React.useState<number>(0);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [isLoaded, setIsLoaded] = React.useState<boolean>(false);
  const [videoSize, setVideoSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = React.useState<{ w: number; h: number }>({ w: 800, h: 450 });

  const [dragging, setDragging] = React.useState<'playhead' | 'start' | 'end' | null>(null);
  const [clipMode, setClipMode] = React.useState<boolean>(false);
  const [timeRange, setTimeRange] = React.useState<TimeRange>({ start: 0, end: 5 });

  const [filters, setFilters] = React.useState<FilterConfig[]>(() => DEFAULT_FILTERS.map(f => ({ ...f })));
  const [transitionAlpha, setTransitionAlpha] = React.useState<number>(1);
  const transitionRef = React.useRef<{ start: number; from: number; to: number } | null>(null);

  const [exporting, setExporting] = React.useState<boolean>(false);
  const [exportProgress, setExportProgress] = React.useState<ExportProgress>({ stage: 'preparing', percent: 0 });
  const [exportError, setExportError] = React.useState<string>('');
  const [showExportModal, setShowExportModal] = React.useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState<boolean>(false);
  const [gifBlobUrl, setGifBlobUrl] = React.useState<string>('');
  const [gifFileSize, setGifFileSize] = React.useState<number>(0);
  const [fpsCounter, setFpsCounter] = React.useState<number>(0);
  const fpsFramesRef = React.useRef<{ count: number; time: number }>({ count: 0, time: performance.now() });

  React.useEffect(() => {
    const saved = localStorage.getItem('motionmosaic_filters');
    if (saved) {
      try { setFilters(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  React.useEffect(() => {
    if (filters.length > 0) {
      localStorage.setItem('motionmosaic_filters', JSON.stringify(filters));
    }
  }, [filters]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setContainerSize({ w: width, h: height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  React.useEffect(() => {
    if (!videoSize.w || !containerSize.w) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const aspect = videoSize.h / videoSize.w;
    let targetW = containerSize.w - 40;
    let targetH = targetW * aspect;
    if (targetH > containerSize.h - 40) {
      targetH = containerSize.h - 40;
      targetW = targetH / aspect;
    }
    canvas.style.width = `${targetW}px`;
    canvas.style.height = `${targetH}px`;
    canvas.width = Math.floor(targetW);
    canvas.height = Math.floor(targetH);
  }, [videoSize, containerSize]);

  const handleFile = (file: File) => {
    if (!file) return;
    const validTypes = ['video/mp4', 'video/webm', 'video/quicktime'];
    if (!validTypes.includes(file.type) && !/\.(mp4|webm|mov)$/i.test(file.name)) {
      alert('请上传 MP4 或 WebM 格式的视频文件');
      return;
    }
    if (videoSrc) URL.revokeObjectURL(videoSrc);
    const url = URL.createObjectURL(file);
    setVideoSrc(url);
    setFileName(file.name);
    setIsLoaded(false);
    setClipMode(false);
    setTimeRange({ start: 0, end: 5 });
  };

  const onVideoLoaded = () => {
    const v = videoRef.current!;
    const d = v.duration;
    setDuration(d);
    setVideoSize({ w: v.videoWidth, h: v.videoHeight });
    setTimeRange({ start: 0, end: Math.min(d, 5) });
    setIsLoaded(true);
    v.currentTime = 0.001;
  };

  const renderLoop = React.useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      rafRef.current = requestAnimationFrame(renderLoop);
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafRef.current = requestAnimationFrame(renderLoop);
      return;
    }

    const now = performance.now();
    const interval = 1000 / 30;
    if (now - lastFrameRef.current < interval) {
      rafRef.current = requestAnimationFrame(renderLoop);
      return;
    }
    lastFrameRef.current = now;

    fpsFramesRef.current.count++;
    if (now - fpsFramesRef.current.time > 1000) {
      setFpsCounter(fpsFramesRef.current.count);
      fpsFramesRef.current = { count: 0, time: now };
    }

    if (transitionRef.current) {
      const t = Math.min(1, (now - transitionRef.current.start) / 500);
      const eased = 1 - Math.pow(1 - t, 3);
      setTransitionAlpha(transitionRef.current.from + (transitionRef.current.to - transitionRef.current.from) * eased);
      if (t >= 1) transitionRef.current = null;
    }

    const w = canvas.width, h = canvas.height;
    if (w > 0 && h > 0) {
      ctx.clearRect(0, 0, w, h);
      if (video.readyState >= 2) {
        ctx.drawImage(video, 0, 0, w, h);
        if (filters.some(f => f.enabled)) {
          applyFilters(ctx, w, h, filters, transitionAlpha);
        }
      } else {
        ctx.fillStyle = '#0a0a12';
        ctx.fillRect(0, 0, w, h);
      }
    }
    rafRef.current = requestAnimationFrame(renderLoop);
  }, [filters, transitionAlpha]);

  React.useEffect(() => {
    rafRef.current = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [renderLoop]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v || !isLoaded) return;
    if (v.paused) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  };

  const onToggleFilter = (id: FilterType) => {
    setFilters((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f));
      const toggled = next.find((f) => f.id === id);
      if (toggled?.enabled) {
        transitionRef.current = { start: performance.now(), from: 0, to: 1 };
        setTransitionAlpha(0);
      } else if (toggled && !toggled.enabled) {
        transitionRef.current = { start: performance.now(), from: 1, to: 0 };
        setTransitionAlpha(1);
      }
      return next;
    });
  };

  const onIntensityChange = (id: FilterType, value: number) => {
    setFilters((prev) => prev.map((f) => (f.id === id ? { ...f, intensity: value } : f)));
  };

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (clipMode && v.currentTime >= timeRange.end) {
      v.currentTime = timeRange.start;
    }
  };

  const onVideoEnded = () => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  };

  const getTimelinePosition = (e: MouseEvent, rect: DOMRect): number => {
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    return (x / rect.width) * duration;
  };

  const onTimelineMouseDown = (e: React.MouseEvent, target: 'playhead' | 'start' | 'end') => {
    if (!isLoaded) return;
    setDragging(target);
    e.preventDefault();
  };

  React.useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const el = timelineRef.current;
      if (!el || !duration) return;
      const rect = el.getBoundingClientRect();
      const t = getTimelinePosition(e, rect);
      const v = videoRef.current;
      if (dragging === 'playhead' && v) {
        v.currentTime = Math.max(0, Math.min(t, duration));
      } else if (dragging === 'start') {
        setTimeRange((prev) => {
          const maxStart = Math.max(0, prev.end - 3);
          const newStart = Math.min(t, maxStart);
          return validateTimeRange({ ...prev, start: newStart }, duration);
        });
      } else if (dragging === 'end') {
        setTimeRange((prev) => {
          const minEnd = Math.min(duration, prev.start + 3);
          const newEnd = Math.max(t, minEnd);
          return validateTimeRange({ ...prev, end: newEnd }, duration);
        });
      }
    };
    const onUp = () => setDragging(null);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging, duration]);

  const handleExport = async () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c || !isLoaded) return;
    setExporting(true);
    setExportError('');
    setShowExportModal(true);
    setExportProgress({ stage: 'preparing', percent: 0 });

    const applyFn = (ctx: CanvasRenderingContext2D, w: number, h: number, fs: FilterConfig[]) => {
      applyFilters(ctx, w, h, fs, 1);
    };

    try {
      await exportGif(v, c, filters, timeRange, applyFn, {
        onProgress: (p) => setExportProgress(p),
        onComplete: (blob) => {
          if (gifBlobUrl) URL.revokeObjectURL(gifBlobUrl);
          const url = URL.createObjectURL(blob);
          setGifBlobUrl(url);
          setGifFileSize(blob.size);
          setExporting(false);
          setShowExportModal(false);
          setShowSuccessModal(true);
        },
        onError: (err) => {
          setExportError(err.message);
          setExporting(false);
          setTimeout(() => setShowExportModal(false), 1500);
        }
      });
    } catch (e) {
      setExportError(e instanceof Error ? e.message : '导出失败');
      setExporting(false);
    }
  };

  const downloadGif = () => {
    if (!gifBlobUrl) return;
    const a = document.createElement('a');
    a.href = gifBlobUrl;
    const baseName = fileName.replace(/\.[^.]+$/, '') || 'motionmosaic';
    a.download = `${baseName}_filtered.gif`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const progressPercent = exportProgress.percent;
  const progressColor = `linear-gradient(90deg, hsl(0, 85%, 55%), hsl(${Math.floor(progressPercent * 1.2)}, 80%, 50%))`;

  const clipDuration = timeRange.end - timeRange.start;
  const startPct = duration > 0 ? (timeRange.start / duration) * 100 : 0;
  const endPct = duration > 0 ? (timeRange.end / duration) * 100 : 100;
  const playheadPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  const stageLabel: Record<string, string> = {
    preparing: '准备中...',
    capturing: '逐帧截取...',
    encoding: 'GIF 编码中...',
    done: '完成!'
  };

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'grid', gridTemplateRows: '60px 1fr 220px', gap: 0, overflow: 'hidden' }}>

      {/* ========== HEADER ========== */}
      <header style={{
        display: 'flex', alignItems: 'center', padding: '0 24px',
        background: 'rgba(10, 10, 18, 0.7)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px', boxShadow: '0 4px 14px rgba(0, 212, 255, 0.3)'
          }}>▶</div>
          <div>
            <div style={{
              fontSize: '18px', fontWeight: 700,
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px'
            }}>MotionMosaic</div>
            <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', marginTop: '-2px' }}>
              动态视频滤镜工坊
            </div>
          </div>
        </div>

        <div style={{ marginLeft: '32px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 18px', borderRadius: '10px', border: 'none',
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              color: '#fff', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 212, 255, 0.28)',
              display: 'flex', alignItems: 'center', gap: '7px',
              ...btnSpring
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >⬆ 上传视频</button>
          <input
            ref={fileInputRef} type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {fileName && (
            <div style={{
              padding: '7px 14px', borderRadius: '9px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              fontSize: '12px', color: 'rgba(255,255,255,0.75)',
              maxWidth: '260px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
            }} title={fileName}>📁 {fileName}</div>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isLoaded && (
            <div style={{
              fontSize: '11px', padding: '5px 11px', borderRadius: '8px',
              background: 'rgba(0, 255, 140, 0.08)', border: '1px solid rgba(0, 255, 140, 0.2)',
              color: '#00ff8c', fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: '5px'
            }}>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%',
                background: '#00ff8c', display: 'inline-block',
                animation: 'pulse 1.5s infinite'
              }} />
              {fpsCounter} FPS
            </div>
          )}
        </div>
      </header>

      {/* ========== MAIN AREA ========== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', overflow: 'hidden' }}>

        {/* Video player area */}
        <div ref={containerRef} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
          background: 'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.03) 0%, transparent 70%)',
          position: 'relative', overflow: 'hidden'
        }}>
          {!videoSrc ? (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.6s ease' }}>
              <div style={{
                width: '180px', height: '180px', borderRadius: '28px',
                background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.12), rgba(168, 85, 247, 0.12))',
                border: '2px dashed rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 22px', fontSize: '62px', backdropFilter: 'blur(10px)'
              }}>🎬</div>
              <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                上传视频开始创作
              </div>
              <div style={{
                fontSize: '13px', color: 'rgba(255,255,255,0.5)',
                maxWidth: '360px', margin: '0 auto 22px'
              }}>
                支持 MP4 / WebM 格式，使用 Canvas 实时滤镜处理，支持 8+ 种动态效果叠加，一键导出 GIF 动图
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {['像素化', '色阶分离', '水彩', '颗粒', '故障', '暗角'].map((t) => (
                  <span key={t} style={{
                    padding: '5px 14px', borderRadius: '20px',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '12px', color: 'rgba(255,255,255,0.7)'
                  }}>{t}</span>
                ))}
              </div>
            </div>
          ) : (
            <div style={{
              position: 'relative', borderRadius: '18px', overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)'
            }}>
              <canvas ref={canvasRef} style={{ display: 'block', background: '#05050a' }} onClick={togglePlay} />
              <div style={{
                position: 'absolute', top: '14px', left: '14px',
                padding: '5px 11px', borderRadius: '8px',
                background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)',
                fontSize: '11px', color: 'rgba(255,255,255,0.85)', fontWeight: 500,
                pointerEvents: 'none'
              }}>
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              {!isPlaying && isLoaded && (
                <div style={{
                  position: 'absolute', inset: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  pointerEvents: 'none', background: 'rgba(0,0,0,0.18)'
                }}>
                  <div style={{
                    width: '72px', height: '72px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.9), rgba(168, 85, 247, 0.9))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '28px', color: '#fff',
                    boxShadow: '0 10px 40px rgba(0, 212, 255, 0.4)',
                    animation: 'pulse 2s infinite'
                  }}>▶</div>
                </div>
              )}
            </div>
          )}
          <video
            ref={videoRef} src={videoSrc} style={{ display: 'none' }}
            onLoadedMetadata={onVideoLoaded} onTimeUpdate={onTimeUpdate}
            onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)}
            onEnded={onVideoEnded} loop={!clipMode} muted playsInline
          />
        </div>

        {/* Filter panel */}
        <aside style={{
          background: 'rgba(10, 10, 18, 0.55)', backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden'
        }}>
          <FilterPanel filters={filters} onToggle={onToggleFilter} onIntensityChange={onIntensityChange} />
        </aside>
      </div>

      {/* ========== TIMELINE & CONTROLS ========== */}
      <div style={{
        background: 'rgba(10, 10, 18, 0.7)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)', padding: '18px 28px 24px'
      }}>
        {/* Playback controls row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
          <button
            onClick={togglePlay} disabled={!isLoaded}
            style={{
              width: '46px', height: '46px', borderRadius: '50%', border: 'none',
              background: isLoaded ? 'linear-gradient(135deg, #00d4ff, #a855f7)' : 'rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '20px', cursor: isLoaded ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: isLoaded ? '0 4px 16px rgba(0, 212, 255, 0.3)' : 'none',
              ...btnSpring
            }}
            onMouseDown={(e) => isLoaded && (e.currentTarget.style.transform = 'scale(0.9)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>

          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', fontVariantNumeric: 'tabular-nums', minWidth: '110px' }}>
            {formatTime(currentTime)} <span style={{ color: 'rgba(255,255,255,0.35)' }}>/ {formatTime(duration)}</span>
          </div>

          <div style={{ flex: 1 }} />

          <button
            onClick={() => setClipMode(!clipMode)}
            disabled={!isLoaded}
            style={{
              padding: '8px 16px', borderRadius: '10px',
              border: clipMode ? 'none' : '1px solid rgba(255,255,255,0.12)',
              background: clipMode
                ? 'linear-gradient(135deg, #00d4ff, #a855f7)'
                : 'rgba(255,255,255,0.08)',
              color: clipMode ? '#fff' : 'rgba(255,255,255,0.7)',
              fontSize: '12px', fontWeight: 600, cursor: isLoaded ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '6px',
              ...btnSpring
            }}
            onMouseDown={(e) => isLoaded && (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ✂ 剪辑
          </button>

          {clipMode && (
            <button
              onClick={handleExport}
              disabled={exporting || !isLoaded}
              style={{
                padding: '8px 16px', borderRadius: '10px', border: 'none',
                background: exporting ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg, #10b981, #059669)',
                color: '#fff', fontSize: '12px', fontWeight: 600,
                cursor: exporting ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                ...btnSpring
              }}
              onMouseDown={(e) => !exporting && (e.currentTarget.style.transform = 'scale(0.95)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              {exporting ? '⏳ 导出中...' : '📥 导出GIF'}
            </button>
          )}

          {clipMode && (
            <div style={{
              fontSize: '11px', padding: '5px 12px', borderRadius: '8px',
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.6)', fontVariantNumeric: 'tabular-nums'
            }}>
              片段 {clipDuration.toFixed(1)}s
              <span style={{ color: clipDuration < 3 || clipDuration > 15 ? '#ef4444' : '#10b981', marginLeft: '6px' }}>
                (3-15s)
              </span>
            </div>
          )}
        </div>

        {/* Timeline bar */}
        <div
          ref={timelineRef}
          style={{
            position: 'relative', height: '28px', borderRadius: '8px',
            background: 'rgba(255,255,255,0.06)', cursor: 'pointer', overflow: 'visible'
          }}
          onClick={(e) => {
            if (!isLoaded || dragging) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const t = getTimelinePosition(e.nativeEvent as unknown as MouseEvent, rect);
            const v = videoRef.current;
            if (v) v.currentTime = Math.max(0, Math.min(t, duration));
          }}
        >
          {/* Clip region highlight */}
          {clipMode && isLoaded && (
            <div style={{
              position: 'absolute', top: 0, bottom: 0,
              left: `${startPct}%`, width: `${endPct - startPct}%`,
              background: 'linear-gradient(180deg, rgba(0, 212, 255, 0.15), rgba(168, 85, 247, 0.15))',
              borderLeft: '2px solid #00d4ff', borderRight: '2px solid #a855f7',
              borderRadius: '4px', zIndex: 1
            }} />
          )}

          {/* Progress fill */}
          {isLoaded && (
            <div style={{
              position: 'absolute', top: 0, left: 0, bottom: 0,
              width: `${playheadPct}%`,
              background: 'linear-gradient(90deg, rgba(0, 212, 255, 0.25), rgba(168, 85, 247, 0.25))',
              borderRadius: '8px', pointerEvents: 'none'
            }} />
          )}

          {/* Playhead handle */}
          {isLoaded && (
            <div
              onMouseDown={(e) => onTimelineMouseDown(e, 'playhead')}
              style={{
                position: 'absolute', top: '-4px', bottom: '-4px',
                left: `${playheadPct}%`, width: '4px',
                background: '#fff', borderRadius: '2px',
                transform: 'translateX(-50%)', cursor: 'grab', zIndex: 5,
                boxShadow: '0 0 8px rgba(255,255,255,0.4)'
              }}
            />
          )}

          {/* Clip start handle */}
          {clipMode && isLoaded && (
            <div
              onMouseDown={(e) => onTimelineMouseDown(e, 'start')}
              style={{
                position: 'absolute', top: '-6px', bottom: '-6px',
                left: `${startPct}%`, width: '14px',
                transform: 'translateX(-50%)', cursor: 'ew-resize', zIndex: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <div style={{
                width: '10px', height: '28px', borderRadius: '5px',
                background: '#00d4ff', boxShadow: '0 2px 8px rgba(0, 212, 255, 0.5)',
                ...btnSpring
              }} />
            </div>
          )}

          {/* Clip end handle */}
          {clipMode && isLoaded && (
            <div
              onMouseDown={(e) => onTimelineMouseDown(e, 'end')}
              style={{
                position: 'absolute', top: '-6px', bottom: '-6px',
                left: `${endPct}%`, width: '14px',
                transform: 'translateX(-50%)', cursor: 'ew-resize', zIndex: 6,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
            >
              <div style={{
                width: '10px', height: '28px', borderRadius: '5px',
                background: '#a855f7', boxShadow: '0 2px 8px rgba(168, 85, 247, 0.5)',
                ...btnSpring
              }} />
            </div>
          )}
        </div>

        {/* Time labels under timeline */}
        {clipMode && isLoaded && (
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: '6px', fontSize: '10px', color: 'rgba(255,255,255,0.4)',
            fontVariantNumeric: 'tabular-nums', padding: '0 2px'
          }}>
            <span style={{ color: '#00d4ff' }}>起 {formatTime(timeRange.start)}</span>
            <span>总 {formatTime(duration)}</span>
            <span style={{ color: '#a855f7' }}>止 {formatTime(timeRange.end)}</span>
          </div>
        )}
      </div>

      {/* ========== EXPORT PROGRESS MODAL ========== */}
      {showExportModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '420px', padding: '32px', borderRadius: '20px',
            background: 'rgba(20, 20, 30, 0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.3s ease'
          }}>
            <div style={{
              fontSize: '18px', fontWeight: 700, marginBottom: '8px',
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              导出 GIF
            </div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
              {stageLabel[exportProgress.stage] || '处理中...'}
            </div>

            {/* Progress bar */}
            <div style={{
              height: '12px', borderRadius: '6px',
              background: 'rgba(255,255,255,0.08)', overflow: 'hidden',
              marginBottom: '12px'
            }}>
              <div style={{
                height: '100%', borderRadius: '6px',
                background: progressColor,
                width: `${progressPercent}%`,
                transition: 'width 0.3s ease, background 0.3s ease'
              }} />
            </div>

            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '12px', color: 'rgba(255,255,255,0.5)'
            }}>
              <span>{progressPercent.toFixed(0)}%</span>
              <span>{stageLabel[exportProgress.stage]}</span>
            </div>

            {exportError && (
              <div style={{
                marginTop: '16px', padding: '10px 14px', borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444', fontSize: '12px'
              }}>
                {exportError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========== SUCCESS MODAL ========== */}
      {showSuccessModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)'
        }}>
          <div style={{
            width: '460px', padding: '32px', borderRadius: '20px',
            background: 'rgba(20, 20, 30, 0.95)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            animation: 'fadeIn 0.3s ease',
            textAlign: 'center'
          }}>
            <div style={{
              width: '64px', height: '64px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '28px', margin: '0 auto 18px',
              boxShadow: '0 8px 30px rgba(16, 185, 129, 0.35)'
            }}>✓</div>

            <div style={{
              fontSize: '20px', fontWeight: 700, marginBottom: '6px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              导出完成!
            </div>

            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '20px' }}>
              GIF 大小: {formatSize(gifFileSize)} · 320px 宽 · {clipDuration.toFixed(1)}s
            </div>

            {/* GIF Preview */}
            {gifBlobUrl && (
              <div style={{
                marginBottom: '20px', borderRadius: '12px', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'inline-block',
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)'
              }}>
                <img
                  src={gifBlobUrl}
                  alt="GIF preview"
                  style={{ maxWidth: '100%', maxHeight: '200px', display: 'block' }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={downloadGif}
                style={{
                  padding: '10px 24px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#fff', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  ...btnSpring
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                💾 下载 GIF
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                style={{
                  padding: '10px 24px', borderRadius: '12px',
                  border: '1px solid rgba(255,255,255,0.15)',
                  background: 'rgba(255,255,255,0.06)',
                  color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 600,
                  cursor: 'pointer', ...btnSpring
                }}
                onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
                onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== GLOBAL ANIMATIONS ========== */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
