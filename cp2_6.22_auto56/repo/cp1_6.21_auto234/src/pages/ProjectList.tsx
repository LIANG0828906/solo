import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Plus, X, Clock, Calendar, Film } from 'lucide-react';

type ProjectType = '微电影' | 'Vlog' | '宣传片';

interface Project {
  id: string | number;
  name: string;
  description: string;
  type: ProjectType;
  targetDuration: number;
  createdAt: string;
}

const typeColors: Record<ProjectType, string> = {
  '微电影': '#8B5CF6',
  'Vlog': '#06B6D4',
  '宣传片': '#3B82F6',
};

const typeBgColors: Record<ProjectType, string> = {
  '微电影': 'bg-[#8B5CF6]/20 text-[#8B5CF6]',
  'Vlog': 'bg-[#06B6D4]/20 text-[#06B6D4]',
  '宣传片': 'bg-[#3B82F6]/20 text-[#3B82F6]',
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

function SkeletonCard() {
  return (
    <div
      className="relative overflow-hidden rounded-[16px] bg-[#1E293B] skeleton-pulse"
      style={{ width: '320px', height: '200px' }}
    >
      <div className="p-5 h-full flex flex-col">
        <div className="h-7 w-3/4 bg-[#334155] rounded mb-4"></div>
        <div className="h-4 w-full bg-[#334155] rounded mb-2"></div>
        <div className="h-4 w-2/3 bg-[#334155] rounded mb-auto"></div>
        <div className="flex gap-2 mt-4">
          <div className="h-6 w-16 bg-[#334155] rounded-full"></div>
          <div className="h-6 w-20 bg-[#334155] rounded-full"></div>
        </div>
        <div className="h-4 w-24 bg-[#334155] rounded mt-3"></div>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#334155]"></div>
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: Project; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer overflow-hidden rounded-[16px] bg-[#1E293B] transition-all duration-300 ease-out hover:-translate-y-1"
      style={{
        width: '320px',
        height: '200px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        padding: '20px',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      }}
    >
      <div className="flex flex-col h-full">
        <h3 className="text-xl font-bold text-white mb-2 truncate">
          {project.name}
        </h3>
        <p
          className="text-slate-400 text-sm mb-4 overflow-hidden"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: '1.5',
          }}
        >
          {project.description}
        </p>
        <div className="flex flex-wrap gap-2 mb-3 mt-auto">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${typeBgColors[project.type]}`}
          >
            <Film size={12} />
            {project.type}
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#334155] text-slate-300">
            <Clock size={12} />
            {project.targetDuration}分钟
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar size={12} />
          {formatDate(project.createdAt)}
        </div>
      </div>
      <div
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{ backgroundColor: typeColors[project.type] }}
      ></div>
    </div>
  );
}

export default function ProjectList() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '微电影' as ProjectType,
    targetDuration: 5,
  });

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get<Project[]>('/api/projects');
      setProjects(response.data);
    } catch (err) {
      setError('加载项目列表失败，请稍后重试');
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setSubmitting(true);
      const response = await axios.post<Project>('/api/projects', formData);
      const newProject = response.data;
      setIsModalOpen(false);
      setFormData({ name: '', description: '', type: '微电影', targetDuration: 5 });
      navigate(`/projects/${newProject.id}`);
    } catch (err) {
      console.error('Failed to create project:', err);
      alert('创建项目失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardClick = (project: Project) => {
    navigate(`/projects/${project.id}`);
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: '#334155',
    borderColor: '#475569',
    borderRadius: '8px',
    padding: '12px',
    color: '#fff',
    width: '100%',
    outline: 'none',
    border: '1px solid #475569',
    transition: 'border-color 0.2s ease',
  };

  return (
    <div className="min-h-screen bg-[#1E293B]">
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">项目列表</h1>
            <p className="text-slate-400">管理您的所有视频创作项目</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B5CF6] text-white rounded-lg font-medium hover:bg-[#7C3AED] transition-colors shadow-lg hover:shadow-[#8B5CF6]/30"
          >
            <Plus size={18} />
            新建项目
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
            {error}
          </div>
        )}

        <div
          className="flex flex-wrap"
          style={{ gap: '24px' }}
        >
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))
          ) : projects.length === 0 ? (
            <div className="w-full flex flex-col items-center justify-center py-20 text-slate-500">
              <Film size={48} className="mb-4 opacity-50" />
              <p className="text-lg">暂无项目，点击右上角创建第一个项目</p>
            </div>
          ) : (
            projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleCardClick(project)}
              />
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-[#1E293B] rounded-2xl p-8 w-full max-w-md shadow-2xl border border-[#334155]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">新建项目</h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-lg hover:bg-[#334155] text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  项目名称 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入项目名称"
                  required
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                  onBlur={(e) => (e.target.style.borderColor = '#475569')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  一句话简介
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="用一句话描述这个项目"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                  onBlur={(e) => (e.target.style.borderColor = '#475569')}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  影片类型 <span className="text-red-400">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as ProjectType })}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                  onBlur={(e) => (e.target.style.borderColor = '#475569')}
                >
                  <option value="微电影">微电影</option>
                  <option value="Vlog">Vlog</option>
                  <option value="宣传片">宣传片</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  目标时长（分钟） <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={formData.targetDuration}
                  onChange={(e) => setFormData({ ...formData, targetDuration: Number(e.target.value) })}
                  required
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = '#3B82F6')}
                  onBlur={(e) => (e.target.style.borderColor = '#475569')}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-[#334155] text-slate-300 hover:bg-[#475569] transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.name.trim()}
                  className="flex-1 px-4 py-2.5 rounded-lg font-medium bg-[#8B5CF6] text-white hover:bg-[#7C3AED] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '创建中...' : '创建项目'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
