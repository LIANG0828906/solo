import React from 'react';
import { useDrag } from 'react-dnd';
import { NodeType } from '@/types/behaviorTree';
import { GitBranch, ListOrdered, Filter, Zap, ChevronLeft, ChevronRight } from 'lucide-react';

interface NodePanelProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface NodeDefinition {
  type: NodeType;
  name: string;
  color: string;
  icon: React.ReactNode;
  description: string;
}

const nodeDefinitions: NodeDefinition[] = [
  {
    type: 'selector',
    name: '选择节点',
    color: '#e94560',
    icon: <GitBranch size={20} />,
    description: '依次尝试子节点，直到一个成功'
  },
  {
    type: 'sequence',
    name: '顺序节点',
    color: '#0f3460',
    icon: <ListOrdered size={20} />,
    description: '依次执行子节点，直到一个失败'
  },
  {
    type: 'condition',
    name: '条件节点',
    color: '#533483',
    icon: <Filter size={20} />,
    description: '判断环境条件是否满足'
  },
  {
    type: 'action',
    name: '行动节点',
    color: '#1a936f',
    icon: <Zap size={20} />,
    description: '执行具体动作'
  }
];

interface NodeCardProps {
  node: NodeDefinition;
  collapsed: boolean;
}

const NodeCard: React.FC<NodeCardProps> = ({ node, collapsed }) => {
  const [{ isDragging }, drag, preview] = useDrag(() => ({
    type: 'NODE_TYPE',
    item: { type: node.type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  }), [node.type]);

  return (
    <div
      ref={preview}
      className="flex flex-col gap-2 p-3 rounded-lg cursor-pointer transition-all duration-200 select-none"
      style={{
        backgroundColor: '#1a2744',
        color: '#e0e0e0',
        opacity: isDragging ? 0.5 : 1,
        transform: isDragging ? 'scale(0.95)' : 'scale(1)',
        filter: 'brightness(1)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.filter = 'brightness(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.filter = 'brightness(1)';
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: node.color }}
        />
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="flex-shrink-0" style={{ color: node.color }}>
            {node.icon}
          </span>
          {!collapsed && (
            <span className="font-medium text-sm truncate">
              {node.name}
            </span>
          )}
        </div>
        {!collapsed && (
          <div
            ref={drag}
            className="flex-shrink-0 p-1 rounded hover:bg-white/10"
            style={{ cursor: 'grab' }}
          >
            <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" opacity="0.5">
              <circle cx="3" cy="4" r="1.5" />
              <circle cx="9" cy="4" r="1.5" />
              <circle cx="3" cy="8" r="1.5" />
              <circle cx="9" cy="8" r="1.5" />
              <circle cx="3" cy="12" r="1.5" />
              <circle cx="9" cy="12" r="1.5" />
            </svg>
          </div>
        )}
      </div>
      {!collapsed && (
        <p className="text-xs opacity-70 leading-relaxed pl-5">
          {node.description}
        </p>
      )}
    </div>
  );
};

const NodePanel: React.FC<NodePanelProps> = ({ collapsed, onToggle }) => {
  return (
    <>
      <style>{`
        @media (max-width: 767px) {
          .node-panel {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            height: auto !important;
            max-height: 60vh;
            z-index: 50;
            transition: transform 0.3s ease-in-out !important;
            border-radius: 0 0 16px 16px !important;
          }
          .node-panel.collapsed {
            transform: translateY(-100%) !important;
          }
          .node-panel:not(.collapsed) {
            transform: translateY(0) !important;
          }
          .toggle-button {
            position: fixed !important;
            top: 8px !important;
            right: 8px !important;
            left: auto !important;
            transform: none !important;
          }
        }
      `}</style>
      <div
        className={`node-panel ${collapsed ? 'collapsed' : ''} fixed left-0 top-0 h-full flex flex-col transition-all duration-300 ease-in-out z-40`}
        style={{
          width: collapsed ? '48px' : '240px',
          backgroundColor: '#16213e',
          color: '#e0e0e0',
          borderRight: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '4px 0 16px rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="flex items-center justify-between p-3 border-b border-white/10">
          {!collapsed && (
            <h2 className="text-sm font-semibold">节点面板</h2>
          )}
          <button
            className={`toggle-button flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-300 hover:bg-white/10 ${collapsed ? 'mx-auto' : ''}`}
            onClick={onToggle}
            style={{
              position: collapsed ? 'absolute' : 'relative',
              right: collapsed ? '0' : 'auto',
              transform: collapsed ? 'translateX(50%)' : 'none',
              backgroundColor: collapsed ? '#16213e' : 'transparent',
              border: collapsed ? '1px solid rgba(255, 255, 255, 0.1)' : 'none'
            }}
          >
            <span style={{ transition: 'transform 0.3s ease-in-out' }}>
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </span>
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-3 p-3 overflow-y-auto">
          {nodeDefinitions.map((node) => (
            <NodeCard key={node.type} node={node} collapsed={collapsed} />
          ))}
        </div>
      </div>
    </>
  );
};

export default NodePanel;
