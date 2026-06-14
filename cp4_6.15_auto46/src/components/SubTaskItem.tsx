import React, { useState, useCallback } from 'react';
import type { SubTask } from '@/types/index';
import './SubTaskItem.css';

interface SubTaskItemProps {
  subTask: SubTask;
  onToggle: (id: string, actualMinutes: number) => void;
  onEdit: (id: string, title: string, estimatedMinutes: number, actualMinutes: number) => void;
  onDelete: (id: string) => void;
}

function SubTaskItemInner({ subTask, onToggle, onEdit, onDelete }: SubTaskItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subTask.title);
  const [editEstimated, setEditEstimated] = useState(subTask.estimatedMinutes);
  const [editActual, setEditActual] = useState(subTask.actualMinutes);

  const handleToggle = useCallback(() => {
    const actual = subTask.completed
      ? subTask.actualMinutes
      : subTask.actualMinutes || subTask.estimatedMinutes;
    onToggle(subTask.id, actual);
  }, [subTask.id, subTask.completed, subTask.actualMinutes, subTask.estimatedMinutes, onToggle]);

  const startEdit = useCallback(() => {
    setEditTitle(subTask.title);
    setEditEstimated(subTask.estimatedMinutes);
    setEditActual(subTask.actualMinutes);
    setEditing(true);
  }, [subTask.title, subTask.estimatedMinutes, subTask.actualMinutes]);

  const saveEdit = useCallback(() => {
    const trimmed = editTitle.trim();
    if (!trimmed) return;
    onEdit(subTask.id, trimmed, editEstimated, editActual);
    setEditing(false);
  }, [subTask.id, editTitle, editEstimated, editActual, onEdit]);

  const cancelEdit = useCallback(() => {
    setEditing(false);
  }, []);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') saveEdit();
      if (e.key === 'Escape') cancelEdit();
    },
    [saveEdit, cancelEdit],
  );

  return (
    <div className={`subtask-item${subTask.completed ? ' completed' : ''}`}>
      <input
        type="checkbox"
        className="subtask-checkbox"
        checked={subTask.completed}
        onChange={handleToggle}
      />

      {editing ? (
        <div className="subtask-edit-row">
          <input
            className="subtask-edit-input title-input"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={handleEditKeyDown}
            autoFocus
          />
          <input
            className="subtask-edit-input time-input"
            type="number"
            min={1}
            value={editEstimated}
            onChange={(e) => setEditEstimated(Number(e.target.value))}
            onKeyDown={handleEditKeyDown}
            title="预估分钟"
          />
          <input
            className="subtask-edit-input time-input"
            type="number"
            min={0}
            value={editActual}
            onChange={(e) => setEditActual(Number(e.target.value))}
            onKeyDown={handleEditKeyDown}
            title="实际分钟"
          />
          <div className="subtask-edit-actions">
            <button className="subtask-btn" onClick={saveEdit} title="保存">
              ✓
            </button>
            <button className="subtask-btn" onClick={cancelEdit} title="取消">
              ✗
            </button>
          </div>
        </div>
      ) : (
        <>
          <span className={`subtask-title${subTask.completed ? ' completed-text' : ''}`}>
            {subTask.title}
          </span>
          <span className="subtask-time">
            {subTask.estimatedMinutes}分{subTask.completed && subTask.actualMinutes > 0 ? ` / ${subTask.actualMinutes}分` : ''}
          </span>
          <div className="subtask-actions">
            <button className="subtask-btn" onClick={startEdit} title="编辑">
              ✎
            </button>
            <button className="subtask-btn delete" onClick={() => onDelete(subTask.id)} title="删除">
              ✕
            </button>
          </div>
        </>
      )}
    </div>
  );
}

const SubTaskItem = React.memo(SubTaskItemInner);
export default SubTaskItem;
