import React, { useState } from 'react';
import { TaskCard } from './types';
import './Card.css';

interface CardProps {
  card: TaskCard;
  isDragging?: boolean;
  onUpdate: (cardId: string, updates: Partial<TaskCard>) => void;
  onDelete: (cardId: string) => void;
}

const Card: React.FC<CardProps> = ({ card, isDragging, onUpdate, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editTitle, setEditTitle] = useState(card.title);
  const [editDescription, setEditDescription] = useState(card.description);
  const [editAssignee, setEditAssignee] = useState(card.assignee);
  const [editDueDate, setEditDueDate] = useState(card.dueDate);
  const [isEditing, setIsEditing] = useState(false);

  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const handleSave = () => {
    onUpdate(card.id, {
      title: editTitle,
      description: editDescription,
      assignee: editAssignee,
      dueDate: editDueDate,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(card.title);
    setEditDescription(card.description);
    setEditAssignee(card.assignee);
    setEditDueDate(card.dueDate);
    setIsEditing(false);
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  const truncateDescription = (text: string, maxLines: number = 2) => {
    const lines = text.split('\n');
    if (lines.length <= maxLines) return text;
    return lines.slice(0, maxLines).join('\n') + '...';
  };

  return (
    <div
      className={`card ${isDragging ? 'card-dragging' : ''} ${
        isExpanded ? 'card-expanded' : ''
      }`}
      onClick={() => !isEditing && setIsExpanded(!isExpanded)}
    >
      {!isEditing ? (
        <>
          <div className="card-header">
            <h4 className="card-title">{card.title}</h4>
            {isExpanded && (
              <button
                className="card-delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(card.id);
                }}
                title="删除"
              >
                ×
              </button>
            )}
          </div>

          <div className="card-meta">
            <div className="card-assignee">
              <div className="card-avatar">{getInitials(card.assignee)}</div>
              <span className="card-assignee-name">
                {card.assignee || '未分配'}
              </span>
            </div>
            {card.dueDate && (
              <span
                className={`card-due-date ${isOverdue ? 'overdue' : ''}`}
              >
                📅 {formatDate(card.dueDate)}
              </span>
            )}
          </div>

          {card.description && (
            <p className="card-description">
              {isExpanded
                ? card.description
                : truncateDescription(card.description)}
            </p>
          )}

          {isExpanded && (
            <button
              className="card-edit-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
            >
              编辑详情
            </button>
          )}
        </>
      ) : (
        <div className="card-edit-form" onClick={(e) => e.stopPropagation()}>
          <input
            type="text"
            className="card-edit-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            placeholder="标题"
          />
          <textarea
            className="card-edit-textarea"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            placeholder="描述"
            rows={3}
          />
          <input
            type="text"
            className="card-edit-input"
            value={editAssignee}
            onChange={(e) => setEditAssignee(e.target.value)}
            placeholder="负责人"
          />
          <input
            type="date"
            className="card-edit-input"
            value={editDueDate}
            onChange={(e) => setEditDueDate(e.target.value)}
          />
          <div className="card-edit-actions">
            <button className="btn-cancel" onClick={handleCancel}>
              取消
            </button>
            <button className="btn-save" onClick={handleSave}>
              保存
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
