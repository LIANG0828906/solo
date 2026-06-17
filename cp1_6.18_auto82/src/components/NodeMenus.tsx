import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Check } from 'lucide-react';
import { useStore } from '@/store';
import { BG_SECONDARY, NODE_COLORS, SLIDER_TRACK, SLIDER_THUMB } from '@/shared/types';
import type { NodeType, NodeStatus } from '@/shared/types';

interface AddNodeMenuProps {
  x: number;
  y: number;
  dayOffset: number;
  parentId: string | null;
  onClose: () => void;
}

export function AddNodeMenu({ x, y, dayOffset, parentId, onClose }: AddNodeMenuProps) {
  const [selectedType, setSelectedType] = useState<NodeType>('goal');
  const [description, setDescription] = useState('');
  const addNode = useStore((s) => s.addNode);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = () => {
    if (!description.trim()) return;
    addNode(selectedType, description.trim(), dayOffset, parentId);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={onClose}
    >
      <div
        className="absolute p-4 flex flex-col gap-3 shadow-xl"
        style={{
          left: Math.min(x, window.innerWidth - 230),
          top: Math.min(y + 10, window.innerHeight - 200),
          width: 200,
          background: BG_SECONDARY,
          borderRadius: 6,
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-white/60 font-medium">添加节点</span>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex gap-2">
          {(['goal', 'subtask', 'milestone'] as NodeType[]).map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className="flex-1 py-1.5 text-xs text-center rounded-md transition-all duration-200"
              style={{
                background: selectedType === type ? `${NODE_COLORS[type]}30` : 'rgba(255,255,255,0.05)',
                color: selectedType === type ? NODE_COLORS[type] : 'rgba(255,255,255,0.5)',
                border: selectedType === type ? `1px solid ${NODE_COLORS[type]}60` : '1px solid transparent',
              }}
            >
              {type === 'goal' ? '目标' : type === 'subtask' ? '子任务' : '里程碑'}
            </button>
          ))}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="节点描述..."
          className="w-full px-3 py-2 text-sm text-white placeholder-white/30 outline-none"
          style={{
            background: '#1E1E2E',
            borderRadius: 6,
          }}
          onKeyDown={handleKeyDown}
        />

        <button
          onClick={handleSubmit}
          disabled={!description.trim()}
          className="w-full py-2 text-sm font-medium text-white rounded-md transition-all duration-200 disabled:opacity-30"
          style={{ background: '#6C63FF' }}
        >
          确认添加
        </button>
      </div>
    </div>
  );
}

interface NodeDetailPanelProps {
  nodeId: string;
  onClose: () => void;
}

export function NodeDetailPanel({ nodeId, onClose }: NodeDetailPanelProps) {
  const node = useStore((s) => s.nodes.find((n) => n.id === nodeId));
  const updateNodeStatus = useStore((s) => s.updateNodeStatus);
  const updateNodeEstimatedDays = useStore((s) => s.updateNodeEstimatedDays);
  const updateNodeDescription = useStore((s) => s.updateNodeDescription);
  const deleteNode = useStore((s) => s.deleteNode);
  const triggerCheckRef = useRef<((id: string) => void) | null>(null);

  const setTriggerCheck = useCallback((fn: (id: string) => void) => {
    triggerCheckRef.current = fn;
  }, []);

  if (!node) return null;

  const statusLabels: Record<NodeStatus, string> = {
    not_started: '未开始',
    in_progress: '进行中',
    completed: '已完成',
    overdue: '已延期',
  };

  const handleStatusToggle = () => {
    const prevStatus = node.status;
    updateNodeStatus(nodeId);
    if (prevStatus !== 'completed') {
      setTimeout(() => {
        onClose();
      }, 500);
    }
  };

  const handleDelete = () => {
    deleteNode(nodeId);
    onClose();
  };

  return (
    <div
      className="absolute z-40 p-4 flex flex-col gap-3 shadow-2xl"
      style={{
        right: 16,
        top: 80,
        width: 260,
        background: BG_SECONDARY,
        borderRadius: 12,
        border: '1px solid #3A3A5C',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="w-3 h-3 rounded-full"
            style={{ background: NODE_COLORS[node.type] }}
          />
          <span className="text-sm text-white/60">
            {node.type === 'goal' ? '目标' : node.type === 'subtask' ? '子任务' : '里程碑'}
          </span>
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
          <X size={16} />
        </button>
      </div>

      <input
        type="text"
        value={node.description}
        onChange={(e) => updateNodeDescription(nodeId, e.target.value)}
        className="w-full px-3 py-2 text-sm text-white outline-none"
        style={{
          background: '#1E1E2E',
          borderRadius: 8,
        }}
      />

      <button
        onClick={handleStatusToggle}
        className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium rounded-lg transition-all duration-300"
        style={{
          background: node.status === 'completed' ? '#6BCB77' : node.status === 'in_progress' ? '#4ECDC4' : node.status === 'overdue' ? '#FF6B6B' : 'rgba(255,255,255,0.1)',
          color: node.status === 'not_started' ? 'rgba(255,255,255,0.6)' : '#1A1A2E',
        }}
      >
        {node.status === 'completed' && <Check size={14} />}
        {statusLabels[node.status]}
      </button>

      {node.type !== 'milestone' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-white/50">预估耗时</span>
            <span className="text-sm text-white font-medium">{node.estimatedDays}天</span>
          </div>
          <input
            type="range"
            min={1}
            max={365}
            value={node.estimatedDays}
            onChange={(e) => updateNodeEstimatedDays(nodeId, parseInt(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, ${SLIDER_THUMB} ${((node.estimatedDays - 1) / 364) * 100}%, ${SLIDER_TRACK} ${((node.estimatedDays - 1) / 364) * 100}%)`,
            }}
          />
        </div>
      )}

      <button
        onClick={handleDelete}
        className="mt-1 w-full py-2 text-xs text-red-400/60 hover:text-red-400 rounded-lg transition-colors"
        style={{ background: 'rgba(255,107,107,0.08)' }}
      >
        删除节点
      </button>
    </div>
  );
}

interface EndDateDisplayProps {
  endDate: Date | null;
}

export function EndDateDisplay({ endDate }: EndDateDisplayProps) {
  if (!endDate) return null;

  const now = new Date();
  const diffMs = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / 86400000);

  const formatted = `${endDate.getFullYear()}/${String(endDate.getMonth() + 1).padStart(2, '0')}/${String(endDate.getDate()).padStart(2, '0')}`;

  return (
    <div
      className="absolute z-20 px-4 py-2 flex flex-col items-end"
      style={{ right: 16, top: 16 }}
    >
      <span className="text-xs text-white/40">预计完成</span>
      <span className="text-lg text-white font-semibold">{formatted}</span>
      {diffDays > 0 && (
        <span className="text-xs text-white/50">
          还有 <span className="text-white font-medium">{diffDays}</span> 天
        </span>
      )}
      {diffDays <= 0 && diffDays > -365 && (
        <span className="text-xs text-red-400/70">已过期 {Math.abs(diffDays)} 天</span>
      )}
    </div>
  );
}
