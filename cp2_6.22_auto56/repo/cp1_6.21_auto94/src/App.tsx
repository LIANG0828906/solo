import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import EstimateChart, { EstimateData } from './EstimateChart';
import GanttChart, { GanttTask } from './GanttChart';
import { calculatePERT, calculatePoker } from './EstimateEngine';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: number;
}

interface Task {
  id: string;
  projectId: string;
  name: string;
  optimistic: number;
  pessimistic: number;
  mostLikely: number;
  order: number;
  createdAt: number;
}

const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [estimates, setEstimates] = useState<EstimateData[]>([]);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [taskName, setTaskName] = useState('');
  const [optimistic, setOptimistic] = useState('');
  const [pessimistic, setPessimistic] = useState('');
  const [mostLikely, setMostLikely] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const fetchProjects = useCallback(async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('获取项目列表失败:', error);
    }
  }, []);

  const fetchTasks = useCallback(async (projectId: string) => {
    try {
      const response = await axios.get(`/api/tasks/${projectId}`);
      setTasks(response.data);
    } catch (error) {
      console.error('获取任务列表失败:', error);
    }
  }, []);

  const fetchEstimates = useCallback(async (projectId: string) => {
    try {
      const response = await axios.get(`/api/tasks/${projectId}/estimates`);
      setEstimates(response.data);
    } catch (error) {
      console.error('获取估算数据失败:', error);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks(selectedProjectId);
      fetchEstimates(selectedProjectId);
    } else {
      setTasks([]);
      setEstimates([]);
    }
  }, [selectedProjectId, fetchTasks, fetchEstimates]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || isSubmittingProject) return;

    setIsSubmittingProject(true);
    try {
      const response = await axios.post('/api/projects', {
        name: newProjectName.trim(),
        description: newProjectDesc.trim(),
      });
      setProjects((prev) => [response.data, ...prev]);
      setSelectedProjectId(response.data.id);
      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      setMobileSidebarOpen(false);
    } catch (error) {
      console.error('创建项目失败:', error);
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !taskName.trim() || isSubmittingTask) return;

    const optNum = parseFloat(optimistic);
    const pesNum = parseFloat(pessimistic);
    const mlNum = parseFloat(mostLikely);

    if (
      isNaN(optNum) ||
      isNaN(pesNum) ||
      isNaN(mlNum) ||
      optNum < 0 ||
      pesNum < 0 ||
      mlNum < 0
    ) {
      alert('请输入有效的非负数字');
      return;
    }

    setIsSubmittingTask(true);
    try {
      await axios.post('/api/tasks', {
        projectId: selectedProjectId,
        name: taskName.trim(),
        optimistic: optNum,
        pessimistic: pesNum,
        mostLikely: mlNum,
      });

      await fetchTasks(selectedProjectId);
      await fetchEstimates(selectedProjectId);

      setTaskName('');
      setOptimistic('');
      setPessimistic('');
      setMostLikely('');
    } catch (error) {
      console.error('添加任务失败:', error);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const ganttTasks: GanttTask[] = tasks.map((task, index) => {
    const estimate = estimates.find((e) => e.taskId === task.id);
    const pertVal = estimate
      ? estimate.pert
      : calculatePERT(task.optimistic, task.pessimistic, task.mostLikely);
    const pokerVal = estimate
      ? estimate.poker
      : calculatePoker(task.mostLikely, task.createdAt + index);

    return {
      id: task.id,
      name: task.name,
      duration: pertVal,
      pert: pertVal,
      optimistic: task.optimistic,
      pessimistic: task.pessimistic,
      mostLikely: task.mostLikely,
      poker: pokerVal,
    };
  });

  const handleSelectProject = (projectId: string) => {
    setSelectedProjectId(projectId);
    setMobileSidebarOpen(false);
  };

  const handleBack = () => {
    setSelectedProjectId(null);
  };

  return (
    <div className="app-container">
      <aside className={`sidebar ${mobileSidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          <span>项目列表</span>
          <button
            className="new-project-btn"
            onClick={() => setShowNewProjectModal(true)}
            title="新建项目"
            aria-label="新建项目"
          >
            +
          </button>
        </div>
        <div className="project-list">
          {projects.length === 0 ? (
            <div
              style={{
                padding: '20px 12px',
                fontSize: '13px',
                color: '#6B7280',
                textAlign: 'center',
              }}
            >
              暂无项目
              <br />
              点击 + 创建
            </div>
          ) : (
            projects.map((project) => (
              <div
              key={project.id}
              className={`project-item ${selectedProjectId === project.id ? 'selected' : ''}`}
              onClick={() => handleSelectProject(project.id)}
              title={project.description || project.name}
            >
              {project.name}
            </div>
          ))
          )}
        </div>
      </aside>

      <div
        className={`mobile-sidebar-overlay ${mobileSidebarOpen ? 'visible' : ''}`}
        onClick={() => setMobileSidebarOpen(false)}
      />

      <main className="main-content">
        <header className="main-header">
          <button
            className="hamburger-btn"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="打开菜单"
          >
            ☰
          </button>
          {selectedProject ? (
            <>
              <button
                className="back-btn"
                onClick={handleBack}
                aria-label="返回"
                title="返回项目列表"
              >
                ←
              </button>
              <h1 className="project-title">{selectedProject.name}</h1>
            </>
          ) : (
            <h1 className="project-title">项目估算对比看板</h1>
          )}
        </header>

        <div className="main-body">
          {!selectedProject ? (
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6B7280',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
              <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px', color: '#111827' }}>
                欢迎使用项目估算对比看板
              </h2>
              <p style={{ fontSize: '14px', marginBottom: '24px' }}>
                从左侧选择一个项目，或点击 + 创建新项目
              </p>
              <button
                className="submit-btn"
                onClick={() => setShowNewProjectModal(true)}
                style={{ width: 'auto', padding: '0 24px' }}
              >
                新建项目
              </button>
            </div>
          ) : (
            <>
              <form className="task-form" onSubmit={handleAddTask}>
              <div style={{ fontWeight: 600, fontSize: '15px', marginBottom: '4px' }}>
                添加任务
              </div>
              <div className="form-group">
                <label htmlFor="taskName">任务名称</label>
                <input
                  id="taskName"
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="输入任务名称"
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="optimistic">乐观估算 (小时)</label>
                  <input
                    id="optimistic"
                    type="number"
                    min="0"
                    step="0.5"
                    value={optimistic}
                    onChange={(e) => setOptimistic(e.target.value)}
                    placeholder="乐观"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="mostLikely">最可能估算 (小时)</label>
                  <input
                    id="mostLikely"
                    type="number"
                    min="0"
                    step="0.5"
                    value={mostLikely}
                    onChange={(e) => setMostLikely(e.target.value)}
                    placeholder="最可能"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="pessimistic">悲观估算 (小时)</label>
                  <input
                    id="pessimistic"
                    type="number"
                    min="0"
                    step="0.5"
                    value={pessimistic}
                    onChange={(e) => setPessimistic(e.target.value)}
                    placeholder="悲观"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={isSubmittingTask}
              >
                {isSubmittingTask ? '添加中...' : '添加任务'}
              </button>
            </form>

              <div className="task-list-card">
                <div className="task-list-header">任务列表</div>
                <div className="task-list">
                  {tasks.length === 0 ? (
                  <div
                    style={{
                      padding: '32px',
                      textAlign: 'center',
                      color: '#6B7280',
                      fontSize: '14px',
                    }}
                  >
                    暂无任务，请添加任务
                  </div>
                ) : (
                  <table className="task-table">
                    <thead>
                      <tr>
                        <th>任务名称</th>
                        <th>乐观</th>
                        <th>最可能</th>
                        <th>悲观</th>
                        <th>PERT估算</th>
                        <th>扑克估算</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tasks.map((task, index) => {
                        const estimate = estimates.find(
                          (e) => e.taskId === task.id
                        );
                        const pertVal = estimate
                          ? estimate.pert
                          : calculatePERT(
                              task.optimistic,
                              task.pessimistic,
                              task.mostLikely
                            );
                        const pokerVal = estimate
                          ? estimate.poker
                          : calculatePoker(
                              task.mostLikely,
                              task.createdAt + index
                            );
                        return (
                          <tr key={task.id}>
                            <td>{task.name}</td>
                            <td>{task.optimistic}h</td>
                            <td>{task.mostLikely}h</td>
                            <td>{task.pessimistic}h</td>
                            <td className="pert-value">
                              {pertVal.toFixed(1)}h
                            </td>
                            <td className="poker-value">
                              {pokerVal.toFixed(1)}h
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

              <div className="charts-container">
                <div className="chart-card">
                  <h3>估算对比图</h3>
                  <div className="legend-container">
                    <div className="legend-item">
                      <span className="legend-color pert" />
                      <span>PERT估算</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-color poker" />
                      <span>扑克估算</span>
                    </div>
                  </div>
                  <EstimateChart data={estimates} />
                </div>

                <div className="chart-card">
                  <h3>甘特图</h3>
                  <GanttChart tasks={ganttTasks} />
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {showNewProjectModal && (
        <div
          className="modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowNewProjectModal(false);
            }
          }}
        >
          <div className="modal-content">
            <h2 className="modal-title">新建项目</h2>
            <div className="modal-form">
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#6B7280',
                    marginBottom: '6px',
                  }}
                  htmlFor="projectName"
                >
                  项目名称
                </label>
                <input
                  id="projectName"
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="输入项目名称"
                  autoFocus
                />
              </div>
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#6B7280',
                    marginBottom: '6px',
                  }}
                  htmlFor="projectDesc"
                >
                  项目描述
                </label>
                <textarea
                  id="projectDesc"
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="输入项目描述（可选）"
                />
              </div>
              <div className="modal-buttons">
                <button
                  type="button"
                  className="modal-cancel-btn"
                  onClick={() => setShowNewProjectModal(false)}
                >
                  取消
                </button>
                <button
                  type="button"
                  className="modal-submit-btn"
                  onClick={handleCreateProject}
                  disabled={!newProjectName.trim() || isSubmittingProject}
                >
                  {isSubmittingProject ? '创建中...' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
