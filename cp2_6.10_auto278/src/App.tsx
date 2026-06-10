import { useState, useCallback, useMemo } from 'react';
import QuantumScene from './scene/QuantumScene';
import ControlPanel from './ui/ControlPanel';
import LogPanel from './ui/LogPanel';
import type { LogEntry } from './types';
import { CYBER_COLORS } from './types';

export default function App() {
  const [entanglementStrength, setEntanglementStrength] = useState(0.5);
  const [shouldAddNode, setShouldAddNode] = useState(false);
  const [resetCamera, setResetCamera] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [nodeCount, setNodeCount] = useState(0);
  const [connectionCount, setConnectionCount] = useState(0);

  const handleLog = useCallback((entry: Omit<LogEntry, 'id' | 'timestamp'>) => {
    const newLog: LogEntry = {
      ...entry,
      id: `LOG-${Date.now().toString(36).toUpperCase()}`,
      timestamp: new Date(),
    };
    setLogs(prev => {
      const updated = [...prev, newLog];
      if (updated.length > 5) {
        return updated.slice(-5);
      }
      return updated;
    });
  }, []);

  const handleNodeAdded = useCallback(() => {
    setShouldAddNode(false);
    setNodeCount(prev => prev + 1);
  }, []);

  const handleConnectionAdded = useCallback(() => {
    setConnectionCount(prev => prev + 1);
  }, []);

  const handleAddNode = useCallback(() => {
    setShouldAddNode(true);
  }, []);

  const handleStrengthChange = useCallback((value: number) => {
    setEntanglementStrength(value);
  }, []);

  const handleResetCamera = useCallback(() => {
    setResetCamera(true);
    setLogs(prev => {
      const newLog: LogEntry = {
        id: `LOG-${Date.now().toString(36).toUpperCase()}`,
        timestamp: new Date(),
        type: 'reset',
        message: '视角已重置',
      };
      const updated = [...prev, newLog];
      if (updated.length > 5) {
        return updated.slice(-5);
      }
      return updated;
    });
  }, []);

  const handleCameraReset = useCallback(() => {
    setResetCamera(false);
  }, []);

  const headerStyle = useMemo(() => ({
    position: 'fixed' as const,
    top: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 100,
    textAlign: 'center' as const,
    pointerEvents: 'none' as const,
  }), []);

  const titleStyle = useMemo(() => ({
    fontSize: '36px',
    fontWeight: 'bold' as const,
    background: `linear-gradient(135deg, ${CYBER_COLORS.neonPurple}, ${CYBER_COLORS.neonCyan})`,
    WebkitBackgroundClip: 'text' as const,
    WebkitTextFillColor: 'transparent' as const,
    backgroundClip: 'text',
    letterSpacing: '3px',
    textShadow: `0 0 40px ${CYBER_COLORS.neonPurple}60`,
    marginBottom: '8px',
  }), []);

  const subtitleStyle = useMemo(() => ({
    fontSize: '12px',
    color: '#666',
    letterSpacing: '4px',
    textTransform: 'uppercase' as const,
  }), []);

  const fpsStyle = useMemo(() => ({
    position: 'fixed' as const,
    top: '24px',
    right: '24px',
    fontSize: '12px',
    color: CYBER_COLORS.neonCyan,
    fontFamily: 'monospace',
    background: CYBER_COLORS.panelBg,
    padding: '8px 16px',
    borderRadius: '6px',
    border: `1px solid ${CYBER_COLORS.borderColor}`,
    zIndex: 100,
  }), []);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div style={headerStyle}>
        <div style={titleStyle}>量子纠缠之舞</div>
        <div style={subtitleStyle}>QUANTUM ENTANGLEMENT DANCE</div>
      </div>

      <div style={fpsStyle}>
        ⚡ 60 FPS
      </div>

      <div style={{ width: '100%', height: '100%' }}>
        <QuantumScene
          entanglementStrength={entanglementStrength}
          onLog={handleLog}
          shouldAddNode={shouldAddNode}
          onNodeAdded={handleNodeAdded}
          onConnectionAdded={handleConnectionAdded}
          resetCamera={resetCamera}
          onCameraReset={handleCameraReset}
        />
      </div>

      <ControlPanel
        onAddNode={handleAddNode}
        entanglementStrength={entanglementStrength}
        onStrengthChange={handleStrengthChange}
        onResetCamera={handleResetCamera}
        nodeCount={nodeCount}
        connectionCount={connectionCount}
      />

      <LogPanel logs={logs} />
    </div>
  );
}
