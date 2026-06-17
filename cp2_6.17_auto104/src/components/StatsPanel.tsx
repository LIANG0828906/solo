import { useMemo } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';

export function StatsPanel() {
  const {
    timeLeft,
    currentWpm,
    accuracy,
    getSortedErrors,
    totalChars,
  } = useTypingEngine();

  const sortedErrors = getSortedErrors();
  const maxErrorCount = useMemo(() => {
    if (sortedErrors.length === 0) return 0;
    return sortedErrors[0][1];
  }, [sortedErrors]);

  const formatTime = (seconds: number): string => {
    const secs = Math.ceil(seconds);
    return `${Math.floor(secs / 60)}:${(secs % 60).toString().padStart(2, '0')}`;
  };

  const getErrorColor = (count: number, max: number): string => {
    if (max === 0) return '#F9E2AF';
    const ratio = count / max;
    const r = Math.round(249 + (243 - 249) * ratio);
    const g = Math.round(226 + (139 - 226) * ratio);
    const b = Math.round(175 + (168 - 175) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="stats-panel">
      <div className="stat-item">
        <span className="stat-label">Time</span>
        <span className="stat-value large">{formatTime(timeLeft)}</span>
      </div>

      <div className="stat-item">
        <span className="stat-label">WPM</span>
        <span className="stat-value">{currentWpm}</span>
      </div>

      <div className="stat-item">
        <span className="stat-label">Accuracy</span>
        <span className="stat-value">{accuracy.toFixed(1)}%</span>
      </div>

      <div className="stat-item">
        <span className="stat-label">Characters</span>
        <span className="stat-value" style={{ fontSize: '24px' }}>{totalChars}</span>
      </div>

      <div>
        <h2>Error Distribution</h2>
        <div className="error-chart">
          {sortedErrors.length === 0 ? (
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              No errors yet
            </p>
          ) : (
            sortedErrors.map(([char, count]) => (
              <div key={char} className="error-bar-row">
                <span className="error-char">{char}</span>
                <div className="error-bar-container">
                  <div
                    className="error-bar"
                    style={{
                      width: `${(count / maxErrorCount) * 100}%`,
                      backgroundColor: getErrorColor(count, maxErrorCount),
                    }}
                  />
                </div>
                <span className="error-count">{count}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
