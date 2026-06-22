import React from 'react';
import { Stats } from '../../types';
import AnimatedNumber from './AnimatedNumber';

interface StatsBannerProps {
  stats: Stats;
}

const StatsBanner: React.FC<StatsBannerProps> = ({ stats }) => {
  return (
    <div className="stats-banner">
      <div className="stat-card">
        <div className="stat-label">今日新增条目</div>
        <div className="stat-value">
          <AnimatedNumber value={stats.todayNewItems} />
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">今日成功交换</div>
        <div className="stat-value">
          <AnimatedNumber value={stats.todaySuccessfulExchanges} />
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-label">总条目数</div>
        <div className="stat-value">
          <AnimatedNumber value={stats.totalItems} />
        </div>
      </div>
    </div>
  );
};

export default StatsBanner;
