import { useState, useEffect, useMemo } from 'react';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProjectStore } from '@/store/projectStore';
import ProjectCard from '@/components/ProjectCard';
import { cn } from '@/lib/utils';
import type { Project } from '@/types';

const GENRE_OPTIONS = ['流行', '爵士', '电子', '古典', '民谣', 'R&B'];

export default function ProjectList() {
  const navigate = useNavigate();
  const projects = useProjectStore((state) => state.projects);
  const selectProject = useProjectStore((state) => state.selectProject);
  const addProject = useProjectStore((state) => state.addProject);

  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    genres: [] as string[],
    bpmRange: { min: 80, max: 140 },
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const q = searchQuery.toLowerCase();
    return projects.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.clientName.toLowerCase().includes(q)
    );
  }, [projects, searchQuery]);

  const handleCardClick = (project: Project) => {
    selectProject(project.id);
    navigate(`/project/${project.id}`);
  };

  const toggleGenre = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre)
        ? prev.genres.filter((g) => g !== genre)
        : [...prev.genres, genre],
    }));
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.clientName.trim()) return;
    addProject({
      name: formData.name.trim(),
      clientName: formData.clientName.trim(),
      genres: formData.genres,
      bpmRange: formData.bpmRange,
    });
    setFormData({ name: '', clientName: '', genres: [], bpmRange: { min: 80, max: 140 } });
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-bg-main p-6 lg:p-8">
      <div
        className={cn(
          'mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between transition-all duration-400',
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
        )}
      >
        <h1 className="text-2xl font-bold text-text-primary">我的项目</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary" />
            <input
              type="text"
              placeholder="搜索项目..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 rounded-lg border border-[#374151] bg-bg-card py-2 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent/50 focus:outline-none transition-colors"
            />
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            style={{ borderRadius: '8px' }}
          >
            <Plus className="h-4 w-4" />
            新建项目
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-56 rounded-2xl bg-gradient-to-b from-[#1F2937] to-[#111827] animate-pulse"
              style={{
                animationDelay: `${i * 100}ms`,
                backgroundImage:
                  'linear-gradient(90deg, #334155 25%, #475569 50%, #334155 75%)',
                backgroundSize: '200% 100%',
              }}
            />
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-text-secondary">
          <p className="text-lg">暂无项目</p>
          <p className="mt-2 text-sm">点击右上角"新建项目"开始吧</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProjects.map((project, index) => (
            <div
              key={project.id}
              className={cn(
                'transition-all duration-400',
                isVisible ? 'translate-y-0 opacity-100' : 'translate-y-5 opacity-0'
              )}
              style={{ transitionDelay: `${(index + 1) * 80}ms` }}
            >
              <ProjectCard project={project} onClick={() => handleCardClick(project)} />
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-bg-card p-6 shadow-2xl">
            <h2 className="mb-5 text-xl font-semibold text-text-primary">新建项目</h2>

            <div className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  项目名称
                </label>
                <input
                  type="text"
                  maxLength={40}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="请输入项目名称"
                  className="w-full rounded-lg border border-[#374151] bg-bg-main px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent/50 focus:outline-none transition-colors"
                />
                <div className="mt-1 text-right text-[10px] text-text-secondary">
                  {formData.name.length}/40
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-text-primary">
                  客户名称
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="请输入客户名称"
                  className="w-full rounded-lg border border-[#374151] bg-bg-main px-4 py-2.5 text-sm text-text-primary placeholder:text-text-secondary focus:border-accent/50 focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  风格标签
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((genre) => {
                    const isSelected = formData.genres.includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => toggleGenre(genre)}
                        className={cn(
                          'rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
                          isSelected
                            ? 'bg-accent text-white'
                            : 'bg-[#374151] text-text-secondary hover:text-text-primary'
                        )}
                      >
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">
                  BPM 范围
                </label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-text-secondary">
                    <span>最小: {formData.bpmRange.min}</span>
                    <span>最大: {formData.bpmRange.max}</span>
                  </div>
                  <div className="space-y-2">
                    <input
                      type="range"
                      min={60}
                      max={200}
                      value={formData.bpmRange.min}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFormData({
                          ...formData,
                          bpmRange: {
                            ...formData.bpmRange,
                            min: Math.min(val, formData.bpmRange.max),
                          },
                        });
                      }}
                      className="w-full accent-accent"
                    />
                    <input
                      type="range"
                      min={60}
                      max={200}
                      value={formData.bpmRange.max}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setFormData({
                          ...formData,
                          bpmRange: {
                            ...formData.bpmRange,
                            max: Math.max(val, formData.bpmRange.min),
                          },
                        });
                      }}
                      className="w-full accent-accent"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg px-5 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                disabled={!formData.name.trim() || !formData.clientName.trim()}
                className={cn(
                  'rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors',
                  formData.name.trim() && formData.clientName.trim()
                    ? 'bg-accent hover:bg-accent/90'
                    : 'bg-[#374151] cursor-not-allowed'
                )}
                style={{ borderRadius: '8px' }}
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
