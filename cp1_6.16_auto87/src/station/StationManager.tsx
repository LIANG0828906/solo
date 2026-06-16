import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Track, genreMap } from '../store/useStore';
import RecordCard from './RecordCard';

interface StationManagerProps {
  searchText: string;
  searchResults: Track[];
  currentQueue: Track[];
  currentStationName: string;
  onSearchChange: (text: string) => void;
  onAddToQueue: (track: Track) => void;
  onAddByGenre: (genre: string, count: number) => void;
  onCreateStation: (name: string) => void;
  onTrackClick: (track: Track) => void;
}

const genreStyles: Record<string, { bg: string; hover: string }> = {
  folk: { bg: 'rgba(139, 105, 20, 0.6)', hover: 'rgba(139, 105, 20, 0.9)' },
  electronic: { bg: 'rgba(155, 89, 182, 0.6)', hover: 'rgba(155, 89, 182, 0.9)' },
  jazz: { bg: 'rgba(52, 152, 219, 0.6)', hover: 'rgba(52, 152, 219, 0.9)' },
  classical: { bg: 'rgba(241, 196, 15, 0.6)', hover: 'rgba(241, 196, 15, 0.9)' },
  rock: { bg: 'rgba(231, 76, 60, 0.6)', hover: 'rgba(231, 76, 60, 0.9)' },
  pop: { bg: 'rgba(233, 30, 99, 0.6)', hover: 'rgba(233, 30, 99, 0.9)' },
};

const StationManager: React.FC<StationManagerProps> = React.memo(({
  searchText,
  searchResults,
  currentQueue,
  currentStationName,
  onSearchChange,
  onAddToQueue,
  onAddByGenre,
  onCreateStation,
  onTrackClick,
}) => {
  const [stationName, setStationName] = useState('');
  const [newTrackId, setNewTrackId] = useState<string | null>(null);
  const queueEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (newTrackId && queueEndRef.current) {
      setTimeout(() => {
        setNewTrackId(null);
      }, 500);
    }
  }, [newTrackId, currentQueue]);

  const handleAddToQueue = useCallback((track: Track) => {
    onAddToQueue(track);
    setNewTrackId(track.id);
  }, [onAddToQueue]);

  const handleCreateStation = useCallback(() => {
    if (stationName.trim()) {
      onCreateStation(stationName.trim());
      setStationName('');
    }
  }, [stationName, onCreateStation]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateStation();
    }
  }, [handleCreateStation]);

  return (
    <div
      className="station-manager"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        padding: '20px',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <div style={{ marginBottom: '8px' }}>
        <label
          style={{
            display: 'block',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '14px',
            marginBottom: '8px',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          电台名称
        </label>
        <input
          type="text"
          value={stationName}
          onChange={(e) => setStationName(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="为你的电台命名..."
          style={{
            width: '100%',
            padding: '12px 16px',
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '12px',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '14px',
            outline: 'none',
            backdropFilter: 'blur(10px)',
            transition: 'border-color 0.3s ease, background 0.3s ease',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'rgba(255, 140, 66, 0.8)';
            e.target.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            e.target.style.background = 'rgba(255, 255, 255, 0.1)';
          }}
        />
        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
          <button
            onClick={handleCreateStation}
            disabled={!stationName.trim()}
            style={{
              flex: 1,
              padding: '10px 16px',
              background: stationName.trim()
                ? 'linear-gradient(135deg, #E63946, #FF8C42)'
                : 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '8px',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontSize: '12px',
              cursor: stationName.trim() ? 'pointer' : 'not-allowed',
              opacity: stationName.trim() ? 1 : 0.5,
              transition: 'transform 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (stationName.trim()) {
                e.currentTarget.style.transform = 'scale(1.02)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            创建电台
          </button>
        </div>
        {currentStationName && (
          <div
            style={{
              marginTop: '12px',
              padding: '8px 12px',
              background: 'rgba(255, 140, 66, 0.2)',
              borderRadius: '8px',
              color: '#FF8C42',
              fontFamily: 'monospace',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>📻</span>
            当前电台: {currentStationName}
          </div>
        )}
      </div>

      <div>
        <label
          style={{
            display: 'block',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '14px',
            marginBottom: '8px',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          风格标签
        </label>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          {Object.entries(genreMap).map(([key, name]) => (
            <button
              key={key}
              onClick={() => onAddByGenre(key, 5)}
              style={{
                padding: '8px 16px',
                background: genreStyles[key].bg,
                border: 'none',
                borderRadius: '8px',
                color: '#ffffff',
                fontFamily: 'monospace',
                fontSize: '12px',
                cursor: 'pointer',
                transition: 'transform 0.2s ease, background 0.2s ease',
                backdropFilter: 'blur(5px)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.1)';
                e.currentTarget.style.background = genreStyles[key].hover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.background = genreStyles[key].bg;
              }}
            >
              {name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label
          style={{
            display: 'block',
            color: '#ffffff',
            fontFamily: 'monospace',
            fontSize: '14px',
            marginBottom: '8px',
            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
          }}
        >
          搜索歌曲
        </label>
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            value={searchText}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="搜索曲名或歌手..."
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '12px',
              color: '#ffffff',
              fontFamily: 'monospace',
              fontSize: '14px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              transition: 'border-color 0.3s ease, background 0.3s ease',
            }}
            onFocus={(e) => {
              e.target.style.borderColor = 'rgba(255, 140, 66, 0.8)';
              e.target.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = 'rgba(255, 255, 255, 0.4)';
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            🔍
          </div>
        </div>

        {searchResults.length > 0 && (
          <div
            style={{
              marginTop: '8px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '12px',
              overflow: 'hidden',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            {searchResults.map((track) => (
              <div
                key={track.id}
                onClick={() => handleAddToQueue(track)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 12px',
                  height: '60px',
                  cursor: 'pointer',
                  background: 'linear-gradient(90deg, rgba(240, 240, 240, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                  transition: 'background 0.2s ease',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 140, 66, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, rgba(240, 240, 240, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)';
                }}
              >
                <RecordCard track={track} size="small" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.title}
                  </div>
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.artist}
                  </div>
                </div>
                <div
                  style={{
                    color: '#FF8C42',
                    fontSize: '18px',
                  }}
                >
                  +
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
          }}
        >
          <div
            style={{
              color: '#ffffff',
              fontFamily: 'monospace',
              fontSize: '14px',
              fontWeight: 'bold',
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>🎵</span>
            播放队列
            <span style={{ fontSize: '12px', opacity: 0.7, fontWeight: 'normal' }}>
              ({currentQueue.length} 首)
            </span>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '12px',
            padding: '8px',
          }}
          className="queue-list"
        >
          {currentQueue.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)',
                fontFamily: 'monospace',
                padding: '40px 20px',
                fontSize: '12px',
              }}
            >
              队列为空，搜索歌曲或点击风格标签添加
            </div>
          ) : (
            currentQueue.map((track, index) => (
              <div
                key={track.id}
                ref={index === currentQueue.length - 1 ? queueEndRef : null}
                onClick={() => onTrackClick(track)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px',
                  marginBottom: '6px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, transform 0.3s ease, opacity 0.3s ease',
                  opacity: newTrackId === track.id ? 0 : 1,
                  transform: newTrackId === track.id ? 'translateY(40px)' : 'translateY(0)',
                  animation: newTrackId === track.id ? 'slideIn 0.3s ease forwards' : 'none',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 140, 66, 0.2)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                <div
                  style={{
                    width: '20px',
                    color: 'rgba(255, 255, 255, 0.5)',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    textAlign: 'center',
                  }}
                >
                  {index + 1}
                </div>
                <RecordCard track={track} size="small" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      color: '#ffffff',
                      fontFamily: 'monospace',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.title}
                  </div>
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.6)',
                      fontFamily: 'monospace',
                      fontSize: '10px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {track.artist}
                  </div>
                </div>
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.4)',
                    fontFamily: 'monospace',
                    fontSize: '10px',
                  }}
                >
                  {genreMap[track.genre]}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <style>{`
        .station-manager::-webkit-scrollbar,
        .queue-list::-webkit-scrollbar {
          width: 6px;
        }
        .station-manager::-webkit-scrollbar-track,
        .queue-list::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
        .station-manager::-webkit-scrollbar-thumb,
        .queue-list::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.3);
          border-radius: 3px;
        }
        .station-manager::-webkit-scrollbar-thumb:hover,
        .queue-list::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.5);
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
});

StationManager.displayName = 'StationManager';

export default StationManager;
