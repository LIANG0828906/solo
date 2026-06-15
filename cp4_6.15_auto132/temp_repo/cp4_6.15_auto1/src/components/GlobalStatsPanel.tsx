import { useStore } from '@/store';
import AnimatedNumber from './AnimatedNumber';
import { FileText, TrendingUp, Award, Hash } from 'lucide-react';

export default function GlobalStatsPanel() {
  const getGlobalStats = useStore((s) => s.getGlobalStats);
  const stats = getGlobalStats();

  const items = [
    { icon: FileText, label: '提交总数', value: stats.totalSubmissions, decimals: 0, color: 'from-[#00897b] to-[#00695c]' },
    { icon: TrendingUp, label: '平均分', value: stats.averageScore, decimals: 1, color: 'from-[#26a69a] to-[#00897b]' },
    { icon: Award, label: '最高分', value: stats.highestScore, decimals: 1, color: 'from-[#4db6ac] to-[#26a69a]' },
    { icon: Hash, label: '最低分', value: stats.lowestScore, decimals: 1, color: 'from-[#80cbc4] to-[#4db6ac]' },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {items.map((item) => (
        <div
          key={item.label}
          className="relative overflow-hidden rounded-xl bg-white shadow-sm border border-[#b2dfdb]/40 p-4 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5"
        >
          <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl ${item.color} opacity-5 rounded-bl-full`} />
          <div className="flex items-center gap-2 mb-2">
            <item.icon size={16} className="text-[#00695c]" />
            <span className="text-xs text-[#546e7a]">{item.label}</span>
          </div>
          <div className="text-2xl font-bold text-[#00695c]">
            <AnimatedNumber value={item.value} decimals={item.decimals} />
          </div>
        </div>
      ))}
    </div>
  );
}
