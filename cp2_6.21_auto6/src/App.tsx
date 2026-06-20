import { useEffect, useRef } from 'react';
import { useStore } from './store/useStore';
import audioEngine from './audioEngine';
import { SceneManager } from './sceneManager';
import { LeftPanel } from './components/LeftPanel';
import { RightPanel } from './components/RightPanel';
import { TopBar } from './components/TopBar';
import { themes } from './types';
import type { ElementType } from './types';

function App() {
  const theme = useStore((state) => state.theme);
  const audioLoaded = useStore((state) => state.audioLoaded);
  const elements = useStore((state) => state.elements);
  const isRecording = useStore((state) => state.isRecording);
  const setCurrentTime = useStore((state) => state.setCurrentTime);
  const setPlaying = useStore((state) => state.setPlaying);
  const setFrequencyData = useStore((state) => state.setFrequencyData);
  const setRecording = useStore((state) => state.setRecording);
  const addElement = useStore((state) => state.addElement);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  const themeColors = themes[theme];

  useEffect(() => {
    audioEngine.onFrequencyUpdate = (data) => {
      setFrequencyData(new Uint8Array(data));
    };

    audioEngine.onTimeUpdate = (time) => {
      setCurrentTime(time);
    };

    audioEngine.onEnded = () => {
      setPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audioEngine.stop();
    };
  }, [setFrequencyData, setCurrentTime, setPlaying]);

  useEffect(() => {
    if (!isRecording) return;

    const canvas = document.querySelector('canvas');
    if (!canvas) {
      console.warn('No canvas found for recording');
      return;
    }

    canvasRef.current = canvas;

    try {
      const stream = canvas.captureStream(60);
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });

      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
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

      mediaRecorder.start();
    } catch (err) {
      console.error('Failed to start recording:', err);
      setRecording(false);
    }

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [isRecording, setRecording]);

  const handleRecordToggle = (recording: boolean) => {
    if (recording) {
      setRecording(true);
    } else {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const elementType = e.dataTransfer.getData('elementType') as ElementType;
    if (elementType) {
      addElement(elementType);
    }
  };

  const gradientStyle = {
    background: `linear-gradient(180deg, ${themeColors.bg} 0%, #1a0a2e 100%)`,
    transition: 'background 0.6s ease',
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        ...gradientStyle,
        position: 'relative',
      }}
    >
      <TopBar onRecordToggle={handleRecordToggle} />

      <div
        ref={canvasContainerRef}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        }}
      >
        <SceneManager />
      </div>

      <LeftPanel />
      <RightPanel />

      {!audioLoaded && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.6)',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎵</div>
          <div style={{ fontSize: '18px', marginBottom: '8px' }}>
            上传音乐开始创作
          </div>
          <div style={{ fontSize: '13px', opacity: 0.6 }}>
            支持 MP3 / WAV 格式，时长不超过 2 分钟
          </div>
        </div>
      )}

      {audioLoaded && elements.length === 0 && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.5)',
            pointerEvents: 'none',
            zIndex: 50,
          }}
        >
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>✨</div>
          <div style={{ fontSize: '15px' }}>
            从左侧面板拖拽元素到场景中
          </div>
        </div>
      )}

      {isRecording && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(255, 0, 0, 0.8)',
            color: 'white',
            padding: '8px 20px',
            borderRadius: '20px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 150,
            animation: 'pulse 1s infinite',
          }}
        >
          <span style={{ fontSize: '10px' }}>●</span>
          正在录制...
        </div>
      )}

      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          overflow: hidden;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}

export default App;
