import { useDrag } from 'react-dnd';
import { Type, Briefcase, BarChart3, GraduationCap, FolderKanban } from 'lucide-react';
import type { ComponentType } from '@/store/types';

interface DraggableItemProps {
  type: ComponentType;
  label: string;
  icon: React.ReactNode;
}

const COMPONENT_ITEMS: { type: ComponentType; label: string; icon: React.ReactNode }[] = [
  { type: 'heading', label: '标题', icon: <Type size={18} /> },
  { type: 'experience', label: '经历', icon: <Briefcase size={18} /> },
  { type: 'skill-bar', label: '技能条', icon: <BarChart3 size={18} /> },
  { type: 'education', label: '教育背景', icon: <GraduationCap size={18} /> },
  { type: 'project-list', label: '项目列表', icon: <FolderKanban size={18} /> },
];

function DraggableItem({ type, label, icon }: DraggableItemProps) {
  const [{ isDragging }, dragRef] = useDrag({
    type: 'COMPONENT',
    item: { type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={dragRef}
      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-slate-200/80 bg-white cursor-grab active:cursor-grabbing select-none transition-all duration-200 hover:border-blue-300 hover:shadow-md hover:scale-[1.02] hover:-translate-y-0.5"
      style={{
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 text-slate-500 transition-colors duration-200 group-hover:bg-blue-50 group-hover:text-blue-500">
        {icon}
      </div>
      <span className="text-sm font-medium text-slate-600">{label}</span>
    </div>
  );
}

export default function Panel() {
  return (
    <aside className="w-60 flex-shrink-0 bg-slate-50/80 border-r border-slate-200/60 flex flex-col h-full">
      <div className="px-4 pt-5 pb-3">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">组件面板</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {COMPONENT_ITEMS.map((item) => (
          <DraggableItem key={item.type} {...item} />
        ))}
      </div>
      <div className="px-4 py-3 border-t border-slate-200/60">
        <p className="text-[11px] text-slate-400 leading-relaxed">拖拽组件到画布区域开始搭建简历</p>
      </div>
    </aside>
  );
}
