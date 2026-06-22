import React, { useRef, useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAudioStore } from '../store/audioStore';
import { getAudioEngine } from '../engine/AudioEngine';

export const ControlBar: React.FC = () => {
  const isPlaying = useAudioStore((state) => state.isPlaying);
  const currentTime = useAudioStore((state) => state.currentTime);
  const duration = useAudioStore((state) => state.duration);
  const volume = useAudioStore((state) => state.volume);
  const file = useAudioStore((state) => state.file);

  const progressRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const triggerHaptic = () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
  };

  const handlePlayPause = () => {
    const engine = getAudioEngine();
    if (isPlaying) {
      engine.pause();
    } else {
      engine.play();
    }
    triggerHaptic();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const time = Math.max(0, Math.min(1, ratio)) * duration;
    getAudioEngine().seek(time);
    triggerHaptic();
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    handleProgressClick(e);
  };

  const handleProgressMouseMove = (e: MouseEvent) => {
    if (!isDragging || !progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    const time = Math.max(0, Math.min(1, ratio)) * duration;
    getAudioEngine().seek(time);
  };

  const handleProgressMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleProgressMouseMove);
      window.addEventListener('mouseup', handleProgressMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleProgressMouseMove);
      window.removeEventListener('mouseup', handleProgressMouseUp);
    };
  }, [isDragging, duration]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    getAudioEngine().setVolume(vol);
  };

  const toggleMute = () => {
    if (volume > 0) {
      getAudioEngine().setVolume(0);
    } else {
      getAudioEngine().setVolume(0.7);
    }
    triggerHaptic();
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="control-bar">
      <button
        className="play-btn"
        onClick={handlePlayPause}
        disabled={!file}
      >
        {isPlaying ? <Pause size={24} /> : <Play size={24} />}
      </button>

      <div className="time-display">{formatTime(currentTime)}</div>

      <div
        ref={progressRef}
        className="progress-bar"
        onMouseDown={handleProgressMouseDown}
      >
        <div
          className="progress-fill"
          style={{ width: `${progressPercent}%` }}
        />
        <div
          className="progress-thumb"
          style={{ left: `calc(${progressPercent}% - 6px)` }}
        />
      </div>

      <div className="time-display total">{formatTime(duration)}</div>

      <div className="volume-control">
        <button className="volume-btn" onClick={toggleMute}>
          {volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
          className="volume-slider"
        />
      </div>
    </div>
  );
};
