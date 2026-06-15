import React, { useState } from 'react';
import { X, Minus, Plus, Pickaxe, TreePine, Sparkles, Wheat } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import type { WorkerType } from '@/types';

interface DispatchWorkerModalProps {
  open: boolean;
  onClose: () => void;
}

interface WorkerConfig {
  type: WorkerType;
  label: string;
  resourceLabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  count: number;
}

export const DispatchWorkerModal: React.FC<DispatchWorkerModalProps> = ({ open, onClose }) => {
  const workers = useGameStore((s) => s.workers);
  const dispatchWorker = useGameStore((s) => s.dispatchWorker);
  const recallWorker = useGameStore((s) => s.recallWorker);

  const configs: WorkerConfig[] = [
    {
      type: 'miner',
      label: '采矿工',
      resourceLabel: '采集石材',
      icon: <Pickaxe size={20} />,
      color: 'var(--stone-color)',
      bgColor: 'var(--stone-bg)',
      count: workers.miners,
    },
    {
      type: 'woodcutter',
      label: '伐木工',
      resourceLabel: '采集木材',
      icon: <TreePine size={20} />,
      color: 'var(--wood-color)',
      bgColor: 'var(--wood-bg)',
      count: workers.woodcutters,
    },
    {
      type: 'goldPanner',
      label: '淘金者',
      resourceLabel: '采集黄金',
      icon: <Sparkles size={20} />,
      color: 'var(--gold-color)',
      bgColor: 'var(--gold-bg)',
      count: workers.goldPanners,
    },
    {
      type: 'farmer',
      label: '农民',
      resourceLabel: '生产食物',
      icon: <Wheat size={20} />,
      color: 'var(--food-color)',
      bgColor: 'var(--food-bg)',
      count: workers.farmers,
    },
  ];

  if (!open) return null;

  const handleDispatch = (type: WorkerType) => {
    dispatchWorker(type, 1);
  };

  const handleRecall = (type: WorkerType, current: number) => {
    if (current <= 0) return;
    recallWorker(type, 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center fade-in"
      style={{ background: 'rgba(61,43,31,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="w-[92%] max-w-md p-5 rounded-2xl fade-in-up"
        style={{
          background: 'var(--bg-papyrus)',
          border: '2px solid var(--gold)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-brown)' }}>
            派遣工人
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-brown-light)' }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          className="px-4 py-2.5 rounded-xl mb-4 flex items-center justify-between"
          style={{
            background: 'rgba(207,181,59,0.2)',
            border: '1px dashed var(--gold)',
          }}
        >
          <span className="text-sm font-medium" style={{ color: 'var(--text-brown)' }}>
            当前空闲工人
          </span>
          <span
            className="text-xl font-bold px-3 py-0.5 rounded-lg"
            style={{
              background: 'var(--gold)',
              color: 'var(--text-brown)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {workers.idle}
          </span>
        </div>

        <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
          {configs.map((cfg) => (
            <div
              key={cfg.type}
              className="p-3.5 rounded-xl flex items-center gap-3 transition-all"
              style={{
                background: cfg.bgColor,
                border: `1.5px solid ${cfg.color}33`,
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${cfg.color}22`, color: cfg.color }}
              >
                {cfg.icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm" style={{ color: 'var(--text-brown)' }}>
                  {cfg.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-brown-light)' }}>
                  {cfg.resourceLabel} · 在岗 {cfg.count}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleRecall(cfg.type, cfg.count)}
                  disabled={cfg.count <= 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all"
                  style={{
                    background: 'rgba(185,28,28,0.12)',
                    color: 'var(--error)',
                    border: '1px solid rgba(185,28,28,0.25)',
                  }}
                >
                  <Minus size={14} />
                </button>
                <span
                  className="text-lg font-bold w-7 text-center"
                  style={{ color: cfg.color }}
                >
                  {cfg.count}
                </span>
                <button
                  onClick={() => handleDispatch(cfg.type)}
                  disabled={workers.idle <= 0}
                  className="w-8 h-8 rounded-lg flex items-center justify-center font-bold transition-all"
                  style={{
                    background: 'rgba(58,140,58,0.12)',
                    color: 'var(--success)',
                    border: '1px solid rgba(58,140,58,0.25)',
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={onClose}
            className="px-8 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%)',
              color: 'var(--text-brown)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--gold-dark)',
            }}
          >
            完成派遣
          </button>
        </div>
      </div>
    </div>
  );
};
