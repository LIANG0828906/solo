import React, { useState, useEffect, useRef } from 'react';
import type { Song } from '../services/apiService';

interface SongListProps {
  songs: Song[];
  moodColor: string;
  onLike: (songId: string) => void;
  onDislike: (songId: string) => void;
  isLoggedIn: boolean;
}

const hexToRgba = (hex: string, alpha: number): string => {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const slideInKeyframes = `
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(40px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes flipY {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(90deg);
  }
  100% {
    transform: rotateY(180deg);
  }
}

@keyframes flipIconY {
  0% {
    transform: rotateY(0deg);
  }
  50% {
    transform: rotateY(-90deg);
  }
  100% {
    transform: rotateY(-180deg);
  }
}

.song-card:active {
  transform: scale(1.05);
}

.vote-btn {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}

.vote-icon {
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  display: inline-block;
}
`;

const SongList: React.FC<SongListProps> = ({ songs, moodColor, onLike, onDislike, isLoggedIn }) => {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, number>>({});
  const [likeActive, setLikeActive] = useState<Record<string, boolean>>({});
  const [dislikeActive, setDislikeActive] = useState<Record<string, boolean>>({});
  const [likeFlipping, setLikeFlipping] = useState<Record<string, boolean>>({});
  const [dislikeFlipping, setDislikeFlipping] = useState<Record<string, boolean>>({});
  const intervalRefs = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    return () => {
      Object.values(intervalRefs.current).forEach(clearInterval);
    };
  }, []);

  useEffect(() => {
    const songIds = new Set(songs.map((s) => s.id));
    const allIds = Object.keys(intervalRefs.current);
    allIds.forEach((id) => {
      if (!songIds.has(id) && intervalRefs.current[id]) {
        clearInterval(intervalRefs.current[id]);
        delete intervalRefs.current[id];
      }
    });
  }, [songs]);

  const startPlayback = (song: Song) => {
    if (playingId === song.id) {
      stopPlayback(song.id);
      return;
    }

    if (playingId) {
      stopPlayback(playingId);
    }

    setPlayingId(song.id);
    setProgressMap((prev) => ({ ...prev, [song.id]: 0 }));

    const totalSteps = (song.duration * 1000) / 100;
    const increment = 100 / totalSteps;
    let current = 0;

    intervalRefs.current[song.id] = setInterval(() => {
      current += increment;
      if (current >= 100) {
        clearInterval(intervalRefs.current[song.id]);
        delete intervalRefs.current[song.id];
        setProgressMap((prev) => ({ ...prev, [song.id]: 0 }));
        setPlayingId(null);
      } else {
        setProgressMap((prev) => ({ ...prev, [song.id]: current }));
      }
    }, 100);
  };

  const stopPlayback = (songId: string) => {
    if (intervalRefs.current[songId]) {
      clearInterval(intervalRefs.current[songId]);
      delete intervalRefs.current[songId];
    }
    if (playingId === songId) {
      setPlayingId(null);
    }
    setProgressMap((prev) => ({ ...prev, [songId]: 0 }));
  };

  const handleLike = (songId: string) => {
    if (!isLoggedIn) return;
    setLikeFlipping((prev) => ({ ...prev, [songId]: true }));
    setTimeout(() => {
      setLikeFlipping((prev) => ({ ...prev, [songId]: false }));
      setLikeActive((prev) => ({ ...prev, [songId]: true }));
      setDislikeActive((prev) => ({ ...prev, [songId]: false }));
    }, 200);
    onLike(songId);
  };

  const handleDislike = (songId: string) => {
    if (!isLoggedIn) return;
    setDislikeFlipping((prev) => ({ ...prev, [songId]: true }));
    setTimeout(() => {
      setDislikeFlipping((prev) => ({ ...prev, [songId]: false }));
      setDislikeActive((prev) => ({ ...prev, [songId]: true }));
      setLikeActive((prev) => ({ ...prev, [songId]: false }));
    }, 200);
    onDislike(songId);
  };

  const formatDuration = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (songs.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '200px',
          color: 'rgba(255,255,255,0.5)',
          fontSize: '16px',
        }}
      >
        选择心情获取推荐歌曲
      </div>
    );
  }

  return (
    <>
      <style>{slideInKeyframes}</style>
      <div
        style={{
          maxHeight: '80vh',
          overflowY: 'auto',
          padding: '4px 2px 4px 4px',
        }}
      >
        {songs.map((song, index) => {
          const progress = progressMap[song.id] || 0;
          const isPlaying = playingId === song.id;
          const likeActiveState = likeActive[song.id];
          const dislikeActiveState = dislikeActive[song.id];
          const likeFlippingState = likeFlipping[song.id];
          const dislikeFlippingState = dislikeFlipping[song.id];

          return (
            <div
              key={song.id}
              className="song-card"
              style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '14px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.15s ease',
                cursor: 'pointer',
                opacity: 0,
                transform: 'translateX(40px)',
                animation: `slideInRight 0.4s ease forwards`,
                animationDelay: `${index * 0.08}s`,
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '12px',
                  backgroundColor: song.cover,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  color: '#fff',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                ♪
              </div>

              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                  gap: '4px',
                }}
              >
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#fff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.3,
                  }}
                >
                  {song.name}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.5)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {song.artist} · {formatDuration(song.duration)}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  flexShrink: 0,
                }}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startPlayback(song);
                  }}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: hexToRgba(moodColor, 0.9),
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '14px',
                    fontWeight: 700,
                    boxShadow: `0 2px 8px ${hexToRgba(moodColor, 0.4)}`,
                    transition: 'transform 0.15s ease, background-color 0.15s ease',
                    padding: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.08)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                  }}
                  title={isPlaying ? '暂停' : '播放'}
                >
                  {isPlaying ? '❚❚' : '▶'}
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(song.id);
                  }}
                  disabled={!isLoggedIn}
                  title={!isLoggedIn ? '提示登录后可使用' : '喜欢'}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: likeActiveState ? 'rgba(59,130,246,0.9)' : 'rgba(255,255,255,0.08)',
                    color: likeActiveState ? '#fff' : 'rgba(255,255,255,0.7)',
                    cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.2s ease',
                    transform: likeFlippingState ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transformStyle: 'preserve-3d',
                    padding: 0,
                    opacity: isLoggedIn ? 1 : 0.5,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      transform: likeFlippingState ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                      transition: 'transform 0.2s ease',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    👍
                  </span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDislike(song.id);
                  }}
                  disabled={!isLoggedIn}
                  title={!isLoggedIn ? '提示登录后可使用' : '不喜欢'}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: dislikeActiveState ? 'rgba(239,68,68,0.9)' : 'rgba(255,255,255,0.08)',
                    color: dislikeActiveState ? '#fff' : 'rgba(255,255,255,0.7)',
                    cursor: isLoggedIn ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    transition: 'background-color 0.15s ease, color 0.15s ease, transform 0.2s ease',
                    transform: dislikeFlippingState ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transformStyle: 'preserve-3d',
                    padding: 0,
                    opacity: isLoggedIn ? 1 : 0.5,
                  }}
                >
                  <span
                    style={{
                      display: 'inline-block',
                      transform: dislikeFlippingState ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                      transition: 'transform 0.2s ease',
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                  >
                    👎
                  </span>
                </button>
              </div>

              {isPlaying && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    height: '3px',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${progress}%`,
                      backgroundColor: hexToRgba(moodColor, 0.8),
                      transition: 'width 0.1s linear',
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default SongList;
