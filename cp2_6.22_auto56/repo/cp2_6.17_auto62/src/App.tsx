import { useEffect, useState } from 'react';
import { Card } from './ui/Card';
import { Tree } from './ui/Tree';
import { useStoryStore } from './store';
import { ChoiceDirection } from './story/types';
import { getNodeById } from './story/engine';

function App() {
  const {
    currentNodeId,
    history,
    currentHistoryIndex,
    isLoading,
    initStory,
    makeChoice,
    jumpToHistory,
    clearHistory,
  } = useStoryStore();

  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (started && !currentNodeId) {
      initStory();
    }
  }, [started, currentNodeId, initStory]);

  const currentNode = currentNodeId ? getNodeById(currentNodeId) : null;

  const handleChoice = (direction: ChoiceDirection) => {
    makeChoice(direction);
  };

  const handleExit = () => {
    setStarted(false);
    clearHistory();
  };

  const handleNodeClick = (historyIndex: number) => {
    jumpToHistory(historyIndex);
  };

  const handleStart = () => {
    setStarted(true);
  };

  const appStyle: React.CSSProperties = {
    minHeight: '100vh',
    backgroundColor: '#0F0F1A',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', 'Microsoft YaHei', sans-serif",
    padding: '40px 20px',
    gap: '24px',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '42px',
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: '4px',
    marginBottom: '8px',
    background: 'linear-gradient(135deg, #E94560, #0F3460, #E94560)',
    backgroundSize: '200% 200%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: 'gradientShift 3s ease infinite',
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.5)',
    letterSpacing: '2px',
    marginBottom: '32px',
  };

  const startButtonStyle: React.CSSProperties = {
    padding: '16px 48px',
    fontSize: '18px',
    color: 'white',
    backgroundColor: '#E94560',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'transform 0.3s ease-out, box-shadow 0.3s ease-out',
    letterSpacing: '2px',
  };

  const cardContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '420px',
  };

  if (!started) {
    return (
      <div style={appStyle}>
        <h1 style={titleStyle}>FlickerTale</h1>
        <p style={subtitleStyle}>一个由AI驱动的沉浸式文字冒险</p>
        <button
          style={startButtonStyle}
          onClick={handleStart}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(233, 69, 96, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          开始冒险
        </button>
        <style>{`
          @keyframes gradientShift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div style={appStyle}>
      <h1 style={{ ...titleStyle, fontSize: '28px', marginBottom: 0 }}>FlickerTale</h1>

      <div style={cardContainerStyle}>
        <Card
          node={currentNode}
          onChoice={handleChoice}
          onExit={handleExit}
          isLoading={isLoading}
        />
      </div>

      <Tree
        history={history}
        onNodeClick={handleNodeClick}
        currentHistoryIndex={currentHistoryIndex}
        onClear={clearHistory}
      />

      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}

export default App;
