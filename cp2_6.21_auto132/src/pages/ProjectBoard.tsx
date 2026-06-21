import { useEffect, useState, useCallback, useRef } from 'react';
import useProjectStore from '../store/useProjectStore';
import TaskCard from '../components/TaskCard';

const STATUS_COLUMNS: { key: string; label: string; color: string }[] = [
  { key: 'unassigned', label: '待分配', color: '#78909c' },
  { key: 'translating', label: '翻译中', color: '#42a5f5' },
  { key: 'reviewing', label: '审核中', color: '#ffa726' },
  { key: 'completed', label: '已完成', color: '#66bb6a' },
];

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
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assigneeId: '', dueDate: '' });
  const dragCounterRef = useRef(0);

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

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleDragStart = useCallback((taskId: string) => {
    setDraggedTask(taskId);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedTask(null);
    setDragOverColumn(null);
    dragCounterRef.current = 0;
  }, []);

  const handleDragEnterColumn = useCallback((e: React.DragEvent, columnKey: string) => {
    e.preventDefault();
    dragCounterRef.current++;
    setDragOverColumn(columnKey);
  }, []);

  const handleDragLeaveColumn = useCallback(() => {
    dragCounterRef.current--;
    if (dragCounterRef.current <= 0) {
      setDragOverColumn(null);
      dragCounterRef.current = 0;
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, columnKey: string) => {
      e.preventDefault();
      if (draggedTask) {
        await updateTaskStatus(draggedTask, columnKey as any);
      }
      setDraggedTask(null);
      setDragOverColumn(null);
      dragCounterRef.current = 0;
    },
    [draggedTask, updateTaskStatus]
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
      <div className="kanban-board">
        {STATUS_COLUMNS.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key);
          return (
            <div
              key={col.key}
              className={`kanban-column ${dragOverColumn === col.key ? 'drag-over' : ''}`}
              onDragOver={e => e.preventDefault()}
              onDragEnter={e => handleDragEnterColumn(e, col.key)}
              onDragLeave={handleDragLeaveColumn}
              onDrop={e => handleDrop(e, col.key)}
            >
              <div className="column-header">
                <span className="column-dot" style={{ background: col.color }} />
                <span className="column-label">{col.label}</span>
                <span className="column-count">{colTasks.length}</span>
              </div>
              <div className="column-cards">
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={() => handleDragStart(task.id)}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
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
