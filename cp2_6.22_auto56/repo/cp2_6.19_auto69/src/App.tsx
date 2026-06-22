import React, { useMemo } from 'react';
import ToolBar from './components/ToolBar';
import Canvas from './components/Canvas';
import StatusBar from './components/StatusBar';
import { createBroadcastService } from './services/broadcastService';
import './index.css';

const App: React.FC = () => {
  const broadcastService = useMemo(() => createBroadcastService('whiteboard-sync'), []);

  return (
    <div className="app">
      <style>{`
        .app {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: #f5f5f5;
          font-family: 'PingFang SC', 'Microsoft YaHei', -apple-system, BlinkMacSystemFont, sans-serif;
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          margin: 0;
          padding: 0;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        html, body, #root {
          width: 100%;
          height: 100%;
        }

        button {
          font-family: inherit;
        }

        ::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        ::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .app > * {
          animation: fadeIn 0.3s ease;
        }
      `}</style>

      <StatusBar />
      <ToolBar />
      <Canvas broadcastService={broadcastService} />
    </div>
  );
};

export default App;
