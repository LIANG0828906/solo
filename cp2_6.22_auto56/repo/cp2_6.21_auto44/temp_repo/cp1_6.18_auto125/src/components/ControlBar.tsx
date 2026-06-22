import { useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { useAlgorithmStore } from '../stores/algorithmStore';

export function ControlBar() {
  const { playbackState, speed, togglePlay, prevStep, nextStep, setSpeed } = useAlgorithmStore();
  const playingRef = useRef(playbackState);
  const speedRef = useRef(speed);
  const intervalRef = useRef<number | null>(null);

  playingRef.current = playbackState;
  speedRef.current = speed;

  useEffect(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (playbackState === 'playing') {
      const baseInterval = 800;
      const interval = baseInterval / speed;
      intervalRef.current = window.setInterval(() => {
        useAlgorithmStore.getState().nextStep();
      }, interval);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [playbackState, speed]);

  const isPlaying = playbackState === 'playing';

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '80%',
        maxWidth: 720,
        height: 60,
        background: 'rgba(0, 0, 0, 0.4)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderRadius: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        padding: '0 24px',
        zIndex: 10,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      <button
        onClick={prevStep}
        style={buttonStyle(32, '#3D3D5C')}
        onMouseEnter={(e) => handleHover(e, true)}
        onMouseLeave={(e) => handleHover(e, false)}
        title="上一步"
      >
        <SkipBack size={16} color="#FFFFFF" />
      </button>

      <button
        onClick={togglePlay}
        style={{
          ...buttonStyle(36, isPlaying ? '#FFAA00' : '#00FF88'),
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => handleHover(e, true)}
        onMouseLeave={(e) => handleHover(e, false)}
        title={isPlaying ? '暂停' : '播放'}
      >
        {isPlaying ? (
          <Pause size={18} color="#FFFFFF" />
        ) : (
          <Play size={18} color="#FFFFFF" style={{ marginLeft: 2 }} />
        )}
      </button>

      <button
        onClick={nextStep}
        style={buttonStyle(32, '#3D3D5C')}
        onMouseEnter={(e) => handleHover(e, true)}
        onMouseLeave={(e) => handleHover(e, false)}
        title="下一步"
      >
        <SkipForward size={16} color="#FFFFFF" />
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginLeft: 12,
        }}
      >
        <span style={{ color: '#aaa', fontSize: 12, minWidth: 32 }}>{speed.toFixed(1)}x</span>
        <input
          type="range"
          min="0.5"
          max="3"
          step="0.1"
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
          style={sliderStyle}
        />
        <span style={{ color: '#666', fontSize: 12 }}>3x</span>
      </div>
    </div>
  );
}

function buttonStyle(size: number, bg: string): React.CSSProperties {
  return {
    width: size,
    height: size,
    borderRadius: '50%',
    background: bg,
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
    padding: 0,
    flexShrink: 0,
  };
}

function handleHover(e: React.MouseEvent<HTMLButtonElement>, isEnter: boolean): void {
  const target = e.currentTarget;
  if (isEnter) {
    target.style.transform = 'scale(1.08)';
    target.style.filter = 'brightness(1.15)';
  } else {
    target.style.transform = 'scale(1)';
    target.style.filter = 'brightness(1)';
  }
}

const sliderStyle: React.CSSProperties = {
  width: 200,
  height: 4,
  appearance: 'none',
  WebkitAppearance: 'none',
  background: '#555555',
  borderRadius: 2,
  outline: 'none',
  cursor: 'pointer',
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #FFFFFF;
    cursor: pointer;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    transition: transform 0.15s ease;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    transform: scale(1.15);
  }
  input[type="range"]::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #FFFFFF;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  }
`;
if (!document.querySelector('style[data-range-slider]')) {
  styleSheet.setAttribute('data-range-slider', 'true');
  document.head.appendChild(styleSheet);
}
