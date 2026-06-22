import React, { useState } from 'react'
import { Todo } from '../types'
import { meetingApi } from '../api/meetingApi'

interface TodoListProps {
  todos: Todo[]
  onUpdate: () => void
}

const TodoList: React.FC<TodoListProps> = ({ todos, onUpdate }) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Todo>>({})
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const getPriorityStyle = (priority: string): React.CSSProperties => {
    switch (priority) {
      case 'high':
        return { backgroundColor: '#FEE2E2', color: '#EF4444' }
      case 'medium':
        return { backgroundColor: '#FEF3C7', color: '#F59E0B' }
      case 'low':
        return { backgroundColor: '#D1FAE5', color: '#10B981' }
      default:
        return { backgroundColor: '#F3F4F6', color: '#6B7280' }
    }
  }

  const getPriorityText = (priority: string): string => {
    switch (priority) {
      case 'high':
        return '高'
      case 'medium':
        return '中'
      case 'low':
        return '低'
      default:
        return priority
    }
  }

  const toggleTodo = async (todo: Todo) => {
    if (togglingId === todo.id) return
    setTogglingId(todo.id)
    try {
      await meetingApi.updateTodo(todo.id, { completed: !todo.completed })
      onUpdate()
    } catch (error) {
      console.error('更新待办状态失败:', error)
    } finally {
      setTogglingId(null)
    }
  }

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id)
    setEditForm({
      assignee: todo.assignee,
      priority: todo.priority,
      deadline: todo.deadline,
    })
  }

  const saveEdit = async (todoId: string) => {
    try {
      await meetingApi.updateTodo(todoId, editForm)
      setEditingId(null)
      setEditForm({})
      onUpdate()
    } catch (error) {
      console.error('保存编辑失败:', error)
    }
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const deleteTodo = async (todoId: string) => {
    setDeletingId(todoId)
    setTimeout(async () => {
      try {
        await meetingApi.deleteTodo(todoId)
        setDeletingId(null)
        onUpdate()
      } catch (error) {
        console.error('删除待办事项失败:', error)
        setDeletingId(null)
      }
    }, 300)
  }

  if (todos.length === 0) {
    return (
      <div style={styles.container}>
        <h3 style={styles.sectionTitle}>待办事项</h3>
        <div style={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
          <p style={{ color: '#9CA3AF', marginTop: '12px' }}>暂无待办事项</p>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <h3 style={styles.sectionTitle}>待办事项</h3>
      <div style={styles.list}>
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={`todo-item ${deletingId === todo.id ? 'slide-out' : ''}`}
          >
            <div style={styles.checkboxContainer}>
              <div
                className={`checkbox ${todo.completed ? 'checked' : ''} ${todo.completed && togglingId !== todo.id ? 'scale-in' : ''}`}
                onClick={() => toggleTodo(todo)}
              >
                {todo.completed && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
            </div>

            <div style={styles.todoContent}>
              {editingId === todo.id ? (
                <div style={styles.editForm}>
                  <div style={styles.editField}>
                    <label style={styles.editLabel}>责任人</label>
                    <input
                      type="text"
                      value={editForm.assignee || ''}
                      onChange={(e) => setEditForm({ ...editForm, assignee: e.target.value })}
                      className="edit-input"
                    />
                  </div>
                  <div style={styles.editField}>
                    <label style={styles.editLabel}>优先级</label>
                    <select
                      value={editForm.priority || 'medium'}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as 'high' | 'medium' | 'low' })}
                      className="edit-input"
                    >
                      <option value="high">高</option>
                      <option value="medium">中</option>
                      <option value="low">低</option>
                    </select>
                  </div>
                  <div style={styles.editField}>
                    <label style={styles.editLabel}>截止日期</label>
                    <input
                      type="date"
                      value={editForm.deadline || ''}
                      onChange={(e) => setEditForm({ ...editForm, deadline: e.target.value })}
                      className="edit-input"
                    />
                  </div>
                  <div style={styles.editActions}>
                    <button
                      onClick={() => saveEdit(todo.id)}
                      className="save-button"
                    >
                      保存
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="cancel-button"
                    >
                      取消
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{
                    ...styles.todoDescription,
                    ...(todo.completed ? styles.todoCompleted : {}),
                  }}>
                    {todo.description}
                  </p>
                  <div style={styles.todoMeta}>
                    <span style={styles.assignee}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      {todo.assignee}
                    </span>
                    <span style={{ ...styles.priorityBadge, ...getPriorityStyle(todo.priority) }}>
                      {getPriorityText(todo.priority)}优先级
                    </span>
                    <span style={styles.deadline}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '4px' }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      {todo.deadline}
                    </span>
                  </div>
                </>
              )}
            </div>

            {editingId !== todo.id && (
              <div style={styles.actionButtons}>
                <button
                  onClick={() => startEdit(todo)}
                  className="icon-button"
                  title="编辑"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="icon-button"
                  title="删除"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: 600,
    marginBottom: '16px',
    color: '#1E293B',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  checkboxContainer: {
    paddingTop: '2px',
  },
  todoContent: {
    flex: 1,
    minWidth: 0,
  },
  todoDescription: {
    fontSize: '14px',
    color: '#1F2937',
    lineHeight: 1.6,
    marginBottom: '8px',
    wordBreak: 'break-word',
  },
  todoCompleted: {
    textDecoration: 'line-through',
    color: '#9CA3AF',
  },
  todoMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  assignee: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#6B7280',
  },
  priorityBadge: {
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: 500,
  },
  deadline: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '12px',
    color: '#6B7280',
  },
  actionButtons: {
    display: 'flex',
    gap: '4px',
    flexShrink: 0,
  },
  editForm: {
    width: '100%',
  },
  editField: {
    marginBottom: '12px',
  },
  editLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6B7280',
    marginBottom: '4px',
  },
  editActions: {
    display: 'flex',
    gap: '8px',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
  },
}

export default TodoList
