import { useEffect } from 'react';
import { TextDisplay } from './components/TextDisplay';
import { InputArea } from './components/InputArea';
import { StatsPanel } from './components/StatsPanel';
import { ResultModal } from './components/ResultModal';
import { useTypingEngine } from './hooks/useTypingEngine';
import { getRandomArticle } from './data/articles';

function App() {
  const { status, heatmapMode, toggleHeatmap, resetGame } = useTypingEngine();

  useEffect(() => {
    const article = getRandomArticle();
    resetGame(article);
  }, [resetGame]);

  const handleRestart = () => {
    // 重置后用户可以通过输入开始新游戏
  };

  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready to start';
      case 'playing':
        return 'Type away!';
      case 'finished':
        return 'Complete!';
      default:
        return '';
    }
  };

  return (
    <>
      <div className="header">
        <h1>TypeRush</h1>
        <p>Test your typing speed and accuracy</p>
      </div>

      <div className="app-container">
        <div className="main-area">
          <div className="text-header">
            <h2 style={{ fontSize: '18px', color: 'var(--text-secondary)' }}>
              {getStatusText()}
            </h2>
            <div className="heatmap-toggle-container">
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                Heatmap
              </span>
              <button
                className={`heatmap-toggle ${heatmapMode ? 'active' : ''}`}
                onClick={toggleHeatmap}
                title="Toggle heatmap mode"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
              </button>
            </div>
          </div>

          <TextDisplay />
          <InputArea />
        </div>

        <StatsPanel />
      </div>

      <ResultModal onRestart={handleRestart} />
    </>
  );
}

export default App;
