import { useState, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { Star, Sliders, Heart, AlertTriangle, Check, Sparkles } from 'lucide-react';
import type { SelfAssessment } from '../../../../shared/types';

const MUSCLE_AREAS = [
  { key: '胸部', emoji: '💪' },
  { key: '背部', emoji: '🔙' },
  { key: '肩部', emoji: '🦾' },
  { key: '手臂', emoji: '💪' },
  { key: '核心', emoji: '🎯' },
  { key: '腿部', emoji: '🦵' },
  { key: '臀部', emoji: '🍑' },
] as const;

export default function SelfAssessmentPage() {
  const { clientId } = useParams<{ clientId?: string }>();
  const navigate = useNavigate();
  const actualClientId = clientId ?? 'client-1';

  const [sleepRating, setSleepRating] = useState(0);
  const [hoverSleep, setHoverSleep] = useState(0);
  const [soreAreas, setSoreAreas] = useState<string[]>([]);
  const [energyLevel, setEnergyLevel] = useState(5);
  const [bouncingStars, setBouncingStars] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [adjustmentResult, setAdjustmentResult] = useState<{ notes: string[]; planChanged: boolean } | null>(null);

  const handleSleepClick = (rating: number) => {
    setSleepRating(rating);
    setBouncingStars(prev => [...prev, rating]);
    setTimeout(() => {
      setBouncingStars(prev => prev.filter(s => s !== rating));
    }, 650);
  };

  const toggleSoreArea = (area: string) => {
    setSoreAreas(prev =>
      prev.includes(area) ? prev.filter(a => a !== area) : [...prev, area]
    );
  };

  const canSubmit = sleepRating > 0;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);

    const assessment: SelfAssessment = {
      sleepQuality: sleepRating,
      soreAreas,
      energyLevel,
    };

    try {
      await axios.post('/api/sessions/self-assessment', {
        clientId: actualClientId,
        selfAssessment: assessment,
        date: new Date().toISOString().split('T')[0],
      });

      try {
        const todayIndex = ((new Date().getDay() + 6) % 7);
        const planRes = await axios.get(`/api/trainingPlans/${actualClientId}`);
        if (planRes?.data?.id) {
          const adjRes = await axios.put(`/api/trainingPlans/${planRes.data.id}/adjust`, {
            selfAssessment: assessment,
            dayIndex: todayIndex,
          });
          if (adjRes?.data) {
            setAdjustmentResult({
              notes: adjRes.data.modificationNotes ?? [],
              planChanged: (adjRes.data.modificationNotes ?? []).length > 0,
            });
          }
        }
      } catch { /* ignore adjustment errors */ }

      setSubmitted(true);
    } catch {
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }, [sleepRating, soreAreas, energyLevel, submitting, canSubmit, actualClientId]);

  const adjustmentHint = useMemo(() => {
    const hints: { type: 'increase' | 'decrease' | 'neutral'; text: string }[] = [];
    if (soreAreas.length > 0) {
      hints.push({ type: 'decrease', text: `${soreAreas.join('、')}部位训练量将减少20-40%` });
    }
    if (sleepRating < 3) {
      hints.push({ type: 'decrease', text: '睡眠不足，训练强度适当降低' });
    }
    if (energyLevel > 7) {
      hints.push({ type: 'increase', text: '精力充沛，训练强度将提升10-20%' });
    } else if (energyLevel < 4) {
      hints.push({ type: 'decrease', text: '能量不足，整体训练量减少30%' });
    }
    if (hints.length === 0) {
      hints.push({ type: 'neutral', text: '状态良好，按原计划训练' });
    }
    return hints;
  }, [soreAreas, sleepRating, energyLevel]);

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto p-6 min-h-screen flex items-center justify-center">
        <div className="card text-center w-full animate-fade-in">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mb-5 shadow-lg shadow-green-500/30">
            <Check size={38} className="text-white" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">自评完成 ✨</h2>
          <p className="text-gray-500 mb-6">已记录您的今日状态</p>

          {adjustmentResult && (
            <div className={`rounded-2xl p-5 mb-6 text-left ${
              adjustmentResult.planChanged
                ? 'bg-orange-50 border border-orange-200'
                : 'bg-green-50 border border-green-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={18} className={adjustmentResult.planChanged ? 'text-orange-500' : 'text-green-500'} />
                <h3 className={`font-semibold ${adjustmentResult.planChanged ? 'text-orange-700' : 'text-green-700'}`}>
                  {adjustmentResult.planChanged ? '今日训练计划已智能调整' : '状态良好，保持原计划'}
                </h3>
              </div>
              {adjustmentResult.notes.length > 0 ? (
                <ul className="space-y-2">
                  {adjustmentResult.notes.map((note, i) => (
                    <li
                      key={i}
                      className="text-sm animate-fade-in flex items-start gap-2"
                      style={{ animationDelay: `${i * 80}ms` }}
                    >
                      <span className={`inline-block mt-1 w-2 h-2 rounded-full shrink-0 ${
                        note.includes('减少') ? 'bg-red-400' : note.includes('增加') ? 'bg-green-400' : 'bg-blue-400'
                      }`} />
                      <span className={
                        note.includes('减少') ? 'text-red-700' : note.includes('增加') ? 'text-green-700' : 'text-gray-600'
                      }>{note}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-600">训练计划无需调整，加油！</p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <button
              className="btn-ghost"
              onClick={() => navigate('/')}
            >
              返回首页
            </button>
            <button
              className="btn-primary"
              onClick={() => navigate('/daily-session')}
            >
              开始训练
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto p-4 md:p-6 pb-32">
      <div className="text-center mb-8 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">🌅 今日准备</h1>
        <p className="text-gray-500">告诉我们您今天的状态，我们将智能调整训练计划</p>
      </div>

      <div className="card mb-5 animate-fade-in-delay-1">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
            <Star size={22} className="text-blue-500 fill-blue-200" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">昨晚睡眠质量</h3>
            <p className="text-xs text-gray-500">点击星星评分</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 py-2">
          {[1, 2, 3, 4, 5].map(rating => {
            const active = rating <= (hoverSleep || sleepRating);
            const isBouncing = bouncingStars.includes(rating);
            return (
              <button
                key={rating}
                onClick={() => handleSleepClick(rating)}
                onMouseEnter={() => setHoverSleep(rating)}
                onMouseLeave={() => setHoverSleep(0)}
                className="group relative p-2 transition-transform"
              >
                <Star
                  size={44}
                  className={`transition-all duration-200 ${
                    active
                      ? 'text-amber-400 fill-amber-300'
                      : 'text-gray-200 group-hover:text-amber-200'
                  } ${isBouncing ? 'animate-star-bounce' : ''}`}
                  strokeWidth={active ? 0 : 2}
                />
                <span className="sr-only">{rating}星</span>
              </button>
            );
          })}
        </div>

        <div className="text-center mt-4">
          <span className="inline-block px-3 py-1 rounded-full bg-gray-50 text-gray-500 text-sm font-medium">
            {sleepRating === 0 ? '请选择评分' : sleepRating <= 2 ? '😴 睡得不太好' : sleepRating <= 3 ? '😐 睡得一般' : sleepRating <= 4 ? '🙂 睡得不错' : '🤩 非常好'}
          </span>
        </div>
      </div>

      <div className="card mb-5 animate-fade-in-delay-2">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-red-50 flex items-center justify-center">
            <AlertTriangle size={22} className="text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">肌肉酸痛部位</h3>
            <p className="text-xs text-gray-500">可多选，酸痛部位将降低训练强度</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {MUSCLE_AREAS.map(area => {
            const selected = soreAreas.includes(area.key);
            return (
              <button
                key={area.key}
                onClick={() => toggleSoreArea(area.key)}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ease-out ${
                  selected
                    ? 'bg-red-500 text-white shadow-md shadow-red-500/30 scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 active:scale-95'
                }`}
              >
                <span className="mr-1.5">{area.emoji}</span>
                {area.key}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card mb-6 animate-fade-in-delay-3">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">
            <Sliders size={22} className="text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">今日可用精力</h3>
            <p className="text-xs text-gray-500">1分疲惫，10分充满活力</p>
          </div>
        </div>

        <div className="px-2">
          <div className="relative mb-6">
            <input
              type="range"
              min={1}
              max={10}
              value={energyLevel}
              onChange={(e) => setEnergyLevel(Number(e.target.value))}
              className="w-full h-3 rounded-full appearance-none cursor-pointer accent-orange-500"
              style={{
                background: `linear-gradient(to right, #ef4444 0%, #f59e0b 40%, #22c55e 100%)`,
                WebkitAppearance: 'none',
              }}
            />
            <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-400 px-0.5 pointer-events-none">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          <div className="flex items-center justify-between mt-8">
            <div className="flex items-center gap-2">
              <Heart className={`${energyLevel < 4 ? 'text-red-500' : energyLevel > 7 ? 'text-green-500 animate-pulse' : 'text-amber-500'}`} size={22} fill="currentColor" />
              <span className={`font-bold text-lg ${
                energyLevel < 4 ? 'text-red-600' : energyLevel > 7 ? 'text-green-600' : 'text-amber-600'
              }`}>
                {energyLevel}分
              </span>
            </div>
            <span className={`badge ${
              energyLevel < 4 ? 'badge-red' : energyLevel > 7 ? 'badge-green' : 'badge-orange'
            }`}>
              {energyLevel < 4 ? '需要休息' : energyLevel > 7 ? '状态爆棚' : '中规中矩'}
            </span>
          </div>
        </div>
      </div>

      <div className="card mb-8 animate-fade-in-delay-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <Sparkles size={16} className="text-orange-500" />
          智能调整预览
        </h4>
        <ul className="space-y-2">
          {adjustmentHint.map((hint, i) => (
            <li
              key={i}
              className={`flex items-center gap-2 text-sm p-2.5 rounded-lg transition-all ${
                hint.type === 'increase'
                  ? 'bg-green-50 text-green-700'
                  : hint.type === 'decrease'
                  ? 'bg-red-50 text-red-700'
                  : 'bg-gray-50 text-gray-600'
              }`}
            >
              <span className="text-base">{hint.type === 'increase' ? '📈' : hint.type === 'decrease' ? '📉' : '✅'}</span>
              {hint.text}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="btn-primary w-full py-3.5 text-base fixed bottom-6 left-4 right-4 max-w-lg mx-auto shadow-xl"
      >
        {submitting ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            处理中...
          </>
        ) : (
          <>
            <Check size={18} strokeWidth={3} />
            提交自评并生成训练
          </>
        )}
      </button>
    </div>
  );
}
