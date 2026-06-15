import React, { useState } from 'react';
import type { Board, ThemeColor } from '../types';
import { THEME_COLORS } from '../types';
import { useBoardStore } from '../store/boardStore';

interface BoardListProps {
  onOpenBoard: (id: string) => void;
}

const BoardList: React.FC<BoardListProps> = ({ onOpenBoard }) => {
  const boards = useBoardStore((s) => s.boards);
  const addBoard = useBoardStore((s) => s.addBoard);
  const renameBoard = useBoardStore((s) => s.renameBoard);
  const deleteBoard = useBoardStore((s) => s.deleteBoard);

  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newTheme, setNewTheme] = useState<ThemeColor>('dawn-orange');

  const handleCreate = () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    addBoard(trimmed, newTheme);
    setNewName('');
    setNewTheme('dawn-orange');
    setIsCreating(false);
  };

  const handleRename = (board: Board) => {
    const name = prompt('重命名白板', board.name);
    if (name && name.trim()) {
      renameBoard(board.id, name.trim());
    }
  };

  const handleDelete = (board: Board) => {
    if (confirm(`确定删除白板「${board.name}」吗？`)) {
      deleteBoard(board.id);
    }
  };

  return (
    <div className="board-list-page">
      <header className="board-list-header">
        <h1 className="board-list-title">
          <span className="logo-icon">💡</span>
          IdeaCanvas
        </h1>
        <p className="board-list-subtitle">灵感白板 · 协作共创</p>
      </header>

      <div className="board-grid">
        {boards.map((board) => {
          const themeInfo = THEME_COLORS[board.themeColor];
          return (
            <div
              key={board.id}
              className="board-card"
              onClick={() => onOpenBoard(board.id)}
            >
              <div
                className="board-card-theme-corner"
                style={{ backgroundColor: themeInfo.hex }}
              >
                <span className="board-card-theme-label">{themeInfo.label}</span>
              </div>
              <div className="board-card-body">
                <h3 className="board-card-name">{board.name}</h3>
                <div className="board-card-meta">
                  {new Date(board.updatedAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
              <div className="board-card-actions" onClick={(e) => e.stopPropagation()}>
                <button
                  className="board-card-action-btn"
                  onClick={() => handleRename(board)}
                  title="重命名"
                >
                  ✏️
                </button>
                <button
                  className="board-card-action-btn"
                  onClick={() => handleDelete(board)}
                  title="删除"
                >
                  🗑️
                </button>
              </div>
            </div>
          );
        })}

        <div className="board-card board-card-new" onClick={() => setIsCreating(true)}>
          <div className="board-card-new-icon">＋</div>
          <div className="board-card-new-text">新建白板</div>
        </div>
      </div>

      {isCreating && (
        <div className="modal-overlay" onClick={() => setIsCreating(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">创建新白板</h2>
            <div className="modal-field">
              <label>白板名称</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="输入白板名称"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              />
            </div>
            <div className="modal-field">
              <label>主题氛围色</label>
              <div className="theme-selector">
                {(Object.keys(THEME_COLORS) as ThemeColor[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={`theme-option ${newTheme === key ? 'selected' : ''}`}
                    onClick={() => setNewTheme(key)}
                  >
                    <span className="theme-dot" style={{ backgroundColor: THEME_COLORS[key].hex }} />
                    <span className="theme-name">{THEME_COLORS[key].label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setIsCreating(false)}>取消</button>
              <button className="btn-confirm" onClick={handleCreate} disabled={!newName.trim()}>创建</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BoardList;
