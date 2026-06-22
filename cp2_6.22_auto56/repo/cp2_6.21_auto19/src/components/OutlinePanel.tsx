import React from 'react';
import { useMindmapStore } from '../store/mindmapStore';
import { MindmapNode } from '../types';

interface OutlinePanelProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

const OutlinePanel: React.FC<OutlinePanelProps> = ({ isOpen, onClose, isMobile }) => {
  const { nodes, selectedNodeId, setSelectedNode, getTasksForNode } = useMindmapStore();

  const buildNodeTree = (): { node: MindmapNode; children: MindmapNode[] }[] => {
    const rootNodes = nodes.filter((n) => !n.parent_id);
    const getChildren = (parentId: string): MindmapNode[] => {
      return nodes.filter((n) => n.parent_id === parentId);
    };

    return rootNodes.map((node) => ({
      node,
      children: getChildren(node.id),
    }));
  };

  const tree = buildNodeTree();

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId);
  };

  const renderNodeItem = (node: MindmapNode, level: number = 0) => {
    const taskCount = getTasksForNode(node.id).length;
    const isSelected = selectedNodeId === node.id;

    return (
      <div key={node.id}>
        <div
          onClick={() => handleNodeClick(node.id)}
          style={{
            padding: '10px 12px',
            paddingLeft: `${12 + level * 20}px`,
            cursor: 'pointer',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            transition: 'background-color 0.2s ease',
            border: isSelected ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid transparent',
          }}
          onMouseEnter={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isSelected) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        >
          <span
            style={{
              fontSize: '14px',
              color: '#fff',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
            }}
          >
            {node.title}
          </span>
          {taskCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                backgroundColor: 'rgba(255,255,255,0.15)',
                padding: '2px 8px',
                borderRadius: '10px',
                color: '#fff',
                marginLeft: '8px',
              }}
            >
              {taskCount}
            </span>
          )}
        </div>
        {nodes.filter((n) => n.parent_id === node.id).map((child) => renderNodeItem(child, level + 1))}
      </div>
    );
  };

  const panelStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '60vh',
        backgroundColor: 'rgba(30, 30, 46, 0.95)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,0.2)',
        borderRight: 'none',
        color: '#fff',
        padding: '20px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease-out',
        zIndex: 100,
        borderRadius: '16px 16px 0 0',
      }
    : {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '320px',
        height: '100vh',
        backgroundColor: 'rgba(30, 30, 46, 0.9)',
        backdropFilter: 'blur(12px)',
        borderRight: '1px solid rgba(255,255,255,0.2)',
        color: '#fff',
        padding: '20px',
        boxSizing: 'border-box',
        overflowY: 'auto',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease-out',
        zIndex: 100,
      };

  return (
    <div style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h3 style={{ margin: 0, fontSize: '18px' }}>节点大纲</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#fff',
            fontSize: '20px',
            cursor: 'pointer',
            opacity: 0.7,
          }}
        >
          ×
        </button>
      </div>

      {nodes.length === 0 ? (
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
          暂无节点
          <br />
          <span style={{ fontSize: '12px' }}>双击画布创建节点</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {tree.map((item) => renderNodeItem(item.node))}
        </div>
      )}
    </div>
  );
};

export default OutlinePanel;
