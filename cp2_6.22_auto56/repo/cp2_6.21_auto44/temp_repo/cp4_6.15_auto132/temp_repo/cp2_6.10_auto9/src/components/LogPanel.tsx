import { useStore } from '@/store/useStore';
import './LogPanel.css';

const LogPanel = () => {
  const logEntries = useStore((state) => state.logEntries);
  const exportLogs = useStore((state) => state.exportLogs);

  const recentLogs = logEntries.slice(-5).reverse();

  return (
    <div className="logpanel-container">
      <div className="logpanel-header">
        <div className="logpanel-title">
          <i className="fas fa-scroll"></i>
          <span>航行日志</span>
        </div>
        <button className="export-button" onClick={exportLogs}>
          <i className="fas fa-download"></i>
          <span>保存日志</span>
        </button>
      </div>
      
      <div className="logpanel-content">
        {recentLogs.length === 0 ? (
          <div className="logpanel-empty">
            <i className="fas fa-hourglass-half"></i>
            <p>等待记录...</p>
            <small>每30秒自动记录一次</small>
          </div>
        ) : (
          <div className="logpanel-entries">
            {recentLogs.map((entry, index) => (
              <div key={index} className="log-entry">
                <div className="log-time">{entry.timestamp}</div>
                <div className="log-data">
                  <span className="log-item">
                    <i className="fas fa-wind"></i>
                    {entry.sailAngle}°
                  </span>
                  <span className="log-item">
                    <i className="fas fa-ship"></i>
                    {entry.rudderAngle}°
                  </span>
                  <span className="log-item">
                    <i className="fas fa-weight-hanging"></i>
                    {entry.ballastWeight}斤
                  </span>
                  <span className="log-item">
                    <i className="fas fa-arrows-alt-h"></i>
                    {entry.rollAngle}°
                  </span>
                  <span className="log-item">
                    <i className="fas fa-tachometer-alt"></i>
                    {entry.windSpeed}级
                  </span>
                  <span className="log-item">
                    <i className="fas fa-shield-alt"></i>
                    {entry.stabilityScore}分
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LogPanel;
