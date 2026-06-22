import { useState } from 'react';
import { Briefcase, GraduationCap, Dumbbell, Star, AlertTriangle } from 'lucide-react';
import { TaskType } from '@/utils/storage';
import { useTaskStore } from '@/store';

const types: { key: TaskType; label: string; icon: typeof Briefcase; color: string; activeBg: string }[] = [
  { key: 'work', label: '工作', icon: Briefcase, color: 'text-blue-400', activeBg: 'bg-blue-500/20 border-blue-400/50 text-blue-200' },
  { key: 'study', label: '学习', icon: GraduationCap, color: 'text-green-400', activeBg: 'bg-green-500/20 border-green-400/50 text-green-200' },
  { key: 'exercise', label: '运动', icon: Dumbbell, color: 'text-orange-400', activeBg: 'bg-orange-500/20 border-orange-400/50 text-orange-200' },
];

interface TaskFormProps {
  showAlert?: boolean;
}

export default function TaskForm({ showAlert }: TaskFormProps) {
  const { input, setInput } = useTaskStore();
  const [focused, setFocused] = useState(false);

  return (
    <div className={`glass rounded-2xl p-5 w-full transition-all duration-300 ${showAlert ? 'ring-2 ring-red-400/50 shake' : ''}`} style={showAlert ? { animation: 'shake 0.4s ease' } : undefined}>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>

      {showAlert && (
        <div className="flex items-center gap-2 text-red-300 text-sm mb-3 pb-3 border-b border-white/10">
          <AlertTriangle size={16} />
          请先输入任务名称再开始番茄钟
        </div>
      )}

      <div className="mb-4">
        <label className="block text-xs text-slate-400 mb-2 tracking-wide">任务名称 *</label>
        <input
          type="text"
          value={input.taskName}
          onChange={(e) => setInput({ ...input, taskName: e.target.value })}
          placeholder="例如：写项目文档、阅读第3章..."
          maxLength={40}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`w-full bg-black/25 border rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 ${
            focused ? 'border-indigo-400/60 bg-black/40 shadow-lg shadow-indigo-500/10' : 'border-white/10 hover:border-white/20'
          }`}
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs text-slate-400 mb-2 tracking-wide">任务描述</label>
        <textarea
          value={input.taskDescription}
          onChange={(e) => setInput({ ...input, taskDescription: e.target.value })}
          placeholder="简要描述一下你要做什么..."
          maxLength={200}
          rows={2}
          className="w-full bg-black/25 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 text-sm outline-none transition-all duration-200 hover:border-white/20 focus:border-indigo-400/60 focus:bg-black/40 resize-none"
        />
      </div>

      <div className="mb-4">
        <label className="block text-xs text-slate-400 mb-2 tracking-wide">任务类型</label>
        <div className="grid grid-cols-3 gap-2">
          {types.map((t) => {
            const Icon = t.icon;
            const active = input.taskType === t.key;
            return (
              <button
                key={t.key}
                onClick={() => setInput({ ...input, taskType: t.key })}
                className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-sm font-medium transition-all duration-200 ${
                  active
                    ? `${t.activeBg} shadow-md scale-[1.02]`
                    : 'bg-black/20 border-white/10 text-slate-400 hover:border-white/20 hover:text-slate-200'
                }`}
              >
                <Icon size={15} className={active ? t.color : ''} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs text-slate-400 mb-2 tracking-wide flex items-center justify-between">
          <span>心情评分</span>
          <span className="text-yellow-300 flex items-center gap-0.5">
            {Array.from({ length: input.moodScore }).map((_, i) => (
              <Star key={i} size={13} fill="currentColor" />
            ))}
            {Array.from({ length: 5 - input.moodScore }).map((_, i) => (
              <Star key={i} size={13} className="text-slate-600" />
            ))}
          </span>
        </label>
        <div className="flex items-center gap-2">
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={input.moodScore}
            onChange={(e) => setInput({ ...input, moodScore: Number(e.target.value) })}
            className="flex-1 appearance-none h-1.5 rounded-full bg-white/10 outline-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #facc15 0%, #facc15 ${(input.moodScore - 1) * 25}%, rgba(255,255,255,0.1) ${(input.moodScore - 1) * 25}%, rgba(255,255,255,0.1) 100%)`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] text-slate-500">
          <span>😕 一般</span>
          <span>😊 很好</span>
        </div>
      </div>
    </div>
  );
}
