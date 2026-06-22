import React, { useRef, useState, useCallback, useEffect } from 'react';
import type { StoryNode } from '@/types';
import { useEditorStore } from '@/store';
import { MessageSquare, ChevronRight, GripVertical, Trash2 } from 'lucide-react';

interface NodeCardProps {
  node: StoryNode;
  isSelected: boolean;
  isSimActive: boolean;
  isInPath: boolean;
  isSimulating: boolean;
  diffType?: 'added' | 'removed' | 'modified' | null;
  onStartDrag: (e: React.MouseEvent, nodeId: string) => void;
  onStartConnect: (e: React.MouseEvent, nodeId: string) => void;
  onClick: (nodeId: string) => void;
  onDelete: (nodeId: string) => void;
  onSimClick?: (edgeId: string) => void;
}

const NODE_WIDTH = 240;
const NODE_HEIGHT = 160;
const PORT_SIZE = 14;

export const NodeCard: React.FC<NodeCardProps> = ({
  node,
  isSelected,
  isSimActive,
  isInPath,
  isSimulating,
  diffType,
  onStartDrag,
  onStartConnect,
  onClick,
  onDelete,
  onSimClick,
}) => {
  const store = useEditorStore();
  const [showDelete, setShowDelete] = useState(false);
  const outgoingEdges = store.edges.filter((e) => e.sourceId === node.id);

  const getDiffOverlay = () => {
    if (diffType === 'added') {
      return 'border-2 border-dashed border-green-400';
    }
    if (diffType === 'removed') {
      return 'border-2 border-dashed border-red-400 opacity-50';
    }
    if (diffType === 'modified') {
      return 'animate-blink-yellow';
    }
    return '';
  };

  const getBorderClass = () => {
    if (isSimActive) {
      return 'border-2 animate-pulse-gold border-[#f5c16c]';
    }
    if (isSelected) {
      return 'border-2 border-[#e94560] animate-border-glow';
    }
    if (isInPath && !isSimulating) {
      return 'border border-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.4)]';
    }
    return 'border border-white/10';
  };

  const opacityClass = isSimulating && !isSimActive && !isInPath ? 'opacity-40' : '';

  return (
    <div
      className={`absolute rounded-lg bg-[#16213e] card-shadow overflow-hidden select-none transition-all duration-200 ${getBorderClass()} ${opacityClass} ${getDiffOverlay()}`}
      style={{
        left: node.position.x,
        top: node.position.y,
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        zIndex: isSelected ? 20 : isSimActive ? 15 : 10,
      }}
      onMouseEnter={() => setShowDelete(true)}
      onMouseLeave={() => setShowDelete(false)}
    >
      <div
        className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#0f3460]/80 to-transparent border-b border-white/5 cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => onStartDrag(e, node.id)}
        onClick={(e) => {
          e.stopPropagation();
          onClick(node.id);
        }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <GripVertical size={14} className="text-white/30 shrink-0" />
          <h3 className="font-display text-sm font-semibold text-white truncate">
            {node.title}
          </h3>
        </div>
        {showDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="p-1 rounded hover:bg-red-500/20 text-white/40 hover:text-red-400 transition-colors shrink-0"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <div
        className="p-3 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation();
          onClick(node.id);
        }}
      >
        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-2">
          {node.description}
        </p>

        {node.dialogues.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <MessageSquare size={12} className="text-[#e94560]/70" />
            <span>{node.dialogues.length} 条对话</span>
          </div>
        )}
      </div>

      <div className="absolute left-1/2 -translate-x-1/2 -bottom-[8px]">
        {isSimActive && outgoingEdges.length > 0 ? (
          <div
            className="flex gap-1 -translate-y-full mb-1 bg-[#1a1a2e] rounded px-1 py-0.5 border border-[#f5c16c]/30 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {outgoingEdges.map((edge) => (
              <button
                key={edge.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSimClick?.(edge.id);
                }}
                className="flex items-center gap-1 px-2 py-1 rounded text-[10px] text-[#f5c16c] hover:bg-[#f5c16c]/10 transition-colors"
              >
                <ChevronRight size={12} />
                {edge.condition.type === 'has_item'
                  ? `持有${edge.condition.itemName || '道具'}`
                  : '推进剧情'}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div
        className="absolute -left-[7px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-[#0f3460] border-2 border-slate-500 hover:border-[#e94560] hover:scale-125 transition-all cursor-crosshair z-30"
        title="输入端口"
      />

      <div
        className={`absolute -right-[7px] top-1/2 -translate-y-1/2 w-[14px] h-[14px] rounded-full bg-[#0f3460] border-2 border-slate-500 hover:border-[#e94560] hover:scale-125 transition-all cursor-crosshair z-30 ${isSimActive ? 'bg-[#e94560] border-white animate-pulse' : ''}`}
        title="输出端口 - 拖拽创建连线"
        onMouseDown={(e) => {
          e.stopPropagation();
          onStartConnect(e, node.id);
        }}
      />

      <div className="absolute top-1/2 left-0 flex items-center pointer-events-none">
        <div
          className="w-[7px] h-[2px] bg-slate-600"
          style={{ transform: 'translateX(-4px)' }}
        />
      </div>
      <div className="absolute top-1/2 right-0 flex items-center pointer-events-none">
        <div
          className="w-[7px] h-[2px] bg-slate-600"
          style={{ transform: 'translateX(4px)' }}
        />
      </div>
    </div>
  );
};

export default NodeCard;
export { NODE_WIDTH, NODE_HEIGHT, PORT_SIZE };
