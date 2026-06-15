import React, { useRef, useState, useEffect, useCallback } from 'react';
import type { Annotation } from '../types';

interface PreviewPlayerProps {
  videoBlob: Blob | null;
  annotations: Annotation[];
  onSeek: (timeMs: number) => void;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(millis).padStart(2, '0')}`;
}

const PreviewPlayer: React.FC<PreviewPlayerProps> = ({ videoBlob, annotations, onSeek }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [rippleId, setRippleId] = useState<string | null>(null);
  const videoUrlRef = useRef<string>('');

  useEffect(() => {
    if (videoBlob) {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
      videoUrlRef.current = URL.createObjectURL(videoBlob);
      if (videoRef.current) {
        videoRef.current.src = videoUrlRef.current;
      }
    }
    return () => {
      if (videoUrlRef.current) {
        URL.revokeObjectURL(videoUrlRef.current);
      }
    };
  }, [videoBlob]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setDuration(video.duration * 1000);
    };

    const handleTimeUpdate = () => {
      const timeMs = video.currentTime * 1000;
      setCurrentTime(timeMs);
      onSeek(timeMs);
      drawAnnotations(timeMs);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onSeek]);

  const drawAnnotations = useCallback((timeMs: number) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.clientWidth;
    canvas.height = video.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const scaleX = canvas.width / video.videoWidth;
    const scaleY = canvas.height / video.videoHeight;

    annotations.forEach((ann) => {
      if (ann.timestamp > timeMs) return;
      if (ann.endTime > 0 && ann.endTime < timeMs) return;

      ctx.save();
      ctx.scale(scaleX, scaleY);

      switch (ann.type) {
        case 'brush': {
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
        }
        case 'highlight': {
          ctx.fillStyle = ann.color;
          ctx.globalAlpha = ann.opacity;
          ctx.fillRect(ann.rect.x, ann.rect.y, ann.rect.width, ann.rect.height);
          break;
        }
        case 'text': {
          ctx.fillStyle = ann.color;
          ctx.font = `bold ${ann.fontSize}px Inter, sans-serif`;
          ctx.fillText(ann.content, ann.position.x, ann.position.y);
          break;
        }
      }
      ctx.restore();
    });
  }, [annotations]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || duration === 0 || isNaN(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = percent * duration;
    if (isNaN(newTime) || !isFinite(newTime) || newTime < 0) return;
    video.currentTime = newTime / 1000;
  };

  const handleMarkerClick = (e: React.MouseEvent, annotation: Annotation) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    if (
      annotation.timestamp === undefined ||
      annotation.timestamp === null ||
      isNaN(annotation.timestamp) ||
      annotation.timestamp < 0
    ) {
      return;
    }
    const targetTime = annotation.timestamp / 1000;
    if (isNaN(targetTime) || !isFinite(targetTime)) {
      return;
    }
    video.currentTime = Math.max(0, Math.min(video.duration || Infinity, targetTime));
    setRippleId(annotation.id);
    setTimeout(() => setRippleId(null), 600);
  };

  if (!videoBlob) {
    return (
      <div className="empty-state">
        暂无录制视频，点击"开始录制"创建你的第一个课程片段
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <span className="timeline-title">🎬 预览回放</span>
        <span className="time-display">{formatTime(currentTime)} / {formatTime(duration)}</span>
      </div>

      <div style={{ position: 'relative', background: '#000', borderRadius: 8, overflow: 'hidden', marginBottom: 16 }}>
        <video
          ref={videoRef}
          style={{ width: '100%', display: 'block', aspectRatio: '16/9', objectFit: 'contain' }}
          onClick={togglePlay}
        />
        <canvas
          ref={canvasRef}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        />
      </div>

      <div
        className="timeline-progress"
        onClick={handleTimelineClick}
      >
        <div
          className="timeline-progress-bar"
          style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
        />
        <div className="timeline-markers">
          {annotations.map((ann) => (
            <div
              key={ann.id}
              className={`timeline-marker ${rippleId === ann.id ? 'ripple' : ''}`}
              style={{ left: duration > 0 ? `${(ann.timestamp / duration) * 100}%` : '0%' }}
              onClick={(e) => handleMarkerClick(e, ann)}
              title={`${formatTime(ann.timestamp)} - ${ann.type}`}
            />
          ))}
        </div>
      </div>

      <div className="video-controls">
        <button className="btn" onClick={togglePlay}>
          {isPlaying ? '⏸️ 暂停' : '▶️ 播放'}
        </button>
        <button
          className="btn"
          onClick={() => {
            if (videoRef.current) videoRef.current.currentTime = 0;
          }}
        >
          ⏮️ 重置
        </button>
      </div>
    </div>
  );
};

export default PreviewPlayer;
