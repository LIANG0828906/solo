import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useDroppable } from '@dnd-kit/core';
import useProjectStore, { Task } from '../store/useProjectStore';
import TaskCard from '../components/TaskCard';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

const STATUS_COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'unassigned', label: '待分配', color: '#78909c' },
  { key: 'translating', label: '翻译中', color: '#42a5f5' },
  { key: 'reviewing', label: '审核中', color: '#ffa726' },
  { key: 'completed', label: '已完成', color: '#66bb6a' },
];

interface ColumnProps {
  column: typeof STATUS_COLUMNS[0];
  tasks: Task[];
}

function KanbanColumn({ column, tasks }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.key,
  });

  return (
    <div
      ref={setNodeRef}
      className={`kanban-column ${isOver ? 'drag-over' : ''}`}
    >
      <div className="column-header">
        <span className="column-dot" style={{ background: column.color }} />
        <span className="column-label">{column.label}</span>
        <span className="column-count">{tasks.length}</span>
      </div>
      <div className="column-cards">
        {tasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  );
}

export default function ProjectBoard() {
  const {
    currentUser,
    projects,
    currentProject,
    tasks,
    users,
    fetchProjects,
    createProject,
    setCurrentProject,
    fetchTasks,
    createTask,
    updateTaskStatus,
  } = useProjectStore();

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 150);
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigneeId: '', dueDate: '' });
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    })
  );

  useEffect(() => {
    if (currentUser && !currentProject) {
      fetchProjects();
    }
  }, [currentUser, currentProject]);

  useEffect(() => {
    if (currentProject) {
      fetchTasks(currentProject.id);
    }
  }, [currentProject]);

  const filteredProjects = useMemo(() =>
    projects.filter(p =>
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    ),
    [projects, debouncedSearch]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    if (task) {
      setActiveTask(task);
    }
  }, [tasks]);

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;
      const newStatus = over.id as Task['status'];

      const { tasks, updateTaskStatus: doUpdate } = useProjectStore.getState();
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      if (task.status !== newStatus) {
        await doUpdate(taskId, newStatus);
      }
    },
    []
  );

  if (!currentProject) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>我的项目</h2>
          <div className="dashboard-actions">
            <div className="search-wrap">
              <input
                type="text"
                placeholder="搜索项目..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="search-input"
              />
            </div>
            <button className="btn btn-primary" onClick={() => setShowNewProject(true)}>
              + 新建项目
            </button>
          </div>
        </div>
        <div className="project-grid">
          {filteredProjects.map(p => {
            const total = p.totalTasks || 0;
            const done = p.completedTasks || 0;
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div
                key={p.id}
                className="project-card"
                onClick={() => setCurrentProject(p)}
              >
                <h3 className="project-name">{p.name}</h3>
                <div className="project-role">
                  {p.role === 'manager' ? '项目经理' : p.role === 'translator' ? '译员' : p.role === 'reviewer' ? '审校员' : p.role}
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar" style={{ width: `${pct}%` }} />
                </div>
                <div className="progress-text">
                  {done}/{total} 任务完成 ({pct}%)
                </div>
                <div className="project-time">
                  更新于 {new Date(p.updatedAt).toLocaleDateString('zh-CN')}
                </div>
              </div>
            );
          })}
        </div>
        {showNewProject && (
          <div className="modal-overlay" onClick={() => setShowNewProject(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <h3>新建项目</h3>
              <input
                type="text"
                placeholder="项目名称"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                className="modal-input"
              />
              <div className="modal-actions">
                <button className="btn btn-ghost" onClick={() => setShowNewProject(false)}>
                  取消
                </button>
                <button
                  className="btn btn-primary"
                  onClick={async () => {
                    if (newProjectName.trim()) {
                      await createProject(newProjectName.trim());
                      setNewProjectName('');
                      setShowNewProject(false);
                    }
                  }}
                >
                  创建
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="kanban">
      <div className="kanban-header">
        <button className="btn btn-ghost btn-back" onClick={() => setCurrentProject(null)}>
          ← 返回项目列表
        </button>
        <button className="btn btn-primary" onClick={() => setShowNewTask(true)}>
          + 新建任务
        </button>
      </div>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-board">
          {STATUS_COLUMNS.map(col => {
            const colTasks = tasks.filter(t => t.status === col.key);
            return (
              <KanbanColumn key={col.key} column={col} tasks={colTasks} />
            );
          })}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className="task-card dragging-overlay">
              <div className="task-card-header">
                <span
                  className="task-status-dot"
                  style={{
                    background:
                      activeTask.status === 'unassigned'
                        ? '#78909c'
                        : activeTask.status === 'translating'
                        ? '#42a5f5'
                        : activeTask.status === 'reviewing'
                        ? '#ffa726'
                        : '#66bb6a',
                  }}
                />
                <span className="task-title">{activeTask.title}</span>
              </div>
              <div className="task-card-meta">
                <span className="task-due">截止：{activeTask.dueDate || '未设置'}</span>
                <span className="task-assignee">
                  {activeTask.assigneeAvatar && (
                    <img src={activeTask.assigneeAvatar} alt="" className="avatar-xs" />
                  )}
                  {activeTask.assigneeName}
                </span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
      {showNewTask && (
        <div className="modal-overlay" onClick={() => setShowNewTask(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>新建任务</h3>
            <input
              type="text"
              placeholder="任务标题"
              value={newTask.title}
              onChange={e => setNewTask(v => ({ ...v, title: e.target.value }))}
              className="modal-input"
            />
            <textarea
              placeholder="任务描述"
              value={newTask.description}
              onChange={e => setNewTask(v => ({ ...v, description: e.target.value }))}
              className="modal-textarea"
            />
            <select
              value={newTask.assigneeId}
              onChange={e => setNewTask(v => ({ ...v, assigneeId: e.target.value }))}
              className="modal-input"
            >
              <option value="">选择负责人</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={newTask.dueDate}
              onChange={e => setNewTask(v => ({ ...v, dueDate: e.target.value }))}
              className="modal-input"
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowNewTask(false)}>
                取消
              </button>
              <button
                className="btn btn-primary"
                onClick={async () => {
                  if (newTask.title.trim() && currentProject) {
                    await createTask(currentProject.id, newTask);
                    setNewTask({ title: '', description: '', assigneeId: '', dueDate: '' });
                    setShowNewTask(false);
                  }
                }}
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
