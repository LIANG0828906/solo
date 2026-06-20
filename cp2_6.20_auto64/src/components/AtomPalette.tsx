
import React from 'react';
import { ELEMENT_CONFIG, ELEMENT_LIST, type ElementType } from '../utils/constants';
import { useMoleculeStore } from '../store/moleculeStore';

export const AtomPalette: React.FC = () => {
  const setDraggingElement = useMoleculeStore((s) => s.setDraggingElement);

  const handleDragStart = (e: React.DragEvent, element: ElementType) => {
    e.dataTransfer.setData('element', element);
    e.dataTransfer.effectAllowed = 'copy';
    setDraggingElement(element);
  };

  const handleDragEnd = () => {
    setDraggingElement(null);
  };

  return (
    <div className="flex flex-col gap-3 p-4 h-full overflow-y-auto">
      <h3 className="text-xs text-cyan-400 uppercase tracking-widest mb-2 select-none">
        原子元素
      </h3>
      {ELEMENT_LIST.map((element) => {
        const config = ELEMENT_CONFIG[element];
        return (
          <div
            key={element}
            draggable
            onDragStart={(e) => handleDragStart(e, element)}
            onDragEnd={handleDragEnd}
            className="group flex items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing
                       bg-[#1a1f2e]/60 backdrop-blur-sm border border-white/5
                       hover:bg-[#1a1f2e]/90 hover:border-white/10
                       hover:brightness-110 active:scale-95
                       transition-all duration-200 ease-out select-none"
            style={{
              transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <div
              className="relative flex-shrink-0 rounded-full transition-all duration-200 ease-out
                         group-hover:scale-125"
              style={{
                width: config.radius * 40,
                height: config.radius * 40,
                backgroundColor: config.color,
                boxShadow: `0 0 0px ${config.color}`,
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = 
                  `0 0 20px ${config.color}, 0 0 40px ${config.color}66`;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 0px ${config.color}`;
              }}
            >
              <div
                className="absolute inset-0 rounded-full opacity-40"
                style={{
                  background: `radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), transparent 60%)`,
                }}
              />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-white">{config.name}</span>
              <span className="text-xs text-gray-400">
                {element} · {config.atomicWeight.toFixed(2)}
              </span>
            </div>
          </div>
        );
      })}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-[10px] text-gray-500 leading-relaxed select-none">
          拖拽原子到3D场景中放置，点击工具条选择键类型后依次点击两个原子创建化学键。
        </p>
      </div>
    </div>
  );
};
