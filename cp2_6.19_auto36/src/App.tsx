import React, { useState, useRef, useEffect } from 'react';
import { Theme, THEMES, Viewport, MindMapNode } from './types';
import { mapEngine } from './core/MapEngine';
import { MindMapCanvas } from './ui/MindMapCanvas';
import { NoteEditor } from './ui/NoteEditor';
import { ControlPanel } from './ui/ControlPanel';

const App: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(THEMES.blue);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<Viewport>({
    x: 100,
    y: 100,
    scale: 1,
  });
  const [nodes, setNodes] = useState<MindMapNode[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNodes(mapEngine.getNodes());

    const handleNodesChanged = () => {
      setNodes(mapEngine.getNodes());
    };

    mapEngine.eventBus.on('nodes:changed', handleNodesChanged);

    return () => {
      mapEngine.eventBus.off('nodes:changed', handleNodesChanged);
    };
  }, []);

  const handleThemeChange = (themeId: string) => {
    const newTheme = THEMES[themeId];
    if (newTheme) {
      setTheme(newTheme);
    }
  };

  const handleSelectNode = (nodeId: string | null) => {
    setSelectedNodeId(nodeId);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        overflow: 'hidden',
        fontFamily: "'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        fontSize: '14px',
      }}
    >
      <div style={{ width: '10%', minWidth: '120px', position: 'relative' }}>
        <ControlPanel
          theme={theme}
          onThemeChange={handleThemeChange}
          viewport={viewport}
          onViewportChange={setViewport}
          nodes={nodes}
          canvasRef={canvasRef}
        />
      </div>

      <div style={{ flex: 1, position: 'relative' }} ref={canvasRef}>
        <MindMapCanvas
          theme={theme}
          selectedNodeId={selectedNodeId}
          onSelectNode={handleSelectNode}
          viewport={viewport}
          onViewportChange={setViewport}
        />
      </div>

      <div style={{ width: '25%', minWidth: '280px', maxWidth: '400px' }}>
        <NoteEditor
          nodeId={selectedNodeId}
          nodeTitle={selectedNode?.title || ''}
          theme={theme}
        />
      </div>
    </div>
  );
};

export default App;
