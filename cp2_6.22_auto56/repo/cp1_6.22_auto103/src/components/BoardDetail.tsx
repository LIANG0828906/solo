import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import TaskCard from './TaskCard';
import TaskDetailPanel from './TaskDetailPanel';
import OnlineUsers from './OnlineUsers';
import { fetchBoard, createTask, updateTaskStatus, addComment } from '../api';
import { useWebSocket } from '../useWebSocket';
import { Board, Task, WsMessage } from '../types';

const COLUMNS = [
  { key: 'todo' as const, label: '待办', color: '#888' },
  { key: 'in-progress' as const, label: '进行中', color: '#4A9EFF' },
  { key: 'done' as const, label: '已完成', color: '#00D4AA' },
];

const ASSIGNEE_COLORS: Record<string, string> = {
  Alice: '#FF6B6B',
  Bob: '#4ECDC4',
  Charlie: '#FF9F43',
};

const MEMBERS = ['Alice', 'Bob', 'Charlie'];

interface Props {
  boardId: string;
  onBack: () => void;
}

interface AddTaskForm {
  status: 'todo' | 'in-progress' | 'done';
  show: boolean;
}

export default function BoardDetail({ boardId, onBack }: Props) {
  const [board, setBoard] = useState<Board | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [addTaskForm, setAddTaskForm] = useState<AddTaskForm | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newAssignee, setNewAssignee] = useState('Alice');

  const loadBoard = useCallback(async () => {
    const data = await fetchBoard(boardId);
    setBoard(data);
  }, [boardId]);

  useEffect(() => { loadBoard(); }, [loadBoard]);

  const handleWsMessage = useCallback((msg: WsMessage) => {
    if (msg.type === 'task-created') {
      setBoard((prev) => {
        if (!prev) return prev;
        if (prev.tasks.some((t) => t.id === msg.task.id)) return prev;
        return { ...prev, tasks: [...prev.tasks, msg.task] };
      });
    } else if (msg.type === 'task-updated') {
      setBoard((prev) => {
        if (!prev) return prev;
        return { ...prev, tasks: prev.tasks.map((t) => (t.id === msg.task.id ? msg.task : t)) };
      });
      setSelectedTask((prev) => (prev && prev.id === msg.task.id ? msg.task : prev));
    } else if (msg.type === 'comment-added') {
      setBoard((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t) =>
            t.id === msg.taskId ? { ...t, comments: [...t.comments, msg.comment] } : t
          ),
        };
      });
      setSelectedTask((prev) => {
        if (!prev || prev.id !== msg.taskId) return prev;
        return { ...prev, comments: [...prev.comments, msg.comment] };
      });
    } else if (msg.type === 'online-users') {
      setOnlineUsers(msg.users);
    }
  }, []);

  const username = useWebSocket(boardId, handleWsMessage);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !board) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as Task['status'];
    const task = board.tasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    setBoard((prev) => {
      if (!prev) return prev;
      return { ...prev, tasks: prev.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)) };
    });
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => prev ? { ...prev, status: newStatus } : prev);
    }
    await updateTaskStatus(boardId, taskId, newStatus);
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !addTaskForm) return;
    const task = await createTask(boardId, newTitle.trim(), newDesc.trim(), newAssignee);
    setBoard((prev) => {
      if (!prev) return prev;
      if (prev.tasks.some((t) => t.id === task.id)) return prev;
      return { ...prev, tasks: [...prev.tasks, { ...task, status: addTaskForm.status }] };
    });
    setNewTitle('');
    setNewDesc('');
    setNewAssignee('Alice');
    setAddTaskForm(null);
  };

  const handleAddComment = async (content: string) => {
    if (!selectedTask) return;
    await addComment(boardId, selectedTask.id, username, content);
  };

  if (!board) return <div style={{ padding: 40, color: '#888' }}>加载中...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#1E1E2E' }}>
      <header style={{
        padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={onBack}
            style={{
              background: 'transparent', border: '1px solid #444', color: '#aaa', borderRadius: 6,
              padding: '6px 14px', cursor: 'pointer', fontSize: 13, transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00D4AA'; e.currentTarget.style.color = '#00D4AA'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.color = '#aaa'; }}
          >
            ← 返回
          </button>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#fff' }}>{board.name}</h2>
        </div>
        <OnlineUsers users={onlineUsers} />
      </header>

      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="board-lanes" style={{
          flex: 1, display: 'flex', gap: 16, padding: 20, overflow: 'auto',
        }}>
          {COLUMNS.map((col) => {
            const tasks = board.tasks.filter((t) => t.status === col.key);
            return (
              <div key={col.key} style={{
                flex: 1, minWidth: 280, background: '#2A2A3E', borderRadius: 12,
                display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 100px)',
              }}>
                <div style={{
                  padding: '14px 16px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px 12px 0 0',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: col.color,
                    }} />
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{col.label}</span>
                    <span style={{ fontSize: 12, color: '#666', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '2px 8px' }}>
                      {tasks.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setAddTaskForm({ status: col.key, show: true })}
                    style={{
                      background: 'transparent', border: '1px dashed #555', color: '#888', borderRadius: 6,
                      padding: '4px 10px', cursor: 'pointer', fontSize: 18, lineHeight: 1, transition: 'all 0.15s',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00D4AA'; e.currentTarget.style.color = '#00D4AA'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#555'; e.currentTarget.style.color = '#888'; }}
                  >
                    +
                  </button>
                </div>

                <Droppable droppableId={col.key}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        flex: 1, padding: 8, overflow: 'auto',
                        background: snapshot.isDraggingOver ? 'rgba(0,212,170,0.04)' : 'transparent',
                        transition: 'background 0.2s',
                        minHeight: 80,
                      }}
                    >
                      {tasks.map((task, index) => (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              style={{
                                ...dragProvided.draggableProps.style,
                                marginBottom: 8,
                                opacity: dragSnapshot.isDragging ? 0.9 : 1,
                              }}
                            >
                              <div style={{
                                transform: dragSnapshot.isDragging ? 'rotate(2deg)' : 'none',
                                boxShadow: dragSnapshot.isDragging ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
                                transition: dragSnapshot.isDragging ? 'none' : 'all 0.3s cubic-bezier(0.2, 0, 0, 1)',
                              }}>
                                <TaskCard task={task} onClick={() => setSelectedTask(task)} />
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>

                {addTaskForm && addTaskForm.status === col.key && (
                  <form onSubmit={handleAddTask} style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <input
                      style={{
                        width: '100%', background: '#25253A', border: '1px solid #444', borderRadius: 6,
                        padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', marginBottom: 8,
                      }}
                      placeholder="任务标题"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      autoFocus
                    />
                    <textarea
                      style={{
                        width: '100%', background: '#25253A', border: '1px solid #444', borderRadius: 6,
                        padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', marginBottom: 8,
                        minHeight: 60, resize: 'vertical',
                      }}
                      placeholder="任务描述"
                      value={newDesc}
                      onChange={(e) => setNewDesc(e.target.value)}
                    />
                    <select
                      value={newAssignee}
                      onChange={(e) => setNewAssignee(e.target.value)}
                      style={{
                        width: '100%', background: '#25253A', border: '1px solid #444', borderRadius: 6,
                        padding: '8px 12px', color: '#fff', fontSize: 13, outline: 'none', marginBottom: 8,
                        appearance: 'none',
                      }}
                    >
                      {MEMBERS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="submit" style={{
                        flex: 1, background: '#00D4AA', border: 'none', color: '#1E1E2E', borderRadius: 6,
                        padding: '8px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      }}>添加</button>
                      <button type="button" onClick={() => setAddTaskForm(null)} style={{
                        background: 'transparent', border: '1px solid #444', color: '#aaa', borderRadius: 6,
                        padding: '8px 14px', fontSize: 13, cursor: 'pointer',
                      }}>取消</button>
                    </div>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </DragDropContext>

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          boardId={boardId}
          onClose={() => setSelectedTask(null)}
          onAddComment={handleAddComment}
        />
      )}
    </div>
  );
}
