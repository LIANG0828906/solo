import { useState, useRef, useCallback } from 'react';
import { useSequenceStore } from '@/store/sequenceStore';

interface ToolbarProps {
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

export default function Toolbar({ canvasRef }: ToolbarProps) {
  const { toggleAutoRotate, viewParams } = useSequenceStore();
  const { autoRotate } = viewParams;

  const [isRecording, setIsRecording] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleResetView = useCallback(() => {
    if (canvasRef?.current) {
      const canvas = canvasRef.current;
      const renderer = (canvas as any).__r3f?.root?.state?.gl;
      const camera = (canvas as any).__r3f?.root?.state?.camera;
      if (camera) {
        const startPos = camera.position.clone();
        const targetPos = { x: 0, y: 5, z: 15 };
        const startTime = Date.now();
        const duration = 800;

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const t = Math.min(1, elapsed / duration);
          const ease = 1 - Math.pow(1 - t, 3);

          camera.position.x = startPos.x + (targetPos.x - startPos.x) * ease;
          camera.position.y = startPos.y + (targetPos.y - startPos.y) * ease;
          camera.position.z = startPos.z + (targetPos.z - startPos.z) * ease;
          camera.lookAt(0, 0, 0);

          if (t < 1) {
            requestAnimationFrame(animate);
          }
        };
        animate();
      }
    }
  }, [canvasRef]);

  const handleScreenshot = useCallback(() => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    if (canvasRef?.current) {
      const canvas = canvasRef.current;
      requestAnimationFrame(() => {
        try {
          const dataURL = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `dna-helix-${Date.now()}.png`;
          link.href = dataURL;
          link.click();
        } catch (e) {
          console.error('Screenshot failed:', e);
        }
      });
    }
  }, [canvasRef]);

  const handleToggleRecord = useCallback(() => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      if (canvasRef?.current) {
        try {
          const stream = (canvasRef.current as any).captureStream(30);
          const mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9',
          });

          chunksRef.current = [];
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
              chunksRef.current.push(e.data);
            }
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.download = `dna-animation-${Date.now()}.webm`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);
          };

          mediaRecorder.start();
          mediaRecorderRef.current = mediaRecorder;
          setIsRecording(true);
        } catch (e) {
          console.error('Recording failed:', e);
          alert('您的浏览器不支持画布录制功能');
        }
      }
    }
  }, [isRecording, canvasRef]);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: '24px',
          left: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 100,
        }}
      >
        <ToolButton
          icon="⟲"
          label="重置视角"
          onClick={handleResetView}
        />
        <ToolButton
          icon="📷"
          label="截图"
          onClick={handleScreenshot}
        />
        <ToolButton
          icon={isRecording ? '⏹' : '⏺'}
          label={isRecording ? '停止录制' : '录制动画'}
          onClick={handleToggleRecord}
          active={isRecording}
          activeColor="#ff4444"
        />
        <ToolButton
          icon={autoRotate ? '◐' : '◑'}
          label={autoRotate ? '停止旋转' : '自动旋转'}
          onClick={toggleAutoRotate}
          active={autoRotate}
          activeColor="#00d4ff"
        />
      </div>

      {isRecording && (
        <div
          style={{
            position: 'fixed',
            top: '28px',
            right: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 100,
            padding: '6px 12px',
            background: 'rgba(255, 50, 50, 0.2)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 100, 100, 0.4)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#ff4444',
              boxShadow: '0 0 10px #ff4444, 0 0 20px #ff4444',
              animation: 'blink 1s ease-in-out infinite',
            }}
          />
          <span
            style={{
              color: '#ffaaaa',
              fontSize: '11px',
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '1px',
            }}
          >
            REC
          </span>
        </div>
      )}

      {showFlash && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'white',
            opacity: 0.7,
            pointerEvents: 'none',
            zIndex: 9999,
            animation: 'shutter 0.15s ease-out forwards',
          }}
        />
      )}

      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes shutter {
          0% { opacity: 0.8; }
          100% { opacity: 0; }
        }
      `}</style>
    </>
  );
}

interface ToolButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
  activeColor?: string;
}

function ToolButton({ icon, label, onClick, active, activeColor = '#00d4ff' }: ToolButtonProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: active
            ? `linear-gradient(135deg, ${activeColor}33, ${activeColor}22)`
            : 'rgba(20, 20, 50, 0.8)',
          border: `1px solid ${active ? activeColor : 'rgba(100, 100, 255, 0.4)'}`,
          color: active ? activeColor : '#e0e0ff',
          cursor: 'pointer',
          fontSize: '18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          transform: isHovered ? 'scale(1.15)' : 'scale(1)',
          boxShadow: isHovered
            ? `0 0 25px ${active ? activeColor : 'rgba(100, 150, 255, 0.5)'}`
            : 'none',
        }}
      >
        {icon}
      </button>

      {isHovered && (
        <div
          style={{
            position: 'absolute',
            left: '56px',
            top: '50%',
            transform: 'translateY(-50%)',
            padding: '6px 12px',
            background: 'rgba(15, 15, 40, 0.95)',
            border: '1px solid rgba(100, 100, 255, 0.3)',
            borderRadius: '6px',
            color: '#e0e0ff',
            fontSize: '11px',
            fontFamily: "'JetBrains Mono', monospace",
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 0.2s ease',
            backdropFilter: 'blur(8px)',
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}
