import React, { useState, useRef, useEffect } from 'react';
import type { RecipeBoard } from '../types';
import './BoardList.css';

interface BoardListProps {
  boards: RecipeBoard[];
  onBoardClick: (boardId: string) => void;
  onCreateBoard: (name: string) => void;
  onDeleteBoard: (boardId: string) => void;
  onUpdateBoard: (boardId: string, data: Partial<RecipeBoard>) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  draggingCardBoardId?: string | null;
  onCardDropOnBoard?: (boardId: string) => void;
}

export function BoardList({
  boards,
  onBoardClick,
  onCreateBoard,
  onDeleteBoard,
  onUpdateBoard,
  searchQuery,
  onSearchChange,
  draggingCardBoardId,
  onCardDropOnBoard,
}: BoardListProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingBoardId, setDeletingBoardId] = useState<string | null>(null);
  const [hoveredBoardId, setHoveredBoardId] = useState<string | null>(null);
  const [dragOverBoardId, setDragOverBoardId] = useState<string | null>(null);
  const createInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (showCreateForm && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [showCreateForm]);

  useEffect(() => {
    if (editingBoardId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingBoardId]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newBoardName.trim()) {
      onCreateBoard(newBoardName.trim());
      setNewBoardName('');
      setShowCreateForm(false);
    }
  };

  const handleDoubleClick = (board: RecipeBoard, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBoardId(board.id);
    setEditName(board.name);
  };

  const handleEditSubmit = (boardId: string) => {
    if (editName.trim()) {
      onUpdateBoard(boardId, { name: editName.trim() });
    }
    setEditingBoardId(null);
  };

  const handleDelete = (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingBoardId(boardId);
    setTimeout(() => {
      onDeleteBoard(boardId);
      setDeletingBoardId(null);
    }, 400);
  };

  const handleDragOver = (e: React.DragEvent, boardId: string) => {
    e.preventDefault();
    if (draggingCardBoardId && draggingCardBoardId !== boardId) {
      setDragOverBoardId(boardId);
    }
  };

  const handleDragLeave = () => {
    setDragOverBoardId(null);
  };

  const handleDrop = (e: React.DragEvent, boardId: string) => {
    e.preventDefault();
    setDragOverBoardId(null);
    if (onCardDropOnBoard && draggingCardBoardId && draggingCardBoardId !== boardId) {
      onCardDropOnBoard(boardId);
    }
  };

  const filteredBoards = boards.filter((board) =>
    board.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="board-list-page">
      <header className="page-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">🍳</span>
            美食灵感板
          </h1>
          <p className="page-subtitle">收藏你喜爱的美食食谱，激发烹饪灵感</p>
        </div>
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="搜索食谱板..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="search-input"
          />
        </div>
      </header>

      <div className="boards-grid">
        {filteredBoards.map((board, index) => (
          <div
            key={board.id}
            className={`board-card ${deletingBoardId === board.id ? 'deleting' : ''} ${dragOverBoardId === board.id ? 'drag-highlight' : ''} board-enter`}
            style={{ animationDelay: `${index * 0.08}s` }}
            onClick={() => !editingBoardId && onBoardClick(board.id)}
            onMouseEnter={() => setHoveredBoardId(board.id)}
            onMouseLeave={() => setHoveredBoardId(null)}
            onDragOver={(e) => handleDragOver(e, board.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, board.id)}
          >
            <div className="board-banner" style={{ background: board.gradient }}>
              <div className="banner-pattern" />
            </div>

            <div className="board-content">
              {editingBoardId === board.id ? (
                <input
                  ref={editInputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleEditSubmit(board.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditSubmit(board.id);
                    if (e.key === 'Escape') setEditingBoardId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="board-name-input"
                />
              ) : (
                <h3
                  className="board-name"
                  onDoubleClick={(e) => handleDoubleClick(board, e)}
                  title="双击编辑名称"
                >
                  {board.name}
                </h3>
              )}
              <p className="board-count">{board.cardOrder.length} 个食谱</p>
            </div>

            {hoveredBoardId === board.id && !editingBoardId && (
              <div className="board-actions">
                <button
                  className="board-action-btn edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingBoardId(board.id);
                    setEditName(board.name);
                  }}
                  title="编辑"
                >
                  ✎
                </button>
                <button
                  className="board-action-btn delete"
                  onClick={(e) => handleDelete(board.id, e)}
                  title="删除"
                >
                  ✕
                </button>
              </div>
            )}
          </div>
        ))}

        <div
          className={`board-card create-card ${showCreateForm ? 'form-active' : ''}`}
          onClick={() => !showCreateForm && setShowCreateForm(true)}
        >
          {showCreateForm ? (
            <form className="create-form" onSubmit={handleCreateSubmit}>
              <input
                ref={createInputRef}
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                placeholder="食谱板名称..."
                className="create-input"
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
              <div className="create-form-actions">
                <button
                  type="button"
                  className="create-btn cancel"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateForm(false);
                    setNewBoardName('');
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="create-btn confirm"
                  disabled={!newBoardName.trim()}
                >
                  创建
                </button>
              </div>
            </form>
          ) : (
            <div className="create-content">
              <div className="create-icon">+</div>
              <p className="create-text">创建新食谱板</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
