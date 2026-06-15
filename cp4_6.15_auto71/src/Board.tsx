import React, { useState, useCallback } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import Column from './Column';
import { useBoard } from './App';
import type { Priority } from './types';
import './Board.css';

const Board: React.FC = () => {
  const {
    columns,
    labels,
    projectName,
    projectDescription,
    moveCard,
    activeLabelId,
    setActiveLabelId,
    searchQuery,
    setSearchQuery,
    addCard,
  } = useBoard();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createColumnId, setCreateColumnId] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newLabels, setNewLabels] = useState<string[]>([]);
  const [newDueDate, setNewDueDate] = useState('');

  const handleDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    moveCard(
      draggableId,
      source.droppableId,
      destination.droppableId,
      destination.index
    );
  }, [moveCard]);

  const handleOpenCreateModal = (columnId: string) => {
    setCreateColumnId(columnId);
    setNewTitle('');
    setNewDescription('');
    setNewPriority('medium');
    setNewLabels([]);
    setNewDueDate('');
    setShowCreateModal(true);
  };

  const handleCreateCard = () => {
    if (!newTitle.trim()) return;

    addCard(createColumnId, {
      title: newTitle.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      labels: newLabels,
      dueDate: newDueDate || null,
    });

    setShowCreateModal(false);
  };

  const toggleLabel = (labelId: string) => {
    setNewLabels(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleLabelFilter = (labelId: string) => {
    setActiveLabelId(activeLabelId === labelId ? null : labelId);
  };

  const priorityColors: Record<Priority, string> = {
    high: '#FF6B6B',
    medium: '#FFB74D',
    low: '#69F0AE',
  };

  return (
    <div className="board-container">
      <div className="board-header">
        <div className="board-header-left">
          <h1 className="board-title">{projectName}</h1>
          <p className="board-description">{projectDescription}</p>
        </div>
        <div className="board-header-right">
          <div className="search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="搜索卡片..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="labels-bar">
        <span className="labels-label">标签：</span>
        <div className="labels-list">
          {labels.map(label => (
            <button
              key={label.id}
              className={`label-pill ${activeLabelId === label.id ? 'active' : ''}`}
              style={{
                backgroundColor: activeLabelId === label.id ? label.color : `${label.color}20`,
                color: activeLabelId === label.id ? '#fff' : label.color,
                borderColor: label.color,
              }}
              onClick={() => handleLabelFilter(label.id)}
            >
              {label.name}
            </button>
          ))}
          {activeLabelId && (
            <button
              className="clear-filter-btn"
              onClick={() => setActiveLabelId(null)}
            >
              清除筛选
            </button>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board-columns">
          {columns.map((column, colIndex) => (
            <React.Fragment key={column.id}>
              {colIndex > 0 && <div className="column-divider" />}
              <Column
                column={column}
                colIndex={colIndex}
                onAddCard={() => handleOpenCreateModal(column.id)}
              />
            </React.Fragment>
          ))}
        </div>
      </DragDropContext>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div
            className="create-card-modal glass-effect"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="modal-title">创建新卡片</h3>

            <div className="form-group">
              <label className="form-label">标题</label>
              <input
                type="text"
                className="form-input"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="输入卡片标题..."
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">描述</label>
              <textarea
                className="form-textarea"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="输入卡片描述..."
                rows={3}
              />
            </div>

            <div className="form-group">
              <label className="form-label">优先级</label>
              <div className="priority-options">
                {(['high', 'medium', 'low'] as Priority[]).map(p => (
                  <button
                    key={p}
                    className={`priority-option ${newPriority === p ? 'selected' : ''}`}
                    onClick={() => setNewPriority(p)}
                  >
                    <span
                      className="priority-dot"
                      style={{ backgroundColor: priorityColors[p] }}
                    />
                    {p === 'high' ? '高' : p === 'medium' ? '中' : '低'}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">标签</label>
              <div className="label-selector">
                {labels.map(label => (
                  <button
                    key={label.id}
                    className={`label-select ${newLabels.includes(label.id) ? 'selected' : ''}`}
                    style={{
                      backgroundColor: newLabels.includes(label.id) ? label.color : 'transparent',
                      color: newLabels.includes(label.id) ? '#fff' : label.color,
                      borderColor: label.color,
                    }}
                    onClick={() => toggleLabel(label.id)}
                  >
                    {label.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">截止日期</label>
              <input
                type="date"
                className="form-input"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCreateModal(false)}
              >
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCreateCard}
                disabled={!newTitle.trim()}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Board;
