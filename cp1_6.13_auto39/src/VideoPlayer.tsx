import React from 'react';
import { FilterConfig, TimeRange, ExportProgress } from './types';
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

export const VideoPlayer: React.FC<VideoPlayerProps> = () => {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const rafRef = React.useRef<number>(0);
  const lastFrameRef = React.useRef<number>(0);

  const [videoSrc, setVideoSrc] = React.useState<string>('');
  const [fileName, setFileName] = React.useState<string>('');
  const [duration, setDuration] = React.useState<number>(0);
  const [currentTime, setCurrentTime] = React.useState<number>(0);
  const [isPlaying, setIsPlaying] = React.useState<boolean>(false);
  const [isLoaded, setIsLoaded] = React.useState<boolean>(false);
  const [videoSize, setVideoSize] = React.useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [dragging, setDragging] = React.useState<'playhead' | 'start' | 'end' | null>(null);
  const [clipMode, setClipMode] = React.useState<boolean>(false);
  const [timeRange, setTimeRange] = React.useState<TimeRange>({ start: 0, end: 0 });
  const [filters, setFilters] = React.useState<FilterConfig[]>([]);
  const [transitionAlpha, setTransitionAlpha] = React.useState<number>(1);
  const transitionRef = React.useRef<{ start: number; from: number; to: number } | null>(null);
  const [lastEnabledId, setLastEnabledId] = React.useState<string | null>(null);

  const [exporting, setExporting] = React.useState<boolean>(false);
  const [exportProgress, setExportProgress] = React.useState<ExportProgress>({ stage: 'preparing', percent: 0 });
  const [exportError, setExportError] = React.useState<string>('');
  const [showExportModal, setShowExportModal] = React.useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = React.useState<boolean>(false);
  const [gifBlobUrl, setGifBlobUrl] = React.useState<string>('');
  const [gifFileSize, setGifFileSize] = React.useState<number>(0);
  const [fpsCounter, setFpsCounter] = React.useState<number>(0);
  const fpsFramesRef = React.useRef<{ count: number; time: number }>({ count: 0, time: performance.now() });

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = React.useState<{ w: number; h: number }>({ w: 800, h: 450 });

  React.useEffect(() => {
    const saved = localStorage.getItem('motionmosaic_filters');
    if (saved) {
      try {
        setFilters(JSON.parse(saved));
      } catch {
        import('./types').then((m) => setFilters(m.DEFAULT_FILTERS.map((f) => ({ ...f }))));
      }
    } else {
      import('./types').then((m) => setFilters(m.DEFAULT_FILTERS.map((f) => ({ ...f }))));
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
    setTimeRange({ start: 0, end: 0 });
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
        if (filters.length > 0) {
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

  const onToggleFilter = (id: string) => {
    setFilters((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, enabled: !f.enabled } : f));
      const toggled = next.find((f) => f.id === id);
      if (toggled?.enabled) {
        setLastEnabledId(id);
        transitionRef.current = { start: performance.now(), from: 0, to: 1 };
        setTransitionAlpha(0);
      } else if (toggled && !toggled.enabled) {
        transitionRef.current = { start: performance.now(), from: 1, to: 0 };
        setTransitionAlpha(1);
      }
      return next;
    });
  };

  const onIntensityChange = (id: string, value: number) => {
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

  const getTimelinePosition = (e: React.MouseEvent | MouseEvent, rect: DOMRect): number => {
    const x = Math.max(0, Math.min(rect.width, (e as MouseEvent).clientX - rect.left));
    return (x / rect.width) * duration;
  };

  const timelineRef = React.useRef<HTMLDivElement>(null);

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
        v.currentTime = t;
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
  const progressColor = `linear-gradient(90deg, hsl(${10 - progressPercent * 0.1}, 85%, 55%), hsl(${progressPercent * 1.2}, 80%, 50%))`;

  const clipDuration = timeRange.end - timeRange.start;

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'grid',
        gridTemplateRows: '60px 1fr 220px',
        gap: 0,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 24px',
          background: 'rgba(10, 10, 18, 0.7)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              boxShadow: '0 4px 14px rgba(0, 212, 255, 0.3)'
            }}
          >
            ▶
          </div>
          <div>
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.5px'
              }}
            >
              MotionMosaic
            </div>
            <div style={{ fontSize: '10.5px', color: 'rgba(255,255,255,0.4)', marginTop: '-2px' }}>
              动态视频滤镜工坊
            </div>
          </div>
        </div>

        <div style={{ marginLeft: '32px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              background: 'linear-gradient(135deg, #00d4ff, #a855f7)',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 212, 255, 0.28)',
              transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: '7px'
            }}
            onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
            onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            ⬆ 上传视频
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
            style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          {fileName && (
            <div
              style={{
                padding: '7px 14px',
                borderRadius: '9px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                fontSize: '12px',
                color: 'rgba(255,255,255,0.75)',
                maxWidth: '260px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}
              title={fileName}
            >
              📁 {fileName}
            </div>
          )}
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isLoaded && (
            <div
              style={{
                fontSize: '11px',
                padding: '5px 11px',
                borderRadius: '8px',
                background: 'rgba(0, 255, 140, 0.08)',
                border: '1px solid rgba(0, 255, 140, 0.2)',
                color: '#00ff8c',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span
                style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: '#00ff8c',
                  animation: 'pulse 1.5s infinite'
                }}
              />
              {fpsCounter} FPS
            </div>
          )}
        </div>
      </header>

      {/* Main area: player + filter panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 380px',
          overflow: 'hidden'
        }}
      >
        {/* Video player area */}
        <div
          ref={containerRef}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            background:
              'radial-gradient(ellipse at center, rgba(0, 212, 255, 0.03) 0%, transparent 70%)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {!videoSrc ? (
            <div
              style={{
                textAlign: 'center',
                animation: 'fadeIn 0.6s ease'
              }}
            >
              <div
                style={{
                  width: '180px',
                  height: '180px',
                  borderRadius: '28px',
                  background:
                    'linear-gradient(135deg, rgba(0, 212, 255, 0.12), rgba(168, 85, 247, 0.12))',
                  border: '2px dashed rgba(255,255,255,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 22px',
                  fontSize: '62px',
                  backdropFilter: 'blur(10px)'
                }}
              >
                🎬
              </div>
              <div style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>
                上传视频开始创作
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', maxWidth: '360px', margin: '0 auto 22px' }}>
                支持 MP4 / WebM 格式，使用 Canvas 实时滤镜处理，支持 8+ 种动态效果叠加，一键导出 GIF 动图
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                {['像素化', '色阶分离', '水彩', '颗粒', '故障', '暗角'].map((t) => (
                  <span
                    key={t}
                    style={{
                      padding: '5px 14px',
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.7)'
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div
              style={{
                position: 'relative',
                borderRadius: '18px',
                overflow: 'hidden',
                boxShadow:
                  '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)'
              }}
            >
              <canvas
                ref={canvasRef}
                style={{
                  display: 'block',
                  background: '#05050a'
                }}
                onClick={togglePlay}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '14px',
                  padding: '5px 11px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(8px)',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 500,
                  pointerEvents: 'none'
                }}
              >
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              {!isPlaying && isLoaded && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    background: 'rgba(0,0,0,0.18)'
                  }}
                >
                  <div
                    style={{
                      width: '72px',
                      height: '72px',
                      borderRadius: '50%',
                      background:
                        'linear-gradient(135deg, rgba(0, 212, 255, 0.9), rgba(168, 85, 247, 0.9))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      color: '#fff',
                      boxShadow: '0 10px 40px rgba(0, 212, 255, 0.4)',
                      animation: 'pulse 2s infinite'
                    }}
                  >
                    ▶
                  </div>
                </div>
              )}
            </div>
          )}
          <video
            ref={videoRef}
            src={videoSrc}
            style={{ display: 'none' }}
            onLoadedMetadata={onVideoLoaded}
            onTimeUpdate={onTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={onVideoEnded}
            loop={!clipMode}
            muted
            playsInline
            crossOrigin="anonymous"
          />
        </div>

        {/* Filter panel */}
        <aside
          style={{
            background: 'rgba(10, 10, 18, 0.55)',
            backdropFilter: 'blur(20px)',
            borderLeft: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden'
          }}
        >
          <FilterPanel
            filters={filters}
            onToggle={onToggleFilter as any}
            onIntensityChange={onIntensityChange as any}
          />
        </aside>
      </div>

      {/* Timeline & controls */}
      <div
        style={{
          background: 'rgba(10, 10, 18, 0.7)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '18px 28px 24px'
        }}
      >
        {/* Playback controls */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            marginBottom: '16px'
          }}
        >
          <button
            onClick={togglePlay}
            disabled={!isLoaded}
            style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              border: 'none',
              background: isLoaded
                ? 'linear-gradient(135deg, #00d4ff, #a855f7)'
                : 'rgba(255,255,255,