import React from 'react';
import ReactDOM from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Scene from './components/Scene';
import Panel from './components/Panel';
import { useState } from 'react';
import { PRESETS, MEDIA } from './utils/physics';

function App() {
  const [presetId, setPresetId] = useState('air-water');
  const [incidentAngle, setIncidentAngle] = useState(30);
  const [dispersionMode, setDispersionMode] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
  const medium1 = MEDIA[preset.medium1];
  const medium2 = MEDIA[preset.medium2];

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        background: '#1A1A2E',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 8], fov: 50 }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Scene
          preset={preset}
          incidentAngle={incidentAngle}
          onAngleChange={setIncidentAngle}
          dispersionMode={dispersionMode}
        />
      </Canvas>

      <Panel
        preset={preset}
        medium1={medium1}
        medium2={medium2}
        incidentAngle={incidentAngle}
        onPresetChange={setPresetId}
        onAngleChange={setIncidentAngle}
        dispersionMode={dispersionMode}
        onDispersionModeChange={setDispersionMode}
        collapsed={panelCollapsed}
        onToggleCollapse={() => setPanelCollapsed(!panelCollapsed)}
      />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
