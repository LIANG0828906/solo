import React from 'react';
import { useStore } from '../store';

const LoadingOverlay: React.FC = () => {
  const { isLoading, loadingProgress } = useStore();

  if (!isLoading) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-spinner" />
      <div className="loading-text">正在加载建筑数据...</div>
      <div className="loading-progress-bar">
        <div
          className="loading-progress-fill"
          style={{ width: `${loadingProgress}%` }}
        />
      </div>
      <div className="loading-progress-percent">{loadingProgress}%</div>
    </div>
  );
};

export default LoadingOverlay;
