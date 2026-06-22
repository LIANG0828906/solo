import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { useMindmapStore } from '../store/mindmapStore';

const priorityColors: Record<string, string> = {
  high: '#ff4d4f',
  medium: '#faad14',
  low: '#52c41a',
};

interface CustomNodeData {
  label: string;
  nodeId: string;
  onAddTask: (nodeId: string) => void;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const { getTasksForNode, getHighestPriorityForNode } = useMindmapStore();
  const tasks = getTasksForNode(data.nodeId);
  const highestPriority = getHighestPriorityForNode(data.nodeId);
  const taskCount = tasks.length;

  return (
    <div
      className={`custom-node ${selected ? 'selected' : ''}`}
      style={{
        position: 'relative',
        padding: '12px 16px',
        borderRadius: '10px',
        backgroundColor: '#2a2a3e',
        border: selected ? '1.5px solid #4a4a6e' : '1px solid rgba(255,255,255,0.2)',
        boxShadow: selected ? '0 0 3px 3px rgba(59,130,246,0.5)' : 'none',
        color: '#fff',
        fontSize: '14px',
        minWidth: '100px',
        textAlign: 'center',
        transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          border: 'none',
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>{data.label}</span>
      </div>

      {taskCount > 0 && highestPriority && (
        <div
          style={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            backgroundColor: priorityColors[highestPriority],
            color: '#fff',
            fontSize: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid #1e1e2e',
          }}
        >
          {taskCount > 99 ? '99+' : taskCount}
        </div>
      )}

      <button
        className="add-task-btn"
        onClick={(e) => {
          e.stopPropagation();
          data.onAddTask(data.nodeId);
        }}
        style={{
          position: 'absolute',
          top: '-6px',
          right: taskCount > 0 ? '18px' : '-6px',
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.1)',
          border: '1px solid rgba(255,255,255,0.2)',
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          lineHeight: '1',
          padding: 0,
          transition: 'color 0.2s ease, background-color 0.2s ease',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#00d4ff';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(0,212,255,0.15)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.color = '#fff';
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(255,255,255,0.1)';
        }}
      >
        +
      </button>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          width: '8px',
          height: '8px',
          backgroundColor: 'rgba(255,255,255,0.3)',
          border: 'none',
        }}
      />
    </div>
  );
};

export default memo(CustomNode);
