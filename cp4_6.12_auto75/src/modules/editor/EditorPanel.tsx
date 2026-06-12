import React from 'react';
import { useTimelineStore } from '@/store/timelineStore';
import { shallow } from 'zustand/shallow';

const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
];

const EditorPanel: React.FC = () => {
  const {
    nodes,
    edges,
    selectedNodeId,
    addNode,
    removeNode,
    reorderNodes,
    setSelectedNode,
    removeEdge,
  } = useTimelineStore(
    shallow((s) => ({
      nodes: s.nodes,
      edges: s.edges,
      selectedNodeId: s.selectedNodeId,
      addNode: s.addNode,
      removeNode: s.removeNode,
      reorderNodes: s.reorderNodes,
      setSelectedNode: s.setSelectedNode,
      removeEdge: s.removeEdge,
    }))
  );

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    e.currentTarget.style.opacity = '0.4';
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, toIdx: number) => {
    e.preventDefault();
    const fromIdx = Number(e.dataTransfer.getData('text/plain'));
    if (!isNaN(fromIdx) && fromIdx !== toIdx) {
      reorderNodes(fromIdx, toIdx);
    }
  };

  return (
    <div
      style={{
        width: 280,
        background: '#16213e',
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        flexShrink: 0,
        height: '100%',
      }}
    >
      <div
        style={{
          fontFamily: 'Verdana',
          fontSize: 24,
          fontWeight: 'bold',
          color: '#e94560',
          padding: 16,
          borderBottom: '1px solid #0f3460',
        }}
      >
        Timeline Forge
      </div>

      <button
        onClick={addNode}
        style={{
          background: '#e94560',
          color: 'white',
          margin: 12,
          padding: '10px',
          borderRadius: 8,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          transition: 'background .2s',
        }}
        onMouseOver={(e) => (e.currentTarget.style.background = '#d63a53')}
        onMouseOut={(e) => (e.currentTarget.style.background = '#e94560')}
      >
        ＋ 添加事件节点
      </button>

      <div style={{ padding: '0 12px' }}>
        {nodes.map((node, idx) => {
          const isSelected = selectedNodeId === node.id;
          return (
            <div
              key={node.id}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragEnd={handleDragEnd}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, idx)}
              onClick={() => setSelectedNode(node.id)}
              style={{
                background: '#0f3460',
                borderRadius: 10,
                padding: 12,
                marginBottom: 10,
                cursor: 'grab',
                position: 'relative',
                transition: 'all .15s',
                border: isSelected ? '2px solid #1E90FF' : '2px solid transparent',
                transform: isSelected ? 'scale(1.02)' : 'scale(1)',
              }}
              className="node-card"
            >
              <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                <span
                  style={{
                    background: node.color || COLORS[idx % COLORS.length],
                    borderRadius: '50%',
                    display: 'inline-block',
                    marginRight: 8,
                    width: 10,
                    height: 10,
                    verticalAlign: 'middle',
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: 'white',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {node.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: '#9aa5b1',
                      marginTop: 4,
                    }}
                  >
                    {node.date}
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeNode(node.id);
                }}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: '#e94560',
                  color: 'white',
                  fontSize: 12,
                  border: 'none',
                  cursor: 'pointer',
                  opacity: 0,
                  transition: 'opacity .15s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
                className="node-delete-btn"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <div
        style={{
          padding: 12,
          borderTop: '1px solid #0f3460',
          marginTop: 12,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 'bold',
            color: '#9aa5b1',
            marginBottom: 8,
          }}
        >
          节点连线
        </div>
        {edges.map((edge) => {
          const sourceIdx =
            typeof edge.source === 'number'
              ? edge.source
              : nodes.findIndex((n) => n.id === edge.sourceId);
          const targetIdx =
            typeof edge.target === 'number'
              ? edge.target
              : nodes.findIndex((n) => n.id === edge.targetId);
          if (
            sourceIdx < 0 ||
            targetIdx < 0 ||
            sourceIdx >= nodes.length ||
            targetIdx >= nodes.length
          ) {
            return null;
          }
          const sourceNode = nodes[sourceIdx];
          const targetNode = nodes[targetIdx];
          return (
            <div
              key={edge.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                marginBottom: 6,
                background: '#0f3460',
                borderRadius: 6,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: 'white',
                  flex: 1,
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {sourceNode.title} → {targetNode.title}
              </span>
              <button
                onClick={() => removeEdge(edge.id)}
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#e94560',
                  color: 'white',
                  fontSize: 12,
                  border: 'none',
                  cursor: 'pointer',
                  marginLeft: 8,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          );
        })}
      </div>

      <style>
        {`
          .node-card:hover .node-delete-btn {
            opacity: 1 !important;
          }
        `}
      </style>
    </div>
  );
};

export default EditorPanel;
