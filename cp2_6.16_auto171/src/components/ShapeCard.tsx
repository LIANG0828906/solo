import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { Block, ShapeParams, ShapeTypes, MAX_ANIMATIONS_PER_SHAPE } from '../types';
import { useAnimStore } from '../store';
import { AnimationBlock } from './AnimationBlock';
import { ParamsEditor } from './ParamsEditor';
import { X, Layers, ChevronDown, ChevronUp, GripVertical } from 'lucide-react';

interface ShapeCardProps {
  block: Block;
  index: number;
}

const getShapePreview = (block: Block): JSX.Element => {
  const params = block.params as ShapeParams;
  const fill = params.fill;
  const size = 28;

  switch (block.shapeType) {
    case ShapeTypes.CIRCLE:
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="16" fill={fill} />
        </svg>
      );
    case ShapeTypes.RECTANGLE:
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <rect x="4" y="8" width="32" height="24" rx="2" fill={fill} />
        </svg>
      );
    case ShapeTypes.TRIANGLE:
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <polygon points="20,4 4,34 36,34" fill={fill} />
        </svg>
      );
    case ShapeTypes.STAR: {
      const points = params.points ?? 5;
      const outerR = 16;
      const innerR = 7;
      const pts: string[] = [];
      for (let i = 0; i < points * 2; i++) {
        const angle = (i * Math.PI) / points - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        pts.push(`${20 + r * Math.cos(angle)},${20 + r * Math.sin(angle)}`);
      }
      return (
        <svg width={size} height={size} viewBox="0 0 40 40">
          <polygon points={pts.join(' ')} fill={fill} />
        </svg>
      );
    }
    default:
      return <></>;
  }
};

export const ShapeCard: React.FC<ShapeCardProps> = ({ block, index }) => {
  const sequences = useAnimStore(s => s.sequences);
  const blocks = useAnimStore(s => s.blocks);
  const toggleBlockExpanded = useAnimStore(s => s.toggleBlockExpanded);
  const expandedBlocks = useAnimStore(s => s.expandedBlocks);
  const deleteBlock = useAnimStore(s => s.deleteBlock);
  const canAddAnimation = useAnimStore(s => s.canAddAnimation);

  const isExpanded = expandedBlocks.has(block.id);
  const seq = sequences.find(s => s.shapeId === block.id);
  const animationIds = seq?.animationIds ?? [];
  const animations = animationIds
    .map(id => blocks.find(b => b.id === id))
    .filter((b): b is Block => b !== undefined);

  const borderColor = (block.params as ShapeParams).fill;
  const canDropAnim = canAddAnimation(block.id);

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `shape-drop-${block.id}`,
    data: {
      type: 'shape-drop-area',
      shapeId: block.id,
      block
    },
    disabled: !canDropAnim
  });

  const handleDelete = () => {
    deleteBlock(block.id);
  };

  return (
    <div
      className={`
        relative rounded-2xl overflow-hidden
        bg-[#1a1a2e] border border-white/10
        transition-all duration-300 ease-out
        animate-[cardIn_0.3s_cubic-bezier(0.34,1.56,0.64,1)]
        ${isOver && canDropAnim ? 'ring-2 ring-[#e94560]/60 shadow-[0_0_30px_rgba(233,69,96,0.15)]' : ''}
        ${!canDropAnim ? 'opacity-90' : ''}
      `}
      style={{
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: `inset 0 0 60px ${borderColor}08`
      }}
    >
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
        onClick={() => toggleBlockExpanded(block.id)}
      >
        <div className="flex flex-col items-center gap-1">
          <div
            className="p-2 rounded-xl bg-white/5"
            style={{ boxShadow: `0 0 20px ${borderColor}30` }}
          >
            {getShapePreview(block)}
          </div>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 text-white/60 font-mono">
            #{index + 1}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#e0e0e0]">{block.name}</h3>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ backgroundColor: `${borderColor}30`, color: borderColor }}
              >
                {animationIds.length}/10 动画
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={e => { e.stopPropagation(); handleDelete(); }}
                className="p-1.5 rounded-lg text-white/40 hover:text-[#e94560] hover:bg-[#e94560]/10 transition-all"
                title="删除形状"
              >
                <X size={16} />
              </button>
              <div className="text-white/40">
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            </div>
          </div>

          <div className="text-xs text-white/50 flex items-center gap-2">
            <Layers size={12} />
            <span>
              {animationIds.length > 0
                ? `含 ${animationIds.length} 个动画效果`
                : '拖入动画积木开始创作动画'}
            </span>
          </div>
        </div>
      </div>

      <div
        className={`
          overflow-hidden transition-all duration-300 ease-out
          ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
        `}
      >
        <div className="px-4 pb-4 space-y-4">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5">
            <h4 className="text-xs font-semibold text-white/70 mb-2 flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: borderColor }}
              />
              形状参数
            </h4>
            <ParamsEditor block={block} />
          </div>

          <div
            ref={setDropRef}
            className={`
              p-3 rounded-xl border-2 border-dashed transition-all
              ${isOver && canDropAnim
                ? 'border-[#e94560]/60 bg-[#e94560]/10'
                : 'border-white/10 bg-white/[0.02]'
              }
              ${!canDropAnim ? 'border-white/5 bg-white/[0.01]' : ''}
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#e94560]" />
                动画序列
              </h4>
              {!canDropAnim && (
                <span className="text-[10px] text-[#e94560] font-semibold">
                  已达上限
                </span>
              )}
            </div>

            {animations.length === 0 ? (
              <div className="py-6 flex flex-col items-center justify-center text-white/30">
                <GripVertical size={20} className="mb-1 opacity-50" />
                <span className="text-xs">拖动画积木到这里</span>
              </div>
            ) : (
              <SortableContext
                items={animations.map(a => `anim-${a.id}`)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {animations.map((anim, idx) => (
                    <AnimationBlock
                      key={anim.id}
                      block={anim}
                      shapeId={block.id}
                      index={idx}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
