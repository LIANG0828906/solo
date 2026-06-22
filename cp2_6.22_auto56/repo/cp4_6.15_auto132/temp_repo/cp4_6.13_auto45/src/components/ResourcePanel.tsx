import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { AnimatedNumber } from './AnimatedNumber';
import { Pickaxe, TreePine, Sparkles, Wheat, Users, ChevronDown } from 'lucide-react';
import { DispatchWorkerModal } from './DispatchWorkerModal';
import type { ResourceType } from '@/types';
import { RESOURCE_CAP } from '@/types';

const RESOURCE_CONFIG: Record<
  ResourceType,
  { label: string; color: string; bgColor: string; icon: React.ReactNode; cap: number }
> = {
  stone: {
    label: '石材',
    color: 'var(--stone-color)',
    bgColor: 'var(--stone-bg)',
    icon: <Pickaxe size={18} />,
    cap: RESOURCE_CAP.stone,
  },
  wood: {
    label: '木材',
    color: 'var(--wood-color)',
    bgColor: 'var(--wood-bg)',
    icon: <TreePine size={18} />,
    cap: RESOURCE_CAP.wood,
  },
  gold: {
    label: '黄金',
    color: 'var(--gold-color)',
    bgColor: 'var(--gold-bg)',
    icon: <Sparkles size={18} />,
    cap: RESOURCE_CAP.gold,
  },
  food: {
    label: '食物',
    color: 'var(--food-color)',
    bgColor: 'var(--food-bg)',
    icon: <Wheat size={18} />,
    cap: RESOURCE_CAP.food,
  },
};

interface ResourcePanelProps {
  onOpenDispatch: () => void;
}

export const ResourcePanel: React.FC<ResourcePanelProps> = () => {
  const resources = useGameStore((s) => s.resources);
  const workers = useGameStore((s) => s.workers);
  const getProductionRate = useGameStore((s) => s.getProductionRate);
  const rates = getProductionRate();
  const [dispatchOpen, setDispatchOpen] = useState(false);

  return (
    <>
      <div
        className="w-full px-4 py-3 flex items-center gap-3 border-b-2 flex-shrink-0"
        style={{
          background:
            'linear-gradient(180deg, rgba(207,181,59,0.15) 0%, rgba(245,230,200,1) 100%)',
          borderColor: 'var(--gold)',
        }}
      >
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg flex-shrink-0"
          style={{ background: 'rgba(207,181,59,0.25)', border: '1px solid var(--gold)' }}
        >
          <span style={{ color: 'var(--gold-dark)' }}>
            <Users size={18} />
          </span>
          <span className="text-sm font-bold" style={{ color: 'var(--text-brown)' }}>
            {workers.total}
          </span>
        </div>

        <div className="flex-1 flex items-center gap-2 justify-center flex-wrap">
          {(Object.keys(RESOURCE_CONFIG) as ResourceType[]).map((key) => {
            const cfg = RESOURCE_CONFIG[key];
            const value = resources[key];
            const rate = rates[key];
            const pct = Math.min(100, (value / cfg.cap) * 100);

            return (
              <div
                key={key}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl flex-shrink-0 fade-in-up"
                style={{
                  background: cfg.bgColor,
                  border: `1.5px solid ${cfg.color}33`,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span style={{ color: cfg.color }}>{cfg.icon}</span>
                <div className="flex flex-col">
                  <div className="flex items-baseline gap-1">
                    <AnimatedNumber
                      value={Math.floor(value)}
                      className="text-base font-bold leading-none"
                      style={{ color: cfg.color }}
                    />
                    <span
                      className="text-xs leading-none opacity-60"
                      style={{ color: 'var(--text-brown)' }}
                    >
                      /{cfg.cap}
                    </span>
                  </div>
                  <div className="h-0.5 mt-1 rounded-full overflow-hidden bg-white/40">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${pct}%`, background: cfg.color }}
                    />
                  </div>
                </div>
                <div
                  className="text-xs font-medium px-1.5 py-0.5 rounded"
                  style={{
                    background: rate > 0 ? 'rgba(58,140,58,0.15)' : 'rgba(0,0,0,0.05)',
                    color: rate > 0 ? 'var(--success)' : 'var(--text-brown-light)',
                  }}
                >
                  +{rate.toFixed(1)}/s
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => setDispatchOpen(true)}
          className="px-3 py-2 rounded-xl font-bold text-sm flex items-center gap-1.5 flex-shrink-0 transition-all hover:scale-105"
          style={{
            background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)',
            color: 'var(--text-brown)',
            boxShadow: 'var(--shadow-md)',
            border: '1px solid var(--gold-dark)',
          }}
        >
          <ChevronDown size={14} />
          派遣工人
        </button>
      </div>

      <DispatchWorkerModal open={dispatchOpen} onClose={() => setDispatchOpen(false)} />
    </>
  );
};
