import { useBrailleStore, GameMode } from './store/brailleStore';
import LineChart from './components/LineChart';
import './QuizPanel.css';

interface QuizPanelProps {
  elapsedTime?: number;
}

export default function QuizPanel({ elapsedTime = 0 }: QuizPanelProps) {
  const {
    mode,
    setMode,
    currentChar,
    isCorrect,
    showError,
    errorMessage,
    score,
    correctCount,
    totalQuestions,
    history,
    testResults,
    testCurrentIndex,
    testQuestions,
    startTest,
  } = useBrailleStore();

  const accuracy = totalQuestions > 0 ? ((correctCount / totalQuestions) * 100).toFixed(1) : '0.0';

  const chartData = history.map((record) => ({
    id: record.id,
    value: record.accuracy,
  }));

  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
  };

  const indicatorLeft = mode === 'practice' ? '0%' : '50%';
  const indicatorWidth = '50%';

  const isTestFinished = mode === 'test' && testResults !== null;

  return (
    <div className="quiz-panel">
      <div className="mode-tabs">
        <div
          className={`mode-tab ${mode === 'practice' ? 'active' : ''}`}
          onClick={() => handleModeChange('practice')}
        >
          练习
        </div>
        <div
          className={`mode-tab ${mode === 'test' ? 'active' : ''}`}
          onClick={() => handleModeChange('test')}
        >
          测试
        </div>
        <div
          className="tab-indicator"
          style={{ left: indicatorLeft, width: indicatorWidth }}
        />
      </div>

      {isTestFinished ? (
        <div className="test-result-section">
          <div className="test-result-title">测试完成！</div>
          <div className="test-result-stats">
            <div className="test-result-stat">
              <div className="label">正确率</div>
              <div className="value">{testResults!.accuracy.toFixed(1)}%</div>
            </div>
            <div className="test-result-stat">
              <div className="label">平均用时</div>
              <div className="value">{testResults!.avgTime.toFixed(1)}s</div>
            </div>
          </div>
          <button className="restart-btn" onClick={startTest}>
            再测一次
          </button>
        </div>
      ) : (
        <>
          <div className="current-char-display">
            <div className={`current-char ${isCorrect ? 'correct' : ''}`}>
              {currentChar}
            </div>
            {showError && mode === 'practice' && (
              <div className="error-message">{errorMessage}</div>
            )}
          </div>

          <div className="stats-section">
            {mode === 'practice' ? (
              <>
                <div className="stat-card">
                  <div className="stat-label">得分</div>
                  <div className="stat-value">{score}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">正确率</div>
                  <div className="stat-value accuracy">{accuracy}%</div>
                </div>
              </>
            ) : (
              <>
                <div className="stat-card">
                  <div className="stat-label">当前题数</div>
                  <div className="stat-value">
                    {testCurrentIndex + 1}/{testQuestions.length}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">已用时间</div>
                  <div className="stat-value accuracy">{elapsedTime.toFixed(1)}s</div>
                </div>
              </>
            )}
          </div>
        </>
      )}

      <div className="chart-section">
        <div className="chart-title">历史成绩</div>
        <LineChart data={chartData} width={272} height={100} />
      </div>

      {!isTestFinished && (
        <div className="submit-hint">
          {mode === 'practice'
            ? '点击圆点输入盲文，全部正确后自动下一题'
            : '输入完成后自动跳转下一题'}
        </div>
      )}
    </div>
  );
}
