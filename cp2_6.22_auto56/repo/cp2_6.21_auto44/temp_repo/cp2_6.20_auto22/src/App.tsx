import React, { useState, useRef } from 'react';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import GanttChart from './components/GanttChart';
import ResourcePanel from './components/ResourcePanel';
import { useAppStore } from './store';

const App: React.FC = () => {
  const projects = useAppStore((s) => s.projects);
  const tasks = useAppStore((s) => s.tasks);
  const resources = useAppStore((s) => s.resources);
  const criticalPath = useAppStore((s) => s.criticalPath);
  const addProject = useAppStore((s) => s.addProject);
  const addTask = useAppStore((s) => s.addTask);
  const ganttContainerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  const [newTask, setNewTask] = useState({
    name: '',
    projectId: '',
    assigneeId: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    estimatedHours: 8,
  });

  const handleExportPNG = async () => {
    setIsExporting(true);
    try {
      const container = ganttContainerRef.current;
      if (!container) return;

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const link = document.createElement('a');
      link.download = `gantt-chart-${format(new Date(), 'yyyy-MM-dd')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    addProject({ name: newProjectName.trim(), description: newProjectDesc.trim(), color: '' });
    setNewProjectName('');
    setNewProjectDesc('');
    setShowNewProjectModal(false);
  };

  const handleCreateTask = () => {
    if (!newTask.name.trim() || !newTask.projectId) return;
    addTask({
      projectId: newTask.projectId,
      name: newTask.name.trim(),
      startDate: newTask.startDate,
      endDate: newTask.endDate,
      assigneeId: newTask.assigneeId || null,
      dependencies: [],
      estimatedHours: newTask.estimatedHours,
      progress: 0,
    });
    setNewTask({
      name: '',
      projectId: projects[0]?.id || '',
      assigneeId: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(), 'yyyy-MM-dd'),
      estimatedHours: 8,
    });
    setShowNewTaskModal(false);
  };

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', background: '#eceff1', overflow: 'hidden' }}>
      <header
        style={{
          padding: '14px 24px',
          background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 2px 8px rgba(26,35,126,0.3)',
          zIndex: 100,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #42a5f5, #1e88e5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(66,165,245,0.4)',
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="4" width="6" height="16" rx="2" fill="white" opacity="0.9" />
              <rect x="11" y="8" width="6" height="12" rx="2" fill="white" opacity="0.8" />
              <rect x="19" y="2" width="2" height="18" rx="1" fill="white" opacity="0.6" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>项目甘特图与资源管理</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>
              {projects.length} 个项目 · {tasks.length} 个任务 · {resources.length} 位成员
              {criticalPath.length > 0 && (
                <span style={{ marginLeft: 10, color: '#ffc107', fontWeight: 600 }}>
                  ★ 关键路径: {criticalPath.length} 个任务
                </span>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowNewProjectModal(true)}
            style={{
              padding: '9px 18px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
          >
            + 新建项目
          </button>
          <button
            onClick={() => setShowNewTaskModal(true)}
            style={{
              padding: '9px 18px',
              background: 'rgba(255,255,255,0.15)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.25)',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              backdropFilter: 'blur(8px)',
              transition: 'all 0.2s',
            }}
          >
            + 添加任务
          </button>
          <button
            onClick={handleExportPNG}
            disabled={isExporting}
            style={{
              padding: '9px 18px',
              background: isExporting ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #42a5f5, #1e88e5)',
              color: 'white',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 600,
              cursor: isExporting ? 'progress' : 'pointer',
              boxShadow: isExporting ? 'none' : '0 4px 12px rgba(66,165,245,0.4)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {isExporting ? (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  style={{ animation: 'spin 1s linear infinite' }}
                >
                  <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeLinecap="round" strokeDasharray="30 60" />
                </svg>
                导出中...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                导出PNG
              </>
            )}
          </button>
        </div>
      </header>

      <div
        className="main-content"
        style={{
          flex: 1,
          display: 'flex',
          overflow: 'hidden',
          flexDirection: 'row',
        }}
      >
        <div
          ref={ganttContainerRef}
          style={{
            width: '70%',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid #cfd8dc',
            background: 'white',
          }}
          className="gantt-container"
        >
          <GanttChart tasks={tasks} projects={projects} resources={resources} />
        </div>

        <div
          style={{
            width: '30%',
            minWidth: 280,
            display: 'flex',
            flexDirection: 'column',
            background: '#f5f7fa',
          }}
          className="resource-panel"
        >
          <ResourcePanel resources={resources} tasks={tasks} projects={projects} />
        </div>
      </div>

      {showNewProjectModal && (
        <div
          onClick={() => setShowNewProjectModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            animation: 'fadeIn 0.2s',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              width: 400,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a237e', marginBottom: 16 }}>新建项目</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#455a64', display: 'block', marginBottom: 6 }}>项目名称</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="输入项目名称"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cfd8dc',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1a237e')}
                  onBlur={(e) => (e.target.style.borderColor = '#cfd8dc')}
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#455a64', display: 'block', marginBottom: 6 }}>项目描述（可选）</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="输入项目描述"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cfd8dc',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1a237e')}
                  onBlur={(e) => (e.target.style.borderColor = '#cfd8dc')}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setShowNewProjectModal(false)}
                style={{
                  padding: '9px 20px',
                  background: '#eceff1',
                  color: '#455a64',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                style={{
                  padding: '9px 20px',
                  background: 'linear-gradient(135deg, #1a237e, #283593)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(26,35,126,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                创建项目
              </button>
            </div>
          </div>
        </div>
      )}

      {isExporting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            animation: 'fadeIn 0.2s',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: 16,
              padding: '32px 48px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              style={{ animation: 'spin 1s linear infinite' }}
            >
              <circle cx="12" cy="12" r="10" stroke="#1a237e" strokeWidth="3" strokeLinecap="round" strokeDasharray="30 60" />
            </svg>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#1a237e' }}>正在导出PNG...</div>
            <div style={{ fontSize: 12, color: '#78909c' }}>请稍候，正在生成高清图片</div>
          </div>
        </div>
      )}

      {showNewTaskModal && (
        <div
          onClick={() => setShowNewTaskModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'white',
              borderRadius: 16,
              padding: 24,
              width: 420,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              animation: 'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 700, color: '#1a237e', marginBottom: 16 }}>添加任务</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#455a64', display: 'block', marginBottom: 6 }}>任务名称</label>
                <input
                  type="text"
                  value={newTask.name}
                  onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
                  placeholder="输入任务名称"
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cfd8dc',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#455a64', display: 'block', marginBottom: 6 }}>所属项目</label>
                  <select
                    value={newTask.projectId}
                    onChange={(e) => setNewTask({ ...newTask, projectId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #cfd8dc',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      background: 'white',
                    }}
                  >
                    <option value="">选择项目</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#455a64', display: 'block', marginBottom: 6 }}>负责人</label>
                  <select
                    value={newTask.assigneeId}
                    onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #cfd8dc',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                      background: 'white',
                    }}
                  >
                    <option value="">未分配</option>
                    {resources.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#455a64', display: 'block', marginBottom: 6 }}>开始日期</label>
                  <input
                    type="date"
                    value={newTask.startDate}
                    onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #cfd8dc',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 500, color: '#455a64', display: 'block', marginBottom: 6 }}>结束日期</label>
                  <input
                    type="date"
                    value={newTask.endDate}
                    onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #cfd8dc',
                      borderRadius: 8,
                      fontSize: 14,
                      outline: 'none',
                    }}
                  />
                </div>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 500, color: '#455a64', display: 'block', marginBottom: 6 }}>预估工时 (小时)</label>
                <input
                  type="number"
                  min={1}
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: parseInt(e.target.value) || 1 })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #cfd8dc',
                    borderRadius: 8,
                    fontSize: 14,
                    outline: 'none',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setShowNewTaskModal(false)}
                style={{
                  padding: '9px 20px',
                  background: '#eceff1',
                  color: '#455a64',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleCreateTask}
                style={{
                  padding: '9px 20px',
                  background: 'linear-gradient(135deg, #1a237e, #283593)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(26,35,126,0.3)',
                }}
              >
                添加任务
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @media (max-width: 768px) {
          .main-content {
            flex-direction: column !important;
          }
          .gantt-container {
            width: 100% !important;
            height: 60% !important;
            border-right: none !important;
            border-bottom: 1px solid #cfd8dc;
          }
          .resource-panel {
            width: 100% !important;
            height: 40% !important;
            min-width: 0 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default App;
