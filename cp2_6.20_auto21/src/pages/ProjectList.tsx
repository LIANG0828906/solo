import { Link } from 'react-router-dom';
import { Plus, FolderKanban, History, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import Navbar from '@/components/layout/Navbar';
import { useRetroStore } from '@/store/useRetroStore';
import type { Project } from '@/types';

const mockProjects: Project[] = [
  {
    id: 'project-001',
    name: '智能客服系统 V2.0',
    description: '基于大语言模型的智能客服系统，支持多轮对话、意图识别和知识图谱检索',
    createdAt: '2026-03-01T00:00:00Z',
    retrospectives: [
      {
        id: 'session-001',
        projectId: 'project-001',
        projectName: '智能客服系统 V2.0',
        templateId: 'template-001',
        status: 'completed',
        members: [],
        createdAt: '2026-06-15T09:00:00Z',
        completedAt: '2026-06-15T11:00:00Z',
      },
      {
        id: 'session-002',
        projectId: 'project-001',
        projectName: '智能客服系统 V2.0',
        templateId: 'template-001',
        status: 'completed',
        members: [],
        createdAt: '2026-06-01T09:00:00Z',
        completedAt: '2026-06-01T11:00:00Z',
      },
      {
        id: 'session-003',
        projectId: 'project-001',
        projectName: '智能客服系统 V2.0',
        templateId: 'template-001',
        status: 'active',
        members: [],
        createdAt: '2026-06-20T09:00:00Z',
      },
    ],
  },
  {
    id: 'project-002',
    name: '数据分析平台',
    description: '企业级数据分析和可视化平台，支持实时数据接入、多维度分析和自定义报表',
    createdAt: '2026-04-15T00:00:00Z',
    retrospectives: [
      {
        id: 'session-004',
        projectId: 'project-002',
        projectName: '数据分析平台',
        templateId: 'template-002',
        status: 'completed',
        members: [],
        createdAt: '2026-06-10T14:00:00Z',
        completedAt: '2026-06-10T16:00:00Z',
      },
      {
        id: 'session-005',
        projectId: 'project-002',
        projectName: '数据分析平台',
        templateId: 'template-002',
        status: 'completed',
        members: [],
        createdAt: '2026-05-27T14:00:00Z',
        completedAt: '2026-05-27T16:00:00Z',
      },
    ],
  },
  {
    id: 'project-003',
    name: '移动端电商 App',
    description: '全渠道移动端电商应用，支持商品浏览、购物车、订单管理和支付功能',
    createdAt: '2026-05-01T00:00:00Z',
    retrospectives: [
      {
        id: 'session-006',
        projectId: 'project-003',
        projectName: '移动端电商 App',
        templateId: 'template-001',
        status: 'draft',
        members: [],
        createdAt: '2026-06-18T10:00:00Z',
      },
    ],
  },
];

const statusConfig = {
  draft: { label: '草稿', color: 'bg-gray-500/20 text-gray-400' },
  active: { label: '进行中', color: 'bg-primary-500/20 text-primary-400' },
  completed: { label: '已完成', color: 'bg-emerald-500/20 text-emerald-400' },
};

export default function ProjectList() {
  const { currentUser } = useRetroStore();

  return (
    <div className="min-h-screen bg-grid-pattern">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold font-display mb-1">项目列表</h2>
            <p className="text-white/60 text-sm">欢迎回来，{currentUser.name}</p>
          </div>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            创建新项目
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map((project, index) => {
            const latestRetro = project.retrospectives[0];
            const completedCount = project.retrospectives.filter(
              (r) => r.status === 'completed'
            ).length;

            return (
              <div
                key={project.id}
                className={`glass-card glass-card-hover p-6 fade-in slide-up animate-stagger-${
                  Math.min(index + 1, 8) as 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
                }`}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-400/30 to-primary-600/30 flex items-center justify-center flex-shrink-0">
                    <FolderKanban className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold mb-1 truncate">{project.name}</h3>
                    <p className="text-sm text-white/50 line-clamp-2">{project.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-1.5 text-white/60">
                    <History className="w-4 h-4" />
                    <span>{project.retrospectives.length} 次复盘</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>{completedCount} 次完成</span>
                  </div>
                </div>

                {latestRetro && (
                  <div className="glass-card p-3 mb-4 bg-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/50">最近复盘</span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          statusConfig[latestRetro.status].color
                        }`}
                      >
                        {statusConfig[latestRetro.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-white/70">
                      {format(new Date(latestRetro.createdAt), 'yyyy年MM月dd日', {
                        locale: zhCN,
                      })}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Link
                    to={latestRetro?.status === 'active' ? '/retrospective' : '/history'}
                    className="btn-primary flex-1 py-2 text-sm text-center"
                  >
                    {latestRetro?.status === 'active' ? '继续复盘' : '开始复盘'}
                  </Link>
                  <Link
                    to="/trend"
                    className="btn-secondary px-3 py-2 flex items-center justify-center"
                    title="趋势分析"
                  >
                    <TrendingUp className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
