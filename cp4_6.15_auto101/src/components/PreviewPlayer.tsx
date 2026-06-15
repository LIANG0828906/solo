import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize2, SkipBack, SkipForward } from 'lucide-react';
import { SubtitleEntry, Annotation, AnnotationTool, COLOR_MAP } from '../types';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentSubtitle = getCurrentSubtitle(currentTime);

  const handlePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    
    if (showAnnotations) {
      renderAnnotationsAtTime(time);
    }
  }, [showAnnotations, renderAnnotationsAtTime]);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      
      if (canvasRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = rect.height;
        setCanvasRef(canvasRef.current);
      }
    }
  }, [setCanvasRef]);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!videoRef.current) return;
    const time = parseFloat(e.target.value);
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
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
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const skipBackward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 5);
    }
  }, []);

  const skipForward = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(videoDuration, videoRef.current.currentTime + 5);
    }
  }, [videoDuration]);

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
          toggleFullscreen();
          break;
        case 'm':
          toggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePlayPause, skipBackward, skipForward, toggleFullscreen, toggleMute]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (videoRef.current) {
        renderAnnotationsAtTime(videoRef.current.currentTime);
      }
    };

    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(container);

    return () => resizeObserver.disconnect();
  }, [renderAnnotationsAtTime]);

  const progressPercent = videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0;

  if (!videoUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/20 rounded-2xl border border-white/10">
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
      className="relative w-full h-full bg-black rounded-2xl overflow-hidden animate-fadeIn"
      style={{ animationDelay: '200ms' }}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="absolute inset-0 w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
        onClick={handlePlayPause}
      />

      {showAnnotations && annotations.length > 0 && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none"
        />
      )}

      {showSubtitles && currentSubtitle && (
        <div className="absolute bottom-20 left-0 right-0 flex justify-center px-4 pointer-events-none">
          <div className="bg-black/80 backdrop-blur-sm px-4 py-2 rounded-lg max-w-2xl">
            <p className="text-white text-center text-[15px] leading-relaxed">
              {currentSubtitle.text}
            </p>
          </div>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
        <div className="relative h-1.5 bg-white/20 rounded-full mb-3 cursor-pointer group">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-neon-blue to-electric-purple transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />
          <input
            type="range"
            min="0"
            max={videoDuration || duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progressPercent}% - 6px)` }}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={skipBackward}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="后退5秒"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={handlePlayPause}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-neon-blue to-electric-purple flex items-center justify-center text-white hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <button
              onClick={skipForward}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="前进5秒"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 ml-2">
              <button
                onClick={toggleMute}
                className="p-2 text-gray-400 hover:text-white transition-colors"
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
                  [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:cursor-pointer"
              />
            </div>

            <span className="text-gray-400 text-[12px] font-mono ml-3">
              {formatTime(currentTime)} / {formatTime(videoDuration || duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-2 text-gray-400 hover:text-white transition-colors"
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
          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors"
        >
          <div className="w-16 h-16 rounded-full bg-gradient-to-r from-neon-blue to-electric-purple flex items-center justify-center shadow-lg shadow-electric-purple/30 hover:scale-110 transition-transform">
            <Play className="w-6 h-6 text-white ml-1" />
          </div>
        </button>
      )}
    </div>
  );
};
