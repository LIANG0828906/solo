import { useRef } from 'react';
import { useStore } from '../store/useStore';
import { themes } from '../types';
import type { ThemeType } from '../types';
import audioEngine from '../audioEngine';

export function TopBar() {
  const theme = useStore((state) => state.theme);
  const setTheme = useStore((state) => state.setTheme);
  const isPlaying = useStore((state) => state.isPlaying);
  const setPlaying = useStore((state) => state.setPlaying);
  const currentTime = useStore((state) => state.currentTime);
  const duration = useStore((state) => state.duration);
  const setCurrentTime = useStore((state) => state.setCurrentTime);
  const isRecording = useStore((state) => state.isRecording);
  const setRecording = useStore((state) => state.setRecording);
  const audioLoaded = useStore((state) => state.audioLoaded);

  const themeColors = themes[theme];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const themeList: { key: ThemeType; name: string; colors: string[] }[] = [
    { key: 'cyberpunk', name: '赛博朋克', colors: ['#ff00ff', '#00ffff', '#ffff00'] },
    { key: 'aurora', name: '极光蓝绿', colors: ['#0000ff', '#00ff88', '#88ffff'] },
    { key: 'lava', name: '熔岩红橙', colors: ['#ff3300', '#ff8800', '#ffcc00'] },
  ];

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxDuration = 120;
    try {
      await audioEngine.loadFile(file);
      if (audioEngine.getDuration() > maxDuration) {
        alert('音频时长不能超过2分钟');
        return;
      }
      useStore.getState().setDuration(audioEngine.getDuration());
      useStore.getState().setAudioLoaded(true);
    } catch (err) {
      console.error('Failed to load audio:', err);
      alert('音频加载失败，请检查文件格式');
    }
  };

  const handlePlayPause = () => {
    if (!audioLoaded) {
      fileInputRef.current?.click();
      return;
    }

    if (isPlaying) {
      audioEngine.pause();
      setPlaying(false);
    } else {
      audioEngine.play();
      setPlaying(true);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;
    audioEngine.seek(newTime);
    setCurrentTime(newTime);
  };

  const handleRecord = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.warn('No canvas found for recording');
      return;
    }

    try {
      const stream = canvas.captureStream(60);

      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm';
        }
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        if (recordedChunksRef.current.length === 0) return;
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `music-visualizer-${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        recordedChunksRef.current = [];
      };

      mediaRecorder.start(100);
      setRecording(true);
    } catch (err) {
      console.error('Failed to start recording:', err);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
    setRecording(false);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '60px',
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        transition: 'all 0.3s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`,
              borderRadius: '8px',
              fontSize: '16px',
            }}
          >
            🎵
          </div>
          <span
            style={{
              color: 'white',
              fontSize: '15px',
              fontWeight: 600,
              letterSpacing: '0.5px',
            }}
          >
            3D音乐可视化编辑器
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1, maxWidth: '400px' }}>
          <button
            onClick={handlePlayPause}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: 'none',
              background: `linear-gradient(135deg, ${themeColors.primary}, ${themeColors.secondary})`,
              color: 'white',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              transition: 'all 0.3s ease',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.boxShadow = `0 0 20px ${themeColors.primary}60`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {isPlaying ? '❚❚' : '▶'}
          </button>

          <div style={{ flex: 1 }}>
            <div
              ref={progressRef}
              onClick={handleProgressClick}
              style={{
                height: '6px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '3px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${themeColors.primary}, ${themeColors.secondary})`,
                  borderRadius: '3px',
                  transition: 'width 0.1s linear',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    right: '-6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'white',
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.3)',
                  }}
                />
              </div>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '4px',
                fontSize: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'monospace',
              }}
            >
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
        </div>

        {!audioLoaded && (
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            上传音乐
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.5)',
              marginRight: '4px',
            }}
          >
            主题
          </span>
          {themeList.map((t) => (
            <button
              key={t.key}
              onClick={() => setTheme(t.key)}
              title={t.name}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: theme === t.key ? '2px solid white' : '2px solid transparent',
                background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]}, ${t.colors[2]})`,
                cursor: 'pointer',
                transition: 'all 0.6s ease',
                padding: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)';
                e.currentTarget.style.boxShadow = `0 0 12px ${t.colors[0]}80`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          ))}
        </div>

        <button
          onClick={handleRecord}
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            border: '2px solid rgba(255, 255, 255, 0.3)',
            background: isRecording ? '#ff2222' : 'rgba(255, 0, 0, 0.3)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            transition: 'all 0.3s ease',
            animation: isRecording ? 'topbar-pulse 1s infinite' : 'none',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';
          }}
        >
          {isRecording ? '⏹' : '●'}
        </button>
      </div>

      <style>{`
        @keyframes topbar-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default TopBar;
