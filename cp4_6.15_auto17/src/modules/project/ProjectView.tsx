import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit3,
  Save,
  Calendar,
  Clock,
  Flag,
  ChevronLeft,
  Menu,
  GripVertical,
  CheckCircle2,
  PlayCircle,
  PauseCircle,
} from 'lucide-react';
import { useStore } from '@/shared/store';
import type { Task, TaskStatus, Priority } from '@/shared/types';
import { cn } from '@/lib/utils';
import GanttChart from './GanttChart';
import TaskTimeline from './TaskTimeline';

const priorityConfig: Record<Priority, { label: string; color: string; bgClass: string }> = {
  high: { label: '高', color: 'text-red-400', bgClass: 'bg-red-400/15' },
  medium: { label: '中', color: 'text-yellow-400', bgClass: 'bg-yellow-400/15' },
  low: { label: '低', color: 'text-green-400', bgClass: 'bg-green-400/15' },
};

const statusConfig: Record<TaskStatus, { label: string; icon: typeof PlayCircle; color: string }> = {
  pending: { label: '待开始', icon: PauseCircle, color: 'text-forge-muted' },
  in_progress: { label: '进行中', icon: PlayCircle, color: 'text-log-progress' },
  completed: { label: '已完成', icon: CheckCircle2, color: 'text-log-completed' },
};

export default function ProjectView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('medium');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const project = useMemo(() => projects.find((p) => p.id === id), [projects, id]);
  const projectTasks = useMemo(
    () => tasks.filter((t) => t.projectId === id).sort((a, b) => a.order - b.order),
    [tasks, id],
  );
  const selectedTask = useMemo(
    () => projectTasks.find((t) => t.id === selectedTaskId),
    [projectTasks, selectedTaskId],
  );

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const checkScreen = () => setSidebarOpen(window.innerWidth >= 1024);
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  if (!project) {
    return (
      <div className="min-h-screen bg-forge-bg flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-display text-2xl font-bold text-white mb-4">项目不存在</h2>
          <Link to="/" className="btn-elastic px-6 py-2 rounded-xl bg-forge-accent text-white">
            返回看板
          </Link>
        </div>
      </div>
    );
  }

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString('zh-CN');
  const toDateInput = (ts: number) => new Date(ts).toISOString().split('T')[0];

  const startEditProject = () => {
    setEditTitle(project.title);
    setEditDesc(project.description);
    setEditPriority(project.priority);
    setEditStart(toDateInput(project.startDate));
    setEditEnd(toDateInput(project.endDate));
    setIsEditingProject(true);
  };

  const saveProject = async () => {
    if (!editTitle.trim()) return;
    await updateProject(project.id, {
      title: editTitle.trim(),
      description: editDesc.trim(),
      priority: editPriority,
      startDate: new Date(editStart).getTime(),
      endDate: new Date(editEnd).getTime(),
    });
    setIsEditingProject(false);
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) return;
    const now = Date.now();
    await addTask({
      projectId: project.id,
      title: newTaskTitle.trim(),
      estimatedHours: 8,
      startDate: now,
      durationDays: 3,
      dependencyIds: [],
      status: 'pending',
      order: projectTasks.length,
    });
    setNewTaskTitle('');
    setIsAddingTask(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (confirm('确定要删除这个任务吗？')) {
      deleteTask(taskId);
      if (selectedTaskId === taskId) setSelectedTaskId(null);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const next: Record<TaskStatus, TaskStatus> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    };
    await updateTask(task.id, { status: next[task.status] });
  };

  const handleDeleteProject = async () => {
    if (confirm('确定要删除整个项目吗？此操作不可恢复。')) {
      await deleteProject(project.id);
      navigate('/');
    }
  };

  const cycleTaskStatus = async (task: Task) => {
    const cycle: TaskStatus[] = ['pending', 'in_progress', 'completed'];
    const idx = cycle.indexOf(task.status);
    await updateTask(task.id, { status: cycle[(idx + 1) % 3] });
  };

  const moveTask = async (task: Task, direction: -1 | 1) => {
    const idx = projectTasks.findIndex((t) => t.id === task.id);
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= projectTasks.length) return;
    const other = projectTasks[newIdx];
    await Promise.all([
      updateTask(task.id, { order: other.order }),
      updateTask(other.id, { order: task.order }),
    ]);
  };

  const toggleDependency = async (task: Task, potentialDepId: string) => {
    const hasDep = task.dependencyIds.includes(potentialDepId);
    if (hasDep) {
      await updateTask(task.id, {
        dependencyIds: task.dependencyIds.filter((d) => d !== potentialDepId),
      });
    } else {
      if (task.id === potentialDepId) return;
      await updateTask(task.id, {
        dependencyIds: [...task.dependencyIds, potentialDepId],
      });
    }
  };

  return (
    <div className="min-h-screen bg-forge-bg flex">
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      )}

      <aside
        className={cn(
          'h-screen bg-forge-card/80 backdrop-blur-xl border-r border-forge-border overflow-y-auto scrollbar-thin',
          'fixed lg:relative z-50 transition-all duration-300',
          mobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarOpen ? 'w-80' : 'w-0 lg:w-12 lg:overflow-hidden',
        )}
      >
        {sidebarOpen && (
          <div className={cn('p-4', !mobileDrawerOpen && 'hidden lg:block')}>
            <div className="flex items-center gap-2 mb-6">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-elastic p-2 rounded-lg hover:bg-white/10 text-forge-muted hover:text-white"
                aria-label="返回"
              >
                <ArrowLeft size={18} />
              </button>
              <h1 className="font-display text-lg font-bold text-white flex-1">项目详情</h1>
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="btn-elastic p-2 rounded-lg hover:bg-white/10 text-forge-muted hover:text-white hidden lg:block"
                aria-label="收起侧栏"
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            {isEditingProject ? (
              <div className="glass-card rounded-xl p-4 mb-4 space-y-3">
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-forge-bg border border-forge-border text-white text-lg font-semibold focus:outline-none focus:border-forge-accent"
                />
                <textarea
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg bg-forge-bg border border-forge-border text-white text-sm resize-none focus:outline-none focus:border-forge-accent"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={editStart}
                    onChange={(e) => setEditStart(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-forge-bg border border-forge-border text-white text-sm focus:outline-none focus:border-forge-accent"
                  />
                  <input
                    type="date"
                    value={editEnd}
                    onChange={(e) => setEditEnd(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-forge-bg border border-forge-border text-white text-sm focus:outline-none focus:border-forge-accent"
                  />
                </div>
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value as Priority)}
                  className="w-full px-3 py-2 rounded-lg bg-forge-bg border border-forge-border text-white text-sm focus:outline-none focus:border-forge-accent"
                >
                  <option value="high">高优先级</option>
                  <option value="medium">中优先级</option>
                  <option value="low">低优先级</option>
                </select>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={saveProject}
                    className="btn-elastic flex-1 py-2 rounded-lg bg-forge-accent text-white text-sm font-medium flex items-center justify-center gap-1.5"
                  >
                    <Save size={14} />
                    保存
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingProject(false)}
                    className="btn-elastic px-4 py-2 rounded-lg bg-forge-surface text-forge-muted text-sm"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-xl p-4 mb-4">
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-display text-xl font-bold text-white leading-tight">
                    {project.title}
                  </h2>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={startEditProject}
                      className="btn-elastic p-1.5 rounded-lg hover:bg-white/10 text-forge-muted hover:text-white"
                      aria-label="编辑"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteProject}
                      className="btn-elastic p-1.5 rounded-lg hover:bg-red-400/10 text-forge-muted hover:text-red-400"
                      aria-label="删除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-forge-muted mb-3">{project.description}</p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className={cn(
                    'inline-flex items-center gap-1 px-2 py-1 rounded-full',
                    priorityConfig[project.priority].bgClass,
                    priorityConfig[project.priority].color,
                  )}>
                    <Flag size={10} />
                    {priorityConfig[project.priority].label}优先级
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-forge-surface text-forge-muted">
                    <Calendar size={10} />
                    {formatDate(project.startDate)} - {formatDate(project.endDate)}
                  </span>
                </div>
              </div>
            )}

            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display font-semibold text-white text-sm">任务列表 ({projectTasks.length})</h3>
              <button
                type="button"
                onClick={() => setIsAddingTask(true)}
                className="btn-elastic px-2.5 py-1 rounded-lg text-xs font-medium bg-forge-accent/15 text-forge-accent hover:bg-forge-accent/25 flex items-center gap-1"
              >
                <Plus size={12} />
                任务
              </button>
            </div>

            {isAddingTask && (
              <div className="mb-3 p-3 rounded-lg bg-forge-surface/50 border border-forge-border">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="输入任务名称..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTask();
                    if (e.key === 'Escape') {
                      setIsAddingTask(false);
                      setNewTaskTitle('');
                    }
                  }}
                  className="w-full px-3 py-2 rounded bg-forge-bg border border-forge-border text-white text-sm focus:outline-none focus:border-forge-accent mb-2"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleAddTask}
                    className="btn-elastic flex-1 py-1.5 rounded text-xs font-medium bg-forge-accent text-white"
                  >
                    添加
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingTask(false);
                      setNewTaskTitle('');
                    }}
                    className="btn-elastic px-3 py-1.5 rounded text-xs text-forge-muted hover:text-white"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {projectTasks.map((task) => {
                const StatusIcon = statusConfig[task.status].icon;
                const isSelected = selectedTaskId === task.id;
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'glass-card rounded-lg p-2.5 cursor-pointer transition-all',
                      isSelected && 'ring-2 ring-forge-accent',
                    )}
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cycleTaskStatus(task);
                        }}
                        className={cn('btn-elastic shrink-0', statusConfig[task.status].color)}
                      >
                        <StatusIcon size={16} />
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-white truncate">
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-forge-muted mt-0.5">
                          <Clock size={10} />
                          <span>{task.estimatedHours}h</span>
                          <span>·</span>
                          <span>{task.durationDays}天</span>
                          {task.dependencyIds.length > 0 && (
                            <>
                              <span>·</span>
                              <span>依赖 {task.dependencyIds.length}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveTask(task, -1);
                          }}
                          className="p-1 rounded text-forge-muted hover:text-white"
                        >
                          <GripVertical size={12} />
                        </button>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="mt-3 pt-3 border-t border-forge-border/50 space-y-2">
                        <div>
                          <div className="text-xs text-forge-muted mb-1">依赖关系</div>
                          <div className="flex flex-wrap gap-1">
                            {projectTasks
                              .filter((t) => t.id !== task.id)
                              .map((other) => {
                                const checked = task.dependencyIds.includes(other.id);
                                return (
                                  <label
                                    key={other.id}
                                    className={cn(
                                      'inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs cursor-pointer',
                                      checked
                                        ? 'bg-forge-accent/20 text-forge-accent'
                                        : 'bg-forge-surface/50 text-forge-muted hover:text-white',
                                    )}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={(e) => {
                                        e.stopPropagation();
                                        toggleDependency(task, other.id);
                                      }}
                                      className="hidden"
                                    />
                                    {other.title}
                                  </label>
                                );
                              })}
                            {projectTasks.filter((t) => t.id !== task.id).length === 0 && (
                              <span className="text-xs text-forge-muted/60">暂无其他任务</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs text-forge-muted">预计工时</label>
                          <input
                            type="number"
                            min={1}
                            value={task.estimatedHours}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateTask(task.id, { estimatedHours: Math.max(1, Number(e.target.value) || 1) });
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-16 px-2 py-1 rounded bg-forge-bg border border-forge-border text-white text-xs focus:outline-none focus:border-forge-accent"
                          />
                          <span className="text-xs text-forge-muted">小时</span>
                          <div className="flex-1" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteTask(task.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-red-400/10 text-forge-muted hover:text-red-400"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {projectTasks.length === 0 && (
                <div className="text-center py-8 text-forge-muted text-sm">
                  还没有任务，点击 + 开始添加
                </div>
              )}
            </div>

            {projectTasks.some((t) => t.status === 'completed') && (
              <Link
                to={`/report/${project.id}`}
                className="btn-elastic w-full mt-4 py-3 rounded-xl font-semibold text-white bg-forge-accent hover:bg-forge-accent-hover flex items-center justify-center gap-2"
              >
                查看复盘报告
              </Link>
            )}
          </div>
        )}
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 bg-forge-card/50 backdrop-blur-xl border-b border-forge-border flex items-center px-4 gap-3">
          <button
            type="button"
            onClick={() => {
              if (window.innerWidth < 1024) {
                setMobileDrawerOpen(true);
              } else {
                setSidebarOpen(!sidebarOpen);
              }
            }}
            className="btn-elastic p-2 rounded-lg hover:bg-white/10 text-forge-muted hover:text-white"
            aria-label="菜单"
          >
            {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex-1">
            <h2 className="font-display font-semibold text-white">{project.title}</h2>
            <p className="text-xs text-forge-muted">甘特图规划 · 拖拽任务条调整时间</p>
          </div>
          <div className="hidden md:flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-log-progress" />
              <span className="text-forge-muted">进行中</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-log-completed" />
              <span className="text-forge-muted">已完成</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full border-2 border-forge-accent" />
              <span className="text-forge-muted">今日</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <GanttChart
            projectId={project.id}
            onTaskClick={(task) => setSelectedTaskId(task.id)}
            selectedTaskId={selectedTaskId}
          />
        </div>

        {selectedTask && (
          <div className="h-[340px] border-t border-forge-border bg-forge-card/50 backdrop-blur-xl p-4 overflow-y-auto scrollbar-thin">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-semibold text-white flex items-center gap-2">
                  {selectedTask.title}
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                      statusConfig[selectedTask.status].color,
                      'bg-white/5',
                    )}
                  >
                    {React.createElement(statusConfig[selectedTask.status].icon, { size: 12 })}
                    {statusConfig[selectedTask.status].label}
                  </span>
                </h3>
                <p className="text-xs text-forge-muted mt-0.5">
                  预计 {selectedTask.estimatedHours} 小时 · 共 {selectedTask.durationDays} 天
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleTaskStatus(selectedTask)}
                className={cn(
                  'btn-elastic px-4 py-1.5 rounded-lg text-sm font-medium',
                  selectedTask.status === 'completed'
                    ? 'bg-log-completed/15 text-log-completed'
                    : 'bg-forge-accent/15 text-forge-accent',
                )}
              >
                标记为{selectedTask.status === 'pending' ? '进行中' : selectedTask.status === 'in_progress' ? '已完成' : '待开始'}
              </button>
            </div>
            <TaskTimeline task={selectedTask} key={selectedTask.id} />
          </div>
        )}
      </main>
    </div>
  );
}
