import React from 'react';
import type { Scene } from '../types';
import FengMian from './FengMian';

interface SceneCardProps {
  scene: Scene;
  timeLeft: number;
}

const SceneCard: React.FC<SceneCardProps> = ({ scene, timeLeft }) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isWarning = timeLeft < 180;

  return (
    <div className="ink-card">
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{ color: 'var(--mo-qing)', fontSize: '0.875rem' }}>
            第 {scene.day} 日
          </span>
          <span className={`countdown ${isWarning ? 'warning' : ''}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
        <h1 style={{ marginBottom: '8px' }}>{scene.theme}</h1>
        <p style={{ fontSize: '0.9375rem' }}>{scene.description}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>雅集氛围</h3>
        <FengMian current={scene.atmosphere} max={scene.maxAtmosphere} />
      </div>

      <div>
        <h3>今日宾客</h3>
        <div className="guest-list">
          {scene.guests.map((guest, index) => (
            <div key={guest.id} className="guest-item" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="guest-avatar">
                {guest.name.charAt(0)}
              </div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '0.9375rem' }}>{guest.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--mo-qing)' }}>{guest.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SceneCard;
