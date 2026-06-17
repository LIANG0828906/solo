import React from 'react';
import { Toolbar } from './components/Toolbar';
import { Board } from './components/Board';
import { NodePanel } from './components/NodePanel';
import { NodeList } from './components/NodeList';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <Toolbar />
      <Board />
      <NodePanel />
      <NodeList />
    </div>
  );
};

export default App;
