import React from 'react';
import type { OutlineItem } from '../types';

interface SidebarProps {
  outline: OutlineItem[];
  activeBlockId: string | null;
  onItemClick: (blockId: string) => void;
  onToggleCollapse: (itemId: string) => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  currentUser?: { initials: string; color: string } | null;
}

const OutlineTreeItem: React.FC<{
  item: OutlineItem;
  level: number;
  activeBlockId: string | null;
  onItemClick: (blockId: string) => void;
  onToggleCollapse: (itemId: string) => void;
}> = ({ item, level, activeBlockId, onItemClick, onToggleCollapse }) => {
  const hasChildren = item.children.length > 0;
  const isActive = activeBlockId === item.blockId;

  return (
    <li className="outline-item">
      <div
        className={`outline-item-content ${isActive ? 'active' : ''}`}
        onClick={() => onItemClick(item.blockId)}
        style={{ paddingLeft: `${8 + level * 16}px` }}
      >
        {hasChildren ? (
          <span
            className={`outline-toggle ${item.collapsed ? 'collapsed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse(item.id);
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        ) : (
          <span className="outline-dot" />
        )}
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {item.text}
        </span>
      </div>
      {hasChildren && (
        <ul className={`outline-children ${item.collapsed ? 'collapsed' : ''}`} style={{ maxHeight: item.collapsed ? '0' : `${item.children.length * 40}px` }}>
          {item.children.map((child) => (
            <OutlineTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              activeBlockId={activeBlockId}
              onItemClick={onItemClick}
              onToggleCollapse={onToggleCollapse}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export const Sidebar: React.FC<SidebarProps> = ({
  outline,
  activeBlockId,
  onItemClick,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  currentUser,
}) => {
  return (
    <>
      <div
        className={`sidebar-overlay ${isMobileOpen ? 'visible' : ''}`}
        onClick={onCloseMobile}
      />
      <aside className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <h1 className="sidebar-title">📚 大纲</h1>
          <p className="sidebar-subtitle">文档结构导航</p>
          {currentUser && (
            <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                className="user-avatar"
                style={{
                  backgroundColor: currentUser.color,
                  marginLeft: '0',
                  width: '24px',
                  height: '24px',
                  fontSize: '0.65rem',
                }}
              >
                {currentUser.initials}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                你已登录
              </span>
            </div>
          )}
        </div>
        <div className="sidebar-content">
          {outline.length > 0 ? (
            <ul className="outline-tree">
              {outline.map((item) => (
                <OutlineTreeItem
                  key={item.id}
                  item={item}
                  level={0}
                  activeBlockId={activeBlockId}
                  onItemClick={onItemClick}
                  onToggleCollapse={onToggleCollapse}
                />
              ))}
            </ul>
          ) : (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: '0.875rem',
            }}>
              <p style={{ marginBottom: '8px', fontSize: '2rem' }}>📝</p>
              <p>还没有标题</p>
              <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                在文本块中使用 # 号创建标题
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
