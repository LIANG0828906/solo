import { useState, useEffect, useRef, useCallback } from 'react';
import MusicCard, { Song } from './MusicCard';

const SCENE_OPTIONS = [
  { value: '健身', label: '🏋️ 健身' },
  { value: '阅读', label: '📖 阅读' },
  { value: '通勤', label: '🚇 通勤' },
  { value: '聚会', label: '🎉 聚会' },
];

const MOOD_OPTIONS = [
  { value: '兴奋', label: '⚡ 兴奋' },
  { value: '放松', label: '😌 放松' },
  { value: '忧郁', label: '🌧️ 忧郁' },
];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function App() {
  const [scene, setScene] = useState('健身');
  const [mood, setMood] = useState('兴奋');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedSongs, setGeneratedSongs] = useState<Song[]>([]);
  const [playlist, setPlaylist] = useState<Song[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [leftWidth, setLeftWidth] = useState(30);
  const [isResizing, setIsResizing] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const isDraggingProgress = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isPlaying && playlist.length > 0) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const currentSong = playlist[currentSongIndex];
          if (!currentSong) return 0;
          if (prev >= currentSong.duration) {
            handleNext();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentSongIndex, playlist]);

  const handleGenerate = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/generate?scene=${encodeURIComponent(scene)}&mood=${encodeURIComponent(mood)}`);
      if (res.ok) {
        const songs = await res.json();
        setTimeout(() => {
          setGeneratedSongs(songs);
          setIsLoading(false);
        }, 600);
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  }, [scene, mood]);

  const addToPlaylist = useCallback((song: Song) => {
    setPlaylist(prev => {
      if (prev.find(s => s.id === song.id)) return prev;
      if (prev.length >= 10) return prev;
      return [...prev, song];
    });
  }, []);

  const removeFromPlaylist = useCallback((songId: string) => {
    setPlaylist(prev => {
      const index = prev.findIndex(s => s.id === songId);
      const newPlaylist = prev.filter(s => s.id !== songId);
      if (index === currentSongIndex && newPlaylist.length > 0) {
        setCurrentSongIndex(Math.min(index, newPlaylist.length - 1));
      }
      return newPlaylist;
    });
  }, [currentSongIndex]);

  const toggleFavorite = useCallback(async (songId: string) => {
    const isFav = favoriteIds.includes(songId);
    if (isFav) {
      try {
        await fetch(`/api/favorites/${songId}`, { method: 'DELETE' });
      } catch { /* empty */ }
      setFavoriteIds(prev => prev.filter(id => id !== songId));
    } else {
      try {
        await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songId }),
        });
      } catch { /* empty */ }
      setFavoriteIds(prev => [...prev, songId]);
    }
  }, [favoriteIds]);

  const handlePlayPause = useCallback(() => {
    if (playlist.length === 0) return;
    setIsPlaying(prev => !prev);
  }, [playlist]);

  const handlePrev = useCallback(() => {
    setCurrentSongIndex(prev => {
      if (prev > 0) return prev - 1;
      return playlist.length - 1;
    });
    setCurrentTime(0);
  }, [playlist]);

  const handleNext = useCallback(() => {
    setCurrentSongIndex(prev => {
      if (prev < playlist.length - 1) return prev + 1;
      return 0;
    });
    setCurrentTime(0);
  }, [playlist]);

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    if (!progressRef.current || playlist.length === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const currentSong = playlist[currentSongIndex];
    if (currentSong) {
      setCurrentTime(Math.max(0, Math.min(currentSong.duration, percent * currentSong.duration)));
    }
  }, [playlist, currentSongIndex]);

  const handleProgressMouseDown = useCallback(() => {
    isDraggingProgress.current = true;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingProgress.current && progressRef.current && playlist.length > 0) {
        const rect = progressRef.current.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        const currentSong = playlist[currentSongIndex];
        if (currentSong) {
          setCurrentTime(Math.max(0, Math.min(currentSong.duration, percent * currentSong.duration)));
        }
      }
      if (isResizing && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const percent = ((e.clientX - rect.left) / rect.width) * 100;
        setLeftWidth(Math.max(20, Math.min(50, percent)));
      }
    };

    const handleMouseUp = () => {
      isDraggingProgress.current = false;
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, playlist, currentSongIndex]);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  }, []);

  const handleDrop = useCallback((dropIndex: number) => {
    if (dragIndex === null || dragIndex === dropIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    setPlaylist(prev => {
      const newPlaylist = [...prev];
      const [removed] = newPlaylist.splice(dragIndex, 1);
      newPlaylist.splice(dropIndex, 0, removed);
      return newPlaylist;
    });
    if (currentSongIndex === dragIndex) {
      setCurrentSongIndex(dropIndex);
    } else if (dragIndex < currentSongIndex && dropIndex >= currentSongIndex) {
      setCurrentSongIndex(prev => prev - 1);
    } else if (dragIndex > currentSongIndex && dropIndex <= currentSongIndex) {
      setCurrentSongIndex(prev => prev + 1);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }, [dragIndex, currentSongIndex]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  const currentSong = playlist[currentSongIndex];
  const totalDuration = currentSong?.duration || 0;

  const leftPanel = (
    <div className="glass-panel" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#EAEAEA' }}>
        ✨ 生成播放列表
      </h2>

      <div>
        <label style={{ fontSize: '14px', color: '#aaa', marginBottom: '8px', display: 'block' }}>
          场景
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {SCENE_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setScene(option.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: scene === option.value ? '#E94560' : 'rgba(255,255,255,0.1)',
                background: scene === option.value ? 'rgba(233, 69, 96, 0.2)' : 'rgba(255,255,255,0.03)',
                color: '#EAEAEA',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontSize: '14px', color: '#aaa', marginBottom: '8px', display: 'block' }}>
          心情
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {MOOD_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => setMood(option.value)}
              style={{
                padding: '12px 16px',
                borderRadius: '10px',
                border: '1px solid',
                borderColor: mood === option.value ? '#9C27B0' : 'rgba(255,255,255,0.1)',
                background: mood === option.value ? 'rgba(156, 39, 176, 0.2)' : 'rgba(255,255,255,0.03)',
                color: '#EAEAEA',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease',
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleGenerate}
        disabled={isLoading}
        style={{
          padding: '14px 24px',
          borderRadius: '12px',
          border: 'none',
          background: 'linear-gradient(135deg, #9C27B0, #2196F3)',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 600,
          cursor: isLoading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px',
          transition: 'all 0.3s ease',
          opacity: isLoading ? 0.8 : 1,
          marginTop: 'auto',
        }}
      >
        {isLoading && (
          <div
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        )}
        {isLoading ? '生成中...' : '🎵 生成播放列表'}
      </button>
    </div>
  );

  const rightPanel = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: '100%', overflow: 'hidden' }}>
      <div className="glass-panel" style={{ padding: '20px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>🎧 推荐歌曲</h2>
          <span style={{ fontSize: '13px', color: '#888' }}>
            点击卡片添加到播放列表
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            gap: '16px',
            overflowX: 'auto',
            overflowY: 'hidden',
            padding: '8px 4px 12px 4px',
            scrollBehavior: 'smooth',
          }}
        >
          {generatedSongs.length > 0 ? (
            generatedSongs.map((song, index) => (
              <div
                key={song.id}
                onClick={() => addToPlaylist(song)}
                style={{ flexShrink: 0, cursor: 'pointer' }}
                title="点击添加到播放列表"
              >
                <MusicCard
                  song={song}
                  isFavorite={favoriteIds.includes(song.id)}
                  onFavoriteToggle={toggleFavorite}
                  index={index}
                  showFavorite={true}
                />
              </div>
            ))
          ) : (
            <div
              style={{
                width: '100%',
                padding: '40px',
                textAlign: 'center',
                color: '#666',
                fontSize: '14px',
              }}
            >
              {isLoading ? '正在为您匹配最佳歌曲...' : '选择场景和心情，生成您的专属歌单'}
            </div>
          )}
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexShrink: 0 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 600 }}>📋 当前播放列表</h2>
          <span style={{ fontSize: '13px', color: '#888' }}>
            {playlist.length}/10 首
          </span>
        </div>
        <div
          className="playlist-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingRight: '8px',
          }}
        >
          {playlist.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {playlist.map((song, index) => (
                <div
                  key={song.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={() => handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    borderRadius: '10px',
                    background: currentSongIndex === index
                      ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.3), rgba(33, 150, 243, 0.2))'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: currentSongIndex === index
                      ? '1px solid rgba(156, 39, 176, 0.5)'
                      : dragOverIndex === index
                      ? '1px dashed #E94560'
                      : '1px solid transparent',
                    cursor: 'grab',
                    transition: 'all 0.2s ease',
                    transform: dragIndex === index ? 'scale(0.95)' : 'scale(1)',
                    opacity: dragIndex === index ? 0.7 : 1,
                  }}
                  onClick={() => {
                    setCurrentSongIndex(index);
                    setCurrentTime(0);
                    setIsPlaying(true);
                  }}
                >
                  <span
                    style={{
                      width: '24px',
                      fontSize: '13px',
                      color: '#666',
                      flexShrink: 0,
                    }}
                  >
                    {index + 1}
                  </span>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '6px',
                      background: `linear-gradient(135deg, #87CEEB, #FF6347)`,
                      flexShrink: 0,
                      opacity: 0.3 + song.energy * 0.7,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {song.title}
                    </p>
                    <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
                      {song.artist}
                    </p>
                  </div>
                  <span style={{ fontSize: '12px', color: '#666', flexShrink: 0 }}>
                    {formatTime(song.duration)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(song.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      flexShrink: 0,
                    }}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill={favoriteIds.includes(song.id) ? '#E53935' : 'none'}
                      stroke={favoriteIds.includes(song.id) ? '#E53935' : '#666'}
                      strokeWidth="2"
                    >
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                    </svg>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromPlaylist(song.id);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#666',
                      flexShrink: 0,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
                fontSize: '14px',
                textAlign: 'center',
                padding: '40px',
              }}
            >
              播放列表为空<br />点击上方推荐歌曲添加
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const bottomPlayer = (
    <div
      className="glass-panel"
      style={{
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '200px', flexShrink: 0 }}>
        {currentSong && (
          <>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #9C27B0, #2196F3)',
                flexShrink: 0,
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ fontSize: '14px', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentSong.title}
              </p>
              <p style={{ fontSize: '12px', color: '#888' }}>
                {currentSong.artist}
              </p>
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={handlePrev}
            style={{
              background: 'none',
              border: 'none',
              color: '#EAEAEA',
              cursor: 'pointer',
              padding: '8px',
              fontSize: '18px',
              transition: 'all 0.2s ease',
            }}
          >
            ⏮
          </button>
          <button
            onClick={handlePlayPause}
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              border: 'none',
              background: 'linear-gradient(135deg, #9C27B0, #2196F3)',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={handleNext}
            style={{
              background: 'none',
              border: 'none',
              color: '#EAEAEA',
              cursor: 'pointer',
              padding: '8px',
              fontSize: '18px',
              transition: 'all 0.2s ease',
            }}
          >
            ⏭
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%', maxWidth: '500px' }}>
          <span style={{ fontSize: '12px', color: '#888', width: '45px', textAlign: 'right', flexShrink: 0 }}>
            {formatTime(currentTime)}
          </span>
          <div
            ref={progressRef}
            onClick={handleProgressClick}
            onMouseDown={handleProgressMouseDown}
            style={{
              flex: 1,
              height: '6px',
              borderRadius: '3px',
              background: 'rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              position: 'relative',
              minWidth: '100px',
            }}
          >
            <div
              style={{
                height: '100%',
                borderRadius: '3px',
                background: 'linear-gradient(90deg, #9C27B0, #2196F3)',
                width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
          <span style={{ fontSize: '12px', color: '#888', width: '45px', flexShrink: 0 }}>
            {formatTime(totalDuration)}
          </span>
        </div>
      </div>

      <div style={{ width: '100px', flexShrink: 0 }} />
    </div>
  );

  if (isMobile) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          background: '#1A1A2E',
          padding: '16px',
          gap: '12px',
          overflow: 'hidden',
        }}
      >
        <button
          onClick={() => setMobilePanelOpen(!mobilePanelOpen)}
          className="glass-panel"
          style={{
            padding: '16px',
            border: 'none',
            color: '#EAEAEA',
            fontSize: '16px',
            cursor: 'pointer',
            textAlign: 'left',
            flexShrink: 0,
          }}
        >
          🎵 {scene} · {mood} {mobilePanelOpen ? '▲' : '▼'}
        </button>
        
        <div
          style={{
            maxHeight: mobilePanelOpen ? '500px' : '0',
            overflow: 'hidden',
            transition: 'max-height 0.3s ease',
            flexShrink: 0,
          }}
        >
          {leftPanel}
        </div>

        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          {rightPanel}
        </div>

        {bottomPlayer}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: '#1A1A2E',
        padding: '20px',
        gap: '16px',
        overflow: 'hidden',
      }}
    >
      <div style={{ flex: 1, display: 'flex', gap: '0', minHeight: 0 }}>
        <div style={{ width: `${leftWidth}%`, minWidth: '280px', flexShrink: 0 }}>
          {leftPanel}
        </div>
        
        <div
          className="resizer"
          onMouseDown={() => setIsResizing(true)}
        />
        
        <div style={{ flex: 1, minWidth: '400px', overflow: 'hidden' }}>
          {rightPanel}
        </div>
      </div>
      
      {bottomPlayer}
    </div>
  );
}
