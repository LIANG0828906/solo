import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, Clock, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { DatePicker, Input, Select, Modal, Drawer, Button } from 'antd';
import dayjs from 'dayjs';
import { api } from './services/api';
import { storage } from './services/storage';
import type { Project, Task } from './types';
import ProgressBar from './components/ProgressBar';
import './project-page.css';

const { RangePicker } = DatePicker;

const DURATION_OPTIONS = [
  { label: '15分钟', value: 15 },
  { label: '30分钟', value: 30 },
  { label: '45分钟', value: 45 },
  { label: '60分钟', value: 60 },
  { label: '90分钟', value: 90 },
  { label: '120分钟', value: 120 },
  { label: '180分钟', value: 180 },
  { label: '240分钟', value: 240 },
];

const PROJECT_COLORS = [
  '#667eea',
  '#f093fb',
  '#4facfe',
  '#43e97b',
  '#fa709a',
  '#ffecd2',
  '#a8edea',
  '#d299c2',
];

export default function ProjectPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskDuration, setNewTaskDuration] = useState<number>(30);
  const [newTaskDeadline, setNewTaskDeadline] = useState<string>('');
  const [newProjectModal, setNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#667eea');
  const [newTaskAnimation, setNewTaskAnimation] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await api.getProjects();
      if (res.success && res.data) {
        setProjects(res.data);
        storage.setProjects(res.data);
        if (res.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(res.data[0].id);
        }
      }
    } catch {
      const localProjects = storage.getProjects();
      setProjects(localProjects);
      if (localProjects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(localProjects[0].id);
      }
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const sortedTasks = selectedProject
    ? [...selectedProject.tasks].sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      })
    : [];

  const totalEstimated = selectedProject?.tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0) || 0;
  const totalCompleted = selectedProject?.tasks.reduce((sum, t) => sum + t.completedMinutes, 0) || 0;
  const progressPercent = totalEstimated > 0 ? (totalCompleted / totalEstimated) * 100 : 0;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const weekMinutes = selectedProject?.tasks
    .filter((t) => t.completed && new Date(t.deadline) >= weekStart)
    .reduce((sum, t) => sum + t.completedMinutes, 0) || 0;

  const monthMinutes = selectedProject?.tasks
    .filter((t) => t.completed && new Date(t.deadline) >= monthStart)
    .reduce((sum, t) => sum + t.completedMinutes, 0) || 0;

  const handleAddTask = async () => {
    if (!selectedProjectId || !newTaskName || !newTaskDeadline) return;

    try {
      const res = await api.addTask(selectedProjectId, {
        name: newTaskName,
        estimatedMinutes: newTaskDuration,
        deadline: newTaskDeadline,
      });
      if (res.success && res.data) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === selectedProjectId
              ? { ...p, tasks: [...p.tasks, res.data!] }
              : p
          )
        );
        setNewTaskAnimation(res.data.id);
        setTimeout(() => setNewTaskAnimation(null), 500);
      }
    } catch {
      const newTask: Task = {
        id: `local-${Date.now()}`,
        name: newTaskName,
        estimatedMinutes: newTaskDuration,
        deadline: newTaskDeadline,
        completed: false,
        completedMinutes: 0,
        projectId: selectedProjectId,
      };
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProjectId ? { ...p, tasks: [...p.tasks, newTask] } : p
        )
      );
      setNewTaskAnimation(newTask.id);
      setTimeout(() => setNewTaskAnimation(null), 500);
    }

    setDrawerOpen(false);
    setNewTaskName('');
    setNewTaskDuration(30);
    setNewTaskDeadline('');
  };

  const toggleTask = async (task: Task) => {
    try {
      const res = await api.updateTask(task.id, {
        completed: !task.completed,
        completedMinutes: !task.completed ? task.estimatedMinutes : 0,
      });
      if (res.success && res.data) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === task.projectId
              ? {
                  ...p,
                  tasks: p.tasks.map((t) => (t.id === task.id ? res.data! : t)),
                }
              : p
          )
        );
      }
    } catch {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === task.projectId
            ? {
                ...p,
                tasks: p.tasks.map((t) =>
                  t.id === task.id
                    ? {
                        ...t,
                        completed: !t.completed,
                        completedMinutes: !t.completed ? t.estimatedMinutes : 0,
                      }
                    : t
                ),
              }
            : p
        )
      );
    }
  };

  const deleteTask = async (taskId: string, projectId: string) => {
    try {
      await api.deleteTask(taskId);
    } catch {}
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId ? { ...p, tasks: p.tasks.filter((t) => t.id !== taskId) } : p
      )
    );
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    try {
      const res = await api.createProject({
        name: newProjectName,
        color: newProjectColor,
      });
      if (res.success && res.data) {
        setProjects((prev) => [...prev, res.data!]);
        setSelectedProjectId(res.data.id);
      }
    } catch {
      const newProject: Project = {
        id: `local-${Date.now()}`,
        name: newProjectName,
        color: newProjectColor,
        createdAt: new Date().toISOString(),
        tasks: [],
      };
      setProjects((prev) => [...prev, newProject]);
      setSelectedProjectId(newProject.id);
    }
    setNewProjectModal(false);
    setNewProjectName('');
    setNewProjectColor('#667eea');
  };

  const deleteProject = async (projectId: string) => {
    Modal.confirm({
      title: '确认删除项目？',
      content: '删除后该项目的所有任务都将丢失，无法恢复。',
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await api.deleteProject(projectId);
        } catch {}
        setProjects((prev) => prev.filter((p) => p.id !== projectId));
        if (selectedProjectId === projectId) {
          setSelectedProjectId(projects.find((p) => p.id !== projectId)?.id || null);
        }
      },
    });
  };

  return (
    <div className="project-page">
      <div className="page-header">
        <h1 className="page-title">学习项目</h1>
        <button className="btn-primary" onClick={() => setNewProjectModal(true)}>
          <Plus size={16} />
          新建项目
        </button>
      </div>

      <div className="project-layout">
        <div className="project-list">
          {projects.map((project) => (
            <div
              key={project.id}
              className={`project-item glass-card ${
                selectedProjectId === project.id ? 'active' : ''
              }`}
              onClick={() => setSelectedProjectId(project.id)}
            >
              <div className="project-item-header">
                <div
                  className="project-color-dot"
                  style={{ background: project.color }}
                />
                <span className="project-name">{project.name}</span>
                <button
                  className="project-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteProject(project.id);
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="project-item-progress">
                <ProgressBar
                  percent={
                    project.tasks.reduce((s, t) => s + t.estimatedMinutes, 0) > 0
                      ? (project.tasks.reduce((s, t) => s + t.completedMinutes, 0) /
                          project.tasks.reduce((s, t) => s + t.estimatedMinutes, 0)) *
                        100
                      : 0
                  }
                  color={project.color}
                  height={6}
                />
              </div>
              <div className="project-item-meta">
                <span>{project.tasks.length} 个任务</span>
                <span>
                  {project.tasks.filter((t) => t.completed).length} 已完成
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="project-detail">
          {selectedProject ? (
            <>
              <div className="project-detail-header glass-card">
                <div className="project-title-row">
                  <div
                    className="project-color-large"
                    style={{ background: selectedProject.color }}
                  />
                  <h2 className="project-detail-title">{selectedProject.name}</h2>
                </div>

                <div className="stats-grid">
                  <div className="stat-box">
                    <div className="stat-box-value">{weekMinutes}</div>
                    <div className="stat-box-label">本周 (分钟)</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-box-value">{monthMinutes}</div>
                    <div className="stat-box-label">本月 (分钟)</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-box-value">{totalCompleted}</div>
                    <div className="stat-box-label">总计 (分钟)</div>
                  </div>
                </div>

                <div className="progress-section">
                  <div className="progress-label">
                    <span>项目进度</span>
                    <span>{progressPercent.toFixed(1)}%</span>
                  </div>
                  <ProgressBar
                    percent={progressPercent}
                    color={selectedProject.color}
                    height={12}
                  />
                </div>

                <button className="btn-add-task" onClick={() => setDrawerOpen(true)}>
                  <Plus size={18} />
                  添加任务
                </button>
              </div>

              <div className="task-list glass-card">
                <h3 className="task-list-title">任务列表</h3>
                {sortedTasks.length === 0 ? (
                  <div className="empty-tasks">
                    <p>暂无任务，点击上方按钮添加第一个任务吧</p>
                  </div>
                ) : (
                  <div className="tasks">
                    {sortedTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`task-item ${
                          task.completed ? 'completed' : ''
                        } ${newTaskAnimation === task.id ? 'fade-in' : ''}`}
                      >
                        <button
                          className="task-checkbox"
                          onClick={() => toggleTask(task)}
                        >
                          {task.completed ? (
                            <CheckCircle2 size={20} color={selectedProject.color} />
                          ) : (
                            <Circle size={20} color="#6b7280" />
                          )}
                        </button>
                        <div className="task-content">
                          <div className="task-name">{task.name}</div>
                          <div className="task-meta">
                            <span className="task-meta-item">
                              <Clock size={12} />
                              {task.estimatedMinutes}分钟
                            </span>
                            <span className="task-meta-item">
                              <Calendar size={12} />
                              {task.deadline}
                            </span>
                          </div>
                        </div>
                        <button
                          className="task-delete"
                          onClick={() => deleteTask(task.id, task.projectId)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-project glass-card">
              <p>暂无项目，点击左上角按钮创建一个吧</p>
            </div>
          )}
        </div>
      </div>

      <Drawer
        title="添加任务"
        placement="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        height={380}
        className="task-drawer"
      >
        <div className="task-form">
          <div className="form-item">
            <label className="form-label">任务名称</label>
            <Input
              value={newTaskName}
              onChange={(e) => setNewTaskName(e.target.value)}
              placeholder="请输入任务名称"
              className="form-input"
            />
          </div>
          <div className="form-item">
            <label className="form-label">预估时长</label>
            <Select
              value={newTaskDuration}
              onChange={setNewTaskDuration}
              options={DURATION_OPTIONS}
              className="form-select"
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-item">
            <label className="form-label">截止日期</label>
            <DatePicker
              value={newTaskDeadline ? dayjs(newTaskDeadline) : null}
              onChange={(d) => setNewTaskDeadline(d ? d.format('YYYY-MM-DD') : '')}
              style={{ width: '100%' }}
              className="form-date-picker"
            />
          </div>
          <Button type="primary" block onClick={handleAddTask} className="btn-submit">
            添加
          </Button>
        </div>
      </Drawer>

      <Modal
        title="新建项目"
        open={newProjectModal}
        onOk={handleCreateProject}
        onCancel={() => setNewProjectModal(false)}
        okText="创建"
        cancelText="取消"
        className="project-modal"
      >
        <div className="project-form">
          <div className="form-item">
            <label className="form-label">项目名称</label>
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="请输入项目名称"
              className="form-input"
            />
          </div>
          <div className="form-item">
            <label className="form-label">项目颜色</label>
            <div className="color-picker">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  className={`color-option ${
                    newProjectColor === color ? 'selected' : ''
                  }`}
                  style={{ background: color }}
                  onClick={() => setNewProjectColor(color)}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
