import React from 'react';
import EditorPanel from './components/EditorPanel';
import PreviewArea from './components/PreviewArea';

const App: React.FC = () => {
  return (
    <div className="app-container">
      <EditorPanel />
      <PreviewArea />
      <style>{`
        .app-container {
          display: flex;
          width: 100%;
          height: 100vh;
          background-color: #2c2c2c;
        }
      `}</style>
    </div>
  );
};

export default App;
