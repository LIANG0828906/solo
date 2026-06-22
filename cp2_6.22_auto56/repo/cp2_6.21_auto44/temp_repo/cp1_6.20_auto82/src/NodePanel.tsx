import React, { useState, useEffect } from 'react';
import type { GraphNode, GraphEdge, EdgeType } from './data';

interface NodePanelProps {
  node: GraphNode | null;
  edges: GraphEdge[];
  allNodes: GraphNode[];
  onUpdate: (node: GraphNode) => void;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
  onJumpToNode: (nodeId: string) => void;
}

const EDGE_TYPE_LABELS: Record<EdgeType, string> = {
  derived: '衍生',
  dependency: '依赖',
  related: '相关'
};

const EDGE_TYPE_COLORS: Record<EdgeType, string> = {
  derived: '#4fc3f7',
  dependency: '#ffb74d',
  related: '#81c784'
};

const PRESET_COLORS = ['#4fc3f7', '#ffb74d', '#81c784', '#ce93d8', '#ef9a9a', '#fff176', '#80cbc4', '#a5d6a7'];

const NodePanel: React.FC<NodePanelProps> = ({ node, edges, allNodes, onUpdate, onClose, onDelete, onJumpToNode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [color, setColor] = useState('#4fc3f7');
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (node) {
      setTitle(node.title);
      setDescription(node.description);
      setTagsInput(node.tags.join(', '));
      setColor(node.color);
      setAnimKey(k => k + 1);
    }
  }, [node?.id]);

  if (!node) return null;

  const relatedEdges = edges.filter(e => e.source === node.id || e.target === node.id);

  const applyChanges = () => {
    onUpdate({
      ...node,
      title,
      description,
      tags: tagsInput.split(',').map(t => t.trim()).filter(Boolean),
      color,
      updatedAt: Date.now()
    });
  };

  return (
    <div
      key={animKey}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100vh',
        width: 360,
        background: 'rgba(22, 33, 62, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(79, 195, 247, 0.2)',
        boxShadow: '-8px 0 30px rgba(0, 0, 0, 0.4)',
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.3s ease-out',
        overflowY: 'auto'
      }}
    >
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 20px 16px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e0e0e0' }}>节点详情</h2>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#e0e0e0',
            fontSize: 22,
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: 6,
            transition: 'all 0.15s',
            minWidth: 36,
            minHeight: 36
          }}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#90a4ae', marginBottom: 6, letterSpacing: 0.5 }}>标题</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onBlur={applyChanges}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#e0e0e0',
              fontSize: 14,
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onFocus={e => (e.currentTarget.style.borderColor = color)}
            onBlurOut={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#90a4ae', marginBottom: 6, letterSpacing: 0.5 }}>详细描述</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            onBlur={applyChanges}
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#e0e0e0',
              fontSize: 14,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
              transition: 'all 0.2s'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#90a4ae', marginBottom: 6, letterSpacing: 0.5 }}>标签（逗号分隔）</label>
          <input
            value={tagsInput}
            onChange={e => setTagsInput(e.target.value)}
            onBlur={applyChanges}
            placeholder="例如：前端, React, 组件"
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              color: '#e0e0e0',
              fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#90a4ae', marginBottom: 6, letterSpacing: 0.5 }}>颜色标记</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PRESET_COLORS.map(c => (
              <button
                key={c}
                onClick={() => { setColor(c); setTimeout(applyChanges, 0); }}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: c,
                  border: color === c ? '2px solid #fff' : '2px solid transparent',
                  cursor: 'pointer',
                  boxShadow: color === c ? `0 0 12px ${c}` : 'none',
                  transition: 'all 0.2s',
                  transform: color === c ? 'scale(1.1)' : 'scale(1)'
                }}
              />
            ))}
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 12, color: '#90a4ae', marginBottom: 10, letterSpacing: 0.5 }}>
            关联节点 ({relatedEdges.length})
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {relatedEdges.length === 0 && (
              <div style={{ color: '#607d8b', fontSize: 13, padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, textAlign: 'center' }}>
                暂无关联节点
              </div>
            )}
            {relatedEdges.map(edge => {
              const otherId = edge.source === node.id ? edge.target : edge.source;
              const otherNode = allNodes.find(n => n.id === otherId);
              const direction = edge.source === node.id ? '→' : '←';
              if (!otherNode) return null;
              return (
                <div
                  key={edge.id}
                  onClick={() => onJumpToNode(otherId)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.04)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    borderLeft: `3px solid ${EDGE_TYPE_COLORS[edge.type]}`,
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                >
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: otherNode.color,
                    boxShadow: `0 0 8px ${otherNode.color}`
                  }} />
                  <span style={{ color: '#e0e0e0', fontSize: 13, flex: 1 }}>{otherNode.title}</span>
                  <span style={{ fontSize: 11, color: EDGE_TYPE_COLORS[edge.type], padding: '2px 6px', borderRadius: 4, background: `${EDGE_TYPE_COLORS[edge.type]}15` }}>
                    {direction} {EDGE_TYPE_LABELS[edge.type]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <button
          onClick={() => onDelete(node.id)}
          style={{
            width: '100%',
            padding: '10px',
            background: 'linear-gradient(135deg, rgba(239, 83, 80, 0.2), rgba(239, 83, 80, 0.1))',
            border: '1px solid rgba(239, 83, 80, 0.3)',
            borderRadius: 8,
            color: '#ef9a9a',
            fontSize: 14,
            cursor: 'pointer',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 83, 80, 0.35), rgba(239, 83, 80, 0.2))';
            e.currentTarget.style.transform = 'scale(1.02)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(239, 83, 80, 0.2), rgba(239, 83, 80, 0.1))';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          删除此节点
        </button>
      </div>
    </div>
  );
};

export default NodePanel;
