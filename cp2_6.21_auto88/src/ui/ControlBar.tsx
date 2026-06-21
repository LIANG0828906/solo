import { useRef, useState } from 'react';
import { useAppState } from '../state';

const LOOP_DURATION = 10;
const FPS = 60;
const TOTAL_FRAMES = LOOP_DURATION * FPS;

export default function ControlBar() {
  const { state, dispatch } = useAppState();
  const [showDownload, setShowDownload] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const formatTime = (t: number) => {
    const s = Math.floor(t);
    const ms = Math.floor((t - s) * 100);
    return `${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'SET_CURRENT_TIME', time: parseFloat(e.target.value) });
  };

  const startRecording = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    try {
      const stream = (canvas as HTMLCanvasElement).captureStream(60);
      let mimeType = 'video/webm;codecs=vp9';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 8000000,
      });

      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setShowDownload(url);
        dispatch({ type: 'SET_RECORDING', isRecording: false });
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      dispatch({ type: 'SET_RECORDING', isRecording: true });
      dispatch({ type: 'SET_CURRENT_TIME', time: 0 });

      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
        }
      }, LOOP_DURATION * 1000);
    } catch (err) {
      console.error('Recording failed:', err);
      alert('您的浏览器不支持视频录制功能');
    }
  };

  const btnBase: React.CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#e0e6f0',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '4px 10px',
    borderRadius: '6px',
    transition: 'all 150ms ease-out',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  };

  return (
    <>
      <div
        style={{
          height: '54px',
          minHeight: '54px',
          background: '#0f172a',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '0 20px',
          gap: '2px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <button
            onClick={() => dispatch({ type: 'TOGGLE_PLAYING' })}
            style={{
              ...btnBase,
              background: state.isPlaying ? 'rgba(79, 195, 247, 0.15)' : 'rgba(79, 195, 247, 0.25)',
              color: '#4fc3f7',
              fontSize: '16px',
              padding: '4px 12px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {state.isPlaying ? '❚❚ 暂停' : '▶ 播放'}
          </button>

          <span
            style={{
              color: '#7a8aa8',
              fontSize: '12px',
              fontFamily: 'monospace',
              minWidth: '50px',
            }}
          >
            {formatTime(state.currentTime)}
          </span>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
            <input
              type="range"
              min="0"
              max={LOOP_DURATION}
              step="0.01"
              value={state.currentTime}
              onChange={handleSeek}
              style={{
                flex: 1,
                height: '4px',
                background: '#2a2a4a',
                borderRadius: '2px',
                outline: 'none',
                cursor: 'pointer',
                accentColor: '#4fc3f7',
              }}
            />
            <span
              style={{
                color: '#7a8aa8',
                fontSize: '12px',
                fontFamily: 'monospace',
                minWidth: '50px',
              }}
            >
              {formatTime(LOOP_DURATION)}
            </span>
          </div>

          <span
            style={{
              color: '#64B4FF',
              fontSize: '11px',
              fontFamily: 'monospace',
              minWidth: '90px',
              textAlign: 'center',
              background: 'rgba(100, 180, 255, 0.08)',
              padding: '2px 8px',
              borderRadius: '4px',
              border: '1px solid rgba(100, 180, 255, 0.15)',
            }}
          >
            帧 {Math.floor(state.currentTime * FPS)} / {TOTAL_FRAMES}
          </span>

          <button
            onClick={() => dispatch({ type: 'TOGGLE_LOOPING' })}
            style={{
              ...btnBase,
              color: state.isLooping ? '#4fc3f7' : '#7a8aa8',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            title={state.isLooping ? '关闭循环' : '开启循环'}
          >
            ↻ 循环
          </button>

          <button
            onClick={startRecording}
            disabled={state.isRecording}
            style={{
              ...btnBase,
              background: state.isRecording
                ? 'rgba(255, 82, 82, 0.25)'
                : 'rgba(255, 82, 82, 0.12)',
              color: state.isRecording ? '#ff8080' : '#ff5252',
              padding: '4px 12px',
            }}
            onMouseEnter={(e) => {
              if (!state.isRecording) e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: state.isRecording ? '#ff5252' : '#ff5252',
                display: 'inline-block',
                animation: state.isRecording ? 'recBlink 1s infinite' : 'none',
                boxShadow: state.isRecording ? '0 0 8px rgba(255, 82, 82, 0.8)' : 'none',
              }}
            />
            {state.isRecording ? '录制中...' : '录制 (10s)'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes recBlink {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(0.8); }
        }
      `}</style>

      {showDownload && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(8px)',
          }}
          onClick={() => {
            setShowDownload(null);
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a2e',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '800px',
              width: '90%',
              border: '1px solid rgba(79, 195, 247, 0.2)',
              boxShadow: '0 0 40px rgba(79, 195, 247, 0.15)',
            }}
          >
            <div
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: '#e0e6f0',
                marginBottom: '16px',
              }}
            >
              录制完成
            </div>
            <video
              src={showDownload}
              controls
              autoPlay
              loop
              style={{
                width: '100%',
                borderRadius: '8px',
                background: '#000',
                marginBottom: '16px',
              }}
            />
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDownload(null);
                }}
                style={{
                  ...btnBase,
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e0e6f0',
                  padding: '8px 20px',
                }}
              >
                关闭
              </button>
              <a
                href={showDownload}
                download="wallpaper.webm"
                style={{
                  ...btnBase,
                  background: '#4fc3f7',
                  color: '#0a0a1a',
                  padding: '8px 20px',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                ⬇ 下载 WebM
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
