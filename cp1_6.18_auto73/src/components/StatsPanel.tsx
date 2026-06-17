import { useAppStore } from '@/store/appStore';
import { useEffect, useState } from 'react';
import { Lightbulb, Link2, Sparkles } from 'lucide-react';

export default function StatsPanel() {
  const cards = useAppStore(s => s.cards);
  const relations = useAppStore(s => s.relations);

  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = cards.filter(c => c.createdAt >= todayStart.getTime()).length;

  return (
    <div className="relative flex items-center justify-center gap-8 px-6 py-3 border-t border-[#2A2A44] overflow-hidden">
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundSize: '128px 128px',
        }}
      />

      <div
        className={`flex items-center gap-2 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        <Lightbulb size={16} className="text-[#FFD93D]" />
        <div>
          <div className="font-display font-bold text-[36px] leading-none text-[#FFD93D]">
            {cards.length}
          </div>
          <div className="text-[10px] text-[#9999AA] mt-0.5">灵感总数</div>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 transition-all duration-500 delay-100 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        <Link2 size={16} className="text-[#4ECDC4]" />
        <div>
          <div className="font-display font-semibold text-[20px] leading-none text-[#4ECDC4]">
            {relations.length}
          </div>
          <div className="text-[10px] text-[#9999AA] mt-0.5">关联数量</div>
        </div>
      </div>

      <div
        className={`flex items-center gap-2 transition-all duration-500 delay-200 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
      >
        <Sparkles size={16} className="text-[#6BCB77]" />
        <div>
          <div className="font-display font-medium text-[16px] leading-none text-[#6BCB77]">
            {todayCount}
          </div>
          <div className="text-[10px] text-[#9999AA] mt-0.5">今日新增</div>
        </div>
      </div>
    </div>
  );
}
