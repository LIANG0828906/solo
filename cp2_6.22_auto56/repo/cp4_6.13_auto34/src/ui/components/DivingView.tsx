import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';
import { shipNavigation } from '../../modules/ship/ShipNavigation';

const DivingView: React.FC = () => {
  const depth = useGameStore((s) => s.depth);
  const maxDepth = useGameStore((s) => s.maxDepth);
  const oxygen = useGameStore((s) => s.oxygen);
  const maxOxygen = useGameStore((s) => s.maxOxygen);
  const pressure = useGameStore((s) => s.pressure);
  const maxPressure = useGameStore((s) => s.maxPressure);
  const engineStarted = useGameStore((s) => s.engineStarted);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [canvasSize, setCanvasSize] = useState({ w: 500, h: 450 });

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const w = Math.max(400, Math.floor(rect.width));
        const h = Math.max(400, Math.floor(rect.height));
        setCanvasSize({ w, h });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    shipNavigation.start();

    const renderLoop = () => {
      if (canvasRef.current) {
        shipNavigation.render(canvasRef.current);
      }
      animFrameRef.current = requestAnimationFrame(renderLoop);
    };
    animFrameRef.current = requestAnimationFrame(renderLoop);

    return () => {
      shipNavigation.stop();
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const handleAscend = useCallback(() => {
    shipNavigation.ascend();
  }, []);

  const handleDescend = useCallback(() => {
    shipNavigation.descend();
  }, []);

  const depthPct = (depth / maxDepth) * 100;
  const oxygenPct = (oxygen / maxOxygen) * 100;
  const pressurePct = (pressure / maxPressure) * 100;

  const gaugePointerAngle = -135 + (depthPct / 100) * 270;

  const getOxygenColor = () => {
    if (oxygenPct > 60) return '#48bb78';
    if (oxygenPct > 30) return '#ecc94b';
    return '#f56565';
  };

  const getPressureColor = () => {
    if (pressurePct < 30) return '#48bb78';
    if (pressurePct < 60) return '#ecc94b';
    return '#f56565';
  };

  return (
    <div
      ref={containerRef}
      className="glass-panel glow-panel"
      style={{
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        height: '100%',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ color: '#64ffda', fontSize: 16, fontWeight: 600 }}>
          🚤 垂直剖面下潜
        </h3>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className="btn"
            onClick={handleAscend}
            disabled={!engineStarted}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            ↑ 上浮
          </button>
          <button
            className="btn"
            onClick={handleDescend}
            disabled={!engineStarted}
            style={{ padding: '6px 14px', fontSize: 12 }}
          >
            ↓ 下潜
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>
        <div
          style={{
            flex: 1,
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid rgba(100, 255, 218, 0.2)',
            background: '#020e1f',
          }}
        >
          <canvas
            ref={canvasRef}
            width={canvasSize.w - 180}
            height={canvasSize.h - 40}
            style={{ display: 'block', width: '100%', height: '100%' }}
          />
        </div>

        <div
          style={{
            width: 180,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div
            style={{
              background: 'rgba(16, 42, 67, 0.6)',
              borderRadius: 10,
              padding: 12,
              border: '1px solid rgba(100, 255, 218, 0.15)',
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: '#8892b0',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              深度计
            </div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1 / 1',
              }}
            >
              <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#0d3b66" />
                    <stop offset="100%" stopColor="#051c30" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="46" fill="url(#gaugeGrad)" stroke="rgba(100,255,218,0.3)" strokeWidth="1" />
                {Array.from({ length: 27 }).map((_, i) => {
                  const angle = (-135 + i * 10) * (Math.PI / 180);
                  const isMajor = i % 3 === 0;
                  const r1 = isMajor ? 38 : 41;
                  const r2 = 44;
                  const x1 = 50 + r1 * Math.cos(angle);
                  const y1 = 50 + r1 * Math.sin(angle);
                  const x2 = 50 + r2 * Math.cos(angle);
                  const y2 = 50 + r2 * Math.sin(angle);
                  return (
                    <line
                      key={i}
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={isMajor ? 'rgba(100,255,218,0.8)' : 'rgba(100,255,218,0.3)'}
                      strokeWidth={isMajor ? 1.5 : 0.8}
                    />
                  );
                })}
                <circle cx="50" cy="50" r="32" fill="none" stroke="rgba(100,255,218,0.1)" strokeWidth="0.5" strokeDasharray="2 2" />
                <line
                  x1="50"
                  y1="50"
                  x2={50 + 28 * Math.cos(gaugePointerAngle * (Math.PI / 180))}
                  y2={50 + 28 * Math.sin(gaugePointerAngle * (Math.PI / 180))}
                  stroke={depth > 50 ? '#ff6b6b' : '#64ffda'}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  style={{ filter: `drop-shadow(0 0 3px ${depth > 50 ? '#ff6b6b' : '#64ffda'})` }}
                />
                <circle cx="50" cy="50" r="4" fill="#64ffda" />
                <circle cx="50" cy="50" r="2" fill="#0a192f" />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: '18%',
                }}
              >
                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    color: depth > 50 ? '#ff6b6b' : '#64ffda',
                    lineHeight: 1,
                    textShadow: `0 0 8px ${depth > 50 ? 'rgba(255,107,107,0.6)' : 'rgba(100,255,218,0.6)'}`,
                  }}
                >
                  {depth}
                </div>
                <div
                  style={{
                    fontSize: 9,
                    color: '#8892b0',
                    fontFamily: 'monospace',
                  }}
                >
                  米 / {maxDepth}m
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(16, 42, 67, 0.6)',
              borderRadius: 10,
              padding: 12,
              border: '1px solid rgba(100, 255, 218, 0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#8892b0',
                marginBottom: 6,
              }}
            >
              <span>💨 氧气</span>
              <span style={{ fontFamily: 'monospace', color: getOxygenColor() }}>
                {oxygen.toFixed(0)}%
              </span>
            </div>
            <div
              style={{
                height: 12,
                borderRadius: 6,
                backgroundColor: '#0a192f',
                overflow: 'hidden',
                border: '1px solid rgba(100, 255, 218, 0.1)',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${oxygenPct}%`,
                  background: `linear-gradient(90deg, ${getOxygenColor()}, ${getOxygenColor()}bb)`,
                  transition: 'all 0.3s ease',
                  boxShadow: `0 0 8px ${getOxygenColor()}80`,
                }}
              />
            </div>
          </div>

          <div
            style={{
              background: 'rgba(16, 42, 67, 0.6)',
              borderRadius: 10,
              padding: 12,
              border: '1px solid rgba(100, 255, 218, 0.15)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11,
                color: '#8892b0',
                marginBottom: 6,
              }}
            >
              <span>🌡️ 压力</span>
              <span style={{ fontFamily: 'monospace', color: getPressureColor() }}>
                {pressure.toFixed(0)}%
              </span>
            </div>
            <div
              style={{
                position: 'relative',
                width: '100%',
                height: 60,
              }}
            >
              <svg viewBox="0 0 100 60" style={{ width: '100%', height: '100%' }}>
                <defs>
                  <clipPath id="trapClip">
                    <polygon points="15,5 85,5 95,55 5,55" />
                  </clipPath>
                </defs>
                <polygon
                  points="15,5 85,5 95,55 5,55"
                  fill="#0a192f"
                  stroke="rgba(100, 255, 218, 0.2)"
                  strokeWidth="1"
                />
                <rect
                  x="5"
                  y={55 - (pressurePct / 100) * 50}
                  width="90"
                  height={(pressurePct / 100) * 50}
                  fill={`url(#pressGrad)`}
                  clipPath="url(#trapClip)"
                  style={{ transition: 'all 0.3s ease' }}
                />
                <defs>
                  <linearGradient id="pressGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#48bb78" />
                    <stop offset="50%" stopColor="#ecc94b" />
                    <stop offset="100%" stopColor="#f56565" />
                  </linearGradient>
                </defs>
                {[25, 50, 75].map((p) => (
                  <line
                    key={p}
                    x1="10"
                    y1={55 - (p / 100) * 50}
                    x2="90"
                    y2={55 - (p / 100) * 50}
                    stroke="rgba(100, 255, 218, 0.15)"
                    strokeWidth="0.5"
                    strokeDasharray="2 2"
                  />
                ))}
              </svg>
            </div>
          </div>

          <div
            style={{
              fontSize: 10,
              color: '#5a6a85',
              textAlign: 'center',
              lineHeight: 1.5,
              padding: '6px 4px',
              fontFamily: 'monospace',
            }}
          >
            按 W/S 或 ↑/↓ 控制<br />
            超过50米氧气消耗翻倍
          </div>
        </div>
      </div>
    </div>
  );
};

export default DivingView;
