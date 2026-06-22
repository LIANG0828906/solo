import { useRef, useState, useEffect, useCallback } from 'react';
import { Play, Pause } from 'lucide-react';
import type { Track } from '@/types';

interface WaveformPlayerProps {
  track: Track;
}

export default function WaveformPlayer({ track }: WaveformPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const [isScaling, setIsScaling] = useState(false);
  const animationRef = useRef<number>();

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const generateWaveformData = useCallback((length: number) => {
    const data: number[] = [];
    for (let i = 0; i < length; i++) {
      const value =
        Math.sin(i * 0.1) * 0.3 +
        Math.sin(i * 0.05) * 0.4 +
        Math.random() * 0.3;
      data.push(Math.abs(value));
    }
    return data;
  }, []);

  const drawWaveform = useCallback(
    (progress: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);

      const width = rect.width;
      const height = rect.height;
      const barWidth = 2;
      const gap = 1;
      const bars = Math.floor(width / (barWidth + gap));
      const waveformData = generateWaveformData(bars);

      ctx.clearRect(0, 0, width, height);

      const centerY = height / 2;
      const progressX = width * progress;

      waveformData.forEach((value, index) => {
        const x = index * (barWidth + gap);
        const barHeight = value * height * 0.8;
        const y = centerY - barHeight / 2;

        const gradient = ctx.createLinearGradient(x, y, x, y + barHeight);

        if (x < progressX) {
          gradient.addColorStop(0, '#ff6b6b');
          gradient.addColorStop(1, '#4ecdc4');
        } else {
          gradient.addColorStop(0, '#ff6b6b');
          gradient.addColorStop(1, '#ff6b6b');
          ctx.globalAlpha = 0.3;
        }

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 1);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    },
    [generateWaveformData]
  );

  useEffect(() => {
    drawWaveform(currentTime / (duration || 1));
  }, [currentTime, duration, drawWaveform]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  useEffect(() => {
    const animate = () => {
      if (isPlaying && audioRef.current) {
        setCurrentTime(audioRef.current.currentTime);
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    setIsScaling(true);
    setTimeout(() => setIsScaling(false), 200);

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (error) {
        console.error('Playback failed:', error);
      }
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const audio = audioRef.current;
    if (!canvas || !audio) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    const newTime = progress * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    setHoverX(x);
    setHoverTime(progress * duration);
  };

  const handleCanvasMouseLeave = () => {
    setHoverX(null);
    setHoverTime(null);
  };

  return (
    <div
      ref={containerRef}
      className="rounded-xl p-4"
      style={{ backgroundColor: '#1a1a2e' }}
    >
      <audio ref={audioRef} src={track.url} preload="metadata" />

      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="flex items-center justify-center rounded-full transition-transform duration-200"
          style={{
            width: '48px',
            height: '48px',
            backgroundColor: '#ff6b6b',
            color: '#fff',
            transform: isScaling ? 'scale(0.95)' : 'scale(1)',
          }}
        >
          {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
        </button>

        <div className="flex-1 relative">
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            onMouseLeave={handleCanvasMouseLeave}
            className="w-full cursor-pointer rounded-lg"
            style={{ height: '60px' }}
          />

          {hoverX !== null && hoverTime !== null && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: hoverX,
                top: '-32px',
                transform: 'translateX(-50%)',
              }}
            >
              <div
                className="px-2 py-1 text-sm rounded"
                style={{
                  backgroundColor: '#fff',
                  color: '#000',
                  borderRadius: '4px',
                  fontSize: '12px',
                }}
              >
                {formatTime(hoverTime)}
              </div>
            </div>
          )}
        </div>

        <div className="text-right min-w-20">
          <span style={{ fontSize: '14px', color: '#fff' }}>
            {formatTime(currentTime)}
          </span>
          <span style={{ fontSize: '14px', color: '#666' }}>
            {' '}
            / {formatTime(duration)}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes btn-scale {
          0% { transform: scale(1); }
          50% { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
