import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useAnimStore } from '../store';
import { Block } from '../types';
import { ShapeCard } from './ShapeCard';
import { PenTool, Grid3x3 } from 'lucide-react';

interface EditPanelProps {
  isMobileVertical?: boolean;
}

export const EditPanel: React.FC<EditPanelProps> = ({ isMobileVertical = false }) => {
  const blocks = useAnimStore(s => s.blocks);
  const canAddShape = useAnimStore(s => s.canAddShape);

  const shapeBlocks = blocks.filter(b => b.type === 'shape');

  const { setNodeRef, isOver } = useDroppable({
    id: 'edit-panel-main',
    data: {
      type: 'edit-panel-drop'
    },
    disabled: !canAddShape()
  });

  return (
    <div
      className={`
        relative flex-1 flex flex-col overflow-hidden
        ${isMobileVertical ? 'h-[60%]' : 'w-[60%]'}
        border-r border-white/5
      `}
    >
      <div className="p-4 border-b border-white/5 bg-[#1a1a2e]/80 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <PenTool size={18} className="text-[#4ecdc4]" />
              <h2 className="text-base font-bold text-[#e0e0e0]">编辑面板</h2>
            </div>
            <p className="text-xs text-white/50">
              拖拽积木，组合你的专属动画
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 text-xs font-mono">
              <span className="text-[#4ecdc4] font-semibold">{shapeBlocks.length}</span>
              <span className="text-white/40"> / 5 形状</span>
            </div>
            <Grid3x3 size={16} className="text-white/30" />
          </div>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`
          flex-1 overflow-y-auto p-4
          transition-all duration-200
          ${isOver && canAddShape() ? 'bg-[#e94560]/[0.03]' : ''}
        `}
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      >
        {shapeBlocks.length === 0 ? (
          <EmptyState isOver={isOver} />
        ) : (
          <div className="space-y-4 max-w-2xl mx-auto">
            {shapeBlocks.map((block, idx) => (
              <ShapeCard
                key={block.id}
                block={block}
                index={idx}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ isOver: boolean }> = ({ isOver }) => {
  return (
    <div className="h-full min-h-[400px] flex items-center justify-center">
      <div
        className={`
          max-w-md w-full p-10 rounded-3xl
          border-2 border-dashed text-center
          transition-all duration-300
          ${isOver
            ? 'border-[#e94560]/50 bg-[#e94560]/10 scale-105'
            : 'border-white/10 bg-white/[0.02]'
          }
        `}
      >
        <div className="flex justify-center gap-3 mb-5">
          {['●', '■', '▲', '★'].map((shape, i) => (
            <div
              key={i}
              className={`
                text-3xl transition-all duration-500
                ${isOver ? 'scale-125 opacity-100' : 'opacity-30'}
              `}
              style={{
                color: ['#e94560', '#4ecdc4', '#ffe66d', '#a855f7'][i],
                animationDelay: `${i * 100}ms`,
                textShadow: isOver
                  ? `0 0 20px ${['#e94560', '#4ecdc4', '#ffe66d', '#a855f7'][i]}60`
                  : 'none'
              }}
            >
              {shape}
            </div>
          ))}
        </div>

        <h3 className="text-xl font-bold text-[#e0e0e0] mb-2">
          开始你的动画创作！
        </h3>
        <p className="text-sm text-white/50 leading-relaxed mb-4">
          从左侧 <span className="text-[#4ecdc4] font-semibold">形状积木</span> 拖拽一个到这里
          <br />
          然后再拖入 <span className="text-[#e94560] font-semibold">动画积木</span> 组合效果
        </p>

        <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
          {[
            { icon: '↔', name: '移动', color: '#e94560' },
            { icon: '↻', name: '旋转', color: '#4ecdc4' },
            { icon: '⤡', name: '缩放', color: '#ffe66d' }
          ].map((item, i) => (
            <div
              key={i}
              className="p-2 rounded-xl bg-white/5 border border-white/5"
            >
              <div
                className="text-xl mb-0.5"
                style={{ color: item.color }}
              >
                {item.icon}
              </div>
              <div className="text-[10px] text-white/50">{item.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
