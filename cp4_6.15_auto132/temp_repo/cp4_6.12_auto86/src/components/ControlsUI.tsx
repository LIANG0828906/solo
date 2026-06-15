import { useRef, useState, useCallback } from 'react';

interface Track {
  name: string;
  url: string;
}

interface ControlsUIProps {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  currentTrack: string;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (volume: number) => void;
  onTrackSelect: (track: Track) => void;
  onFileUpload: (file: File) => void;
  onResetCamera: () => void;
}

const PRESET_TRACKS: Track[] = [
  { name: '电子梦境', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { name: '星际漫游', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { name: '深海回音', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { name: '极光脉冲', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
];

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function ControlsUI({
  isPlaying,
  currentTime,
  duration,
  currentTrack,
  onTogglePlay,
  onSeek,
  onVolumeChange,
  onTrackSelect,
  onFileUpload,
  onResetCamera,
}: ControlsUIProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [volume, setVolume] = useState(80);
  const [showTrackMenu, setShowTrackMenu] = useState(false);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = Math.max(0, Math.min(1, x / rect.width));
    onSeek(percent * duration);
  }, [onSeek, duration]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setVolume(val);
    onVolumeChange(val);
  }, [onVolumeChange]);

  const handleTrackSelect = useCallback((track: Track) => {
    onTrackSelect(track);
    setShowTrackMenu(false);
  }, [onTrackSelect]);

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const styles: { [key: string]: React.CSSProperties } = {
    container: {
      position: 'fixed',
      bottom: 24,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '90%',
      maxWidth: 900,
      background: 'rgba(10, 10, 30, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: 12,
      backdropFilter: 'blur(10px)',
      padding: '16px 24px',
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      zIndex: 1000,
    },
    trackInfo: {
      flex: 1,
      minWidth: 0,
      color: '#ffffff',
      fontSize: 16,
      fontWeight: 500,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    },
    controls: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    button: {
      width: 40,
      height: 40,
      borderRadius: '50%',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      background: 'rgba(255, 255, 255, 0.05)',
      color: '#ffffff',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      fontSize: 14,
    },
    playButton: {
      width: 48,
      height: 48,
      background: 'linear-gradient(135deg, #6677dd 0%, #aa88ff 100%)',
      border: 'none',
    },
    progressContainer: {
      flex: 2,
      minWidth: 200,
      cursor: 'pointer',
    },
    progressBar: {
      height: 6,
      background: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 3,
      overflow: 'hidden',
      position: 'relative',
    },
    progressFill: {
      height: '100%',
      background: 'linear-gradient(90deg, #ffcc66 0%, #6677dd 100%)',
      borderRadius: 3,
      transition: isDragging ? 'none' : 'width 0.1s linear',
    },
    timeDisplay: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 13,
      minWidth: 90,
      textAlign: 'center',
      fontVariantNumeric: 'tabular-nums',
    },
    volumeContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      width: 120,
    },
    volumeIcon: {
      color: 'rgba(255, 255, 255, 0.7)',
      fontSize: 16,
    },
    slider: {
      flex: 1,
      height: 4,
      WebkitAppearance: 'none',
      appearance: 'none',
      background: 'rgba(255, 255, 255, 0.15)',
      borderRadius: 2,
      outline: 'none',
      cursor: 'pointer',
    },
    trackSelect: {
      position: 'relative',
    },
    trackMenu: {
      position: 'absolute',
      bottom: '100%',
      left: 0,
      marginBottom: 8,
      background: 'rgba(10, 10, 30, 0.95)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: 8,
      backdropFilter: 'blur(10px)',
      minWidth: 180,
      overflow: 'hidden',
    },
    trackMenuItem: {
      padding: '10px 16px',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: 14,
      transition: 'background 0.2s ease',
    },
    resetButton: {
      position: 'fixed',
      top: 24,
      right: 24,
      padding: '10px 16px',
      background: 'rgba(10, 10, 30, 0.7)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      borderRadius: 8,
      backdropFilter: 'blur(10px)',
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: 13,
      transition: 'all 0.2s ease',
      zIndex: 1000,
    },
    hiddenInput: {
      display: 'none',
    },
  };

  return (
    <>
      <button
        style={styles.resetButton}
        onClick={onResetCamera}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(10, 10, 30, 0.9)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(10, 10, 30, 0.7)';
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
        }}
      >
        重置视角
      </button>

      <div style={styles.container}>
        <div style={styles.trackInfo}>
          {currentTrack || '请选择或上传音频文件'}
        </div>

        <div style={styles.controls}>
          <div style={styles.trackSelect}>
            <button
              style={styles.button}
              onClick={() => setShowTrackMenu(!showTrackMenu)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              title="选择曲目"
            >
              ♪
            </button>
            {showTrackMenu && (
              <div style={styles.trackMenu}>
                {PRESET_TRACKS.map((track) => (
                  <div
                    key={track.name}
                    style={styles.trackMenuItem}
                    onClick={() => handleTrackSelect(track)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(102, 119, 221, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    {track.name}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            style={styles.button}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
            title="上传音频"
          >
            ↑
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            style={styles.hiddenInput}
            onChange={handleFileChange}
          />

          <button
            style={{ ...styles.button, ...styles.playButton }}
            onClick={onTogglePlay}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(102, 119, 221, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
        </div>

        <div
          style={styles.progressContainer}
          onClick={handleProgressClick}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          <div style={styles.progressBar}>
            <div style={{ ...styles.progressFill, width: `${progressPercent}%` }} />
          </div>
        </div>

        <div style={styles.timeDisplay}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        <div style={styles.volumeContainer}>
          <span style={styles.volumeIcon}>🔊</span>
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            style={styles.slider}
            onChange={handleVolumeChange}
          />
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #6677dd;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          background: #aa88ff;
          box-shadow: 0 0 10px rgba(102, 119, 221, 0.8);
        }
        input[type="range"]::-moz-range-thumb {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #6677dd;
          cursor: pointer;
          border: none;
          transition: all 0.2s ease;
        }
        input[type="range"]::-moz-range-thumb:hover {
          transform: scale(1.2);
          background: #aa88ff;
          box-shadow: 0 0 10px rgba(102, 119, 221, 0.8);
        }
      `}</style>
    </>
  );
}
