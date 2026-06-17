import { useEffect, useRef, useMemo } from 'react';
import { useTypingEngine } from '../hooks/useTypingEngine';
import { getRandomArticle } from '../data/articles';

interface ResultModalProps {
  onRestart: () => void;
}

export function ResultModal({ onRestart }: ResultModalProps) {
  const {
    showResult,
    peakWpm,
    accuracy,
    totalChars,
    correctChars,
    getWpmHistoryAtIntervals,
    getSortedErrors,
    getAvgWpm,
    resetGame,
  } = useTypingEngine();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wpmData = useMemo(() => getWpmHistoryAtIntervals(10), [getWpmHistoryAtIntervals]);
  const sortedErrors = getSortedErrors();
  const avgWpm = getAvgWpm();

  const maxErrorCount = useMemo(() => {
    if (sortedErrors.length === 0) return 0;
    return sortedErrors[0][1];
  }, [sortedErrors]);

  useEffect(() => {
    if (!showResult || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    ctx.clearRect(0, 0, width, height);

    if (wpmData.length < 2) {
      ctx.fillStyle = '#A6ADC8';
      ctx.font = '14px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Not enough data', width / 2, height / 2);
      return;
    }

    const maxWpm = Math.max(...wpmData.map((d) => d.wpm), 10);
    const maxTime = 60;

    ctx.strokeStyle = '#45475A';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();

      ctx.fillStyle = '#A6ADC8';
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(
        Math.round(maxWpm - (maxWpm / 4) * i).toString(),
        padding.left - 8,
        y + 4
      );
    }

    for (let i = 0; i <= 6; i++) {
      const x = padding.left + (chartWidth / 6) * i;
      ctx.fillStyle = '#A6ADC8';
      ctx.font = '12px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${i * 10}s`, x, height - padding.bottom + 16);
    }

    const points: { x: number; y: number }[] = wpmData.map((d) => ({
      x: padding.left + (d.time / maxTime) * chartWidth,
      y: padding.top + chartHeight - (d.wpm / maxWpm) * chartHeight,
    }));

    ctx.strokeStyle = '#89B4FA';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    });
    ctx.stroke();

    points.forEach((p) => {
      ctx.fillStyle = '#89B4FA';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#1E1E2E';
      ctx.lineWidth = 2;
      ctx.stroke();
    });
  }, [showResult, wpmData]);

  const handleRestart = () => {
    const newArticle = getRandomArticle();
    resetGame(newArticle);
    onRestart();
  };

  const handleShare = async () => {
    const text = `TypeRush Results:
• Average WPM: ${avgWpm}
• Peak WPM: ${peakWpm}
• Accuracy: ${accuracy.toFixed(1)}%
• Characters: ${totalChars} (${correctChars} correct)
• Errors: ${totalChars - correctChars}`;

    try {
      await navigator.clipboard.writeText(text);
      alert('Results copied to clipboard!');
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Results copied to clipboard!');
    }
  };

  if (!showResult) return null;

  const getErrorColor = (count: number, max: number): string => {
    if (max === 0) return '#F9E2AF';
    const ratio = count / max;
    const r = Math.round(249 + (243 - 249) * ratio);
    const g = Math.round(226 + (139 - 226) * ratio);
    const b = Math.round(175 + (168 - 175) * ratio);
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Test Complete!</h2>

        <div className="modal-stats">
          <div className="modal-stat-card">
            <div className="label">Avg WPM</div>
            <div className="value">{avgWpm}</div>
          </div>
          <div className="modal-stat-card">
            <div className="label">Peak WPM</div>
            <div className="value">{peakWpm}</div>
          </div>
          <div className="modal-stat-card">
            <div className="label">Accuracy</div>
            <div className="value">{accuracy.toFixed(1)}%</div>
          </div>
          <div className="modal-stat-card">
            <div className="label">Characters</div>
            <div className="value" style={{ fontSize: '22px' }}>{totalChars}</div>
          </div>
        </div>

        <div className="modal-section">
          <h3>WPM Over Time</h3>
          <canvas ref={canvasRef} className="wpm-chart-canvas" />
        </div>

        <div className="modal-section">
          <h3>Error Distribution</h3>
          <div className="error-chart">
            {sortedErrors.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                No errors! Perfect typing!
              </p>
            ) : (
              sortedErrors.slice(0, 8).map(([char, count]) => (
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

        <div className="modal-buttons">
          <button className="btn btn-secondary" onClick={handleShare}>
            Share Results
          </button>
          <button className="btn btn-primary" onClick={handleRestart}>
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}
