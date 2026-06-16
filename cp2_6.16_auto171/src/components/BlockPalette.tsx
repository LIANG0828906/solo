import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { SHAPE_PALETTE, ANIMATION_PALETTE, ShapePaletteItem, AnimationPaletteItem } from '../types';
import { useAnimStore } from '../store';
import { Blocks, Shapes, Sparkles } from 'lucide-react';

interface PaletteBlockProps {
  item: ShapePaletteItem | AnimationPaletteItem;
  category: 'shape' | 'animation';
  disabled?: boolean;
}

const PaletteBlock: React.FC<PaletteBlockProps> = ({ item, category, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${category}-${'shapeType' in item ? item.shapeType : item.animationType}`,
    data: {
      category,
      item,
      fromPalette: true
    },
    disabled
  });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        zIndex: 9999,
        opacity: isDragging ? 0.8 : 1
      }
    : undefined;

  const previewColor = 'shapeType' in item ? item.defaultParams.fill : '#e94560';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        relative p-3 rounded-xl cursor-grab active:cursor-grabbing
        bg-[#0f3460] border border-white/10
        transition-all duration-200 ease-out
        hover:-translate-y-1 hover:shadow-lg hover:shadow-[rgba(233,69,96,0.3)]
        ${isDragging ? 'scale-105 shadow-xl shadow-[rgba(233,69,96,0.4)]' : ''}
        ${disabled ? 'opacity-50 cursor-not-allowed hover:translate-y-0' : ''}
      `}
    >
      <div className="flex items-center gap-2">
        <span
          className="text-2xl flex-shrink-0"
          style={{ color: previewColor, textShadow: `0 0 8px ${previewColor}40` }}
        >
          {item.icon}
        </span>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-[#e0e0e0] truncate">
            {item.name}
          </span>
          <span className="text-[10px] text-white/50 truncate">
            {'shapeType' in item ? '形状' : '动画'}
          </span>
        </div>
      </div>
    </div>
  );
};

interface BlockPaletteProps {
  isMobileCollapsed?: boolean;
}

export const BlockPalette: React.FC<BlockPaletteProps> = ({ isMobileCollapsed = false }) => {
  const canAddShape = useAnimStore(s => s.canAddShape);
  const blocks = useAnimStore(s => s.blocks);
  const shapeCount = blocks.filter(b => b.type === 'shape').length;

  if (isMobileCollapsed) {
    return null;
  }

  return (
    <div className="w-[240px] flex-shrink-0 bg-[#16213e] border-r border-white/5 flex flex-col overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2 mb-1">
          <Blocks size={18} className="text-[#e94560]" />
          <h2 className="text-base font-bold text-[#e0e0e0]">积木库</h2>
        </div>
        <p className="text-xs text-white/50">拖拽积木到编辑区</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div>
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <Shapes size={14} className="text-[#4ecdc4]" />
            <h3 className="text-xs font-semibold text-[#4ecdc4] uppercase tracking-wider">
              形状积木
            </h3>
            <span className="text-[10px] text-white/40 ml-auto">
              {shapeCount}/5
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {SHAPE_PALETTE.map(item => (
              <PaletteBlock
                key={item.shapeType}
                item={item}
                category="shape"
                disabled={!canAddShape()}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-1.5 mb-2 px-1">
            <Sparkles size={14} className="text-[#e94560]" />
            <h3 className="text-xs font-semibold text-[#e94560] uppercase tracking-wider">
              动画积木
            </h3>
            <span className="text-[10px] text-white/40 ml-auto">
              拖到形状上
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {ANIMATION_PALETTE.map(item => (
              <PaletteBlock
                key={item.animationType}
                item={item}
                category="animation"
              />
            ))}
          </div>
        </div>

        <div className="pt-2 mt-2 border-t border-white/5">
          <div className="p-2 rounded-lg bg-[#0f3460]/50">
            <p className="text-[11px] text-white/60 leading-relaxed">
              💡 <strong className="text-white/80">提示：</strong>先拖形状积木到中间，再拖动画积木到形状卡片里组合动画效果！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
