import React from 'react';
import { Toolbar } from './Toolbar';
import { EditorCanvas } from './EditorCanvas';
import { MonsterPalette } from './MonsterPalette';

export const App: React.FC = () => {
  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: '#1a1a2e',
        color: '#e0e0e0',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <Toolbar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <EditorCanvas />
        <MonsterPalette />
      </div>
    </div>
  );
};
