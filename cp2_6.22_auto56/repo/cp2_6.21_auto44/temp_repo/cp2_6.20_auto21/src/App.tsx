import { BrowserRouter as Router, Routes, Route, useParams } from 'react-router-dom';
import Home from '@/pages/Home';
import RetrospectModule from '@/features/retrospect/RetrospectModule';
import ActionBoard from '@/components/ui/ActionBoard';
import TrendRadar from '@/components/charts/TrendRadar';
import { useRetroStore } from '@/store/useRetroStore';
import { ArrowLeft, BarChart3, ListTodo } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { RadarSeries, TeamMember } from '@/types';
import { useState } from 'react';

const RetrospectPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { actionItems, currentSession, updateActionStatus, addActionItem } = useRetroStore();
  const [activeTab, setActiveTab] = useState<'retrospect' | 'actions'>('retrospect');

  const members = currentSession?.members ?? [];

  return (
    <div className="h-screen flex flex-col bg-dark-500">
      <header className="glass-card border-b border-white/10 px-6 py-3 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {currentSession?.projectName || '电商平台重构项目'}
            </h1>
            <p className="text-xs text-white/40">复盘会议</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-dark-400/50 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('retrospect')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'retrospect'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <BarChart3 size={16} />
            复盘讨论
          </button>
          <button
            onClick={() => setActiveTab('actions')}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
              activeTab === 'actions'
                ? 'bg-primary-500 text-white shadow-lg'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <ListTodo size={16} />
            行动项看板
          </button>
        </div>
        <div className="flex items-center gap-2">
          {members.slice(0, 4).map((member: TeamMember, index: number) => (
            <div
              key={member.id}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center border-2 border-dark-500"
              style={{ marginLeft: index > 0 ? '-8px' : '0', zIndex: 4 - index }}
            >
              <span className="text-xs font-medium text-white">
                {member.name.charAt(0)}
              </span>
            </div>
          ))}
          {members.length > 4 && (
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border-2 border-dark-500">
              <span className="text-xs font-medium text-white/60">
                +{members.length - 4}
              </span>
            </div>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        {activeTab === 'retrospect' ? (
          <RetrospectModule />
        ) : (
          <div className="h-full p-6">
            <ActionBoard
              actionItems={actionItems}
              members={members}
              onStatusChange={updateActionStatus}
              onAddAction={addActionItem}
              isHost={true}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const HistoryPage = () => {
  const navigate = useNavigate();
  const [series, setSeries] = useState<RadarSeries[]>([
    {
      name: '2026年6月复盘',
      sessionId: 'session-001',
      color: '#00bcd4',
      visible: true,
      data: [
        { dimension: '沟通效率', value: 4.2 },
        { dimension: '目标达成', value: 3.8 },
        { dimension: '时间管理', value: 3.5 },
        { dimension: '质量把控', value: 4.0 },
        { dimension: '团队协作', value: 4.5 },
      ],
    },
    {
      name: '2026年5月复盘',
      sessionId: 'session-002',
      color: '#ff9800',
      visible: true,
      data: [
        { dimension: '沟通效率', value: 3.5 },
        { dimension: '目标达成', value: 3.2 },
        { dimension: '时间管理', value: 3.0 },
        { dimension: '质量把控', value: 3.6 },
        { dimension: '团队协作', value: 4.0 },
      ],
    },
    {
      name: '2026年4月复盘',
      sessionId: 'session-003',
      color: '#4caf50',
      visible: false,
      data: [
        { dimension: '沟通效率', value: 3.0 },
        { dimension: '目标达成', value: 2.8 },
        { dimension: '时间管理', value: 2.5 },
        { dimension: '质量把控', value: 3.2 },
        { dimension: '团队协作', value: 3.5 },
      ],
    },
  ]);

  const handleToggleSeries = (sessionId: string) => {
    setSeries((prev) =>
      prev.map((s) =>
        s.sessionId === sessionId ? { ...s, visible: !s.visible } : s
      )
    );
  };

  return (
    <div className="min-h-screen bg-dark-500 bg-grid-pattern">
      <header className="glass-card border-b border-white/10 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">趋势分析</h1>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="glass-card p-8">
          <h2 className="text-lg font-semibold text-white mb-6">团队效能趋势对比</h2>
          <div className="flex justify-center">
            <TrendRadar
              series={series}
              width={600}
              height={500}
              onToggleSeries={handleToggleSeries}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { templates } = useRetroStore();

  return (
    <div className="min-h-screen bg-dark-500 bg-grid-pattern">
      <header className="glass-card border-b border-white/10 px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-white">模板管理</h1>
          </div>
          <button className="btn-primary">创建新模板</button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template, index) => (
            <div
              key={template.id}
              className="glass-card glass-card-hover p-6 cursor-pointer fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate('/retrospect/session-001')}
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {template.name}
              </h3>
              <p className="text-sm text-white/50 mb-4">{template.description}</p>
              <div className="flex flex-wrap gap-2">
                {template.phases.map((phase) => (
                  <span
                    key={phase.id}
                    className="text-xs px-2 py-1 rounded-full bg-primary-500/20 text-primary-300"
                  >
                    {phase.name}
                  </span>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs text-white/40">
                  {template.phases.reduce((acc, p) => acc + p.questions.length, 0)} 个问题
                </span>
                <span className="text-xs text-white/40">
                  {new Date(template.updatedAt).toLocaleDateString('zh-CN')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/retrospect/:id" element={<RetrospectPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route
          path="/team"
          element={
            <div className="min-h-screen bg-dark-500 flex items-center justify-center">
              <p className="text-white/50 text-lg">团队成员管理 - 开发中</p>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
