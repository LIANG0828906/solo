import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Block, AnimationTypes, AnimationParams } from '../types';
import { useAnimStore } from '../store';
import { ParamsEditor } from './ParamsEditor';
import { GripVertical, X, ChevronDown, ChevronUp } from 'lucide-react';

interface AnimationBlockProps {
  block: Block;
  shapeId: string;
  index: number;
}

const getPreviewText = (block: Block): string => {
  const params = block.params as AnimationParams;
  switch (block.animationType) {
    case AnimationTypes.MOVE:
      return `(${params.dx! > 0 ? '+' : ''}${params.dx}, ${params.dy! > 0 ? '+' : ''}${params.dy})`;
    case AnimationTypes.ROTATE:
      return `${params.angle}°`;
    case AnimationTypes.SCALE:
      return `${params.factor}x`;
    case AnimationTypes.COLOR:
      return params.targetColor ?? '';
    case AnimationTypes.BLINK:
      return `${params.frequency}Hz`;
    default:
      return '';
  }
};

export const AnimationBlock: React.FC<AnimationBlockProps> = ({ block, shapeId, index }) => {
  const toggleBlockExpanded = useAnimStore(s => s.toggleBlockExpanded);
  const expandedBlocks = useAnimStore(s => s.expandedBlocks);
  const deleteBlock = useAnimStore(s => s.deleteBlock);

  const isExpanded = expandedBlocks.has(block.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: `anim-${block.id}`,
    data: {
      type: 'animation-block',
      block,
      shapeId,
      index
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 999 : 'auto'
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    deleteBlock(block.id);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`
        relative rounded-lg overflow-hidden
        bg-[#16213e] border border-white/5
        transition-all duration-200
        ${isDragging ? 'opacity-90 shadow-2xl shadow-[#e94560]/30 scale-[1.02]' : ''}
      `}
    >
      <div
        className={`
          flex items-center gap-2 p-2.5 pl-3
          border-l-4 border-[#e94560]
          cursor-pointer
          hover:bg-white/[0.03] transition-colors
        `}
        onClick={() => toggleBlockExpanded(block.id)}
      >
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 -ml-1 rounded hover:bg-white/10"
        >
          <GripVertical size={14} className="text-white/40" />
        </div>

        <span className="text-lg flex-shrink-0" style={{ textShadow: '0 0 8px #e9456060' }}>
          {block.icon}
        </span>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#e0e0e0]">{block.name}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">
              #{index + 1}
            </span>
          </div>
          <span className="text-xs text-[#e94560] font-mono truncate">
            {getPreviewText(block)}
          </span>
        </div>

        <button
          onClick={handleDelete}
          className="p-1.5 rounded-md text-white/40 hover:text-[#e94560] hover:bg-[#e94560]/10 transition-all"
        >
          <X size={14} />
        </button>

        <div className="text-white/40">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          bg-gradient-to-b from-[#0f3460]/30 to-transparent
          ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-3 pb-3 pt-1 border-t border-white/5">
          <ParamsEditor block={block} />
        </div>
      </div>
    </div>
  );
};
