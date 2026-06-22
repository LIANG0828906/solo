import { useState, useRef, useCallback, useEffect } from 'react';
import { useAudioPlayer } from './useAudioPlayer';
import LyricsDisplay from './LyricsDisplay';
import AudioVisualizer from './AudioVisualizer';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default function App() {
  const player = useAudioPlayer();
  const audioInputRef = useRef<HTMLInputElement>(null);
  const lyricsInputRef = useRef<HTMLInputElement>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState(0);
  const progressRef = useRef<HTMLDivElement>(null);
  const toastIdRef = useRef(0);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const handleAudioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await player.loadAudioFile(file);
    if (success) {
      showToast(`音频加载成功: ${file.name}`, 'success');
    } else {
      showToast('音频加载失败，请检查文件格式', 'error');
    }
    e.target.value = '';
  };

  const handleLyricsFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const success = await player.loadLyricsFile(file);
    if (success) {
      showToast(`歌词加载成功: ${file.name}`, 'success');
    } else {
      showToast('歌词加载失败，请检查文件格式', 'error');
    }
    e.target.value = '';
  };

  const getProgressPosition = useCallback((clientX: number): number => {
    if (!progressRef.current) return 0;
    const rect = progressRef.current.getBoundingClientRect();
    const pos = (clientX - rect.left) / rect.width;
    return Math.max(0, Math.min(1, pos));
  }, []);

  const handleProgressMouseDown = (e: React.MouseEvent) => {
    if (!player.audioLoaded || !player.duration) return;
    setIsDragging(true);
    const pos = getProgressPosition(e.clientX);
    setDragTime(pos * player.duration);
    setTooltipPosition(pos);
  };

  const handleProgressTouchStart = (e: React.TouchEvent) => {
    if (!player.audioLoaded || !player.duration) return;
    setIsDragging(true);
    const touch = e.touches[0];
    const pos = getProgressPosition(touch.clientX);
    setDragTime(pos * player.duration);
    setTooltipPosition(pos);
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const pos = getProgressPosition(e.clientX);
      setDragTime(pos * player.duration);
      setTooltipPosition(pos);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      const pos = getProgressPosition(touch.clientX);
      setDragTime(pos * player.duration);
      setTooltipPosition(pos);
    };

    const handleMouseUp = () => {
      player.seek(dragTime);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, dragTime, getProgressPosition, player]);

  const displayTime = isDragging ? dragTime : player.currentTime;
  const progressPercent = player.duration > 0 ? (displayTime / player.duration) * 100 : 0;
  const currentLyricIndex = player.getCurrentLyricIndex();

  return (
    <>
      <div style={styles.toastContainer}>
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="toast"
            style={{
              ...styles.toast,
              background: toast.type === 'success' ? 'rgba(6, 182, 212, 0.9)' : 'rgba(239, 68, 68, 0.9)',
            }}
          >
            {toast.message}
          </div>
        ))}
      </div>

      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>🎵 可视化音乐播放器</h1>
          <p style={styles.subtitle}>支持 .mp3 / .wav 音频与 .lrc 歌词</p>
        </div>

        <div style={styles.fileInputs}>
          <button
            onClick={() => audioInputRef.current?.click()}
            style={styles.fileButton}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            🎧 选择音频
          </button>
          <button
            onClick={() => lyricsInputRef.current?.click()}
            style={{ ...styles.fileButton, background: 'rgba(6, 182, 212, 0.3)' }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            📝 选择歌词
          </button>
          <input
            ref={audioInputRef}
            type="file"
            accept=".mp3,.wav,audio/mpeg,audio/wav"
            style={styles.hiddenInput}
            onChange={handleAudioFileChange}
          />
          <input
            ref={lyricsInputRef}
            type="file"
            accept=".lrc,text/plain"
            style={styles.hiddenInput}
            onChange={handleLyricsFileChange}
          />
        </div>

        <div style={styles.visualizerWrap}>
          <AudioVisualizer frequencyData={player.frequencyData} isPlaying={player.isPlaying} />
        </div>

        <LyricsDisplay lyrics={player.lyrics} currentIndex={currentLyricIndex} />

        <div style={styles.progressContainer}>
          <span style={styles.timeText}>{formatTime(displayTime)}</span>
          <div
            ref={progressRef}
            style={styles.progressTrack}
            onMouseDown={handleProgressMouseDown}
            onTouchStart={handleProgressTouchStart}
          >
            <div
              style={{
                ...styles.progressFill,
                width: `${progressPercent}%`,
              }}
            />
            {isDragging && (
              <div
                style={{
                  ...styles.tooltip,
                  left: `${tooltipPosition * 100}%`,
                }}
              >
                {formatTime(dragTime)}
              </div>
            )}
            <div
              style={{
                ...styles.progressThumb,
                left: `calc(${progressPercent}% - 8px)`,
              }}
            />
          </div>
          <span style={styles.timeText}>{formatTime(player.duration)}</span>
        </div>

        <div style={styles.controls}>
          <button
            onClick={player.togglePlay}
            disabled={!player.audioLoaded}
            style={{
              ...styles.playButton,
              opacity: player.audioLoaded ? 1 : 0.4,
              cursor: player.audioLoaded ? 'pointer' : 'not-allowed',
            }}
            onMouseEnter={(e) => {
              if (player.audioLoaded) e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {player.isPlaying ? '⏸' : '▶'}
          </button>

          <div style={styles.volumeControl}>
            <span style={styles.volumeIcon}>🔊</span>
            <div style={styles.volumeTrack}>
              <div
                style={{
                  ...styles.volumeFill,
                  width: `${player.volume * 100}%`,
                }}
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={player.volume}
                onChange={(e) => player.setVolume(parseFloat(e.target.value))}
                style={styles.volumeSlider}
              />
            </div>
            <span style={styles.volumeText}>{Math.round(player.volume * 100)}%</span>
          </div>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    width: '100%',
    maxWidth: 600,
    background: 'rgba(26, 26, 46, 0.7)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    borderRadius: 24,
    padding: 32,
    border: '1px solid rgba(139, 92, 246, 0.2)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(139, 92, 246, 0.1)',
    color: '#fff',
  },
  header: {
    textAlign: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  fileInputs: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    marginBottom: 20,
  },
  fileButton: {
    padding: '10px 20px',
    background: 'rgba(139, 92, 246, 0.3)',
    border: '1px solid rgba(139, 92, 246, 0.4)',
    borderRadius: 12,
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'transform 0.2s ease, background 0.2s ease',
    fontFamily: 'inherit',
  },
  hiddenInput: {
    display: 'none',
  },
  visualizerWrap: {
    marginBottom: 8,
  },
  progressContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    marginBottom: 20,
  },
  timeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    minWidth: 40,
    textAlign: 'center',
    fontVariantNumeric: 'tabular-nums',
  },
  progressTrack: {
    flex: 1,
    height: 6,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 3,
    position: 'relative',
    cursor: 'pointer',
  },
  progressFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
    borderRadius: 3,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  progressThumb: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    width: 16,
    height: 16,
    background: '#fff',
    borderRadius: '50%',
    boxShadow: '0 0 12px rgba(139, 92, 246, 0.8)',
    pointerEvents: 'none',
  },
  tooltip: {
    position: 'absolute',
    bottom: 'calc(100% + 8px)',
    transform: 'translateX(-50%)',
    background: 'rgba(0,0,0,0.8)',
    color: '#fff',
    fontSize: 11,
    padding: '4px 8px',
    borderRadius: 4,
    pointerEvents: 'none',
    whiteSpace: 'nowrap',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  playButton: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
    border: 'none',
    color: '#fff',
    fontSize: 28,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 20px rgba(139, 92, 246, 0.5)',
  },
  volumeControl: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  volumeIcon: {
    fontSize: 16,
  },
  volumeTrack: {
    width: 100,
    height: 4,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    position: 'relative',
  },
  volumeFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #06b6d4, #8b5cf6)',
    borderRadius: 2,
    position: 'absolute',
    top: 0,
    left: 0,
    pointerEvents: 'none',
  },
  volumeSlider: {
    position: 'absolute',
    top: '50%',
    left: 0,
    transform: 'translateY(-50%)',
    width: '100%',
    height: 16,
    opacity: 0,
    cursor: 'pointer',
    margin: 0,
  },
  volumeText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    minWidth: 32,
    fontVariantNumeric: 'tabular-nums',
  },
  toastContainer: {
    position: 'fixed',
    top: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  },
  toast: {
    padding: '10px 20px',
    borderRadius: 8,
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },
};

const mediaQueryStyle = document.createElement('style');
mediaQueryStyle.textContent = `
  @media (max-width: 480px) {
    .fileButton { padding: 8px 14px !important; font-size: 12px !important; }
    #controls-gap { gap: 16px !important; }
  }
`;
document.head.appendChild(mediaQueryStyle);
