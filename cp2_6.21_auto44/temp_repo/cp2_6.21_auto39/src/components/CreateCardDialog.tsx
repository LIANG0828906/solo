import { useState } from 'react';
import type { CardType, CardCreate, TodoItem } from '../types';
import { PRESET_COLORS, TYPE_ICONS, TYPE_NAMES } from '../constants';

interface CreateCardDialogProps {
  onClose: () => void;
  onCreate: (card: Omit<CardCreate, 'x' | 'y' | 'z_index'>) => void;
}

function CreateCardDialog({ onClose, onCreate }: CreateCardDialogProps) {
  const [type, setType] = useState<CardType>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState<string | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([{ id: '1', text: '', completed: false }]);
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 200);
  };

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
    if (type === 'todo') {
      const validTodos = todos.filter((t) => t.text.trim());
      finalContent = JSON.stringify(validTodos);
    }

    onCreate({
      type,
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
          <h2 className="dialog-title">新建卡片</h2>
          <button className="dialog-close-btn" onClick={handleClose} aria-label="关闭">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">选择类型</label>
            <div className="type-selector">
              {(['text', 'image', 'todo'] as CardType[]).map((t) => (
                <div
                  key={t}
                  className={`type-option ${type === t ? 'selected' : ''}`}
                  onClick={() => setType(t)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setType(t);
                    }
                  }}
                >
                  <div className="type-icon">{TYPE_ICONS[t]}</div>
                  <div className="type-name">{TYPE_NAMES[t]}</div>
                </div>
              ))}
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
              {type === 'text' ? '内容' : type === 'image' ? '图片URL' : '待办事项'}
            </label>
            {type === 'todo' ? (
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
                  type === 'text'
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
                创建
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateCardDialog;
