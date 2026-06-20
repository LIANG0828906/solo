import React, { useState, useEffect } from 'react';
import { GameState, BeeType } from '../types';

interface DashboardProps {
  gameState: GameState;
}

export const Dashboard: React.FC<DashboardProps> = ({ gameState }) => {
  const { hive, bees, wave, waveTimer, fps } = gameState;
  
  const collectorCount = bees.filter((b) => b.type === 'collector').length;
  const scoutCount = bees.filter((b) => b.type === 'scout').length;
  const guardianCount = bees.filter((b) => b.type === 'guardian').length;
  
  const [honeyScale, setHoneyScale] = useState(1);
  const [prevHoney, setPrevHoney] = useState(hive.honey);

  useEffect(() => {
    if (hive.honey !== prevHoney) {
      setHoneyScale(1.1);
      const timer = setTimeout(() => setHoneyScale(1), 300);
      setPrevHoney(hive.honey);
      return () => clearTimeout(timer);
    }
  }, [hive.honey, prevHoney]);

  const isWaveImminent = waveTimer < 10;

  return (
    <div className="dashboard">
      <div className="dashboard-item honey-item">
        <span className="honey-icon">🍯</span>
        <div className="dashboard-info">
          <div className="dashboard-label">蜂蜜储量</div>
          <div className="dashboard-value" style={{ transform: `scale(${honeyScale})` }}>
            {Math.floor(hive.honey)} / {hive.maxHoney}
          </div>
          <div className="honey-bar">
            <div 
              className="honey-bar-fill" 
              style={{ width: `${(hive.honey / hive.maxHoney) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="dashboard-item bees-item">
        <span className="bees-icon">🐝</span>
        <div className="dashboard-info">
          <div className="dashboard-label">蜜蜂数量</div>
          <div className="bee-counts">
            <div className="bee-count-item">
              <span className="bee-dot collector-dot" />
              <span>采集蜂: {collectorCount}</span>
            </div>
            <div className="bee-count-item">
              <span className="bee-dot scout-dot" />
              <span>侦察蜂: {scoutCount}</span>
            </div>
            <div className="bee-count-item">
              <span className="bee-dot guardian-dot" />
              <span>护卫蜂: {guardianCount}</span>
            </div>
          </div>
          <div className="bee-total">总计: {bees.length} / {hive.beeSlots}</div>
        </div>
      </div>

      <div className="dashboard-item level-item">
        <span className="level-icon">⬡</span>
        <div className="dashboard-info">
          <div className="dashboard-label">蜂巢等级</div>
          <div className="hive-stars">
            {Array.from({ length: hive.maxLevel }).map((_, i) => (
              <span key={i} className={`star ${i < hive.level ? 'active' : ''}`}>★</span>
            ))}
          </div>
        </div>
      </div>

      <div className={`dashboard-item wave-item ${isWaveImminent ? 'warning' : ''}`}>
        <span className="wave-icon">⚠️</span>
        <div className="dashboard-info">
          <div className="dashboard-label">当前波次</div>
          <div className="wave-info">
            <span className="wave-number">第 {wave} 波</span>
            <span className={`wave-timer ${isWaveImminent ? 'blinking' : ''}`}>
              下一波: {Math.ceil(waveTimer)}s
            </span>
          </div>
          <div className="shield-info">
            <div className="shield-label">护盾: {Math.floor(hive.shield)} / {hive.maxShield}</div>
            <div className="shield-bar">
              <div 
                className="shield-bar-fill" 
                style={{ 
                  width: `${(hive.shield / hive.maxShield) * 100}%`,
                  backgroundColor: hive.shield / hive.maxShield > 0.5 
                    ? '#4CAF50' 
                    : hive.shield / hive.maxShield > 0.25 
                    ? '#FFC107' 
                    : '#F44336'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-item fps-item">
        <div className="dashboard-info">
          <div className="dashboard-label">FPS</div>
          <div className="fps-value">{fps}</div>
        </div>
      </div>
    </div>
  );
};
