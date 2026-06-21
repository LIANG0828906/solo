import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, UserPlus, FolderOpen, X } from 'lucide-react';
import { useStore, Project } from '@/store';
import './ProjectList.css';

const MOCK_PROJECTS: Project[] = [
  {
    id: 'p1',
    name: '夏日协奏曲',
    creator: '张三',
    createdAt: '2026-06-15T10:30:00Z',
    inviteCode: 'ABC123',
    tracks: [
      { id: 't1', name: '主旋律', waveform: 'sine', volume: 80, pan: 0, effectsEnabled: false },
      { id: 't2', name: '贝斯', waveform: 'sawtooth', volume: 70, pan: -30, effectsEnabled: true },
    ],
    notes: [],
  },
  {
    id: 'p2',
    name: '夜空交响乐',
    creator: '李四',
    createdAt: '2026-06-18T14:20:00Z',
    inviteCode: 'XYZ789',
    tracks: [
      { id: 't3', name: '钢琴', waveform: 'triangle', volume: 85, pan: 0, effectsEnabled: false },
    ],
    notes: [],
  },
  {
    id: 'p3',
    name: '电子节拍',
    creator: '王五',
    createdAt: '2026-06-20T09:15:00Z',
    inviteCode: 'EDM456',
    tracks: [
      { id: 't4', name: '鼓点', waveform: 'square', volume: 90, pan: 0, effectsEnabled: true },
      { id: 't5', name: '合成器', waveform: 'sawtooth', volume: 75, pan: 20, effectsEnabled: false },
      { id: 't6', name: 'Bass', waveform: 'sine', volume: 80, pan: -10, effectsEnabled: false },
    ],
    notes: [],
  },
];

export default function ProjectList() {
  const navigate = useNavigate();
  const { projects, setProjects, addProject, addToast } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newCreator, setNewCreator] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const response = await fetch('/api/projects');
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        } else {
          setProjects(MOCK_PROJECTS);
        }
      } catch {
        setProjects(MOCK_PROJECTS);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, [setProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !newCreator.trim()) {
      addToast('请填写项目名和创建人');
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: newProjectName.trim(),
      creator: newCreator.trim(),
      createdAt: new Date().toISOString(),
      inviteCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
      tracks: [
        {
          id: Date.now().toString() + '_t1',
          name: '轨道 1',
          waveform: 'sine',
          volume: 80,
          pan: 0,
          effectsEnabled: false,
        },
      ],
      notes: [],
    };

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newProject.name, creator: newProject.creator }),
      });
      if (response.ok) {
        const created = await response.json();
        addProject(created);
      } else {
        addProject(newProject);
      }
    } catch {
      addProject(newProject);
    }

    addToast(`项目"${newProject.name}"已创建`);
    setNewProjectName('');
    setNewCreator('');
    setShowCreateModal(false);
    navigate(`/editor/${newProject.id}`);
  };

  const handleJoinProject = async () => {
    if (!inviteCode.trim()) {
      addToast('请输入邀请码');
      return;
    }

    try {
      const response = await fetch('/api/project/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      });
      if (response.ok) {
        const project = await response.json();
        addProject(project);
        addToast(`已加入项目"${project.name}"`);
        navigate(`/editor/${project.id}`);
      } else {
        const mock = MOCK_PROJECTS.find((p) => p.inviteCode === inviteCode.trim().toUpperCase());
        if (mock) {
          if (!projects.find((p) => p.id === mock.id)) {
            addProject(mock);
          }
          addToast(`已加入项目"${mock.name}"`);
          navigate(`/editor/${mock.id}`);
        } else {
          addToast('邀请码无效');
        }
      }
    } catch {
      const mock = MOCK_PROJECTS.find((p) => p.inviteCode === inviteCode.trim().toUpperCase());
      if (mock) {
        if (!projects.find((p) => p.id === mock.id)) {
          addProject(mock);
        }
        addToast(`已加入项目"${mock.name}"`);
        navigate(`/editor/${mock.id}`);
      } else {
        addToast('邀请码无效');
      }
    }

    setInviteCode('');
  };

  const handleLoadProject = (projectId: string) => {
    navigate(`/editor/${projectId}`);
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="project-list-page">
      <div className="page-inner">
        <div className="page-header">
          <div>
            <h1 className="page-title">协同音乐编辑器</h1>
            <p className="page-subtitle">实时协作 · 共创音乐</p>
          </div>
          <div className="header-actions">
            <div className="join-project-box">
              <input
                type="text"
                className="invite-input"
                placeholder="输入邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinProject()}
              />
              <button className="join-btn" onClick={handleJoinProject}>
                <UserPlus size={16} />
                <span>加入项目</span>
              </button>
            </div>
            <button className="create-btn" onClick={() => setShowCreateModal(true)}>
              <Plus size={18} />
              <span>创建新项目</span>
            </button>
          </div>
        </div>

        <div className="projects-section">
          <h2 className="section-heading">我的项目</h2>
          {loading ? (
            <div className="loading-state">加载中...</div>
          ) : projects.length === 0 ? (
            <div className="empty-state">
              <FolderOpen size={48} className="empty-icon" />
              <p>还没有项目，点击右上角创建第一个项目吧</p>
            </div>
          ) : (
            <div className="projects-grid">
              {projects.map((project) => (
                <div key={project.id} className="project-card">
                  <div className="card-header">
                    <div className="card-icon">🎵</div>
                    <div className="card-title-wrap">
                      <h3 className="card-title">{project.name}</h3>
                      <p className="card-creator">创建人：{project.creator}</p>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="card-meta">
                      <div className="meta-item">
                        <span className="meta-label">创建时间</span>
                        <span className="meta-value">{formatDate(project.createdAt)}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">轨道数</span>
                        <span className="meta-value">{project.tracks.length}</span>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button className="load-btn" onClick={() => handleLoadProject(project.id)}>
                      <FolderOpen size={16} />
                      <span>加载</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">创建新项目</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">项目名称</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入项目名称"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
              <div className="form-group">
                <label className="form-label">创建人</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入你的名字"
                  value={newCreator}
                  onChange={(e) => setNewCreator(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="cancel-btn" onClick={() => setShowCreateModal(false)}>
                取消
              </button>
              <button className="confirm-btn" onClick={handleCreateProject}>
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
