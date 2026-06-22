import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, History, Users, ChevronRight, Sparkles } from 'lucide-react';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const quickActions = [
    {
      title: '进入复盘会议',
      description: '开始或继续项目复盘',
      icon: LayoutDashboard,
      path: '/retrospect/session-001',
      color: 'from-primary-500 to-primary-700',
    },
    {
      title: '模板管理',
      description: '创建和管理复盘模板',
      icon: FileText,
      path: '/templates',
      color: 'from-purple-500 to-purple-700',
    },
    {
      title: '历史记录',
      description: '查看历史复盘与趋势分析',
      icon: History,
      path: '/history',
      color: 'from-amber-500 to-amber-700',
    },
    {
      title: '团队成员',
      description: '管理参与复盘的成员',
      icon: Users,
      path: '/team',
      color: 'from-emerald-500 to-emerald-700',
    },
  ];

  const recentProjects = [
    {
      id: 'session-001',
      name: '电商平台重构项目',
      status: 'active',
      phase: '改进 (Improve)',
      progress: 75,
      date: '2026-06-18',
      members: 8,
    },
    {
      id: 'session-002',
      name: '移动端App v2.0发布',
      status: 'completed',
      phase: '已完成',
      progress: 100,
      date: '2026-06-10',
      members: 6,
    },
    {
      id: 'session-003',
      name: '数据中台建设',
      status: 'draft',
      phase: '准备中',
      progress: 0,
      date: '2026-06-20',
      members: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-dark-500 bg-grid-pattern">
      <header className="glass-card border-b border-white/10 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">RetroFlow</h1>
              <p className="text-xs text-white/50">项目复盘与回顾平台</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">李</span>
              </div>
              <span className="text-sm text-white/80">李工程师</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8">
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-white mb-6">快速开始</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={action.title}
                onClick={() => navigate(action.path)}
                className="glass-card glass-card-hover p-6 text-left group fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                >
                  <action.icon size={24} className="text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                  {action.title}
                  <ChevronRight
                    size={18}
                    className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300"
                  />
                </h3>
                <p className="text-sm text-white/50">{action.description}</p>
              </button>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-white mb-6">最近项目</h2>
          <div className="space-y-3">
            {recentProjects.map((project, index) => (
              <div
                key={project.id}
                className="glass-card glass-card-hover p-5 flex items-center justify-between cursor-pointer fade-in"
                style={{ animationDelay: `${index * 100 + 400}ms` }}
                onClick={() => navigate(`/retrospect/${project.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-dark-400 to-dark-600 flex items-center justify-center">
                    <span className="text-lg font-bold text-primary-400">
                      {project.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">
                      {project.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          project.status === 'active'
                            ? 'bg-primary-500/20 text-primary-400'
                            : project.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-white/10 text-white/50'
                        }`}
                      >
                        {project.status === 'active'
                          ? '进行中'
                          : project.status === 'completed'
                          ? '已完成'
                          : '草稿'}
                      </span>
                      <span className="text-xs text-white/40">
                        {project.phase}
                      </span>
                      <span className="text-xs text-white/40">
                        {project.members} 人参与
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="w-32">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white/50">进度</span>
                      <span className="text-primary-400 font-medium">
                        {project.progress}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-white/40">{project.date}</span>
                  <ChevronRight size={20} className="text-white/30" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
