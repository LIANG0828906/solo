import { useCallback } from 'react';
import Card from './ui/Card';
import Tree from './ui/Tree';
import { useStoryStore } from './store';
import { getNodeById, getInitialNode } from './story/engine';

export default function App() {
  const {
    currentNodeId,
    history,
    isLoading,
    slideDirection,
    isTransitioning,
    dispatchChoice,
    jumpToNode,
    clearHistory,
    setSlideDirection,
  } = useStoryStore();

  const currentNode = getNodeById(currentNodeId) || getInitialNode();

  const handleChoice = useCallback((choiceIndex: 0 | 1, choiceText: string) => {
    setSlideDirection(choiceIndex === 0 ? 'left' : 'right');
    
    setTimeout(() => {
      dispatchChoice(choiceIndex, choiceText);
    }, 100);
  }, [dispatchChoice, setSlideDirection]);

  const handleClose = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  const handleNodeClick = useCallback((historyIndex: number) => {
    jumpToNode(historyIndex);
  }, [jumpToNode]);

  const handleClear = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a2e 50%, #16213e 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px 350px 20px',
        boxSizing: 'border-box',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(118, 75, 162, 0.1) 0%, transparent 50%)
          `,
          pointerEvents: 'none',
        }}
      />

      <h1
        style={{
          fontSize: '36px',
          fontWeight: 'bold',
          color: '#ffffff',
          margin: '0 0 8px 0',
          letterSpacing: '4px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        ✦ FlickerTale ✦
      </h1>
      <p
        style={{
          fontSize: '13px',
          color: '#666',
          margin: '0 0 40px 0',
          letterSpacing: '2px',
        }}
      >
        你的每一个选择，都在书写命运
      </p>

      {isLoading && !isTransitioning && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#888',
            fontSize: '14px',
            zIndex: 50,
          }}
        >
          正在编织新的命运...
        </div>
      )}

      <Card
        node={currentNode}
        onChoice={handleChoice}
        onClose={handleClose}
        slideDirection={slideDirection}
        isTransitioning={isTransitioning}
      />

      <Tree
        history={history}
        onNodeClick={handleNodeClick}
        onClear={handleClear}
      />

      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          color: '#444',
          fontSize: '11px',
          zIndex: 200,
        }}
      >
        节点 {history.length + 1} / 16
      </div>
    </div>
  );
}
