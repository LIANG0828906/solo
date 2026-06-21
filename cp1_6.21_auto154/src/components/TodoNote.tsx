import React, { useState, memo } from 'react';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Note, TodoNoteContent, TodoItem } from '../types';
import NoteBase from './NoteBase';

interface TodoNoteProps {
  note: Note;
  isDragging: boolean;
  isConnecting: boolean;
  isConnectionSource: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onDelete: () => void;
  onContentChange: (content: TodoNoteContent) => void;
  onConnectionStart: (e: React.MouseEvent) => void;
}

const TodoNote: React.FC<TodoNoteProps> = memo(
  ({
    note,
    isDragging,
    isConnecting,
    isConnectionSource,
    onMouseDown,
    onDelete,
    onContentChange,
    onConnectionStart,
  }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');
    const content = note.content as TodoNoteContent;

    const toggleItem = (itemId: string) => {
      const newItems = content.items.map((item) =>
        item.id === itemId ? { ...item, checked: !item.checked } : item
      );
      onContentChange({ items: newItems });
    };

    const addItem = () => {
      const newItem: TodoItem = {
        id: uuidv4(),
        text: '新待办事项',
        checked: false,
      };
      onContentChange({ items: [...content.items, newItem] });
      setEditingId(newItem.id);
      setEditText('新待办事项');
    };

    const startEdit = (item: TodoItem) => {
      setEditingId(item.id);
      setEditText(item.text);
    };

    const finishEdit = () => {
      if (editingId !== null) {
        const newItems = content.items.map((item) =>
          item.id === editingId ? { ...item, text: editText } : item
        );
        onContentChange({ items: newItems });
        setEditingId(null);
      }
    };

    const deleteItem = (itemId: string) => {
      const newItems = content.items.filter((item) => item.id !== itemId);
      onContentChange({ items: newItems });
    };

    return (
      <NoteBase
        note={note}
        isDragging={isDragging}
        isConnecting={isConnecting}
        isConnectionSource={isConnectionSource}
        onMouseDown={onMouseDown}
        onDelete={onDelete}
        onDoubleClick={() => {}}
        onConnectionStart={onConnectionStart}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {content.items.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => toggleItem(item.id)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: '#22C55E',
                }}
              />
              {editingId === item.id ? (
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onBlur={finishEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEdit();
                  }}
                  autoFocus
                  style={{
                    flex: 1,
                    border: '1px solid #EAB308',
                    borderRadius: '4px',
                    padding: '4px 8px',
                    fontSize: '14px',
                    backgroundColor: '#FFFFFF',
                    color: '#1E293B',
                    outline: 'none',
                  }}
                />
              ) : (
                <span
                  onDoubleClick={(e) => {
                    e.stopPropagation();
                    startEdit(item);
                  }}
                  style={{
                    flex: 1,
                    fontSize: '14px',
                    color: item.checked ? '#9CA3AF' : '#1E293B',
                    textDecoration: item.checked ? 'line-through' : 'none',
                    cursor: 'pointer',
                    wordBreak: 'break-word',
                  }}
                >
                  {item.text}
                </span>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteItem(item.id);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px 4px',
                  borderRadius: '4px',
                  opacity: 0,
                  transition: 'opacity 0.2s',
                }}
                className="todo-delete-btn"
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '0';
                }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={(e) => {
              e.stopPropagation();
              addItem();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: 'none',
              borderRadius: '6px',
              color: '#3B82F6',
              cursor: 'pointer',
              fontSize: '13px',
              marginTop: '4px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
            }}
          >
            <Plus size={14} />
            添加待办
          </button>
        </div>
      </NoteBase>
    );
  }
);

TodoNote.displayName = 'TodoNote';

export default TodoNote;
