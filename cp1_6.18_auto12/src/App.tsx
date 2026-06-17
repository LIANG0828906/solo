import React, { useState, useMemo, useRef, useEffect } from 'react';
import ParticleField from './ParticleField';
import HistoryPanel from './HistoryPanel';
import {
  analyzeSentiment,
  getDominantEmotion,
  getSecondaryEmotion,
  generateThumbnail,
} from './SentimentAnalyzer';
import { Emotion, HistoryRecord } from './types';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [emotions, setEmotions] = useState<Emotion[]>([
    { name: '喜悦', color: '#FF8C00', intensity: 1.5 },
    { name: '焦虑', color: '#8B7DA6', intensity: 1.0 },
    { name: '平静', color: '#40E0D0', intensity: 2.0 },
  ]);
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hoverButton, setHoverButton] = useState(false);
  const animKeyRef = useRef(0);
  const [animKey, setAnimKey] = useState(0);

  const dominant = useMemo(() => getDominantEmotion(emotions), [emotions]);
  const secondary = useMemo(() => getSecondaryEmotion(emotions), [emotions]);

  const totalIntensity = useMemo(
    () => emotions.reduce((s, e) => s + e.intensity, 0) || 1,
    [emotions]
  );

  const handleSubmit = () => {
    if (!inputText.trim() || isAnalyzing) return;
    setIsAnalyzing(true);

    setTimeout(() => {
      const result = analyzeSentiment(inputText);
      setEmotions(result);
      animKeyRef.current += 1;
      setAnimKey(animKeyRef.current);

      const thumbnail = generateThumbnail(result, 60);
      const record: HistoryRecord = {
        id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
        timestamp: Date.now(),
        inputText: inputText.slice(0, 30),
        emotions: result,
        thumbnailData: thumbnail,
      };

      setHistory((prev) => {
        const updated = [record, ...prev];
        return updated.slice(0, 6);
      });

      setIsAnalyzing(false);
    }, 800);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const handleSelectHistory = (record: HistoryRecord) => {
    setEmotions(record.emotions);
    animKeyRef.current += 1;
    setAnimKey(animKeyRef.current);
  };

  const arcRadius = 60;
  const arcWidth = 8;
  const arcSize = (arcRadius + arcWidth) * 2;
  const cx = arcSize / 2;
  const cy = arcSize / 2;

  const describeArc = (
    cx: number,
    cy: number,
    r: number,
    startAngle: number,
    endAngle: number
  ): string => {
    const start = polarToCartesian(cx, cy, r, endAngle);
    const end = polarToCartesian(cx, cy, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
      'M', start.x, start.y,
      'A', r, r, 0, largeArcFlag, 0, end.x, end.y,
    ].join(' ');
  };

  const polarToCartesian = (
    cx: number,
    cy: number,
    r: number,
    angleDeg: number
  ) => {
    const angleRad = ((angleDeg - 90) * Math.PI) / 180;
    return {
      x: cx + r * Math.cos(angleRad),
      y: cy + r * Math.sin(angleRad),
    };
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #111118 0%, #1E1E28 100%)',
        color: '#E0E0E8',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '24px 20px 16px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '14px',
          flexShrink: 0,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <h1
            style={{
              fontSize: '26px',
              fontWeight: 600,
              margin: 0,
              letterSpacing: '4px',
              background: 'linear-gradient(90deg, #FF8C00, #8B7DA6, #40E0D0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            情绪回声
          </h1>
          <p
            style={{
              fontSize: '12px',
              color: '#888',
              margin: '4px 0 0',
              letterSpacing: '2px',
            }}
          >
            Emotion Echo
          </p>
        </div>

        <div
          style={{
            width: '80%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
          }}
          className="input-wrapper"
        >
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value.slice(0, 300))}
            onKeyDown={handleKeyDown}
            placeholder="输入一段描述心情或事件的文字..."
            maxLength={300}
            style={{
              width: '100%',
              height: '100px',
              background: '#1E1E28',
              color: '#FFFFFF',
              fontSize: '16px',
              borderRadius: '12px',
              border: '1px solid #3A3A4A',
              padding: '14px 16px',
              outline: 'none',
              resize: 'none',
              lineHeight: 1.5,
              boxSizing: 'border-box',
              fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => (e.currentTarget.style.borderColor = '#5A5A6A')}
            onBlur={(e) => (e.currentTarget.style.borderColor = '#3A3A4A')}
          />

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            <span
              style={{
                fontSize: '12px',
                color: '#888',
              }}
            >
              {inputText.length}/300
            </span>

            <div style={{ position: 'relative', width: '60px', height: '60px' }}>
              {isAnalyzing && (
                <svg
                  width="60"
                  height="60"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    animation: 'spinRing 3s linear infinite',
                  }}
                >
                  <defs>
                    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={dominant.color} />
                      <stop offset="100%" stopColor={secondary.color} />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="30"
                    cy="30"
                    r="26"
                    fill="none"
                    stroke="url(#ringGrad)"
                    strokeWidth="2"
                    strokeDasharray="120 40"
                    strokeLinecap="round"
                  />
                </svg>
              )}
              <button
                onClick={handleSubmit}
                onMouseEnter={() => setHoverButton(true)}
                onMouseLeave={() => setHoverButton(false)}
                disabled={isAnalyzing || !inputText.trim()}
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: 'none',
                  cursor: isAnalyzing || !inputText.trim() ? 'not-allowed' : 'pointer',
                  background: 'linear-gradient(135deg, #FF8C00, #40E0D0)',
                  boxShadow: hoverButton
                    ? '0 0 18px rgba(255,255,255,0.5), 0 0 4px rgba(255,255,255,0.9)'
                    : '0 0 12px rgba(255,255,255,0.35), 0 0 2px rgba(255,255,255,0.7)',
                  filter: hoverButton ? 'brightness(1.1)' : 'brightness(1)',
                  transition: 'all 0.2s ease',
                  opacity: isAnalyzing || !inputText.trim() ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: '400px',
          margin: '0 16px',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid #2A2A38',
        }}
        className="canvas-container"
      >
        <ParticleField key={animKey} emotions={emotions} />

        <div
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'rgba(30, 30, 40, 0.85)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ fontSize: '12px', color: '#888' }}>主导情绪</div>
            <div
              style={{
                fontSize: '18px',
                color: '#FFFFFF',
                fontWeight: 600,
              }}
            >
              {dominant.name}
            </div>
            <div
              style={{
                fontSize: '14px',
                color: dominant.color,
                fontWeight: 500,
              }}
            >
              强度: {dominant.intensity.toFixed(1)}
            </div>
          </div>

          <svg width={arcSize} height={arcSize}>
            {(() => {
              let angleCursor = 0;
              const arcs = emotions.map((e) => {
                const percent = e.intensity / totalIntensity;
                const sweep = percent * 360;
                const startAngle = angleCursor;
                const endAngle = angleCursor + sweep;
                angleCursor = endAngle;

                const path = describeArc(
                  cx,
                  cy,
                  arcRadius,
                  startAngle,
                  endAngle - 0.5
                );

                return (
                  <path
                    key={e.name}
                    d={path}
                    fill="none"
                    stroke={e.color}
                    strokeWidth={arcWidth}
                    strokeLinecap="round"
                  />
                );
              });
              return arcs;
            })()}
            <circle cx={cx} cy={cy} r={arcRadius - arcWidth} fill="none" />
          </svg>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '16px',
            display: 'flex',
            gap: '12px',
            background: 'rgba(30, 30, 40, 0.7)',
            padding: '8px 12px',
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {emotions.map((e) => (
            <div
              key={e.name}
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <div
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: e.color,
                  boxShadow: `0 0 6px ${e.color}`,
                }}
              />
              <span style={{ fontSize: '12px', color: '#CCC' }}>
                {e.name} {e.intensity.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '16px', flexShrink: 0 }}>
        <HistoryPanel records={history} onSelect={handleSelectHistory} />
      </div>

      <style>{`
        @keyframes spinRing {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .input-wrapper {
            width: 95% !important;
          }
          .canvas-container {
            min-height: 300px !important;
          }
          textarea {
            height: 80px !important;
          }
        }
        textarea::placeholder {
          color: #666;
        }
        * {
          box-sizing: border-box;
        }
        body {
          margin: 0;
          padding: 0;
          background: #111118;
        }
      `}</style>
    </div>
  );
};

export default App;
