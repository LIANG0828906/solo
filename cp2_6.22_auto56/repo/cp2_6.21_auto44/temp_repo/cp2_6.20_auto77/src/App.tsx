import React, { useState, useEffect } from 'react';
import { useStore } from './store';
import { EditorScene } from './GameEngine/EditorScene';
import { Toolbar } from './components/Toolbar';
import { LogicGraphPanel } from './components/LogicGraphPanel';
import { PropertyPanel } from './components/PropertyPanel';

export function App() {
  const mode = useStore((s) => s.mode);
  const transitionOpacity = useStore((s) => s.transitionOpacity);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Toolbar />
      <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            flex: 1,
            transition: 'opacity 0.5s ease',
            opacity: transitionOpacity,
          }}
        >
          <EditorScene />
        </div>
        {mode === 'editor' && (
          <>
            <LogicGraphPanel />
            <PropertyPanel />
          </>
        )}
      </div>
    </div>
  );
}
