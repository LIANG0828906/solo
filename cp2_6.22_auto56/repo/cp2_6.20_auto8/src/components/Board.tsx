import { useState, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import { updateTask } from '../api/tasks';
import type { Task, Lane } from '../types';
import { PRIORITY_LABELS } from '../types';

interface BoardProps {
  tasks: Task[];
  allTasks: Task[];
  lanes: Lane[];
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onCreateTask: (title: string, status: string) => void;
  onDeleteTask: (taskId: string) => void;
  onCreateLane: (title: string) => void;
  onUpdateLane: (laneId: string, title: string) => void;
  onDeleteLane: (laneId: string) => void;
  selectedTag: string | null;
  highlightedTaskId: string | null;
  searchQuery: string;
}

function Board(props: BoardProps) {
  const {
    tasks,
    allTasks,
    lanes,
    onTaskUpdate,
    onCreateTask,
    onDeleteTask,
    onCreateLane,
    onUpdateLane,
    onDeleteLane,
    selectedTag,
    highlightedTaskId,
    searchQuery,
  } = props;

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [editingLaneId, setEditingLaneId] = useState<string | null>(null);
  const [newLaneTitle, setNewLaneTitle] = useState('');
  const [showAddLane, setShowAddLane] = useState(false);
  const [newTaskInputs, setNewTaskInputs] = useState<Record<string, string>>({});

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const sortedLanes = useMemo(
    () => [...lanes].sort((a, b) => a.order - b.order),
    [lanes]
  );

  const getTasksByLane = (laneId: string): Task[] => {
    return tasks
      .filter((t) => t.status === laneId)
      .sort((a, b) => a.order - b.order);
  };

  const isSearching = searchQuery.trim().length > 0;

  const getAllTasksByLane = (laneId: string): Task[] => {
    return allTasks
      .filter((t) => t.status === laneId)
      .sort((a, b) => a.order - b.order);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = allTasks.find((t) => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeTask = allTasks.find((t) => t.id === activeId);
    if (!activeTask) return;

    let targetLaneId: string;
    let targetIndex: number;

    const overTask = allTasks.find((t) => t.id === overId);
    if (overTask) {
      targetLaneId = overTask.status;
      const targetLaneTasks = getAllTasksByLane(targetLaneId);
      targetIndex = targetLaneTasks.findIndex((t) => t.id === overId);
    } else {
      targetLaneId = overId;
      targetIndex = getAllTasksByLane(targetLaneId).length;
    }

    const sourceLaneId = activeTask.status;
    const sourceLaneTasks = getAllTasksByLane(sourceLaneId);
    const sourceIndex = sourceLaneTasks.findIndex((t) => t.id === activeId);

    if (sourceLaneId === targetLaneId && sourceIndex === targetIndex) {
      return;
    }

    if (sourceLaneId === targetLaneId) {
      const laneTasks = getAllTasksByLane(sourceLaneId);
      const newTasks = arrayMove(laneTasks, sourceIndex, targetIndex);
      const updates = newTasks.map((t, idx) => ({ id: t.id, order: idx }));
      
      updates.forEach((u) => {
        onTaskUpdate(u.id, { order: u.order });
      });

      for (const u of updates) {
        try {
          await updateTask(u.id, { order: u.order });
        } catch (e) {
          console.error('更新任务排序失败', e);
        }
      }
    } else {
      const sourceTasks = getAllTasksByLane(sourceLaneId);
      const targetTasks = getAllTasksByLane(targetLaneId);

      const newSourceTasks = sourceTasks.filter((t) => t.id !== activeId);
      const movedTask = { ...activeTask, status: targetLaneId, order: targetIndex };
      const newTargetTasks = [...targetTasks.slice(0, targetIndex), movedTask, ...targetTasks.slice(targetIndex)];

      newSourceTasks.forEach((t, idx) => {
        onTaskUpdate(t.id, { order: idx });
      });
      newTargetTasks.forEach((t, idx) => {
        onTaskUpdate(t.id, { order: idx });
      });
      onTaskUpdate(activeId, { status: targetLaneId, order: targetIndex });

      try {
        await updateTask(activeId, { status: targetLaneId, order: targetIndex });
        
        for (let i = 0; i < newSourceTasks.length; i++) {
          await updateTask(newSourceTasks[i].id, { order: i });
        }
        for (let i = 0; i < newTargetTasks.length; i++) {
          if (newTargetTasks[i].id !== activeId) {
            await updateTask(newTargetTasks[i].id, { order: i });
          }
        }
      } catch (e) {
        console.error('跨泳道移动失败', e);
      }
    }
  };

  const handleAddTask = (laneId: string) => {
    const title = newTaskInputs[laneId];
    if (!title?.trim()) return;
    onCreateTask(title.trim(), laneId);
    setNewTaskInputs((prev) => ({ ...prev, [laneId]: '' }));
  };

  const handleAddLane = () => {
    if (!newLaneTitle.trim()) return;
    onCreateLane(newLaneTitle.trim());
    setNewLaneTitle('');
    setShowAddLane(false);
  };

  return (
    <div style={styles.wrapper}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="board-container" style={styles.board}>
          {sortedLanes.map((lane) => {
            const laneTasks = getTasksByLane(lane.id);
            return (
              <div key={lane.id} className="lane" style={styles.lane}>
                <div style={styles.laneHeader}>
                  {editingLaneId === lane.id ? (
                    <input
                      autoFocus
                      defaultValue={lane.title}
                      onBlur={(e) => {
                        onUpdateLane(lane.id, e.target.value || lane.title);
                        setEditingLaneId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          onUpdateLane(lane.id, (e.target as HTMLInputElement).value || lane.title);
                          setEditingLaneId(null);
                        }
                      }}
                      style={styles.laneTitleInput}
                    />
                  ) : (
                    <h3
                      style={styles.laneTitle}
                      onDoubleClick={() => setEditingLaneId(lane.id)}
                    >
                      {lane.title}
                      <span style={styles.laneCount}>{getAllTasksByLane(lane.id).length}</span>
                    </h3>
                  )}
                  <button
                    onClick={() => {
                      if (confirm('确定删除该泳道及其所有任务？')) {
                        onDeleteLane(lane.id);
                      }
                    }}
                    style={styles.laneDeleteBtn}
                    title="删除泳道"
                  >
                    ×
                  </button>
                </div>

                <div style={styles.laneTasks}>
                  <SortableContext
                    items={laneTasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {laneTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onTaskUpdate={onTaskUpdate}
                        onDelete={onDeleteTask}
                        isHighlighted={highlightedTaskId === task.id}
                        isFiltered={
                          (selectedTag !== null && !task.tags.includes(selectedTag)) ||
                          (isSearching &&
                            !task.title.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
                            !task.description.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
                            !PRIORITY_LABELS[task.priority].toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
                            !task.priority.toLowerCase().includes(searchQuery.toLowerCase().trim()) &&
                            !(task.dueDate && task.dueDate.toLowerCase().includes(searchQuery.toLowerCase().trim())) &&
                            !(task.assignee && task.assignee.toLowerCase().includes(searchQuery.toLowerCase().trim())) &&
                            !task.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase().trim())) &&
                            !task.notes.some((n) => n.content.toLowerCase().includes(searchQuery.toLowerCase().trim()) || n.author.toLowerCase().includes(searchQuery.toLowerCase().trim())))
                        }
                      />
                    ))}
                  </SortableContext>
                  {laneTasks.length === 0 && isSearching && (
                    <div style={styles.noMatch}>
                      <span style={styles.noMatchText}>{lane.title}泳道无匹配任务</span>
                    </div>
                  )}
                </div>

                <div style={styles.addTaskArea}>
                  <input
                    type="text"
                    placeholder="+ 添加新任务"
                    value={newTaskInputs[lane.id] || ''}
                    onChange={(e) =>
                      setNewTaskInputs((prev) => ({ ...prev, [lane.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTask(lane.id);
                    }}
                    style={styles.addTaskInput}
                  />
                </div>
              </div>
            );
          })}

          <div style={styles.addLaneArea}>
            {showAddLane ? (
              <div style={styles.addLaneForm}>
                <input
                  autoFocus
                  placeholder="泳道名称"
                  value={newLaneTitle}
                  onChange={(e) => setNewLaneTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddLane();
                  }}
                  style={styles.addLaneInput}
                />
                <div style={styles.addLaneActions}>
                  <button onClick={handleAddLane} style={styles.addLaneConfirmBtn}>
                    添加
                  </button>
                  <button
                    onClick={() => {
                      setShowAddLane(false);
                      setNewLaneTitle('');
                    }}
                    style={styles.addLaneCancelBtn}
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddLane(true)}
                style={styles.addLaneBtn}
              >
                + 添加泳道
              </button>
            )}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? (
            <div
              style={{
                ...styles.taskCard,
                ...styles.taskCardDragging,
                borderLeftColor: getPriorityColor(activeTask.priority),
              }}
            >
              <div style={styles.taskTitle}>{activeTask.title}</div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'high':
      return '#e94560';
    case 'medium':
      return '#f39c12';
    case 'low':
      return '#27ae60';
    default:
      return '#f39c12';
  }
}

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    height: '100%',
  },
  board: {
    display: 'flex',
    gap: 20,
    overflowX: 'auto',
    overflowY: 'hidden',
    height: 'calc(100vh - 140px)',
    paddingBottom: 20,
    alignItems: 'flex-start',
  },
  lane: {
    flex: '0 0 320px',
    minWidth: 320,
    maxHeight: '100%',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255,255,255,0.05)',
  },
  laneHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  laneTitle: {
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    cursor: 'text',
  },
  laneTitleInput: {
    fontSize: 16,
    fontWeight: 600,
    color: '#fff',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(233,69,96,0.5)',
    borderRadius: 6,
    padding: '4px 8px',
    outline: 'none',
    width: '100%',
  },
  laneCount: {
    fontSize: 13,
    fontWeight: 500,
    backgroundColor: 'rgba(233,69,96,0.3)',
    color: '#fff',
    padding: '2px 10px',
    borderRadius: 12,
  },
  laneDeleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: 'none',
    backgroundColor: 'rgba(233,69,96,0.2)',
    color: '#e94560',
    fontSize: 18,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
  laneTasks: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 12,
    minHeight: 20,
  },
  taskCard: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 10,
    padding: 14,
    borderLeft: '4px solid #f39c12',
    cursor: 'grab',
    transition: 'all ease-out 0.3s',
    touchAction: 'none',
  },
  taskCardDragging: {
    transform: 'scale(1.05)',
    boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
    cursor: 'grabbing',
    opacity: 0.95,
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: 500,
    color: '#fff',
    lineHeight: 1.4,
  },
  addTaskArea: {
    marginTop: 8,
  },
  addTaskInput: {
    width: '100%',
    padding: '10px 12px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    border: '1px dashed rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    outline: 'none',
    transition: 'all ease-out 0.3s',
  },
  addLaneArea: {
    flex: '0 0 280px',
    minWidth: 280,
  },
  addLaneBtn: {
    width: '100%',
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '2px dashed rgba(255,255,255,0.15)',
    borderRadius: 12,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
  addLaneForm: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  addLaneInput: {
    padding: '10px 12px',
    backgroundColor: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    outline: 'none',
  },
  addLaneActions: {
    display: 'flex',
    gap: 8,
  },
  addLaneConfirmBtn: {
    flex: 1,
    padding: '8px 16px',
    background: 'linear-gradient(90deg, var(--accent-start), var(--accent-end))',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
  addLaneCancelBtn: {
    padding: '8px 16px',
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: 'none',
    borderRadius: 8,
    color: '#fff',
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all ease-out 0.3s',
  },
  noMatch: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px 16px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 10,
    border: '1px dashed rgba(255,255,255,0.1)',
  },
  noMatchText: {
    fontSize: 13,
    color: 'var(--text-secondary)',
    opacity: 0.6,
    textAlign: 'center',
  },
};

export default Board;
