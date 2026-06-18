import { useEffect, useRef, useState } from 'react';
import { Heart, Play, Pause } from 'lucide-react';
import { AudioItem, EMOTION_COLORS, EMOTION_LABELS, likeAudio } from '../api';
import { useAudioStore } from '../store';

interface CardProps {
  audio: AudioItem;
  index: number;
}

export default function Card({ audio, index }: CardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animationRef = useRef<number>(0);
  const currentPlayingId = useAudioStore((s) => s.currentPlayingId);
  const setCurrentPlaying = useAudioStore((s) => s.setCurrentPlaying);
  const incrementLikes = useAudioStore((s) => s.incrementLikes);

  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const isPlaying = currentPlayingId === audio.id;
  const emotionColor = EMOTION_COLORS[audio.emotion];

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const audioData = audio.audioData || Array(32).fill(0);
    let frame = 0;

    const render = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const particleCount = 12;
      for (let i = 0; i < particleCount; i++) {
        const dataIndex = Math.floor((i / particleCount) * audioData.length);
        let amplitude = audioData[dataIndex] || 0;

        if (isPlaying) {
          const wave = Math.sin((frame + i * 8) * 0.08) * 0.3 + 0.7;
          amplitude *= wave;
        } else {
          amplitude *= 0.3 + Math.sin((frame + i * 5) * 0.03) * 0.1;
        }

        const x = (i + 0.5) * (w / particleCount);
        const baseY = h / 2;
        const radius = 3 + amplitude * 15;
        const y = baseY - amplitude * 30 * (Math.sin((frame + i * 3) * 0.05));

        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, emotionColor + 'FF');
        gradient.addColorStop(0.4, emotionColor + '80');
        gradient.addColorStop(1, emotionColor + '00');

        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = emotionColor;
        ctx.fill();
      }

      frame++;
      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [audio.audioData, isPlaying, emotionColor]);

  useEffect(() => {
    const audioEl = new Audio(audio.filePath);
    audioEl.preload = 'metadata';
    audioRef.current = audioEl;

    const onTimeUpdate = () => {
      if (audioEl.duration) {
        setProgress((audioEl.currentTime / audioEl.duration) * 100);
      }
    };

    const onEnded = () => {
      setCurrentPlaying(null);
      setProgress(0);
    };

    audioEl.addEventListener('timeupdate', onTimeUpdate);
    audioEl.addEventListener('ended', onEnded);

    return () => {
      audioEl.pause();
      audioEl.removeEventListener('timeupdate', onTimeUpdate);
      audioEl.removeEventListener('ended', onEnded);
    };
  }, [audio.filePath, setCurrentPlaying]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  const togglePlay = () => {
    if (isPlaying) {
      setCurrentPlaying(null);
    } else {
      setCurrentPlaying(audio.id);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) return;
    setLiked(true);
    incrementLikes(audio.id);
    try {
      await likeAudio(audio.id);
    } catch {
      // 忽略错误
    }
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div
      className="ripple-effect animate-fade-in-up group cursor-pointer"
      style={{ animationDelay: `${index * 0.05}s` }}
      onClick={togglePlay}
    >
      <div
        className="relative rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
        style={{
          width: '240px',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: `1px solid ${
            isPlaying ? emotionColor : 'rgba(255, 255, 255, 0.1)'
          }`,
          boxShadow: isPlaying
            ? `0 0 20px ${emotionColor}40, 0 0 40px ${emotionColor}20`
            : '0 4px 24px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.4s ease',
        }}
      >
        <div className="relative" style={{ height: '140px' }}>
          <canvas
            ref={canvasRef}
            width={240}
            height={140}
            className="w-full h-full"
          />
          <div
            className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: 'rgba(0,0,0,0.3)' }}
          >
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: emotionColor }}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 text-white" />
              ) : (
                <Play className="w-6 h-6 text-white ml-1" />
              )}
            </div>
          </div>
          <div
            className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{ background: emotionColor + '40', color: emotionColor }}
          >
            {EMOTION_LABELS[audio.emotion]}
          </div>
        </div>

        <div className="p-4">
          <h3 className="text-white text-sm font-medium truncate mb-2">
            {audio.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
            <span>{formatDuration(audio.duration)}</span>
            <button
              onClick={handleLike}
              className="flex items-center gap-1 hover:scale-110 transition-transform"
              style={{ color: liked ? '#FF6B6B' : 'inherit' }}
            >
              <Heart
                className="w-3.5 h-3.5"
                fill={liked ? '#FF6B6B' : 'none'}
              />
              <span>{audio.likes + (liked ? 1 : 0)}</span>
            </button>
          </div>

          <div
            className="w-full h-1 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #FF6B6B, #6C5CE7)',
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
