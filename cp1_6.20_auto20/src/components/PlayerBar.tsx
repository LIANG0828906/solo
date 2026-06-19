import React, { useRef, useEffect, useState } from 'react';
import { Song } from '../types';

interface PlayerBarProps {
  songs: Song[];
  currentSongIndex: number;
  isPlaying: boolean;
  onPlayPause: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSongEnd: () => void;
}

const formatTime = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const PlayerBar: React.FC<PlayerBarProps> = ({
  songs,
  currentSongIndex,
  isPlaying,
  onPlayPause,
  onPrev,
  onNext,
  onSongEnd
}) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const currentSong = songs[currentSongIndex];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentSong && currentSong.fileUrl) {
      audio.src = currentSong.fileUrl;
      audio.load();
      if (isPlaying) {
        audio.play().catch(() => {});
      }
    }
  }, [currentSongIndex, currentSong?.fileUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const handleTimeUpdate = () => {
    const audio = audioRef.current;
    if (audio) {
      setCurrentTime(audio.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    const audio = audioRef.current;
    if (audio) {
      setDuration(audio.duration);
    }
  };

  const handleEnded = () => {
    onSongEnd();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
  };

  return (
    <div className="player-section">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      />

      <div className="player-cover">🎵</div>

      <div className="player-song-info">
        <div className="player-song-title">
          {currentSong ? currentSong.title : '未选择歌曲'}
        </div>
        <div className="player-song-artist">
          {currentSong?.artist || '本地音乐'}
        </div>
      </div>

      <div className="player-progress">
        <div className="progress-bar" onClick={handleProgressClick}>
          <div
            className="progress-fill"
            style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
          />
        </div>
        <div className="progress-time">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || (currentSong?.duration || 0))}</span>
        </div>
      </div>

      <div className="player-controls">
        <button
          className="control-btn"
          onClick={onPrev}
          disabled={songs.length === 0}
          title="上一首"
        >
          ⏮
        </button>
        <button
          className="control-btn play-btn"
          onClick={onPlayPause}
          disabled={songs.length === 0}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="control-btn"
          onClick={onNext}
          disabled={songs.length === 0}
          title="下一首"
        >
          ⏭
        </button>
      </div>

      <div className="player-volume">
        <span className="volume-icon">🔊</span>
        <input
          type="range"
          className="volume-slider"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolumeChange}
        />
      </div>
    </div>
  );
};

export default PlayerBar;
