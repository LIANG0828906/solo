import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, MapPin, Target } from 'lucide-react';
import api from '@/client/shared/api/client';
import { cn } from '@/client/shared/utils/cn';
import type { AxiosResponse } from 'axios';
import type { Client, GoalType, LocationType } from '@/shared/types';

const GOAL_LABELS: Record<GoalType, string> = {
  muscle: '增肌', 'fat-loss': '减脂', maintain: '维持',
};
const GOAL_COLORS: Record<GoalType, string> = {
  muscle: 'bg-red-100 text-red-600', 'fat-loss': 'bg-green-100 text-green-600', maintain: 'bg-blue-100 text-blue-600',
};
const LOCATION_LABELS: Record<LocationType, string> = { home: '居家', gym: '健身房' };

const EMPTY_FORM = { name: '', age: 18, goal: 'muscle' as GoalType, location: 'home' as LocationType };

export default function ClientList() {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<Client[]>('/clients')
      .then((res: AxiosResponse<Client[]>) => setClients(res.data))
      .catch(() => setClients([]));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(q));
  }, [clients, search]);

  const handleSubmit = async () => {
    if (!form.name.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post<Client>('/clients', {
        ...form,
        baselineScores: { squat: 0, pushup: 0, plank: 0, flexibility: 0, endurance: 0 },
      });
      setClients(prev => [...prev, res.data]);
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch {
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">客户管理</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" /> 新建客户
        </button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="搜索客户..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none transition"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client, i) => (
          <div
            key={client.id}
            className="card cursor-pointer group"
            onClick={() => navigate(`/clients/${client.id}`)}
            style={{ animation: `fadeInUp 0.4s ease-out ${i * 60}ms both` }}
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-white font-bold text-lg shrink-0">
                {client.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800 truncate">{client.name}</h3>
                  <span className="text-sm text-gray-400">{client.age}岁</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', GOAL_COLORS[client.goal])}>
                    <Target className="w-3 h-3 inline mr-1" />{GOAL_LABELS[client.goal]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                    <MapPin className="w-3 h-3 inline mr-1" />{LOCATION_LABELS[client.location]}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-400">暂无客户数据</div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">新建客户</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">姓名</label>
                <input
                  type="text" value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">年龄</label>
                <input
                  type="number" value={form.age} min={10} max={100}
                  onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-100 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">目标</label>
                <select
                  value={form.goal}
                  onChange={e => setForm(f => ({ ...f, goal: e.target.value as GoalType }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 outline-none"
                >
                  <option value="muscle">增肌</option>
                  <option value="fat-loss">减脂</option>
                  <option value="maintain">维持</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">训练地点</label>
                <select
                  value={form.location}
                  onChange={e => setForm(f => ({ ...f, location: e.target.value as LocationType }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-400 outline-none"
                >
                  <option value="home">居家</option>
                  <option value="gym">健身房</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">取消</button>
              <button
                onClick={handleSubmit} disabled={submitting || !form.name.trim()}
                className="flex-1 py-2 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition disabled:opacity-50"
              >
                {submitting ? '创建中...' : '创建'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
