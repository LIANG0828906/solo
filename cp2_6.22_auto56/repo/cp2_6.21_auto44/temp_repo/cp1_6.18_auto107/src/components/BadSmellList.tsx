import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import BadSmellCard from './BadSmellCard';
import { useAppStore } from '@/store';

export default function BadSmellList() {
  const badSmells = useAppStore((s) => s.analysisResult.badSmells);

  const highCount = badSmells.filter((b) => b.severity === 'high').length;
  const mediumCount = badSmells.filter((b) => b.severity === 'medium').length;
  const lowCount = badSmells.filter((b) => b.severity === 'low').length;

  if (badSmells.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <p className="text-slate-400 text-lg">暂未检测到代码坏味道</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
        <div className="flex items-center gap-2 text-white font-semibold">
          <span>检测结果</span>
          <span className="text-sm text-slate-400 font-normal">
            共 {badSmells.length} 个问题
          </span>
        </div>
        <div className="flex-1" />
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <AlertTriangle size={14} className="text-red-400" />
            <span className="text-slate-300">严重</span>
            <span className="text-red-400 font-semibold min-w-[20px]">
              {highCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <AlertCircle size={14} className="text-amber-400" />
            <span className="text-slate-300">中等</span>
            <span className="text-amber-400 font-semibold min-w-[20px]">
              {mediumCount}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <Info size={14} className="text-emerald-400" />
            <span className="text-slate-300">低</span>
            <span className="text-emerald-400 font-semibold min-w-[20px]">
              {lowCount}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        {badSmells.map((smell, index) => (
          <BadSmellCard key={smell.id} smell={smell} index={index} />
        ))}
      </div>
    </div>
  );
}
