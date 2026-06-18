import { useState, useRef, useCallback, useEffect } from 'react';
import {
  FolderOpen,
  Folder,
  FileText,
  ChevronRight,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  LayoutGrid,
} from 'lucide-react';
import { useStore, getVisibleCategories } from './store';
import type { Category } from './types';

function CategoryItem({
  category,
  isSelected,
  onSelect,
  onToggle,
  onDelete,
  onRename,
}: {
  category: Category;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, name: string) => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(category.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const hasChildren = useStore.getState().categories.some(
    c => c.parentId === category.id
  );

  const handleSave = useCallback(() => {
    const trimmed = editName.trim();
    if (trimmed && trimmed !== category.name) {
      onRename(category.id, trimmed);
    }
    setIsEditing(false);
  }, [editName, category.id, category.name, onRename]);

  const levelIcons = [
    <FolderOpen size={14} />,
    <FileText size={13} />,
    <FileText size={12} style={{ opacity: 0.7 }} />,
  ];

  return (
    <div
      className={`category-item ${isSelected ? 'selected' : ''}`}
      style={{ paddingLeft: 12 + category.level * 16 }}
      onClick={() => onSelect(category.id)}
    >
      <span
        className={`expand-icon ${category.isExpanded ? 'expanded' : ''} ${!hasChildren ? 'leaf' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          if (hasChildren) onToggle(category.id);
        }}
      >
        <ChevronRight size={12} />
      </span>
      <span className="level-icon">{levelIcons[category.level] || levelIcons[2]}</span>
      {isEditing ? (
        <input
          ref={inputRef}
          className="inline-edit-input"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          onClick={e => e.stopPropagation()}
        />
      ) : (
        <span className="cat-name">{category.name}</span>
      )}
      <span className="cat-actions">
        {isEditing ? (
          <>
            <button
              className="cat-action-btn"
              onClick={(e) => { e.stopPropagation(); handleSave(); }}
            >
              <Check size={12} />
            </button>
            <button
              className="cat-action-btn"
              onClick={(e) => { e.stopPropagation(); setIsEditing(false); setEditName(category.name); }}
            >
              <X size={12} />
            </button>
          </>
        ) : (
          <>
            <button
              className="cat-action-btn"
              onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
              title="重命名"
            >
              <Pencil size={11} />
            </button>
            <button
              className="cat-action-btn"
              onClick={(e) => { e.stopPropagation(); onDelete(category.id); }}
              title="删除"
            >
              <Trash2 size={11} />
            </button>
          </>
        )}
      </span>
    </div>
  );
}

export default function Sidebar() {
  const {
    categories,
    selectedCategoryId,
    sidebarWidth,
    isMobileView,
    isSidebarCollapsed,
    selectCategory,
    toggleCategory,
    addCategory,
    deleteCategory,
    renameCategory,
    setSidebarWidth,
    setSidebarCollapsed,
  } = useStore();

  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const resizeRef = useRef<{ startX: number; startWidth: number } | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const visibleCategories = getVisibleCategories();

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    resizeRef.current = { startX: e.clientX, startWidth: sidebarWidth };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (ev: MouseEvent) => {
      if (!resizeRef.current) return;
      const delta = ev.clientX - resizeRef.current.startX;
      const newWidth = resizeRef.current.startWidth + delta;
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      resizeRef.current = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth, setSidebarWidth]);

  const handleAddCategory = useCallback(() => {
    if (!newCatName.trim()) return;
    addCategory(newCatName.trim(), newCatParent);
    setNewCatName('');
    setIsAdding(false);
    setNewCatParent(null);
  }, [newCatName, newCatParent, addCategory]);

  const handleSelect = useCallback((id: string) => {
    selectCategory(selectedCategoryId === id ? null : id);
    if (isMobileView) {
      setSidebarCollapsed(true);
    }
  }, [selectedCategoryId, selectCategory, isMobileView, setSidebarCollapsed]);

  const getLevel0Categories = useCallback(() => {
    return categories.filter(c => c.parentId === null);
  }, [categories]);

  const sidebarContent = (
    <div
      ref={sidebarRef}
      className="sidebar"
      style={{ width: isMobileView ? 280 : sidebarWidth }}
    >
      <div className="sidebar-header">
        <span className="sidebar-title">分类管理</span>
        <div className="sidebar-actions">
          {isMobileView && (
            <button className="cat-action-btn" onClick={() => setSidebarCollapsed(true)}>
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="sidebar-body">
        <div
          className={`category-item ${!selectedCategoryId ? 'selected' : ''}`}
          onClick={() => selectCategory(null)}
        >
          <span className="expand-icon leaf"><ChevronRight size={12} /></span>
          <span className="level-icon"><LayoutGrid size={14} /></span>
          <span className="cat-name">全部片段</span>
        </div>

        {visibleCategories.map(cat => (
          <CategoryItem
            key={cat.id}
            category={cat}
            isSelected={selectedCategoryId === cat.id}
            onSelect={handleSelect}
            onToggle={toggleCategory}
            onDelete={deleteCategory}
            onRename={renameCategory}
          />
        ))}

        {isAdding && (
          <div style={{ paddingLeft: 12 + (newCatParent ? (categories.find(c => c.id === newCatParent)?.level ?? 0 + 1) * 16 : 0) }}>
            <div className="category-add-row">
              <input
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddCategory();
                  if (e.key === 'Escape') { setIsAdding(false); setNewCatName(''); }
                }}
                placeholder="分类名称..."
                autoFocus
              />
              <button className="btn btn-primary" style={{ height: 30, padding: '0 6px', fontSize: 12 }} onClick={handleAddCategory}>
                <Check size={12} />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-secondary"
            style={{ flex: 1 }}
            onClick={() => { setIsAdding(true); setNewCatParent(null); }}
          >
            <Plus size={14} /> 新建分类
          </button>
          {getLevel0Categories().length > 0 && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                const last = getLevel0Categories()[getLevel0Categories().length - 1];
                if (last && last.level < 2) {
                  setIsAdding(true);
                  setNewCatParent(last.id);
                }
              }}
            >
              <Plus size={14} /> 子分类
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (isMobileView) {
    if (isSidebarCollapsed) return null;
    return (
      <>
        <div className="mobile-sidebar-overlay" onClick={() => setSidebarCollapsed(true)} />
        <div className="mobile-sidebar">{sidebarContent}</div>
      </>
    );
  }

  return (
    <div className="sidebar-wrapper" style={{ width: sidebarWidth }}>
      {sidebarContent}
      <div
        className="resize-handle"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}
