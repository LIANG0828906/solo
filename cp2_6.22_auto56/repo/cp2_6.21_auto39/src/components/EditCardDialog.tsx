import { useState, useEffect } from 'react';
import type { Card, TodoItem } from '../types';
import { PRESET_COLORS, TYPE_ICONS, TYPE_NAMES } from '../constants';

interface EditCardDialogProps {
  card: Card;
  onClose: () => void;
  onSave: (id: number, data: { title: string; content: string; color: string | null }) => void;
}

function parseTodoContent(content: string): TodoItem[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((text, index) => ({
        id: String(index),
        text: text.trim(),
        completed: false,
      }));
  }
  return [];
}

function EditCardDialog({ card, onClose, onSave }: EditCardDialogProps) {
  const [title, setTitle] = useState(card.title);
  const [content, setContent] = useState(card.content);
  const [color, setColor] = useState<string | null>(card.color);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [isClosing, setIsClosing] = useState(false);

  const isTodo = card.type === 'todo';

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

  useEffect(() => {
    if (isTodo) {
      const parsed = parseTodoContent(card.content);
      setTodos(parsed.length > 0 ? parsed : [{ id: '1', text: '', completed: false }]);
    }
  }, [card.content, isTodo]);

  const handleTodoChange = (id: string, text: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, text } : t))
    );
  };

  const handleTodoToggle = (id: string, completed: boolean) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    );
  };

  const handleAddTodo = () => {
    setTodos((prev) => [
      ...prev,
      { id: String(Date.now()), text: '', completed: false },
    ]);
  };

  const handleRemoveTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let finalContent = content.trim();
    if (isTodo) {
      const validTodos = todos.filter((t) => t.text.trim());
      finalContent = JSON.stringify(validTodos);
    }

    onSave(card.id, {
      title: title.trim(),
      content: finalContent,
      color,
    });

    handleClose();
  };

  return (
    <div
      className={`dialog-overlay ${isClosing ? 'dialog-closing' : ''}`}
      onClick={handleClose}
    >
      <div className="dialog" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2 className="dialog-title">编辑卡片</h2>
          <button className="dialog-close-btn" onClick={handleClose} aria-label="关闭">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">类型</label>
            <div className="type-display">
              <span>{TYPE_ICONS[card.type]}</span>
              <span>{TYPE_NAMES[card.type]}</span>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">标题</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="输入卡片标题..."
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              {card.type === 'text' ? '内容' : card.type === 'image' ? '图片URL' : '待办事项'}
            </label>
            {isTodo ? (
              <div className="todo-editor">
                {todos.map((todo, index) => (
                  <div
                    key={todo.id}
                    className={`todo-editor-item ${todo.completed ? 'completed' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={(e) => handleTodoToggle(todo.id, e.target.checked)}
                    />
                    <input
                      type="text"
                      value={todo.text}
                      onChange={(e) => handleTodoChange(todo.id, e.target.value)}
                      placeholder={`待办事项 ${index + 1}`}
                    />
                    {todos.length > 1 && (
                      <button
                        type="button"
                        className="todo-delete-btn"
                        onClick={() => handleRemoveTodo(todo.id)}
                        aria-label="删除待办"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" className="add-todo-btn" onClick={handleAddTodo}>
                  + 添加待办事项
                </button>
              </div>
            ) : (
              <textarea
                className="form-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  card.type === 'text'
                    ? '输入卡片内容...'
                    : '输入图片URL...'
                }
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">选择颜色</label>
            <div className="color-picker">
              {PRESET_COLORS.map((c) => (
                <div
                  key={c}
                  className={`color-option ${color === c ? 'selected' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setColor(c);
                    }
                  }}
                />
              ))}
              <div
                className={`color-option ${color === null ? 'selected' : ''}`}
                style={{ backgroundColor: '#ffffff', border: '2px dashed #ccc' }}
                onClick={() => setColor(null)}
                title="无颜色"
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setColor(null);
                  }
                }}
              />
            </div>
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-cancel" onClick={handleClose}>
              取消
            </button>
            <div className="dialog-actions-right">
              <button type="submit" className="btn btn-primary" disabled={!title.trim()}>
                保存
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditCardDialog;
