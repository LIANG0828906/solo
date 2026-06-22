import React from 'react';
import ScenePanel from './components/ScenePanel';
import ControlPanel from './components/ControlPanel';
import SavePanel from './components/SavePanel';

const appStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  background: '#1A1A2E',
  overflow: 'hidden',
  fontFamily: "'system-ui', sans-serif",
  fontSize: '13px',
  color: '#E0E0E0',
};

const leftPanelStyle: React.CSSProperties = {
  width: '320px',
  flexShrink: 0,
  zIndex: 10,
};

const centerSceneStyle: React.CSSProperties = {
  flex: 1,
  position: 'relative',
  minWidth: 0,
  minHeight: 0,
};

const rightPanelStyle: React.CSSProperties = {
  width: '280px',
  flexShrink: 0,
  zIndex: 10,
};

export default function App() {
  return (
    <div style={appStyle}>
      <div style={leftPanelStyle}>
        <ControlPanel />
      </div>
      <div style={centerSceneStyle}>
        <ScenePanel />
      </div>
      <div style={rightPanelStyle}>
        <SavePanel />
      </div>
    </div>
  );
}
