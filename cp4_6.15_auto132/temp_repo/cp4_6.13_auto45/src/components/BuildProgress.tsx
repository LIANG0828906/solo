import React from 'react';
import { useGameStore } from '@/store/gameStore';
import { Check, Lock, Pickaxe, TreePine, Sparkles, Wheat, Users } from 'lucide-react';
import type { BuildPhase, Resources, ResourceType } from '@/types';

interface BuildProgressProps {
  onAddToQueue?: (phaseId: string) => void;
}

const RESOURCE_ICON: Record<string, React.ReactNode> = {
  stone: <Pickaxe size={11} />,
  wood: <TreePine size={11} />,
  gold: <Sparkles size={11} />,
  food: <Wheat size={11} />,
};

const RESOURCE_COLOR: Record<string, string> = {
  stone: 'var(--stone-color)',
  wood: 'var(--wood-color)',
  gold: 'var(--gold-color)',
  food: 'var(--food-color)',
};

export const BuildProgress: React.FC<BuildProgressProps> = () => {
  const phases = useGameStore((s) => s.phases);
  const resources = useGameStore((s) => s.resources);
  const workers = useGameStore((s) => s.workers);
  const buildQueue = useGameStore((s) => s.buildQueue);
  const addBuildTask = useGameStore((s) => s.addBuildTask);

  const canAfford = (required: Partial<Resources>) => {
    for (const key of Object.keys(required) as ResourceType[]) {
      if ((resources[key] ?? 0) < (required[key] ?? 0)) return false;
    }
    return true;
  };

  const isInQueue = (phaseId: string) => buildQueue.some((t) => t.phaseId === phaseId);

  const handlePhaseClick = (phase: BuildPhase) => {
    if (phase.status === 'available' && !isInQueue(phase.id)) {
      const check = canAfford(phase.requiredResources) && workers.idle >= phase.requiredWorkers;
      if (check) {
        addBuildTask(phase.id);
      }
    }
  };

  const completedCount = phases.filter((p) => p.status === 'completed').length;
  const overallPct = (completedCount / phases.length) * 100;

  return (
    <div
      className="h-full w-64 flex-shrink-0 flex flex-col p-3 overflow-hidden"
      style={{
        borderRight: '1.5px solid rgba(207,181,59,0.3)',
        background:
          'linear-gradient(180deg, rgba(245,230,200,1) 0%, rgba(232,212,168,0.4) 100%)',
      }}
    >
      <div className="mb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-1.5">
          <h3
            className="text-sm font-bold"
            style={{ color: 'var(--text-brown)' }}
          >
            金字塔建造进度
          </h3>
          <span
            className="text-xs font-bold px-2 py-0.5 rounded-md"
            style={{ background: 'var(--gold)', color: 'var(--text-brown)' }}
          >
            {completedCount}/{phases.length}
          </span>
        </div>
        <div
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'rgba(61,43,31,0.1)' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${overallPct}%`,
              background: 'linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 100%)',
            }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-1.5">
        {phases.map((phase) => {
          const inQueue = isInQueue(phase.id);
          const affordable = canAfford(phase.requiredResources);
          const hasWorkers = workers.idle >= phase.requiredWorkers;
          const clickable = phase.status === 'available' && !inQueue && affordable && hasWorkers;

          let bgColor = 'rgba(156,163,175,0.12)';
          let borderColor = 'rgba(156,163,175,0.3)';
          let textOpacity = 1;

          switch (phase.status) {
            case 'completed':
              bgColor = 'rgba(58,140,58,0.12)';
              borderColor = 'rgba(58,140,58,0.4)';
              break;
            case 'building':
              bgColor = 'rgba(207,181,59,0.2)';
              borderColor = 'var(--gold)';
              break;
            case 'available':
              bgColor = affordable && hasWorkers ? 'rgba(207,181,59,0.12)' : 'rgba(217,119,6,0.1)';
              borderColor = affordable && hasWorkers ? 'rgba(207,181,59,0.5)' : 'rgba(217,119,6,0.3)';
              break;
            case 'locked':
              textOpacity = 0.5;
              break;
          }

          const currentTask = buildQueue.find((t) => t.phaseId === phase.id);

          return (
            <div
              key={phase.id}
              onClick={() => handlePhaseClick(phase)}
              className={`relative p-2.5 rounded-xl transition-all duration-200 ${
                clickable ? 'cursor-pointer hover:scale-[1.02] hover:shadow-md' : ''
              } ${phase.status === 'available' && clickable ? 'pulse-glow' : ''}`}
              style={{
                background: bgColor,
                border: `1.5px solid ${borderColor}`,
                opacity: textOpacity,
                boxShadow: phase.status === 'building' ? '0 0 12px rgba(207,181,59,0.3)' : undefined,
              }}
            >
              <div className="flex items-start gap-2">
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                  style={{
                    background:
                      phase.status === 'completed'
                        ? 'var(--success)'
                        : phase.status === 'locked'
                        ? 'rgba(156,163,175,0.3)'
                        : 'rgba(207,181,59,0.8)',
                    color: phase.status === 'locked' ? 'rgba(61,43,31,0.4)' : '#fff',
                  }}
                >
                  {phase.status === 'completed' ? (
                    <Check size={14} />
                  ) : phase.status === 'locked' ? (
                    <Lock size={12} />
                  ) : (
                    phase.index + 1
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div
                    className="text-xs font-bold truncate mb-0.5"
                    style={{ color: 'var(--text-brown)' }}
                  >
                    {phase.name}
                  </div>

                  {phase.status !== 'locked' && (
                    <>
                      <div className="flex flex-wrap gap-1 mb-1">
                        {Object.entries(phase.requiredResources).map(([k, v]) => {
                          const has = (resources[k as ResourceType] ?? 0) >= (v ?? 0);
                          return (
                            <div
                              key={k}
                              className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium"
                              style={{
                                background: has ? `${RESOURCE_COLOR[k]}1a` : 'rgba(185,28,28,0.1)',
                                color: has ? RESOURCE_COLOR[k] : 'var(--error)',
                              }}
                            >
                              {RESOURCE_ICON[k]}
                              {v}
                            </div>
                          );
                        })}
                        <div
                          className="flex items-center gap-0.5 px-1 py-0.5 rounded text-[10px] font-medium"
                          style={{
                            background: hasWorkers
                              ? 'rgba(207,181,59,0.15)'
                              : 'rgba(185,28,28,0.1)',
                            color: hasWorkers ? 'var(--gold-dark)' : 'var(--error)',
                          }}
                        >
                          <Users size={10} />
                          {phase.requiredWorkers}
                        </div>
                      </div>
                    </>
                  )}

                  {currentTask && currentTask.status === 'building' && (
                    <div
                      className="h-1 rounded-full overflow-hidden mt-1"
                      style={{ background: 'rgba(61,43,31,0.1)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${currentTask.progress}%`,
                          background:
                            'linear-gradient(90deg, var(--gold) 0%, var(--gold-light) 100%)',
                        }}
                      />
                    </div>
                  )}

                  {inQueue && !currentTask && (
                    <div
                      className="text-[10px] font-medium mt-1 px-1.5 py-0.5 rounded inline-block"
                      style={{
                        background: 'rgba(207,181,59,0.2)',
                        color: 'var(--gold-dark)',
                      }}
                    >
                      队列中 #{buildQueue.findIndex((t) => t.phaseId === phase.id) + 1}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
