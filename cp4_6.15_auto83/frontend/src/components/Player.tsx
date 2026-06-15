import { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX } from 'lucide-react';
import { useMoodStore } from '@/store/moodStore';
import { cn } from '@/lib/utils';

export default function Player() {
  const {
    currentSong,
    isPlaying,
    volume,
    currentTime,
    duration,
    setIsPlaying,
    setVolume,
    setCurrentTime,
    setDuration,
    nextSong,
    prevSong,
  } = useMoodStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentSong) return;

    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    } else {
      audio.pause();
    }
  }, [isPlaying, currentSong, setIsPlaying]);

  useEffect(() => {
    if (currentSong && isPlaying) {
      document.title = `♪ ${currentSong.title} - ${currentSong.artist}`;
    } else {
      document.title = 'Mood Music';
    }
  }, [currentSong, isPlaying]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (!audio || isDragging) return;
    setCurrentTime(audio.currentTime);
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (!audio) return;
    setDuration(audio.duration);
  };

  const handleEnded = () => {
    nextSong();
  };

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const audio = audioRef.current;
      const bar = progressRef.current;
      if (!audio || !bar) return;

      const rect = bar.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const newTime = percent * (audio.duration || duration);
      audio.currentTime = newTime;
      setCurrentTime(newTime);
    },
    [duration, setCurrentTime]
  );

  const formatTime = (time: number) => {
    if (!isFinite(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value) / 100;
    setVolume(v);
    if (v > 0) setIsMuted(false);
  };

  const getVolumeGradient = () => {
    const v = isMuted ? 0 : volume * 100;
    const green = [74, 222, 128];
    const yellow = [250, 204, 21];
    const red = [239, 68, 68];

    let color1: number[];
    let color2: number[];
    let ratio: number;

    if (v < 50) {
      color1 = green;
      color2 = yellow;
      ratio = v / 50;
    } else {
      color1 = yellow;
      color2 = red;
      ratio = (v - 50) / 50;
    }

    const r = Math.round(color1[0] + (color2[0] - color1[0]) * ratio);
    const g = Math.round(color1[1] + (color2[1] - color1[1]) * ratio);
    const b = Math.round(color1[2] + (color2[2] - color1[2]) * ratio);

    return `rgb(${r}, ${g}, ${b})`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  if (!currentSong) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'glass rounded-none md:rounded-t-2xl',
        'border-t border-white/20',
        'px-4 py-3 md:px-6 md:py-4'
      )}
    >
      <audio
        ref={audioRef}
        src={currentSong.previewUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative">
            <div
              className="w-12 h-12 md:w-14 md:h-14 rounded-full overflow-hidden border-2 border-white/30 shadow-lg"
              style={{
                animation: isPlaying ? 'spin 4s linear infinite' : undefined,
              }}
            >
              <img
                src={currentSong.coverUrl}
                alt={currentSong.title}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="hidden md:flex items-center gap-1">
            <button
              onClick={prevSong}
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
            >
              <SkipBack className="w-5 h-5" fill="currentColor" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 rounded-full bg-white/20 hover:bg-white/30 active:scale-90 transition-all text-white"
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" fill="white" />
              ) : (
                <Play className="w-5 h-5" fill="white" />
              )}
            </button>
            <button
              onClick={nextSong}
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
            >
              <SkipForward className="w-5 h-5" fill="currentColor" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="hidden md:flex items-center justify-between mb-1">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentSong.title}</p>
              <p className="text-xs text-white/60 truncate">{currentSong.artist}</p>
            </div>
          </div>

          <div className="flex md:hidden items-center gap-2 mb-2">
            <button
              onClick={prevSong}
              className="p-1.5 rounded-full text-white/80 hover:text-white active:scale-90 transition-all"
            >
              <SkipBack className="w-4 h-4" fill="currentColor" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-full bg-white/20 active:scale-90 transition-all text-white"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4" fill="white" />
              ) : (
                <Play className="w-4 h-4" fill="white" />
              )}
            </button>
            <button
              onClick={nextSong}
              className="p-1.5 rounded-full text-white/80 hover:text-white active:scale-90 transition-all"
            >
              <SkipForward className="w-4 h-4" fill="currentColor" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{currentSong.title}</p>
              <p className="text-[10px] text-white/60 truncate">{currentSong.artist}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] md:text-xs text-white/50 w-8 md:w-10 text-right flex-shrink-0">
              {formatTime(currentTime)}
            </span>
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              className="relative flex-1 h-2 md:h-2.5 bg-white/20 rounded-full cursor-pointer group"
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
                style={{ width: `${progressPercent}%` }}
              />
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `calc(${progressPercent}% - 7px)` }}
              />
            </div>
            <span className="text-[10px] md:text-xs text-white/50 w-8 md:w-10 flex-shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 flex-shrink-0 w-36">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume * 100}
            onChange={handleVolumeChange}
            className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${getVolumeGradient()} ${isMuted ? 0 : volume * 100}%, rgba(255,255,255,0.2) ${isMuted ? 0 : volume * 100}%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
