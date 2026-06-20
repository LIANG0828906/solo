import { useState, useMemo } from 'react';
import type { PourMethod, Vessel, BrewRecord } from '@/types';
import type { TastingNote, LiquorColor, Taste, StarScore } from '@/types';
import StarRating from './StarRating';
import { calculateOverallScore } from '@/data/brewStore';
import { Droplet, Flame, Timer, ThermometerSun } from 'lucide-react';

const VESSELS: { v: Vessel; icon: string; label: string }[] = [
  { v: '盖碗', icon: '🫖', label: '盖碗' },
  { v: '紫砂壶', icon: '🏺', label: '紫砂壶' },
  { v: '玻璃杯', icon: '🥛', label: '玻璃杯' },
  { v: '瓷杯', icon: '🍵', label: '瓷杯' },
];

const POUR_METHODS: PourMethod[] = ['高冲', '低冲', '环绕', '定点'];
const TEMP_PRESETS = [80, 85, 90, 95, 100];

interface Props {
  teaId: string;
  onSubmit: (
    brew: Omit<BrewRecord, 'id' | 'createdAt'>,
    note: Omit<TastingNote, 'id' | 'brewRecordId' | 'overallScore'> & { overallScore: number }
  ) => Promise<void>;
  onCancel: () => void;
}

export default function BrewForm({ teaId, onSubmit, onCancel }: Props) {
  const [temperature, setTemperature] = useState(90);
  const [teaAmount, setTeaAmount] = useState(5.0);
  const [brewTime, setBrewTime] = useState(30);
  const [brewCount, setBrewCount] = useState(1);
  const [pourMethod, setPourMethod] = useState<PourMethod>('高冲');
  const [vessel, setVessel] = useState<Vessel>('盖碗');

  const [dryAroma, setDryAroma] = useState('');
  const [liquorColor, setLiquorColor] = useState<LiquorColor>('金黄');
  const [wetAroma, setWetAroma] = useState('');
  const [taste, setTaste] = useState<Taste>('醇厚');
  const [huiganScore, setHuiganScore] = useState<StarScore>(3);
  const [leafCompleteness, setLeafCompleteness] = useState<StarScore>(3);
  const [leafUniformity, setLeafUniformity] = useState<StarScore>(3);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const overallScore = useMemo(
    () => calculateOverallScore(huiganScore, leafCompleteness, leafUniformity),
    [huiganScore, leafCompleteness, leafUniformity]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(
        {
          teaId,
          temperature,
          teaAmount,
          brewTime,
          brewCount,
          pourMethod,
          vessel,
        },
        {
          dryAroma,
          liquorColor,
          wetAroma,
          taste,
          huiganScore,
          leafCompleteness,
          leafUniformity,
          notes,
          overallScore,
        }
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-wood)' }}>
          <ThermometerSun className="w-4 h-4" />
          冲泡参数
        </h3>
        <div className="space-y-4 pl-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="tea-label mb-0">水温</label>
              <span className="text-sm font-semibold" style={{ color: 'var(--color-tea)' }}>
                {temperature}°C
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={60}
                max={100}
                value={temperature}
                onChange={(e) => setTemperature(parseInt(e.target.value))}
                className="w-full"
                style={{ accentColor: 'var(--color-tea)' }}
              />
              <div className="flex justify-between px-1 mt-1">
                {TEMP_PRESETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTemperature(t)}
                    className="text-xs px-1.5 py-0.5 rounded transition-all duration-200"
                    style={{
                      backgroundColor: temperature === t ? 'var(--color-tea)' : 'transparent',
                      color: temperature === t ? 'white' : 'var(--color-text-light)',
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="tea-label flex items-center gap-1">
                <Droplet className="w-3 h-3" />
                投茶量 (克)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="100"
                className="tea-input"
                value={teaAmount.toFixed(1)}
                onChange={(e) => setTeaAmount(parseFloat(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="tea-label flex items-center gap-1">
                <Timer className="w-3 h-3" />
                时间 (秒)
              </label>
              <input
                type="number"
                min="1"
                className="tea-input"
                value={brewTime}
                onChange={(e) => setBrewTime(parseInt(e.target.value) || 0)}
              />
            </div>
            <div>
              <label className="tea-label">第 N 泡</label>
              <input
                type="number"
                min="1"
                className="tea-input"
                value={brewCount}
                onChange={(e) => setBrewCount(parseInt(e.target.value) || 1)}
              />
            </div>
          </div>

          <div>
            <label className="tea-label mb-2">注水方式</label>
            <div className="flex flex-wrap gap-2">
              {POUR_METHODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPourMethod(m)}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300"
                  style={{
                    backgroundColor: pourMethod === m ? 'var(--color-wood)' : 'white',
                    color: pourMethod === m ? 'white' : 'var(--color-text)',
                    border: `1px solid ${pourMethod === m ? 'var(--color-wood)' : 'var(--color-border)'}`,
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="tea-label mb-2">品鉴容器</label>
            <div className="grid grid-cols-4 gap-2">
              {VESSELS.map(({ v, icon, label }) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVessel(v)}
                  className="py-3 px-2 rounded-lg flex flex-col items-center gap-1 transition-all duration-300"
                  style={{
                    backgroundColor: vessel === v ? 'var(--color-tea)' : 'white',
                    color: vessel === v ? 'white' : 'var(--color-text)',
                    border: `1px solid ${vessel === v ? 'var(--color-tea)' : 'var(--color-border)'}`,
                  }}
                >
                  <span className="text-xl">{icon}</span>
                  <span className="text-xs font-medium">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--color-border)' }} className="pt-5">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--color-wood)' }}>
          <Flame className="w-4 h-4" />
          品鉴笔记
        </h3>
        <div className="space-y-4 pl-2">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="tea-label">干茶香</label>
              <input
                className="tea-input"
                value={dryAroma}
                onChange={(e) => setDryAroma(e.target.value)}
                placeholder="描述干茶的香气"
              />
            </div>
            <div>
              <label className="tea-label">湿茶香</label>
              <input
                className="tea-input"
                value={wetAroma}
                onChange={(e) => setWetAroma(e.target.value)}
                placeholder="描述冲泡后的香气"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="tea-label">汤色</label>
              <select
                className="tea-input"
                value={liquorColor}
                onChange={(e) => setLiquorColor(e.target.value as LiquorColor)}
              >
                {(['金黄', '橙黄', '浅绿', '红褐', '深褐', '其他'] as LiquorColor[]).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="tea-label">滋味</label>
              <select
                className="tea-input"
                value={taste}
                onChange={(e) => setTaste(e.target.value as Taste)}
              >
                {(['甘甜', '苦涩', '醇厚', '鲜爽', '滑润', '其他'] as Taste[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <StarRating label="回甘" value={huiganScore} onChange={setHuiganScore} size={18} />
            <StarRating label="叶底完整度" value={leafCompleteness} onChange={setLeafCompleteness} size={18} />
            <StarRating label="叶底均匀度" value={leafUniformity} onChange={setLeafUniformity} size={18} />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
            <span className="text-sm" style={{ color: 'var(--color-text-light)' }}>综合评分：</span>
            <span
              className="text-2xl font-bold"
              style={{
                fontFamily: 'var(--font-serif)',
                color: overallScore >= 90 ? 'var(--color-tea)' : 'var(--color-wood)',
              }}
            >
              {overallScore}
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text-light)' }}>/ 100 分</span>
          </div>

          <div>
            <label className="tea-label">品鉴笔记</label>
            <textarea
              className="tea-input"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="记录您的感受和心得..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          className="tea-btn tea-btn-secondary"
          onClick={onCancel}
          disabled={submitting}
        >
          取消
        </button>
        <button
          type="submit"
          className="tea-btn tea-btn-tea"
          disabled={submitting}
        >
          {submitting ? '保存中...' : '记录冲泡'}
        </button>
      </div>
    </form>
  );
}
