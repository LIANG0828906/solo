import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useStore } from '@/store';

export default function PlayerBar() {
  const currentTrack = useStore((s) => s.currentTrack);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }

    if (currentTrack) {
      const audio = audioRef.current;
      audio.currentTime = 0;
      setProgress(0);
      setIsPlaying(false);
      setDuration(30);

      setTimeout(() => {
        if (audioRef.current) {
          setIsPlaying(true);
        }
      }, 100);
    } else {
      setIsPlaying(false);
      setProgress(0);
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!isPlaying || !currentTrack) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return prev + 0.1;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, duration, currentTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const togglePlay = () => {
    if (!currentTrack) return;
    setIsPlaying((p) => !p);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentTrack) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    setProgress(pct * duration);
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setVolume(pct);
  };

  const formatTime = (t: number) => {
    const m = Math.floor(t / 60);
    const s = Math.floor(t % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!currentTrack) return null;

  return (
    <div className="player-bar">
      <div className="player-cover">
        <img src={currentTrack.coverUrl} alt={currentTrack.recordTitle} />
      </div>
      <div className="player-info">
        <div className="player-track">{currentTrack.trackTitle}</div>
        <div className="player-album">{currentTrack.recordTitle}</div>
      </div>
      <div className="player-progress">
        <span className="player-time">{formatTime(progress)}</span>
        <div className="progress-bar" onClick={handleProgressClick}>
          <div
            className="progress-fill"
            style={{ width: `${(progress / duration) * 100}%` }}
          >
            <div className="progress-thumb" />
          </div>
        </div>
        <span className="player-time">{formatTime(duration)}</span>
      </div>
      <div className="player-controls">
        <button className="player-btn play" onClick={togglePlay}>
          {isPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
        </button>
      </div>
      <div className="player-volume">
        <Volume2 size={16} color="#FFFFFF" />
        <div className="volume-slider" onClick={handleVolumeClick}>
          <div className="volume-fill" style={{ width: `${volume * 100}%` }} />
        </div>
      </div>
    </div>
  );
}
