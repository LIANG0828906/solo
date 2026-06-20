import { useEffect, useState } from 'react';
import { Users, Clock } from 'lucide-react';
import type { GroupBuy } from '../types';
import { formatCountdown } from '../utils/freightSplit';

interface Props {
  group: GroupBuy;
  onClick: () => void;
}

export default function GroupCard({ group, onClick }: Props) {
  const [cd, setCd] = useState(formatCountdown(group.deadline));

  useEffect(() => {
    const tick = () => setCd(formatCountdown(group.deadline));
    tick();
    const id = window.setInterval(tick, cd.urgent ? 500 : 15_000);
    return () => window.clearInterval(id);
  }, [group.deadline, cd.urgent]);

  const current = group.members.length;
  const ratio = Math.min(100, (current / group.maxMembers) * 100);

  return (
    <button
      onClick={onClick}
      className="btn-scale text-left bg-cream-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-cream-200 flex flex-col group"
    >
      <div
        className="h-36 w-full flex items-end p-4 relative"
        style={{ backgroundImage: group.coverGradient }}
      >
        <div className="absolute top-3 right-3 bg-white/80 backdrop-blur px-2.5 py-1 rounded-full text-xs font-medium text-cream-700 flex items-center gap-1">
          <Users size={14} /> {current}/{group.maxMembers}
        </div>
        <h3 className="font-display text-xl text-white drop-shadow-md leading-snug pr-16">
          {group.title}
        </h3>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <div>
          <div className="progress-bar-track">
            <div className="progress-bar-fill" style={{ width: ratio + '%' }} />
          </div>
          <div className="flex justify-between mt-1.5 text-xs text-cream-600">
            <span>已参团 {current} 人</span>
            <span>余 {group.maxMembers - current} 位</span>
          </div>
        </div>
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-1.5 text-sm">
            <Clock size={15} className="text-cream-500" />
            <span className={cd.urgent || cd.expired ? 'urgent-blink' : 'text-cream-700'}>
              {cd.text}
            </span>
          </div>
          <span className="text-xs text-cream-500">团长 @{group.creator}</span>
        </div>
      </div>
    </button>
  );
}
