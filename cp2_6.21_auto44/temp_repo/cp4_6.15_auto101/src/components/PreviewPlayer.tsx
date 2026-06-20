import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { SubtitleEntry, Annotation, AnnotationTool, COLOR_MAP, PenAnnotation, HighlightAnnotation, TextAnnotation } from '../types';

interface PreviewPlayerProps {
  videoUrl: string | null;
  duration: number;
  subtitles: SubtitleEntry[];
  annotations: Annotation[];
  getCurrentSubtitle: (time: number) => SubtitleEntry | null;
  renderAnnotationsAtTime: (time: number) => void;
  setCanvasRef: (canvas: HTMLCanvasElement | null) => void;
  showSubtitles: boolean;
  showAnnotations: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function msToVTTTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const millis = Math.floor((ms % 1000) / 10);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${millis.toString().padStart(2, '0')}`;
}

function generateWebVTT(subtitles: SubtitleEntry[]): string {
  const sorted = [...subtitles].sort((a, b) => a.startTime - b.startTime);
  if (sorted.length === 0) return 'WEBVTT\n\n';
  let vtt = 'WEBVTT\n\n';
  sorted.forEach((sub, idx) => {
    const start = Math.max(0, sub.startTime + sub.offset);
    const end = Math.max(start + 1, sub.endTime + sub.offset);
    vtt += `${idx + 1}\n`;
    vtt += `${msToVTTTime(start)} --> ${msToVTTTime(end)}\n`;
    vtt += `${sub.text}\n\n`;
  });
  return vtt;
}

export const PreviewPlayer: React.FC<PreviewPlayerProps> = ({
  videoUrl,
  duration,
  subtitles,
  annotations,
  getCurrentSubtitle,
  renderAnnotationsAtTime,
  setCanvasRef,
  showSubtitles,
  showAnnotations,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const vttBlobUrlRef = useRef<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [trackEnabled, setTrackEnabled] = useState(true);

  const currentSubtitle = getCurrentSubtitle(currentTime);

  const drawAnnotationOnCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, annotation: Annotation, scaleX: number, scaleY: number) => {
      switch (annotation.tool) {
        case AnnotationTool.PEN: {
          const ann = annotation as PenAnnotation;
          if (ann.points.length < 2) return;
          ctx.strokeStyle = COLOR_MAP[ann.color];
          ctx.lineWidth = ann.lineWidth * Math.max(scaleX, scaleY);
          ctx.globalAlpha = 1;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.beginPath();
          ctx.moveTo(ann.points[0].x * scaleX, ann.points[0].y * scaleY);
          for (let i = 1; i < ann.points.length; i++) {
            ctx.lineTo(ann.points[i].x * scaleX, ann.points[i].y * scaleY);
          }
          ctx.stroke();
          break;
        }
        case AnnotationTool.HIGHLIGHT: {
          const ann = annotation as HighlightAnnotation;
          const x = Math.min(ann.startPoint.x, ann.endPoint.x) * scaleX;
          const y = Math.min(ann.startPoint.y, ann.endPoint.y) * scaleY;
          const w = Math.abs(ann.endPoint.x - ann.startPoint.x) * scaleX;
          const h = Math.abs(ann.endPoint.y - ann.startPoint.y) * scaleY;
          ctx.fillStyle = COLOR_MAP[ann.color];
          ctx.globalAlpha = 0.3;
          ctx.fillRect(x, y, w, h);
          ctx.globalAlpha = 1;
          break;
        }
        case AnnotationTool.TEXT: {
          const ann = annotation as TextAnnotation;
          ctx.fillStyle = COLOR_MAP[ann.color];
          ctx.globalAlpha = 1;
          const fontSize = Math.round(ann.fontSize * scaleY);
          ctx.font = `bold ${fontSize}px Inter, sans-serif`;
          ctx.fillText(ann.text, ann.position.x * scaleX, ann.position.y * scaleY);
          break;
        }
      }
    },
    []
  );

  const renderAnnotationOverlay = useCallback(
    (time: number) => {
      const canvas = overlayCanvasRef.current;
      const ctx = canvas?.getContext('2d');
      const container = containerRef.current;
      const video = videoRef.current;
      if (!canvas || !ctx || !container || !video) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      ctx.clearRect(0, 0, rect.width, rect.height);

      if (!showAnnotations) return;

      const videoRatio = video.videoWidth / video.videoHeight;
      const containerRatio = rect.width / rect.height;
      let drawWidth = rect.width;
      let drawHeight = rect.height;
      let offsetX = 0;
      let offsetY = 0;

      if (videoRatio > containerRatio) {
        drawHeight = rect.width / videoRatio;
        offsetY = (rect.height - drawHeight) / 2;
      } else {
        drawWidth = rect.height * videoRatio;
        offsetX = (rect.width - drawWidth) / 2;
      }

      const scaleX = drawWidth / window.innerWidth;
      const scaleY = drawHeight / window.innerHeight;

      const timeMs = time * 1000;
      const visibleAnnotations = annotations.filter((a) => a.timestamp <= timeMs);

      ctx.save();
      ctx.translate(offsetX, offsetY);

      visibleAnnotations.forEach((ann) => {
        drawAnnotationOnCanvas(ctx, ann, scaleX, scaleY);
      });

      ctx.restore();
    },
    [annotations, showAnnotations, drawAnnotationOnCanvas]
  );

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch((e) => console.warn('Play error:', e));
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    renderAnnotationOverlay(time);
  }, [renderAnnotationOverlay]);

  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    const container = containerRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (video) {
      setVideoDuration(video.duration || duration);
      video.volume = volume;
    }
    if (overlayCanvas && container) {
      const rect = container.getBoundingClientRect();
      overlayCanvas.width = rect.width;
      overlayCanvas.height = rect.height;
      setCanvasRef(null);
    }
    renderAnnotationOverlay(0);
  }, [duration, volume, setCanvasRef, renderAnnotationOverlay]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
    renderAnnotationOverlay(time);
  }, [renderAnnotationOverlay]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
    setIsMuted(vol === 0);
  }, []);

  const toggleMute = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }, [isMuted]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        videoDuration || duration,
        videoRef.current.currentTime + 5
      );
    }
  }, [videoDuration, duration]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case ' ':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBackward();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case 'm':
        case 'M':
          toggleMute();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, skipBackward, skipForward, toggleFullscreen, toggleMute]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(() => {
      renderAnnotationOverlay(videoRef.current?.currentTime || 0);
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [renderAnnotationOverlay]);

  useEffect(() => {
    if (!videoUrl) return;
    if (vttBlobUrlRef.current) {
      URL.revokeObjectURL(vttBlobUrlRef.current);
      vttBlobUrlRef.current = null;
    }
    if (subtitles.length > 0 && showSubtitles) {
      const vttContent = generateWebVTT(subtitles);
      try {
        const vttBlob = new Blob([vttContent], { type: 'text/vtt' });
        vttBlobUrlRef.current = URL.createObjectURL(vttBlob);
      } catch (e) {
        console.warn('Failed to create VTT blob:', e);
      }
    }
    return () => {
      if (vttBlobUrlRef.current) {
        URL.revokeObjectURL(vttBlobUrlRef.current);
        vttBlobUrlRef.current = null;
      }
    };
  }, [videoUrl, subtitles, showSubtitles]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    setTimeout(() => {
      const tracks = video.textTracks;
      for (let i = 0; i < tracks.length; i++) {
        tracks[i].mode = trackEnabled && showSubtitles ? 'showing' : 'hidden';
      }
    }, 100);
  }, [videoUrl, trackEnabled, showSubtitles, vttBlobUrlRef.current]);

  const progressPercent = (videoDuration || duration) > 0
    ? (currentTime / (videoDuration || duration || 1)) * 100
    : 0;

  if (!videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-2xl border border-white/10 min-h-[400px]">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-neon-blue/20 to-electric-purple/20 flex items-center justify-center">
            <Play className="w-8 h-8 text-gray-500 ml-1" />
          </div>
          <p className="text-gray-500 text-[13px]">录制视频后在此预览</p>
          <p className="text-gray-600 text-[11px] mt-1">支持字幕和注释叠加显示</p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-black rounded-2xl overflow-hidden animate-fadeIn min-h-[400px]"
      style={{ animationDelay: '200ms' }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-contain bg-black"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onClick={handlePlayPause}
        crossOrigin="anonymous"
      >
        {vttBlobUrlRef.current && (
          <track
            key={vttBlobUrlRef.current}
            kind="subtitles"
            label="中文字幕"
            srcLang="zh"
            src={vttBlobUrlRef.current}
            default
          />
        )}
      </video>

      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />

      {showSubtitles && currentSubtitle && (
        <div className="absolute left-0 right-0 flex justify-center px-4 pointer-events-none z-20"
          style={{ bottom: '88px' }}
        >
          <div className="bg-black/85 backdrop-blur-sm px-5 py-2.5 rounded-xl max-w-3xl border border-white/10 shadow-2xl">
            <p className="text-white text-center text-[15px] leading-relaxed font-medium">
              {currentSubtitle.text}
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent pt-8 pb-4 px-5 z-30">
        <div className="relative h-1.5 bg-white/20 rounded-full mb-4 cursor-pointer group hover:h-2 transition-all">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-neon-blue via-electric-purple to-purple-500 transition-all duration-100"
            style={{ width: `${progressPercent}%`, boxShadow: '0 0 10px rgba(157, 107, 255, 0.6)' }}
          />
          <input
            type="range"
            min="0"
            max={videoDuration || duration || 100}
            step="0.01"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-all"
            style={{ left: `calc(${progressPercent}% - 7px)` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <button
              onClick={skipBackward}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="后退5秒"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-blue to-electric-purple flex items-center justify-center text-white hover:scale-105 transition-all shadow-lg shadow-electric-purple/30"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={skipForward}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="前进5秒"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/20 rounded-full appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5
                  [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-md"
              />
            </div>

            <span className="text-gray-400 text-[12px] font-mono ml-3 tabular-nums">
              {formatTime(currentTime)}
              <span className="text-gray-600 mx-1">/</span>
              {formatTime(videoDuration || duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTrackEnabled(!trackEnabled)}
              className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                trackEnabled && showSubtitles
                  ? 'bg-electric-purple/30 text-electric-purple border border-electric-purple/50'
                  : 'bg-white/5 text-gray-500 border border-white/10 hover:text-gray-300'
              }`}
              title="切换字幕显示"
            >
              CC
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              title="全屏 (F)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {!isPlaying && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 flex items-center justify-center bg-black/40 hover:bg-black/30 transition-all z-40"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-neon-blue to-electric-purple flex items-center justify-center shadow-2xl shadow-electric-purple/40 hover:scale-110 transition-all duration-200">
            <Play className="w-6 h-6 text-white ml-1" fill="white" />
          </div>
        </button>
      )}
    </div>
  );
};
