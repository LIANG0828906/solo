import { useState, useRef, useEffect } from 'react';
import ParticleScene from './ParticleScene';
import type { ParticleSceneHandle } from './ParticleScene';
import { analyzeEmotion, emotionColors } from './emotionAnalyzer';
import type { EmotionType } from './emotionAnalyzer';

function App() {
  const [inputText, setInputText] = useState('');
  const [emotion, setEmotion] = useState<EmotionType | null>(null);
  const [intensity, setIntensity] = useState(50);
  const [showInput, setShowInput] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasRef = useRef<ParticleSceneHandle>(null);

  const handleGenerate = () => {
    if (!inputText.trim()) return;
    const result = analyzeEmotion(inputText);
    setIsTransitioning(true);
    setShowInput(false);
    setTimeout(() => {
      setEmotion(result.type);
      setIntensity(Math.max(20, Math.min(100, result.score + 30)));
      setTimeout(() => {
        setIsTransitioning(false);
      }, 1500);
    }, 800);
  };

  const handleReset = () => {
    setEmotion(null);
    setShowInput(true);
    setInputText('');
    setIntensity(50);
  };

  const handleSave = () => {
    const dataUrl = canvasRef.current?.exportImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `emotion-poster-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const sliderColor = () => {
    const ratio = intensity / 100;
    const r = Math.round(52 + (231 - 52) * ratio);
    const g = Math.round(152 + (76 - 152) * ratio);
    const b = Math.round(219 + (60 - 219) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div style={styles.container}>
      <ParticleScene ref={canvasRef} emotion={emotion} intensity={intensity} />

      {showInput && (
        <div style={{
          ...styles.inputWrapper,
          opacity: isTransitioning ? 0 : 1,
          transform: isTransitioning ? 'scale(0.95)' : 'scale(1)',
          transition: 'opacity 0.8s ease, transform 0.8s ease'
        }}>
          <div style={styles.rippleContainer}>
            <div style={{ ...styles.ripple, animationDelay: '0s' }} />
            <div style={{ ...styles.ripple, animationDelay: '0.66s' }} />
            <div style={{ ...styles.ripple, animationDelay: '1.33s' }} />
          </div>
          <div style={styles.inputCard}>
            <h2 style={styles.title}>情绪可视化海报</h2>
            <p style={styles.subtitle}>输入文字，让情绪化作流动的光影</p>
            <textarea
              style={styles.textarea}
              placeholder="输入一段诗歌、歌词或心情描述..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  handleGenerate();
                }
              }}
            />
            <button
              style={{
                ...styles.generateBtn,
                opacity: inputText.trim() ? 1 : 0.5,
                cursor: inputText.trim() ? 'pointer' : 'not-allowed'
              }}
              onClick={handleGenerate}
              disabled={!inputText.trim()}
            >
              生成海报
            </button>
          </div>
        </div>
      )}

      {emotion && (
        <>
          <div style={{
            ...styles.emotionLabel,
            opacity: isTransitioning ? 0 : 1,
            transition: 'opacity 1s ease 0.5s',
            color: emotionColors[emotion].start
          }}>
            {emotionColors[emotion].label}
          </div>

          <button style={styles.resetBtn} onClick={handleReset}>
            重置
          </button>

          <div style={styles.controlPanel}>
            <div style={styles.sliderWrapper}>
              <span style={styles.sliderLabel}>强度</span>
              <input
                type="range"
                min="0"
                max="100"
                value={intensity}
                onChange={(e) => setIntensity(Number(e.target.value))}
                style={{
                  ...styles.slider,
                  background: `linear-gradient(to right, #3498db 0%, ${sliderColor()} ${intensity}%, #444 ${intensity}%, #444 100%)`
                }}
              />
              <span style={styles.sliderValue}>{intensity}</span>
            </div>
            <button style={styles.saveBtn} onClick={handleSave}>
              保存 PNG
            </button>
          </div>
        </>
      )}

      <style>
        {`
          @keyframes ripple {
            0% {
              width: 0;
              height: 0;
              opacity: 0.6;
            }
            100% {
              width: 800px;
              height: 800px;
              opacity: 0;
            }
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }
          input[type="range"]::-moz-range-thumb {
            width: 18px;
            height: 18px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          }
        `}
      </style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: '#1a1a2e'
  },
  inputWrapper: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rippleContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 0,
    height: 0,
    pointerEvents: 'none'
  },
  ripple: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    border: '2px solid rgba(100, 180, 255, 0.4)',
    animation: 'ripple 2s ease-out infinite'
  },
  inputCard: {
    background: 'rgba(26, 26, 46, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: 20,
    padding: '40px 48px',
    width: 480,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(100, 180, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    zIndex: 1
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 2
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 28,
    letterSpacing: 1
  },
  textarea: {
    width: '100%',
    minHeight: 120,
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: '16px 18px',
    color: '#fff',
    fontSize: 15,
    lineHeight: 1.6,
    resize: 'none',
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 0.3s ease',
    marginBottom: 20
  },
  generateBtn: {
    width: '100%',
    padding: '14px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: 12,
    color: '#fff',
    fontSize: 16,
    fontWeight: 500,
    letterSpacing: 2,
    transition: 'transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease'
  },
  emotionLabel: {
    position: 'absolute',
    top: 40,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 48,
    fontWeight: 300,
    letterSpacing: 12,
    textShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
    zIndex: 5
  },
  resetBtn: {
    position: 'absolute',
    bottom: 32,
    left: 32,
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.2s ease, transform 0.2s ease',
    zIndex: 10
  },
  controlPanel: {
    position: 'absolute',
    bottom: 32,
    right: 32,
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    zIndex: 10
  },
  sliderWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    background: 'rgba(255, 255, 255, 0.08)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    borderRadius: 10,
    padding: '10px 18px'
  },
  sliderLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    letterSpacing: 1
  },
  slider: {
    width: 140,
    height: 4,
    borderRadius: 2,
    outline: 'none',
    WebkitAppearance: 'none',
    appearance: 'none',
    cursor: 'pointer'
  },
  sliderValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 500,
    minWidth: 28,
    textAlign: 'right'
  },
  saveBtn: {
    padding: '12px 24px',
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    color: '#fff',
    fontSize: 14,
    cursor: 'pointer',
    transition: 'background 0.2s ease, transform 0.2s ease'
  }
};

export default App;
