import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useWindParams } from '@/context/WindContext';

interface FlipNumberProps {
  value: number;
  decimals?: number;
  unit?: string;
}

function FlipNumber({ value, decimals = 1, unit = '' }: FlipNumberProps) {
  const [displayKey, setDisplayKey] = useState(0);
  const prevValue = useRef(value);

  useEffect(() => {
    if (prevValue.current !== value) {
      prevValue.current = value;
      setDisplayKey((k) => k + 1);
    }
  }, [value]);

  return (
    <span className="param-value flip" key={displayKey}>
      {value.toFixed(decimals)}
      {unit && <span className="unit">{unit}</span>}
    </span>
  );
}

export default function ControlPanel() {
  const { windSpeed, windAngle, setWindSpeed, setWindAngle } = useWindParams();
  const [particleCount] = useState(3500);
  const [fps, setFps] = useState(60);

  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;

    const tick = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const handleSpeedChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setWindSpeed(parseFloat(e.target.value));
    },
    [setWindSpeed]
  );

  const handleAngleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setWindAngle(parseFloat(e.target.value));
    },
    [setWindAngle]
  );

  const handleReset = useCallback(() => {
    setWindSpeed(5);
    setWindAngle(0);
  }, [setWindSpeed, setWindAngle]);

  return (
    <div className="control-panel">
      <div className="glass-card panel-header">
        <h1>Wind Simulator</h1>
        <p>三维风向粒子模拟系统</p>
      </div>

      <div className="glass-card">
        <div className="card-title">风速控制</div>
        <div className="param-row">
          <div className="param-label">
            <span>风速</span>
            <FlipNumber value={windSpeed} decimals={1} unit=" m/s" />
          </div>
          <input
            type="range"
            className="wind-speed"
            min={0}
            max={20}
            step={0.1}
            value={windSpeed}
            onChange={handleSpeedChange}
          />
        </div>
      </div>

      <div className="glass-card">
        <div className="card-title">风向控制</div>
        <div className="param-row">
          <div className="param-label">
            <span>风向角度</span>
            <FlipNumber value={windAngle} decimals={0} unit="°" />
          </div>
          <input
            type="range"
            className="wind-angle"
            min={0}
            max={360}
            step={1}
            value={windAngle}
            onChange={handleAngleChange}
          />
        </div>
      </div>

      <div className="glass-card">
        <div className="card-title">场景信息</div>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{particleCount}</div>
            <div className="stat-label">粒子数</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{fps}</div>
            <div className="stat-label">FPS</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#ff9100' }}>
              {windSpeed.toFixed(1)}
            </div>
            <div className="stat-label">m/s</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: '#ff9100' }}>
              {windAngle}°
            </div>
            <div className="stat-label">角度</div>
          </div>
        </div>
      </div>

      <button className="btn" onClick={handleReset}>
        重置参数
      </button>

      <button className="btn btn-orange" onClick={() => setWindSpeed(15)}>
        模拟强风
      </button>
    </div>
  );
}
