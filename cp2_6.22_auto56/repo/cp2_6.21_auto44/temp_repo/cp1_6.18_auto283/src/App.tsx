import React, { useCallback } from 'react';
import { useStore } from './store';
import { CanvasArea } from './components/CanvasArea';

const App: React.FC = () => {
  const addNode = useStore((state) => state.addNode);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent) => {
      addNode(e.clientX, e.clientY);
    },
    [addNode]
  );

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
        background: '#FFFFFF',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      }}
    >
      <CanvasArea onCanvasClick={handleCanvasClick} />
    </div>
  );
};

export default App;
