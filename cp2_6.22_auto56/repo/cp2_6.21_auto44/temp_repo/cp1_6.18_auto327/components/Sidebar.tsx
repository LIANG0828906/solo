import { MapPin, Calendar, TrendingUp } from 'lucide-react';
import { FlavorTagPill } from './FlavorTagPill';
import { buildTagFrequencyMap } from '@/lib/flavorAnalyzer';
import type { RecordLike } from '@/lib/flavorAnalyzer';

interface SidebarProps {
  user: {
    name: string;
    avatarUrl: string;
  };
  records: RecordLike[];
}

export function Sidebar({ user, records }: SidebarProps) {
  const tagFreq = buildTagFrequencyMap(records);
  const totalRecords = records.length;
  const avgRating = totalRecords > 0
    ? (records.reduce((sum, r) => sum + r.rating, 0) / totalRecords).toFixed(1)
    : '0.0';

  const tags = Array.from(tagFreq.entries()).sort((a, b) => b[1].count - a[1].count);
  const maxCount = tags.length > 0 ? Math.max(...tags.map(([, v]) => v.count)) : 1;

  return (
    <aside className="hidden md:flex w-[300px] flex-col gap-6 fixed left-0 top-16 bottom-0 p-6 overflow-y-auto">
      <div className="glass-card p-6 text-center">
        <div className="relative inline-block mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-400/30 to-orange-500/30 blur-xl" />
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="relative w-24 h-24 rounded-full border-2 border-yellow-400/40 bg-[#16213E] object-cover"
          />
          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 border-2 border-[#16213E] flex items-center justify-center">
            <span className="text-xs">☕</span>
          </div>
        </div>
        <h3 className="font-display text-xl font-semibold text-white mb-1">{user.name}</h3>
        <p className="text-sm text-white/50 flex items-center justify-center gap-1">
          <MapPin className="w-3 h-3" />
          风味探索中
        </p>
      </div>

      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-yellow-400" />
          品鉴统计
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="font-display text-2xl font-bold text-yellow-400">{totalRecords}</div>
            <div className="text-xs text-white/50 mt-1 flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3" /> 总记录
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-white/5">
            <div className="font-display text-2xl font-bold text-orange-400">{avgRating}</div>
            <div className="text-xs text-white/50 mt-1">平均评分</div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5">
        <h4 className="text-sm font-semibold text-white/70 uppercase tracking-wider mb-4">
          风味标签云
        </h4>
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 && (
            <p className="text-sm text-white/40">暂无标签数据，快去记录第一杯咖啡吧！</p>
          )}
          {tags.map(([name, { count, color }]) => {
            const intensity = 0.6 + (count / maxCount) * 0.4;
            const fontSize = 0.75 + (count / maxCount) * 0.5;
            return (
              <div
                key={name}
                className="flavor-pill px-3 py-1.5 text-white cursor-default"
                style={{
                  backgroundColor: color,
                  opacity: intensity,
                  fontSize: `${fontSize}rem`,
                }}
              >
                <span className="font-medium">{name}</span>
                <span className="ml-1.5 opacity-80 text-[10px] bg-white/20 px-1.5 rounded-full">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-5 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>探索风味</span>
            <span className="font-medium text-white/70">{tags.length}/8</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-700"
              style={{ width: `${(tags.length / 8) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-auto text-center text-xs text-white/30 pb-2">
        <p>品味生活 · 记录每一杯</p>
      </div>
    </aside>
  );
}
