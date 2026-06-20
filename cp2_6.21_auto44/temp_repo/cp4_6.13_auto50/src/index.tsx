import React from 'react';
import ReactDOM from 'react-dom/client';
import GameCanvas from './components/GameCanvas';
import TimeLine from './components/TimeLine';

const App: React.FC = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 20,
      minHeight: '100vh',
      boxSizing: 'border-box'
    }}>
      <h1 style={{
        color: '#fff',
        marginBottom: 20,
        fontSize: 24,
        textAlign: 'center'
      }}>
        ⏳ 时间回溯解谜
      </h1>
      
      <GameCanvas />
      <TimeLine />
      
      <div style={{
        marginTop: 20,
        color: '#666',
        fontSize: 12,
        textAlign: 'center',
        maxWidth: 400
      }}>
        <p>使用 WASD 或方向键移动，空格键与机关交互。</p>
        <p>按 T 键进入时间回溯模式，可以查看历史操作并插入新分支。</p>
        <p>提示：善用回溯功能，用最少的步数和回溯次数通关获得高分！</p>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
