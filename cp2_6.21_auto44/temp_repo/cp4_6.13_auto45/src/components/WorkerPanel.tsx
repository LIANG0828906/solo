import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Users, Pickaxe, TreePine, Sparkles, Wheat, Coffee, ChevronUp } from 'lucide-react';
import { HireWorkerModal } from './HireWorkerModal';

const WORKER_BAR_CONFIG = [
  { key: 'miners', label: '采矿工', icon: <Pickaxe size={14} />, color: 'var(--stone-color)', bg: 'var(--stone-bg)' },
  { key: 'woodcutters', label: '伐木工', icon: <TreePine size={14} />, color: 'var(--wood-color)', bg: 'var(--wood-bg)' },
  { key: 'goldPanners', label: '淘金者', icon: <Sparkles size={14} />, color: 'var(--gold-color)', bg: 'var(--gold-bg)' },
  { key: 'farmers', label: '农民', icon: <Wheat size={14} />, color: 'var(--food-color)', bg: 'var(--food-bg)' },
] as const;

const WORKER_AVATAR_COLORS = [
  'linear-gradient(135deg, #f4a460 0%, #cd853f 100%)',
  'linear-gradient(135deg, #deb887 0%, #a0522d 100%)',
  'linear-gradient(135deg, #e8c547 0%, #b8860b 100%)',
  'linear-gradient(135deg, #9e9e9e 0%, #616161 100%)',
  'linear-gradient(135deg, #a0622d 0%, #6b3e14 100%)',
];

const AVATAR_NAMES = ['阿蒙', '拉神', '奥西', '伊西斯', '努特', '盖布', '赛特', '奈芙'];

export const WorkerPanel: React.FC = () => {
  const workers = useGameStore((s) => s.workers);
  const [expanded, setExpanded] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);

  const workingCount = workers.total - workers.idle;
  const maxCount = Math.max(1, workers.total);

  const idleAvatars = Array.from({ length: workers.idle }, (_, i) => i);

  return (
    <>
      {expanded && (
        <div
          className="fixed inset-0 z-30 fade-in"
          style={{ background: 'rgba(61,43,31,0.15)' }}
          onClick={() => setExpanded(false)}
        />
      )}

      <div
        className={`fixed right-4 z-40 transition-all duration-300 ease-out ${
          expanded
            ? 'bottom-4 w-80 opacity-100'
            : 'bottom-4 w-14 opacity-100'
        }`}
        style={{
          maxHeight: expanded ? 'calc(100vh - 120px)' : undefined,
        }}
      >
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="w-14 h-14 rounded-2xl flex items-center justify-center relative transition-all hover:scale-105 pulse-glow"
            style={{
              background:
                'linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)',
              boxShadow: 'var(--shadow-lg)',
              border: '2px solid var(--gold-dark)',
            }}
          >
            <Users size={22} style={{ color: 'var(--text-brown)' }} />
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
              style={{
                background: 'var(--text-brown)',
                color: 'var(--gold-light)',
                border: '1.5px solid var(--gold)',
              }}
            >
              {workers.idle}
            </span>
          </button>
        ) : (
          <div
            className="rounded-2xl overflow-hidden flex flex-col fade-in-up"
            style={{
              background: 'var(--bg-papyrus)',
              border: '2px solid var(--gold)',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-4 py-3 flex items-center justify-between flex-shrink-0"
              style={{
                background:
                  'linear-gradient(90deg, rgba(207,181,59,0.3) 0%, rgba(207,181,59,0.1) 100%)',
                borderBottom: '1.5px solid rgba(207,181,59,0.4)',
              }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--gold)', color: 'var(--text-brown)' }}
                >
                  <Users size={16} />
                </div>
                <div>
                  <div
                    className="text-sm font-bold leading-tight"
                    style={{ color: 'var(--text-brown)' }}
                  >
                    工人管理
                  </div>
                  <div
                    className="text-[10px] leading-tight"
                    style={{ color: 'var(--text-brown-light)' }}
                  >
                    总计 {workers.total} 人
                  </div>
                </div>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="p-1.5 rounded-lg transition-all hover:bg-black/5"
                style={{ color: 'var(--text-brown-light)' }}
              >
                <ChevronUp size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              <div
                className="p-3 rounded-xl"
                style={{
                  background: 'rgba(61,43,31,0.04)',
                  border: '1px solid rgba(61,43,31,0.08)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--text-brown-light)' }}
                  >
                    工作状态
                  </span>
                </div>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <div
                      className="h-7 rounded-lg flex items-center justify-between px-2.5"
                      style={{ background: 'var(--stone-bg)' }}
                    >
                      <div className="flex items-center gap-1">
                        <Coffee size={12} style={{ color: 'var(--stone-color)' }} />
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: 'var(--stone-color)' }}
                        >
                          空闲
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold"
                        style={{ color: 'var(--stone-color)' }}
                      >
                        {workers.idle}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div
                      className="h-7 rounded-lg flex items-center justify-between px-2.5"
                      style={{ background: 'var(--gold-bg)' }}
                    >
                      <div className="flex items-center gap-1">
                        <Pickaxe size={12} style={{ color: 'var(--gold-color)' }} />
                        <span
                          className="text-[11px] font-bold"
                          style={{ color: 'var(--gold-color)' }}
                        >
                          在岗
                        </span>
                      </div>
                      <span
                        className="text-sm font-bold"
                        style={{ color: 'var(--gold-color)' }}
                      >
                        {workingCount}
                      </span>
                    </div>
                  </div>
                </div>
                <div
                  className="h-2 rounded-full overflow-hidden"
                  style={{ background: 'rgba(61,43,31,0.08)' }}
                >
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(workingCount / maxCount) * 100}%`,
                      background:
                        'linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 100%)',
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div
                  className="text-xs font-medium px-1"
                  style={{ color: 'var(--text-brown-light)' }}
                >
                  各职业分布
                </div>
                {WORKER_BAR_CONFIG.map((cfg) => {
                  const count = workers[cfg.key as keyof typeof workers] as number;
                  const pct = (count / maxCount) * 100;
                  return (
                    <div key={cfg.key} className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: cfg.bg, color: cfg.color }}
                      >
                        {cfg.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <span
                            className="text-[11px] font-medium"
                            style={{ color: 'var(--text-brown)' }}
                          >
                            {cfg.label}
                          </span>
                          <span
                            className="text-[11px] font-bold"
                            style={{ color: cfg.color }}
                          >
                            {count}
                          </span>
                        </div>
                        <div
                          className="h-1.5 rounded-full overflow-hidden"
                          style={{ background: 'rgba(61,43,31,0.06)' }}
                        >
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, background: cfg.color }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {idleAvatars.length > 0 && (
                <div>
                  <div
                    className="text-xs font-medium mb-2 px-1 flex items-center justify-between"
                    style={{ color: 'var(--text-brown-light)' }}
                  >
                    <span>空闲工人 ({workers.idle})</span>
                  </div>
                  <div
                    className="flex gap-1.5 overflow-x-auto pb-1.5 -mx-1 px-1"
                    style={{ scrollbarWidth: 'none' }}
                  >
                    {idleAvatars.map((_, idx) => {
                      const colorIdx = idx % WORKER_AVATAR_COLORS.length;
                      const nameIdx = idx % AVATAR_NAMES.length;
                      return (
                        <div
                          key={idx}
                          className="flex-shrink-0 flex flex-col items-center gap-0.5 group"
                        >
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white transition-transform group-hover:scale-110"
                            style={{
                              background: WORKER_AVATAR_COLORS[colorIdx],
                              boxShadow: 'var(--shadow-sm)',
                              border: '1.5px solid