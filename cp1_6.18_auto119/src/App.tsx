import React from 'react';
import { Staff } from './components/Staff';
import { ScaleBuilder } from './components/ScaleBuilder';
import { ChordChallenge } from './components/ChordChallenge';

const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#111827',
        color: '#F9FAFB',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}
    >
      <header style={{ textAlign: 'center' }}>
        <h1
          style={{
            fontSize: '28px',
            fontWeight: 800,
            background: 'linear-gradient(135deg, #3B82F6, #8B5CF6, #EC4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px',
          }}
        >
          乐理互动实验室
        </h1>
        <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>
          拖拽、点击、聆听 — 在互动中掌握音乐基础
        </p>
      </header>

      <div
        style={{
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          justifyContent: 'center',
          maxWidth: '960px',
          width: '100%',
        }}
      >
        <div style={{ flex: '1 1 600px', minWidth: '300px' }}>
          <Staff />
        </div>
        <ScaleBuilder />
      </div>

      <div style={{ maxWidth: '960px', width: '100%' }}>
        <ChordChallenge />
      </div>
    </div>
  );
};

export default App;
