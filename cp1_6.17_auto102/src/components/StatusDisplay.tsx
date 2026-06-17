import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { SecurityStatus } from '../SecurityModule';
import '../index.css';

interface ProgressBarProps {
  label: string;
  progress: number;
  breached: boolean;
  threshold?: string;
}

function ProgressBar({ label, progress, breached, threshold }: ProgressBarProps) {
  return (
    <div className="progress-container">
      <div className="progress-header">
        <span className="progress-label">{label}</span>
        <span className={`progress-status ${breached ? 'breached' : ''}`}>
          {breached ? '已破解' : `${progress.toFixed(0)}%`}
        </span>
      </div>
      <div className="progress-bar-bg">
        <div
          className={`progress-bar-fill ${breached ? 'breached' : ''}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {threshold && <div className="threshold-info">阈值范围: {threshold}</div>}
    </div>
  );
}

export function StatusDisplay() {
  const waveformData = useGameStore((state) => state.waveformData);
  const securityStatus = useGameStore((state) => state.securityStatus);
  const gameTime = useGameStore((state) => state.gameTime);
  const breachCount = useGameStore((state) => state.breachCount);
  const breachNotifications = useGameStore((state) => state.breachNotifications);
  const removeBreachNotification = useGameStore((state) => state.removeBreachNotification);

  useEffect(() => {
    breachNotifications.forEach((notification) => {
      const timer = setTimeout(() => {
        removeBreachNotification(notification.id);
      }, 2000);
      return () => clearTimeout(timer);
    });
  }, [breachNotifications, removeBreachNotification]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getThreatColor = (score: number): string => {
    if (score >= 70) return '#FF4444';
    if (score >= 40) return '#FF8C00';
    return '#00FF88';
  };

  const status = securityStatus as SecurityStatus;

  return (
    <div className={`status-display ${status?.alertActive ? 'alert-active' : ''}`}>
      <div className="panel-header">
        <h3>安全系统状态</h3>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">游戏时间</div>
          <div className="stat-value">{formatTime(gameTime)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">破解次数</div>
          <div className="stat-value">{breachCount}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">威胁评分</div>
          <div
            className="stat-value"
            style={{ color: getThreatColor(waveformData?.threatScore || 0) }}
          >
            {waveformData?.threatScore || 0}
          </div>
        </div>
      </div>

      <div className="defense-layers">
        <div className="layer-card">
          <div className="layer-title">
            <span className="layer-icon">🛡️</span>
            <span>防火墙</span>
          </div>
          <ProgressBar
            label="破解进度"
            progress={status?.firewall.progress || 0}
            breached={status?.firewall.breached || false}
            threshold="低频 3-7Hz，保持2秒"
          />
        </div>

        <div className="layer-card">
          <div className="layer-title">
            <span className="layer-icon">👁️</span>
            <span>入侵检测系统</span>
          </div>
          <ProgressBar
            label="绕过进度"
            progress={status?.ids.progress || 0}
            breached={status?.ids.breached || false}
            threshold="中频 20-40Hz，相位差45°，保持1.5秒"
          />
        </div>

        <div className="layer-card">
          <div className="layer-title">
            <span className="layer-icon">🔐</span>
            <span>数据加密</span>
          </div>
          <ProgressBar
            label="解密进度"
            progress={status?.encryption.progress || 0}
            breached={status?.encryption.breached || false}
            threshold="三频段同时激活特定组合，保持3秒"
          />
        </div>
      </div>

      <div className="notifications-container">
        {breachNotifications.map((notification) => (
          <div key={notification.id} className="breach-notification">
            <div className="pulse-ring" />
            <span>{notification.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
