import { useState, useEffect } from 'react';
import type { Card, TodoItem, CardType } from '../types';

interface FullscreenEditorProps {
  card: Card;
  onClose: () => void;
  onSave: (id: number, data: { title: string; content: string }) => void;
}

function parseTodoContent(content: string): TodoItem[] {
  try {
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => ({
        id: item.id || String(Math.random()),
        text: item.text || '',
        completed: item.completed || false,
      }));
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

function serializeTodoContent(todos: TodoItem[]): string {
  return JSON.stringify(todos);
}

function FullscreenEditor({ card, onClose, onSave }: FullscreenEditorProps) {
  const [title, setTitle] = useState(card.title);
  const [content, setContent] = useState(card.content);
  const [todos, setTodos] = useState<TodoItem[]>([]);

  const isTodo = card.type === 'todo';
  const isImage = card.type === 'image';
  const isText = card.type === 'text';

  useEffect(() => {
    if (isTodo) {
      setTodos(parseTodoContent(card.content));
    }
  }, [card.content, isTodo]);

  const handleSave = () => {
    let finalContent = content;
    if (isTodo) {
      finalContent = serializeTodoContent(todos);
    }
    onSave(card.id, { title: title.trim(), content: finalContent });
    onClose();
  };

  const addTodoItem = () => {
    setTodos([
      ...todos,
      {
        id: String(Date.now()),
        text: '',
        completed: false,
      },
    ]);
  };

  const updateTodoItem = (id: string, text: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, text } : t)));
  };

  const toggleTodoItem = (id: string) => {
    setTodos(todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const deleteTodoItem = (id: string) => {
    setTodos(todos.filter((t) => t.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  };

  const typeLabels: Record<CardType, string> = {
    text: '文本卡片',
    image: '图片卡片',
    todo: '待办清单',
  };

  return (
    <div className="fullscreen-editor" onKeyDown={handleKeyDown} tabIndex={0}>
      <div className="editor-header">
        <h2 className="editor-title">编辑 {typeLabels[card.type]}</h2>
        <button className="btn btn-cancel" onClick={onClose}>
          关闭 (Esc)
        </button>
      </div>

      <div className="editor-content">
        <input
          type="text"
          className="editor-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="输入标题..."
          autoFocus
        />

        {isText && (
          <textarea
            className="editor-textarea"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="输入内容..."
          />
        )}

        {isImage && (
          <div>
            <input
              type="text"
              className="editor-input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="输入图片URL..."
              style={{ fontSize: '16px' }}
            />
            {content && (
              <img
                src={content}
                alt="预览"
                style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '16px' }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </div>
        )}

        {isTodo && (
          <div className="todo-editor">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={`todo-editor-item ${todo.completed ? 'completed' : ''}`}
              >
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={() => toggleTodoItem(todo.id)}
                />
                <input
                  type="text"
                  value={todo.text}
                  onChange={(e) => updateTodoItem(todo.id, e.target.value)}
                  placeholder="输入待办事项..."
                />
                <button
                  type="button"
                  className="todo-delete-btn"
                  onClick={() => deleteTodoItem(todo.id)}
                >
                  ×
                </button>
              </div>
            ))}
            <button type="button" className="add-todo-btn" onClick={addTodoItem}>
              + 添加待办事项
            </button>
          </div>
        )}
      </div>

      <div className="editor-footer">
        <button className="btn btn-cancel" onClick={onClose}>
          取消
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          保存 (Ctrl+S)
        </button>
      </div>
    </div>
  );
}

export default FullscreenEditor;
