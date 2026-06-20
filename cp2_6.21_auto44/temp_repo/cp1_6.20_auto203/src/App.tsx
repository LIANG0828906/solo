import { useEffect, useRef, useState, useCallback } from 'react';
import { AudioEngine } from './AudioEngine';
import { Scene3D } from './Scene3D';

type NoteName = 'drum' | 'bass' | 'chord' | 'fx';

interface SceneTrigger {
  noteName: string;
  intensity: number;
}

interface ButtonConfig {
  note: NoteName;
  key: string;
  label: string;
  color: string;
}

const BUTTONS: ButtonConfig[] = [
  { note: 'drum', key: 'a', label: '鼓', color: '#9d4edd' },
  { note: 'bass', key: 's', label: '贝斯', color: '#00f5d4' },
  { note: 'chord', key: 'd', label: '和弦', color: '#ff6b35' },
  { note: 'fx', key: 'f', label: 'FX', color: '#ff006e' }
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const scene3DRef = useRef<Scene3D | null>(null);
  const triggersRef = useRef<SceneTrigger[]>([]);
  const pressedKeysRef = useRef<Set<string>>(new Set());
  const animationIdRef = useRef<number | null>(null);
  const waveformColorRef = useRef<string>('rgb(123, 44, 191)');
  const countAnimRef = useRef<number>(0);

  const [beatCount, setBeatCount] = useState(0);
  const [countAnimating, setCountAnimating] = useState(false);

  const handleNote = useCallback((note: NoteName) => {
    if (!audioEngineRef.current) return;

    audioEngineRef.current.playNote(note);
    triggersRef.current.push({ noteName: note, intensity: 1 });

    setBeatCount(prev => prev + 1);
    setCountAnimating(true);
    countAnimRef.current = Date.now();

    setTimeout(() => {
      if (Date.now() - countAnimRef.current >= 300) {
        setCountAnimating(false);
      }
    }, 300);
  }, []);

  useEffect(() => {
    audioEngineRef.current = new AudioEngine();

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (pressedKeysRef.current.has(key)) return;

      const button = BUTTONS.find(b => b.key === key);
      if (button) {
        pressedKeysRef.current.add(key);
        handleNote(button.note);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      pressedKeysRef.current.delete(key);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      audioEngineRef.current?.dispose();
    };
  }, [handleNote]);

  useEffect(() => {
    if (!canvasRef.current) return;

    scene3DRef.current = new Scene3D(canvasRef.current);
    scene3DRef.current.setOnFrameCallback((color) => {
      waveformColorRef.current = color;
    });

    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      if (!audioEngineRef.current || !scene3DRef.current) return;

      const analysis = audioEngineRef.current.getAnalysis();
      const triggers = [...triggersRef.current];
      triggersRef.current = [];

      scene3DRef.current.update(analysis, triggers);
    };

    animate();

    const handleResize = () => {
      if (scene3DRef.current) {
        scene3DRef.current.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      scene3DRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas || !audioEngineRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let waveformAnimId: number;

    const drawWaveform = () => {
      waveformAnimId = requestAnimationFrame(drawWaveform);

      const { timeDomainData } = audioEngineRef.current!.getAnalysis();

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.strokeStyle = waveformColorRef.current;
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const sliceWidth = canvas.width / timeDomainData.length;
      let x = 0;

      for (let i = 0; i < timeDomainData.length; i++) {
        const v = timeDomainData[i];
        const y = (v + 1) * (canvas.height / 2);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    };

    drawWaveform();

    return () => {
      cancelAnimationFrame(waveformAnimId);
    };
  }, []);

  const handleButtonDown = (note: NoteName) => {
    handleNote(note);
  };

  return (
    <div style={styles.container}>
      <canvas
        ref={canvasRef}
        style={styles.canvas}
      />

      <div style={styles.counter}>
        <span style={styles.counterLabel}>节拍数</span>
        <span
          style={{
            ...styles.counterValue,
            transform: countAnimating ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.3s ease-out'
          }}
        >
          {beatCount}
        </span>
      </div>

      <canvas
        ref={waveformRef}
        width={200}
        height={80}
        style={styles.waveform}
      />

      <div style={styles.buttonContainer}>
        {BUTTONS.map((button) => (
          <button
            key={button.note}
            onMouseDown={() => handleButtonDown(button.note)}
            onTouchStart={(e) => {
              e.preventDefault();
              handleButtonDown(button.note);
            }}
            style={{
              ...styles.button,
              backgroundColor: button.color,
              boxShadow: `0 0 15px ${button.color}, 0 0 30px ${button.color}40`
            }}
            onMouseDownCapture={(e) => {
              const target = e.currentTarget as HTMLButtonElement;
              target.style.transform = 'scale(0.9)';
              setTimeout(() => {
                target.style.transform = 'scale(1)';
              }, 100);
            }}
          >
            <span style={styles.buttonLabel}>{button.label}</span>
            <span style={styles.buttonKey}>{button.key.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative' as const,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    backgroundColor: '#0d0d0d'
  },
  canvas: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%'
  },
  counter: {
    position: 'absolute' as const,
    top: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    zIndex: 10,
    pointerEvents: 'none' as const
  },
  counterLabel: {
    color: '#ffffff80',
    fontSize: '14px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    letterSpacing: '2px',
    textTransform: 'uppercase' as const,
    marginBottom: '8px'
  },
  counterValue: {
    color: '#ffffff',
    fontSize: '72px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    textShadow: '0 0 20px rgba(255,255,255,0.5)'
  },
  waveform: {
    position: 'absolute' as const,
    bottom: '120px',
    right: '20px',
    width: '200px',
    height: '80px',
    borderRadius: '8px',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 10,
    pointerEvents: 'none' as const
  },
  buttonContainer: {
    position: 'absolute' as const,
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    gap: '24px',
    zIndex: 10
  },
  button: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s ease-out, box-shadow 0.2s ease-out',
    userSelect: 'none' as const,
    outline: 'none'
  },
  buttonLabel: {
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    textShadow: '0 0 10px rgba(0,0,0,0.5)'
  },
  buttonKey: {
    color: '#ffffff80',
    fontSize: '12px',
    fontFamily: 'monospace',
    marginTop: '2px'
  }
};
