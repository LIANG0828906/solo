
import React from 'react';
import { CardProvider } from '../context/CardContext';
import CanvasBoard from '../components/CanvasBoard';
import TimeMachine from '../components/TimeMachine';

const App: React.FC = () => {
  return (
    <CardProvider>
      <div style={{
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <CanvasBoard />
        <TimeMachine />
        
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            color: '#64748B',
            fontSize: '12px',
            fontFamily: 'Inter, sans-serif',
            zIndex: 50,
            pointerEvents: 'none',
          }}
        >
          灵感脉搏 · 拖动空白处平移画布 · 滚轮缩放 · 点击创建卡片
        </div>
      </div>
    </CardProvider>
  );
};

export default App;
