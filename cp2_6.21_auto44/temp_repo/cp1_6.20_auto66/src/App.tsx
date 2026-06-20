import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import ColorEditor from './components/ColorEditor';
import GradientPreview from './components/GradientPreview';
import type { ColorNode, GradientType } from './types';

const initialNodes: ColorNode[] = [
  { id: uuidv4(), color: '#667eea', position: 0 },
  { id: uuidv4(), color: '#764ba2', position: 100 }
];

export default function App() {
  const [colorNodes, setColorNodes] = useState<ColorNode[]>(initialNodes);
  const [gradientType, setGradientType] = useState<GradientType>('horizontal');

  const handleGradientTypeChange = useCallback((type: GradientType) => {
    setGradientType(type);
  }, []);

  const handleAddNode = useCallback(() => {
    const newNode: ColorNode = {
      id: uuidv4(),
      color: '#ffffff',
      position: 100
    };
    const updatedNodes = colorNodes.map((node, idx) => ({
      ...node,
      position: Math.round((idx / colorNodes.length) * 100)
    }));
    updatedNodes.push(newNode);
    setColorNodes(updatedNodes);
  }, [colorNodes]);

  const handleDeleteNode = useCallback((nodeId: string) => {
    if (colorNodes.length <= 2) return;
    setColorNodes(prev => {
      const filtered = prev.filter(n => n.id !== nodeId);
      return filtered.map((node, idx) => ({
        ...node,
        position: Math.round((idx / (filtered.length - 1)) * 100)
      }));
    });
  }, [colorNodes.length]);

  const handleNodeColorChange = useCallback((nodeId: string, color: string) => {
    setColorNodes(prev =>
      prev.map(node =>
        node.id === nodeId ? { ...node, color } : node
      )
    );
  }, []);

  const handleNodeReorder = useCallback((draggedId: string, targetId: string) => {
    setColorNodes(prev => {
      const nodes = [...prev];
      const draggedIdx = nodes.findIndex(n => n.id === draggedId);
      const targetIdx = nodes.findIndex(n => n.id === targetId);
      if (draggedIdx === -1 || targetIdx === -1) return prev;
      const [draggedNode] = nodes.splice(draggedIdx, 1);
      nodes.splice(targetIdx, 0, draggedNode);
      return nodes.map((node, idx) => ({
        ...node,
        position: Math.round((idx / (nodes.length - 1)) * 100)
      }));
    });
  }, []);

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#121212'
      }}
    >
      <div
        className="control-panel"
        style={{
          width: '40%',
          padding: '32px',
          backgroundColor: '#1a1a2e',
          borderRight: '1px solid #333',
          display: 'flex',
          flexDirection: 'column',
          gap: '32px'
        }}
      >
        <div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#e0e0e0',
              marginBottom: '8px'
            }}
          >
            渐变调色板
          </h1>
          <p style={{ fontSize: '14px', color: '#888' }}>
            创建、编辑和导出精美的CSS渐变
          </p>
        </div>

        <div>
          <h3
            style={{
              fontSize: '14px',
              fontWeight: 500,
              color: '#aaa',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            渐变类型
          </h3>
          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap'
            }}
          >
            {[
              { value: 'horizontal', label: '水平' },
              { value: 'vertical', label: '垂直' },
              { value: 'radial', label: '径向' },
              { value: 'diagonal', label: '对角' }
            ].map(type => (
              <button
                key={type.value}
                className={`gradient-type-btn ${gradientType === type.value ? 'active' : ''}`}
                onClick={() => handleGradientTypeChange(type.value as GradientType)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        <ColorEditor
          nodes={colorNodes}
          onAddNode={handleAddNode}
          onDeleteNode={handleDeleteNode}
          onColorChange={handleNodeColorChange}
          onReorder={handleNodeReorder}
        />
      </div>

      <div
        className="preview-panel"
        style={{
          width: '60%',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }}
      >
        <GradientPreview
          nodes={colorNodes}
          gradientType={gradientType}
        />
      </div>
    </div>
  );
}
