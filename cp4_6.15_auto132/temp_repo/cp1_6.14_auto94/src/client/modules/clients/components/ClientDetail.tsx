import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from 'recharts';
import { ArrowLeft, Save } from 'lucide-react';
import api from '@/client/shared/api/client';
import type { AxiosResponse } from 'axios';
import type { Client, BaselineScores, GoalType, LocationType } from '@/shared/types';
import { BASELINE_QUESTIONS } from '@/shared/types';

const GOAL_LABELS: Record<GoalType, string> = { muscle: '增肌', 'fat-loss': '减脂', maintain: '维持' };
const LOCATION_LABELS: Record<LocationType, string> = { home: '居家', gym: '健身房' };

function baselineToRadar(scores: BaselineScores) {
  return [
    { axis: '深蹲', value: scores.squat, fullMark: 100 },
    { axis: '俯卧撑', value: scores.pushup, fullMark: 100 },
    { axis: '平板支撑', value: scores.plank, fullMark: 100 },
    { axis: '柔韧性', value: scores.flexibility, fullMark: 10 },
    { axis: '耐力', value: scores.endurance, fullMark: 10 },
  ];
}

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [scores, setScores] = useState<BaselineScores>({ squat: 0, pushup: 0, plank: 0, flexibility: 0, endurance: 0 });
  const [saving, setSaving] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.get<Client>(`/clients/${id}`)
      .then((res: AxiosResponse<Client>) => {
        setClient(res.data);
        setScores(res.data.baselineScores);
      })
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (client) {
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 800);
      return () => clearTimeout(t);
    }
  }, [client]);

  const handleScoreChange = useCallback((key: keyof BaselineScores, value: number) => {
    setScores(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await api.put(`/clients/${id}`, { baselineScores: scores });
      setClient(prev => prev ? { ...prev, baselineScores: scores } : null);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  if (!client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const radarData = baselineToRadar(scores);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition"
      >
        <ArrowLeft className="w-4 h-4" /> 返回
      </button>

      <div className="card flex items-center gap-5">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-300 flex items-center justify-center text-white font-bold text-2xl shrink-0">
          {client.name[0]}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{client.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span>{client.age}岁</span>
            <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-600 font-medium">
              {GOAL_LABELS[client.goal]}
            </span>
            <span>{LOCATION_LABELS[client.location]}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">基线评估</h2>
          <div
            className="flex justify-center"
            style={animating ? { animation: 'radarSpring 0.8s ease-out forwards' } : undefined}
          >
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="axis" tick={{ fill: '#6b7280', fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                <Radar
                  name="评分"
                  dataKey="value"
                  stroke="#FF6B35"
                  fill="url(#orangeGradient)"
                  fillOpacity={0.7}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
                <defs>
                  <radialGradient id="orangeGradient" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FF6B35" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#ff3d00" stopOpacity={0.4} />
                  </radialGradient>
                </defs>
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-800">评分调整</h2>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition disabled:opacity-50 text-sm font-medium"
            >
              <Save className="w-4 h-4" /> {saving ? '保存中...' : '保存'}
            </button>
          </div>
          <div className="space-y-5">
            {BASELINE_QUESTIONS.map(q => {
              const key = q.key as keyof BaselineScores;
              const maxVal = (key === 'flexibility' || key === 'endurance') ? 10 : 100;
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium text-gray-700">{q.label}</label>
                    <span className="text-sm font-bold text-orange-600">{scores[key]}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">{q.description}</p>
                  <input
                    type="range"
                    min={0} max={maxVal}
                    value={scores[key]}
                    onChange={e => handleScoreChange(key, Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
