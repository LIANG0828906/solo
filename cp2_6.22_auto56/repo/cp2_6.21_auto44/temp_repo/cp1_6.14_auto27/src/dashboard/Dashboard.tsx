import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, BookOpen, FileText, X, Calendar } from 'lucide-react';
import ProjectCard from './ProjectCard';
import ProgressChart from './ProgressChart';
import RingProgress from './RingProgress';
import { projectApi, writingLogApi, getProjectWordCount, getSnippetsByDate, recordDailyWords } from '../utils/api';
import type { Project } from '../../shared/types';
import { getPast7Days, todayStr } from '../utils/textStats';

interface SnippetModalProps {
  date: string;
  snippets: string[];
  onClose: () => void;
}

const SnippetModal: React.FC<SnippetModalProps> = ({ date, snippets, onClose }) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
    <div
      className="bg-white rounded-xl max-w-lg w-full max-h-[70vh] overflow-hidden shadow-2xl animate-slide-up"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-accent" />
          <h3 className="font-serif font-bold text-lg text-primary-700">{date} 写作片段</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-primary-100 rounded-lg transition-colors">
          <X className="w-5 h-5 text-primary-400" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto max-h-[calc(70vh-64px)]">
        {snippets.length === 0 ? (
          <p className="text-primary-400 text-center py-8">当天没有写作记录</p>
        ) : (
          <div className="space-y-3">
            {snippets.map((s, i) => (
              <div key={i} className="p-4 bg-primary-50 rounded-lg border-l-4 border-accent">
                <p className="text-sm text-primary-600 leading-relaxed">{s}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chartDates, setChartDates] = useState<string[]>([]);
  const [chartWords, setChartWords] = useState<number[]>([]);
  const [snippetModal, setSnippetModal] = useState<{ date: string; snippets: string[] } | null>(null);
  const [newProject, setNewProject] = useState({
    title: '',
    targetWordCount: 50000,
    deadline: '',
    tags: [] as string[],
  });
  const tagOptions = ['小说', '散文', '技术博客', '诗歌', '杂文'];

  useEffect(() => {
    loadProjects();
    const past7 = getPast7Days();
    setChartDates(past7);
    setChartWords(new Array(7).fill(0));
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadChartData(selectedProject.id);
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const list = await projectApi.list();
      setProjects(list);
      if (list.length > 0 && !selectedProject) {
        setSelectedProject(list[0]);
      }
    } catch (e) {
      console.error('Load projects failed:', e);
    }
  };

  const loadChartData = async (projectId: string) => {
    try {
      const past7 = getPast7Days();
      const logs = await writingLogApi.daily(projectId, 7);
      const dailyWords = past7.map((d) => {
        const log = logs.find((l) => l.date === d);
        return log?.wordsAdded || 0;
      });
      const localLog = JSON.parse(localStorage.getItem('daily_word_log') || '{}');
      past7.forEach((d, i) => {
        const key = `${projectId}_${d}`;
        dailyWords[i] = Math.max(dailyWords[i], localLog[key] || 0);
      });
      setChartDates(past7);
      setChartWords(dailyWords);
    } catch {
      const past7 = getPast7Days();
      const localLog = JSON.parse(localStorage.getItem('daily_word_log') || '{}');
      const dailyWords = past7.map((d) => {
        const key = `${projectId}_${d}`;
        return localLog[key] || 0;
      });
      setChartDates(past7);
      setChartWords(dailyWords);
    }
  };

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) return;
    try {
      const project = await projectApi.create(newProject);
      try {
        await writingLogApi.create({
          projectId: project.id,
          date: todayStr(),
          wordsAdded: 0,
          snippets: [],
        });
      } catch {
        recordDailyWords(project.id, 0, '');
      }
      setShowCreateModal(false);
      setNewProject({ title: '', targetWordCount: 50000, deadline: '', tags: [] });
      loadProjects();
    } catch (e) {
      console.error('Create failed:', e);
    }
  };

  const handleRename = async (id: string, title: string) => {
    try {
      await projectApi.update(id, { title });
      loadProjects();
    } catch (e) {
      console.error('Rename failed:', e);
    }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await projectApi.duplicate(id);
      loadProjects();
    } catch (e) {
      console.error('Duplicate failed:', e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await projectApi.remove(id);
      if (selectedProject?.id === id) {
        setSelectedProject(null);
      }
      loadProjects();
    } catch (e) {
      console.error('Delete failed:', e);
    }
  };

  const handleReorder = async (ids: string[]) => {
    const ordered = [...projects].sort((a, b) => {
      const ai = ids.indexOf(a.id);
      const bi = ids.indexOf(b.id);
      if (ai === -1 && bi === -1) return a.order - b.order;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    const idList = ordered.map((p) => p.id);
    try {
      const updated = await projectApi.reorder(idList);
      setProjects(updated);
    } catch (e) {
      console.error('Reorder failed:', e);
    }
  };

  const handleDayClick = (date: string, snippets: string[]) => {
    const allSnippets = snippets.length > 0 ? snippets : getSnippetsByDate(selectedProject?.id || '', date);
    setSnippetModal({ date, snippets: allSnippets });
  };

  const totalWords = selectedProject ? getProjectWordCount(selectedProject.id) : 0;
  const total7Days = chartWords.reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-serif text-3xl font-bold text-primary-700">写作工作台</h1>
            <p className="text-primary-400 mt-1">整理灵感，记录进步，让写作更高效</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white rounded-xl font-medium transition-all hover:shadow-lg hover:-translate-y-0.5"
          >
            <Plus className="w-5 h-5" />
            新建项目
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-primary-500 rounded-2xl p-6 text-white">
            <div className="flex items-center gap-3 mb-6">
              <FileText className="w-6 h-6 text-accent-light" />
              <h2 className="font-serif text-xl font-bold">写作进度</h2>
              {selectedProject && (
                <span className="ml-auto text-white/70 text-sm">{selectedProject.title}</span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="flex justify-center">
                {selectedProject ? (
                  <RingProgress
                    value={totalWords}
                    max={selectedProject.targetWordCount}
                    size={180}
                    strokeWidth={14}
                  />
                ) : (
                  <div className="w-[180px] h-[180px] flex items-center justify-center text-white/50">
                    选择项目查看
                  </div>
                )}
              </div>
              <div className="md:col-span-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-xs text-white/60 mb-1">7天总字数</div>
                    <div className="text-2xl font-bold tabular-nums">{total7Days.toLocaleString()}</div>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="text-xs text-white/60 mb-1">日均字数</div>
                    <div className="text-2xl font-bold tabular-nums">
                      {Math.round(total7Days / 7).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <div className="text-xs text-white/60 mb-2">过去7天新增字数</div>
                  <ProgressChart
                    dates={chartDates}
                    words={chartWords}
                    onDayClick={handleDayClick}
                    getSnippets={(d) => getSnippetsByDate(selectedProject?.id || '', d)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-surface-card rounded-2xl p-6 shadow-md">
            <h2 className="font-serif text-lg font-bold text-primary-700 mb-4">快速统计</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                <span className="text-primary-500 text-sm">项目总数</span>
                <span className="font-bold text-primary-700">{projects.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                <span className="text-primary-500 text-sm">当前字数</span>
                <span className="font-bold text-primary-700 tabular-nums">{totalWords.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                <span className="text-primary-500 text-sm">目标字数</span>
                <span className="font-bold text-primary-700 tabular-nums">
                  {selectedProject?.targetWordCount.toLocaleString() || 0}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-primary-50 rounded-lg">
                <span className="text-primary-500 text-sm">今日新增</span>
                <span className="font-bold text-success tabular-nums">
                  +{chartWords[chartWords.length - 1].toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-primary-500" />
            <h2 className="font-serif text-xl font-bold text-primary-700">我的项目</h2>
          </div>
          {projects.length === 0 ? (
            <div className="text-center py-16 bg-surface-card rounded-2xl border-2 border-dashed border-primary-200">
              <FileText className="w-16 h-16 text-primary-300 mx-auto mb-4" />
              <p className="text-primary-400 mb-4">还没有任何项目，点击右上角创建第一个写作项目吧</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors"
              >
                立即创建
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onRename={handleRename}
                  onDuplicate={handleDuplicate}
                  onDelete={handleDelete}
                  onClick={() => navigate(`/project/${project.id}`)}
                  onOrderChange={handleReorder}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCreateModal(false)}>
          <div
            className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-slide-up"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-primary-100">
              <h3 className="font-serif text-xl font-bold text-primary-700">创建新项目</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-600 mb-1">项目标题 *</label>
                <input
                  type="text"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  placeholder="输入文章标题..."
                  autoFocus
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary-600 mb-1">目标字数</label>
                  <input
                    type="number"
                    value={newProject.targetWordCount}
                    onChange={(e) => setNewProject({ ...newProject, targetWordCount: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary-600 mb-1">截止日期</label>
                  <input
                    type="date"
                    value={newProject.deadline}
                    onChange={(e) => setNewProject({ ...newProject, deadline: e.target.value })}
                    className="w-full px-4 py-2.5 border border-primary-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-primary-600 mb-2">标签</label>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const tags = newProject.tags.includes(tag)
                          ? newProject.tags.filter((t) => t !== tag)
                          : [...newProject.tags, tag];
                        setNewProject({ ...newProject, tags });
                      }}
                      className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                        newProject.tags.includes(tag)
                          ? 'bg-accent text-white'
                          : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 bg-primary-50 rounded-b-2xl">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2.5 border border-primary-200 text-primary-600 rounded-lg hover:bg-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProject.title.trim()}
                className="flex-1 px-4 py-2.5 bg-accent text-white rounded-lg hover:bg-accent-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {snippetModal && (
        <SnippetModal
          date={snippetModal.date}
          snippets={snippetModal.snippets}
          onClose={() => setSnippetModal(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
