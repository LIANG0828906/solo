import React, { useState, useRef, useEffect } from 'react';
import { Plus, X, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { usePrototypeStore } from '../../stores/prototypeStore';
import type { Screen } from '../../types';

export const ScreenManager: React.FC = () => {
  const {
    currentProjectId,
    currentScreenId,
    screens,
    setCurrentScreen,
    addScreen,
    updateScreen,
    deleteScreen,
  } = usePrototypeStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const projectScreens = screens
    .filter((s) => s.projectId === currentProjectId)
    .sort((a, b) => a.order - b.order);

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    const handleClickOutside = () => {
      setMenuOpen(null);
      if (editingId) {
        handleSaveEdit();
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [editingId, editName]);

  const handleAddScreen = () => {
    if (currentProjectId) {
      addScreen(currentProjectId);
    }
  };

  const handleScreenClick = (screen: Screen, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId === screen.id) return;
    setCurrentScreen(screen.id);
  };

  const handleStartEdit = (screen: Screen, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(screen.id);
    setEditName(screen.name);
    setMenuOpen(null);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      updateScreen(editingId, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleDelete = (screenId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (projectScreens.length > 1) {
      deleteScreen(screenId);
    }
    setMenuOpen(null);
  };

  const handleContextMenu = (e: React.MouseEvent, screenId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(menuOpen === screenId ? null : screenId);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      setEditingId(null);
    }
  };

  return (
    <div className="h-14 bg-slate-100 border-t border-slate-200 flex items-center gap-2 px-4 overflow-x-auto">
      {projectScreens.map((screen) => (
        <div
          key={screen.id}
          className="relative"
          onClick={(e) => handleScreenClick(screen, e)}
          onContextMenu={(e) => handleContextMenu(e, screen.id)}
        >
          <div
            className={`w-[120px] h-9 px-3 rounded-lg flex items-center justify-between gap-2 cursor-pointer transition-all ${
              currentScreenId === screen.id
                ? 'bg-white shadow-sm border-b-2 border-purple-600'
                : 'bg-white/60 hover:bg-white/80 text-slate-600'
            }`}
          >
            {editingId === screen.id ? (
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleSaveEdit}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 min-w-0"
              />
            ) : (
              <span className="text-sm truncate flex-1 text-center">
                {screen.name}
              </span>
            )}
            {editingId !== screen.id && (
              <button
                onClick={(e) => handleContextMenu(e, screen.id)}
                className="p-0.5 hover:bg-slate-100 rounded opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical size={12} className="text-slate-400" />
              </button>
            )}
          </div>

          {menuOpen === screen.id && (
            <div
              className="absolute bottom-full left-0 mb-1 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[120px] z-50"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => handleStartEdit(screen, e)}
                className="w-full px-3 py-2 flex items-center gap-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                <Pencil size={14} />
                重命名
              </button>
              {projectScreens.length > 1 && (
                <button
                  onClick={(e) => handleDelete(screen.id, e)}
                  className="w-full px-3 py-2 flex items-center gap-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  删除
                </button>
              )}
            </div>
          )}
        </div>
      ))}

      <button
        onClick={handleAddScreen}
        className="w-9 h-9 flex items-center justify-center bg-white/60 hover:bg-white rounded-lg text-slate-500 hover:text-slate-700 transition-colors group"
        title="新增屏幕"
      >
        <Plus size={18} />
      </button>

      <div className="flex-1" />

      <div className="text-xs text-slate-400">
        {projectScreens.length} 个屏幕
      </div>
    </div>
  );
};
