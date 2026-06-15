import React, { useState, useEffect } from 'react';
import { StatsResult, ViewMode } from '@/shared/types';
import { generateSummary } from './statsEngine';

interface Props {
  stats: StatsResult;
  viewMode: ViewMode;
}

export const SummaryCard: React.FC<Props> = ({ stats, viewMode }) => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const fullText = generateSummary(stats, viewMode);

  useEffect(() => {
    setDisplayText('');
    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setDisplayText(fullText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => setShowCursor(false), 2000);
      }
    }, 40);
    return () => clearInterval(interval);
  }, [fullText]);

  useEffect(() => {
    const cursorInterval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(cursorInterval);
  }, []);

  return (
    <div className="summary-card glass">
      <div className="summary-header">
        <span className="summary-icon">📝</span>
        <span>情绪分析报告</span>
      </div>
      <div className="summary-content">
        <span className="summary-text">{displayText}</span>
        {showCursor && <span className="blink-cursor">|</span>}
      </div>
      <div className="summary-stats">
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#a78bfa' }}>{stats.averageIntensity}%</span>
          <span className="stat-label">平均强度</span>
        </div>
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#34d399' }}>{stats.diversityScore}</span>
          <span className="stat-label">情绪种类</span>
        </div>
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#f472b6' }}>{stats.dominantEmotion}</span>
          <span className="stat-label">主导情绪</span>
        </div>
        <div className="stat-item">
          <span className="stat-value" style={{ color: '#fbbf24' }}>{stats.warmRatio}%</span>
          <span className="stat-label">暖色占比</span>
        </div>
      </div>
    </div>
  );
};
