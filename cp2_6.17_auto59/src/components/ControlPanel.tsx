import { useRef, useState, useEffect } from 'react';
import { useAudioStore } from '@/store/audioStore';
import {
  loadAudio,
  startPlayback,
  stopPlayback,
  setMasterVolume,
  hasAudioBuffer,
  getDuration,
} from '@/audio/audioProcessor';

const selectIsPlaying = (s: any) => s.isPlaying;
const selectFileName = (s: any) => s.fileName;
const selectDuration = (s: any) => s.duration;
const selectVolume = (s: any) => s.volume;
const selectSetPlaying = (s: any) => s.setPlaying;
const selectSetTrackInfo = (s: any) => s.setTrackInfo;
const selectSetVolume = (s: any) => s.setVolume;

const formatTime = (s: number): string => {
  if (!isFinite(s) || s <= 0) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
};

export const ControlPanel = () => {
  const isPlaying = useAudioStore(selectIsPlaying);
  const fileName = useAudioStore(selectFileName);
  const duration = useAudioStore(selectDuration);
  const volume = useAudioStore(selectVolume);
  const setPlaying = useAudioStore(selectSetPlaying);
  const setTrackInfo = useAudioStore(selectSetTrackInfo);
  const setVolumeStore = useAudioStore(selectSetVolume);

  const inputRef = useRef<HTMLInputElement>(null);
  const [hoverPlay, setHoverPlay] = useState(false);

  useEffect(() => {
    setMasterVolume(volume);
  }, [volume]);

  const handleUploadClick = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await loadAudio(file);
      setTrackInfo(file.name, getDuration());
      startPlayback();
      setPlaying(true);
    } catch (err) {
      console.error('[AuraCanvas] Failed to load audio:', err);
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const togglePlay = async () => {
    if (!hasAudioBuffer()) {
      handleUploadClick();
      return;
    }
    if (isPlaying) {
      stopPlayback();
      setPlaying(false);
    } else {
      startPlayback();
      setPlaying(true);
    }
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolumeStore(v);
  };

  const volumePercent = Math.round(volume * 100);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: 900,
        height: 80,
        background: 'rgba(255,255,255,0.1)',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: 16,
        boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 24,
        zIndex: 10,
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <button
        onClick={handleUploadClick}
        style={{
          padding: '10px 20px',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.25)',
          background: 'rgba(124,77,255,0.25)',
          color: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 500,
          transition: 'all 0.15s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,77,255,0.45)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(124,77,255,0.25)';
        }}
      >
        上传音频
      </button>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div
          style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.9)',
            fontWeight: 500,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {fileName || '请上传音频文件开始体验'}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)' }}>
          {duration > 0 ? `时长: ${formatTime(duration)}` : '支持 MP3, WAV, OGG, FLAC 等格式'}
        </div>
      </div>

      <button
        onClick={togglePlay}
        onMouseEnter={() => setHoverPlay(true)}
        onMouseLeave={() => setHoverPlay(false)}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: 'none',
          background: hoverPlay ? '#9472ff' : '#7C4DFF',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
          flexShrink: 0,
          padding: 0,
        }}
      >
        {isPlaying ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <rect x="3" y="2" width="4" height="12" rx="1" />
            <rect x="9" y="2" width="4" height="12" rx="1" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M3 2.5v11l10-5.5z" />
          </svg>
        )}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: 160, flexShrink: 0 }}>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="rgba(255,255,255,0.7)">
          <path d="M3 6v4h3l4 3V3L6 6H3z" />
        </svg>
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          onChange={handleVolume}
          style={{
            flex: 1,
            height: 4,
            borderRadius: 2,
            appearance: 'none',
            WebkitAppearance: 'none',
            outline: 'none',
            background: `linear-gradient(to right, #7C4DFF 0%, #B388FF ${volumePercent}%, rgba(255,255,255,0.2) ${volumePercent}%, rgba(255,255,255,0.2) 100%)`,
            cursor: 'pointer',
          }}
        />
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4), 0 0 4px rgba(124,77,255,0.6);
          transition: transform 0.15s ease;
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.15);
        }
        input[type="range"]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fff;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4), 0 0 4px rgba(124,77,255,0.6);
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;
