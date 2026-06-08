import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { moduleDefs } from '../data/moduleDefs';
import type { Theme } from '../styles/themes';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  theme: Theme;
}

interface DraggableModuleItemProps {
  type: string;
  name: string;
  icon: string;
  description: string;
  theme: Theme;
}

function DraggableModuleItem({ type, name, icon, description, theme }: DraggableModuleItemProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${type}`,
    data: {
      type: 'sidebar-item',
      moduleType: type,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className="draggable-item"
      style={{
        backgroundColor: theme.inputBg,
        color: theme.sidebarText,
        borderColor: theme.inputBorder,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <span className="draggable-item-icon">{icon}</span>
      <div className="draggable-item-content">
        <div className="draggable-item-name">{name}</div>
        <div className="draggable-item-desc" style={{ color: theme.sidebarText }}>
          {description}
        </div>
      </div>
    </div>
  );
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, theme }) => {
  return (
    <aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      style={{
        backgroundColor: theme.sidebarBg,
        color: theme.sidebarText,
        borderColor: theme.sidebarBorder,
      }}
    >
      <div className="sidebar-header">
        <span className="sidebar-title">组件面板</span>
        <button
          className="toggle-btn"
          onClick={onToggle}
          style={{ color: theme.sidebarText }}
          title={collapsed ? '展开' : '折叠'}
        >
          {collapsed ? '›' : '‹'}
        </button>
      </div>
      <div className="module-list">
        {moduleDefs.map((mod) => (
          <DraggableModuleItem
            key={mod.type}
            type={mod.type}
            name={mod.name}
            icon={mod.icon}
            description={mod.description}
            theme={theme}
          />
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
