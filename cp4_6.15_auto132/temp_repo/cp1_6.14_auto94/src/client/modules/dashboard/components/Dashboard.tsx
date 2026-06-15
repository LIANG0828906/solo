import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarCheck, TrendingUp, ClipboardList, Plus, FileText, BarChart3 } from 'lucide-react';
import api from '@/client/shared/api/client';
import { cn } from '@/client/shared/utils/cn';
import type { AxiosResponse } from 'axios';

interface DashboardData {
  totalClients: number;
  todaySessions: number;
  weeklyCompletionRate: number;
  activePlans: number;
  recentActivity: { clientId: string; clientName: string; action: string; time: string }[];
}

const STAT_CARDS = [
  { key: 'totalClients' as const, label: '总客户数', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'todaySessions' as const, label: '今日训练', icon: CalendarCheck, color: 'text-green-600', bg: 'bg-green-50' },
  { key: 'weeklyCompletionRate' as const, label: '周完成率', icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-50', suffix: '%' },
  { key: 'activePlans' as const, label: '进行中计划', icon: ClipboardList, color: 'text-purple-600', bg: 'bg-purple-50' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<DashboardData>('/dashboard')
      .then((res: AxiosResponse<DashboardData>) => setData(res.data))
      .catch(() => {
        setData({
          totalClients: 12,
          todaySessions: 4,
          weeklyCompletionRate: 78,
          activePlans: 8,
          recentActivity: [
            { clientId: '1', clientName: '张三', action: '完成了今日训练', time: '10分钟前' },
            { clientId: '2', clientName: '李四', action: '提交了自我评估', time: '30分钟前' },
            { clientId: '3', clientName: '王五', action: '更新了基线评分', time: '1小时前' },
            { clientId: '1', clientName: '张三', action: '开始新训练计划', time: '2小时前' },
          ],
        });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 p-8 text-white">
        <h1 className="text-2xl font-bold">欢迎回来，教练</h1>
        <p className="mt-1 text-white/80">今天有 {data.todaySessions} 位客户安排了训练</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map(card => {
          const Icon = card.icon;
          const val = data[card.key];
          return (
            <div key={card.key} className="card flex items-center gap-4" style={{ animation: 'fadeInUp 0.4s ease-out' }}>
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', card.bg)}>
                <Icon className={cn('w-6 h-6', card.color)} />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-800">
                  {val}{card.suffix ?? ''}
                </div>
                <div className="text-sm text-gray-500">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" /> 最近动态
          </h2>
          <div className="space-y-3">
            {data.recentActivity.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/clients/${item.clientId}`)}
                style={{ animation: `fadeInUp 0.4s ease-out ${i * 80}ms both` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-sm font-medium text-orange-600">
                    {item.clientName[0]}
                  </div>
                  <div>
                    <span className="font-medium text-gray-800">{item.clientName}</span>
                    <span className="text-gray-500 ml-2">{item.action}</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-gray-800">快捷操作</h2>
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors font-medium"
          >
            <Plus className="w-5 h-5" /> 新建客户
          </button>
          <button
            onClick={() => navigate('/exercises')}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors font-medium"
          >
            <FileText className="w-5 h-5" /> 创建计划
          </button>
          <button
            onClick={() => navigate('/clients')}
            className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors font-medium"
          >
            <BarChart3 className="w-5 h-5" /> 查看周报
          </button>
        </div>
      </div>
    </div>
  );
}
