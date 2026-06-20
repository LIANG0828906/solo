import { useEffect, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { useStore } from './store';
import ProjectCard from './components/ProjectCard';
import MilestoneTimeline from './components/MilestoneTimeline';
import BoardView from './components/BoardView';
import {
  Gamepad2,
  Menu,
  X,
  Plus,
  Monitor,
  Smartphone,
  Tv,
  LogIn,
  ChevronLeft,
} from 'lucide-react';
import type { Project } from './types';

function Sidebar() {
  const { projects, sidebarOpen, setSidebarOpen } = useStore();
  const navigate = useNavigate();

  return (
    <>
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-50 p-2 glass rounded-lg hover:bg-white/10 transition-colors"
        >
          <Menu size={20} className="text-text-primary" />
        </button>
      )}
      <aside
        className={`fixed left-0 top-0 h-full z-40 glass-strong transition-all duration-300 flex flex-col ${
          sidebarOpen ? 'w-56' : 'w-0 overflow-hidden'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <Gamepad2 size={22} className="text-accent" />
            <span className="font-display text-sm font-bold gradient-text">GDMT</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors md:hidden"
          >
            <X size={16} className="text-text-secondary" />
          </button>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 hover:bg-white/10 rounded transition-colors hidden md:block"
          >
            <ChevronLeft size={16} className="text-text-secondary" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <div className="px-3 mb-2">
            <span className="text-[10px] uppercase tracking-wider text-text-muted font-medium">项目列表</span>
          </div>
          {projects.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/project/${p.id}`)}
              className="w-full px-3 py-2 text-left hover:bg-white/5 transition-colors flex items-center gap-2 group click-scale"
            >
              <div
                className="w-6 h-6 rounded flex-shrink-0"
                style={{
                  background: `linear-gradient(135deg, ${hashColor(p.name, 0)}, ${hashColor(p.name, 1)})`,
                }}
              />
              <span className="text-xs text-text-secondary group-hover:text-text-primary transition-colors truncate">
                {p.name}
              </span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-white/5">
          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-text-secondary click-scale">
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
              <LogIn size={12} />
            </div>
            <span className="text-xs">登录</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function ToastContainer() {
  const { toasts, removeToast } = useStore();

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto glass rounded-lg px-4 py-3 flex items-center gap-3 min-w-[300px] max-w-[420px] animate-slide-in-right cursor-pointer click-scale ${
            toast.type === 'success' ? 'border-l-4 border-l-green-500' :
            toast.type === 'warning' ? 'border-l-4 border-l-yellow-500' :
            'border-l-4 border-l-blue-500'
          }`}
          onClick={() => removeToast(toast.id)}
        >
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
            toast.type === 'success' ? 'bg-green-500' :
            toast.type === 'warning' ? 'bg-yellow-500' :
            'bg-blue-500'
          }`} />
          <span className="text-xs text-text-primary leading-relaxed">{toast.message}</span>
          <button
            onClick={(e) => { e.stopPropagation(); removeToast(toast.id); }}
            className="ml-auto text-text-muted hover:text-text-primary flex-shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}

function CreateProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Project) => void }) {
  const [name, setName] = useState('');
  const [engine, setEngine] = useState<Project['engine']>('Unity');
  const [customEngine, setCustomEngine] = useState('');
  const [platforms, setPlatforms] = useState<('PC' | 'Mobile' | 'Console')[]>(['PC']);
  const [releaseDate, setReleaseDate] = useState('');
  const [description, setDescription] = useState('');

  const togglePlatform = (p: 'PC' | 'Mobile' | 'Console') => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, engine, customEngine: engine === 'Custom' ? customEngine : undefined, platforms, releaseDate, description }),
    });
    const project = await res.json();
    onCreated(project);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="glass-strong rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-display text-lg gradient-text mb-6">创建新项目</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-text-secondary mb-1 block">项目名称</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-from transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">引擎/工具链</label>
            <select
              value={engine}
              onChange={(e) => setEngine(e.target.value as Project['engine'])}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-from transition-colors"
            >
              <option value="Unity">Unity</option>
              <option value="Unreal">Unreal</option>
              <option value="Godot">Godot</option>
              <option value="Custom">自定义</option>
            </select>
          </div>
          {engine === 'Custom' && (
            <div>
              <label className="text-xs text-text-secondary mb-1 block">自定义引擎名称</label>
              <input
                value={customEngine}
                onChange={(e) => setCustomEngine(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-from transition-colors"
              />
            </div>
          )}
          <div>
            <label className="text-xs text-text-secondary mb-1 block">目标平台</label>
            <div className="flex gap-2">
              {(['PC', 'Mobile', 'Console'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-all click-scale ${
                    platforms.includes(p)
                      ? 'bg-primary-from/30 border border-primary-from/50 text-text-primary'
                      : 'bg-white/5 border border-white/10 text-text-secondary hover:bg-white/10'
                  }`}
                >
                  {p === 'PC' ? 'PC' : p === 'Mobile' ? '手机' : '主机'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">发布日期</label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-from transition-colors"
              required
            />
          </div>
          <div>
            <label className="text-xs text-text-secondary mb-1 block">简短描述</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-from transition-colors h-20 resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-text-secondary hover:bg-white/5 text-sm transition-colors click-scale"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 rounded-lg bg-primary-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity click-scale"
            >
              创建项目
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const { projects, fetchProjects, addProject, filterEngine, filterPlatform, setFilterEngine, setFilterPlatform } = useStore();
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const filtered = projects
    .filter((p) => !filterEngine || p.engine === filterEngine || (filterEngine === 'Custom' && p.engine === 'Custom'))
    .filter((p) => !filterPlatform || p.platforms.includes(filterPlatform as 'PC' | 'Mobile' | 'Console'))
    .sort((a, b) => new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime());

  return (
    <div className="p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl gradient-text">项目仪表板</h1>
          <p className="text-text-secondary text-sm mt-1">管理你的游戏开发项目与里程碑</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity click-scale"
        >
          <Plus size={16} />
          创建项目
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filterEngine}
          onChange={(e) => setFilterEngine(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary-from transition-colors"
        >
          <option value="">全部引擎</option>
          <option value="Unity">Unity</option>
          <option value="Unreal">Unreal</option>
          <option value="Godot">Godot</option>
          <option value="Custom">自定义</option>
        </select>
        <select
          value={filterPlatform}
          onChange={(e) => setFilterPlatform(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-primary-from transition-colors"
        >
          <option value="">全部平台</option>
          <option value="PC">PC</option>
          <option value="Mobile">手机</option>
          <option value="Console">主机</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <Gamepad2 size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-text-secondary text-sm">暂无项目，点击上方按钮创建</p>
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={(p) => { addProject(p); }}
        />
      )}
    </div>
  );
}

function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { projects, milestones, tasks, assets, fetchProjectData, addMilestone, updateMilestone, deleteMilestone, addTask, updateTask, deleteTask, addAsset, updateAsset, deleteAsset } = useStore();
  const [activeMilestoneId, setActiveMilestoneId] = useState<string | null>(null);
  const [showAddMilestone, setShowAddMilestone] = useState(false);
  const [newMsName, setNewMsName] = useState('');
  const [newMsStart, setNewMsStart] = useState('');
  const [newMsEnd, setNewMsEnd] = useState('');

  const project = projects.find((p) => p.id === id);
  const projectMilestones = milestones.filter((m) => m.projectId === id);
  const projectTasks = tasks.filter((t) => t.projectId === id);
  const projectAssets = assets.filter((a) => a.projectId === id);

  const loadProject = useCallback(async () => {
    if (id) {
      await fetchProjectData(id);
    }
  }, [id, fetchProjectData]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  useEffect(() => {
    if (projectMilestones.length > 0 && !activeMilestoneId) {
      const active = projectMilestones.find((m) => m.status === 'in_progress');
      setActiveMilestoneId(active?.id || projectMilestones[0]?.id);
    }
  }, [projectMilestones, activeMilestoneId]);

  const activeTasks = activeMilestoneId ? projectTasks.filter((t) => t.milestoneId === activeMilestoneId) : [];

  const handleAddMilestone = async () => {
    if (!id || !newMsName || !newMsStart || !newMsEnd) return;
    const res = await fetch(`/api/projects/${id}/milestones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newMsName, startDate: newMsStart, endDate: newMsEnd, status: 'planning' }),
    });
    const ms = await res.json();
    addMilestone(ms);
    setShowAddMilestone(false);
    setNewMsName('');
    setNewMsStart('');
    setNewMsEnd('');
  };

  const handleMilestoneUpdate = async (msId: string, data: Record<string, unknown>) => {
    const res = await fetch(`/api/milestones/${msId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      updateMilestone(msId, updated);
    } else {
      const err = await res.json();
      useStore.getState().addToast(err.error || '更新里程碑失败', 'warning');
      await loadProject();
    }
  };

  const handleDeleteMilestone = async (msId: string) => {
    await fetch(`/api/milestones/${msId}`, { method: 'DELETE' });
    deleteMilestone(msId);
    if (activeMilestoneId === msId) {
      setActiveMilestoneId(projectMilestones[0]?.id || null);
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-text-secondary mb-4">项目未找到</p>
          <button onClick={() => navigate('/')} className="text-accent hover:underline text-sm">
            返回仪表板
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 h-full flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/')} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
          <ChevronLeft size={18} className="text-text-secondary" />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="font-display text-xl gradient-text truncate">{project.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-secondary">
              {project.engine === 'Custom' ? project.customEngine || '自定义' : project.engine}
            </span>
            {project.platforms.map((p) => (
              <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-text-secondary flex items-center gap-1">
                {p === 'PC' ? <Monitor size={10} /> : p === 'Mobile' ? <Smartphone size={10} /> : <Tv size={10} />}
                {p === 'PC' ? 'PC' : p === 'Mobile' ? '手机' : '主机'}
              </span>
            ))}
          </div>
        </div>
        <button
          onClick={() => setShowAddMilestone(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-gradient text-white text-xs font-medium hover:opacity-90 transition-opacity click-scale"
        >
          <Plus size={14} />
          添加里程碑
        </button>
      </div>

      <p className="text-text-secondary text-xs mb-4 line-clamp-2">{project.description}</p>

      <div className="mb-4 flex-shrink-0">
        <MilestoneTimeline
          milestones={projectMilestones}
          activeMilestoneId={activeMilestoneId}
          onSelectMilestone={setActiveMilestoneId}
          onUpdateMilestone={handleMilestoneUpdate}
          onDeleteMilestone={handleDeleteMilestone}
          onStatusChange={(msId, status) => handleMilestoneUpdate(msId, { status })}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {activeMilestoneId ? (
          <BoardView
            projectId={project.id}
            milestoneId={activeMilestoneId}
            tasks={activeTasks}
            assets={projectAssets}
            onAddTask={addTask}
            onUpdateTask={updateTask}
            onDeleteTask={deleteTask}
            onAddAsset={addAsset}
            onUpdateAsset={updateAsset}
            onDeleteAsset={deleteAsset}
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-text-secondary text-sm">选择一个里程碑查看任务</p>
          </div>
        )}
      </div>

      {showAddMilestone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAddMilestone(false)}>
          <div className="glass-strong rounded-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-display text-lg gradient-text mb-6">添加里程碑</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-secondary mb-1 block">里程碑名称</label>
                <input
                  value={newMsName}
                  onChange={(e) => setNewMsName(e.target.value)}
                  placeholder="如：Alpha、Beta、RC"
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-from transition-colors"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">开始日期</label>
                  <input
                    type="date"
                    value={newMsStart}
                    onChange={(e) => setNewMsStart(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-from transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">截止日期</label>
                  <input
                    type="date"
                    value={newMsEnd}
                    onChange={(e) => setNewMsEnd(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary-from transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddMilestone(false)}
                  className="flex-1 px-4 py-2 rounded-lg border border-white/10 text-text-secondary hover:bg-white/5 text-sm transition-colors click-scale"
                >
                  取消
                </button>
                <button
                  onClick={handleAddMilestone}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary-gradient text-white text-sm font-medium hover:opacity-90 transition-opacity click-scale"
                >
                  添加
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function hashColor(str: string, offset: number): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = ((hash + offset * 60) % 360 + 360) % 360;
  return `hsl(${h}, 60%, 50%)`;
}

function AppLayout() {
  const { sidebarOpen, initWebSocket } = useStore();

  useEffect(() => {
    initWebSocket();
  }, [initWebSocket]);

  return (
    <div className="h-full flex">
      <Sidebar />
      <main
        className={`flex-1 h-full overflow-y-auto transition-all duration-300 ${
          sidebarOpen ? 'md:ml-56' : 'ml-0'
        }`}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/project/:id" element={<ProjectDetail />} />
        </Routes>
      </main>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
