import { useState } from 'react';
import { useComponentStore } from '@/store/componentStore';
import { renderShape } from '@/utils/shapes';
import { ChevronDown, ChevronRight } from 'lucide-react';
import type { Category, ComponentItem } from '@/store/componentStore';

const categoryLabels: Record<Category, string> = {
  head: '头部',
  torso: '躯干',
  limbs: '四肢',
  accessories: '配件',
};

const categoryOrder: Category[] = ['head', 'torso', 'limbs', 'accessories'];

interface ComponentCardProps {
  item: ComponentItem;
}

function ComponentCard({ item }: ComponentCardProps) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('application/component-id', item.id);
    e.dataTransfer.effectAllowed = 'copy';
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '0.5';
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '1';
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      className="group flex items-center gap-3 h-[90px] p-2 rounded-lg border-2 border-[#3A3A4A] bg-[rgba(40,40,55,0.6)] cursor-grab active:cursor-grabbing transition-all duration-150 hover:border-[#FF6B6B] hover:bg-[rgba(60,60,75,0.7)]"
    >
      <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center overflow-hidden">
        {renderShape(item.shape, item.color, 64, 64)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-white text-sm font-medium truncate">{item.name}</div>
        <div className="text-[#888] text-xs mt-1">{categoryLabels[item.category]}</div>
        <div
          className="w-4 h-4 rounded-sm mt-1.5 border border-[rgba(255,255,255,0.15)]"
          style={{ backgroundColor: item.color }}
        />
      </div>
    </div>
  );
}

export default function LeftPanel() {
  const componentLibrary = useComponentStore((s) => s.componentLibrary);
  const [openCategories, setOpenCategories] = useState<Set<Category>>(
    new Set(['head', 'torso', 'limbs', 'accessories'])
  );

  const toggleCategory = (cat: Category) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <div className="w-[280px] max-[1200px]:w-[200px] h-full flex flex-col">
      <div
        className="flex-1 overflow-y-auto p-3"
        style={{
          background: 'rgba(30,30,40,0.5)',
          borderRadius: '12px',
        }}
      >
        <div className="text-white text-sm font-semibold mb-3 px-1">组件面板</div>
        {categoryOrder.map((cat) => {
          const items = componentLibrary.filter((ci) => ci.category === cat);
          const isOpen = openCategories.has(cat);

          return (
            <div key={cat} className="mb-2">
              <button
                onClick={() => toggleCategory(cat)}
                className="w-full flex items-center gap-2 px-2 py-2 text-[#ccc] text-sm font-medium rounded-md hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-200"
              >
                {isOpen ? (
                  <ChevronDown size={14} className="text-[#FF6B6B]" />
                ) : (
                  <ChevronRight size={14} className="text-[#888]" />
                )}
                {categoryLabels[cat]}
                <span className="text-[#666] text-xs ml-auto">{items.length}</span>
              </button>
              {isOpen && (
                <div className="flex flex-col gap-2 mt-1 pl-1">
                  {items.map((item) => (
                    <ComponentCard key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
