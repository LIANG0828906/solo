import { useState, useRef, useCallback } from 'react';
import { Cpu, MemoryStick, Network, HardDrive, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { useDashboardStore } from '@/store/useDashboardStore';
import { CardConfig } from '@/types';
import CpuLineChart from '@/components/charts/CpuLineChart';
import MemoryDoughnutChart from '@/components/charts/MemoryDoughnutChart';
import NetworkBarChart from '@/components/charts/NetworkBarChart';
import DiskAreaChart from '@/components/charts/DiskAreaChart';

const ICON_MAP: Record<string, React.ReactNode> = {
  cpu: <Cpu size={16} />,
  memory: <MemoryStick size={16} />,
  network: <Network size={16} />,
  disk: <HardDrive size={16} />,
};

const CHART_MAP: Record<string, React.FC> = {
  cpu: CpuLineChart,
  memory: MemoryDoughnutChart,
  network: NetworkBarChart,
  disk: DiskAreaChart,
};

function getCurrentValue(type: string): number | null {
  const metrics = useDashboardStore.getState().metrics;
  if (!metrics) return null;
  const map: Record<string, number> = {
    cpu: metrics.cpu,
    memory: metrics.memory,
    network: metrics.networkIn,
    disk: metrics.diskRead,
  };
  return map[type] ?? null;
}

interface DashboardCardProps {
  card: CardConfig;
  index: number;
}

export default function DashboardCard({ card, index }: DashboardCardProps) {
  const collapsed = useDashboardStore((s) => s.collapsedCards.has(card.id));
  const toggleCollapse = useDashboardStore((s) => s.toggleCollapse);
  const swapCards = useDashboardStore((s) => s.swapCards);
  const metrics = useDashboardStore((s) => s.metrics);
  const bounceEffect = useDashboardStore((s) => s.bounceEffect);
  const explosionEffect = useDashboardStore((s) => s.explosionEffect);

  const [dragOver, setDragOver] = useState(false);
  const dragIndexRef = useRef<number | null>(null);

  const currentValue = metrics
    ? { cpu: metrics.cpu, memory: metrics.memory, network: metrics.networkIn, disk: metrics.diskRead }[card.type] ?? null
    : null;

  const ChartComponent = CHART_MAP[card.type];

  const handleDragStart = useCallback((e: React.DragEvent) => {
    dragIndexRef.current = index;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
  }, [index]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10);
    if (fromIndex !== index && !isNaN(fromIndex)) {
      swapCards(fromIndex, index);
    }
  }, [index, swapCards]);

  const prevValueRef = useRef<number | null>(null);
  const [valueFlash, setValueFlash] = useState(false);

  if (currentValue !== null && currentValue !== prevValueRef.current) {
    prevValueRef.current = currentValue;
    if (prevValueRef.current !== null) {
      setValueFlash(true);
      const t = setTimeout(() => setValueFlash(false), 400);
      return () => clearTimeout(t);
    }
  }

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        group relative rounded-xl border transition-all duration-[400ms] ease-out
        ${dragOver ? 'scale-[1.02] border-cyber-cyan shadow-[0_0_20px_rgba(0,240,255,0.3)]' : ''}
        ${bounceEffect ? 'animate-bounce-in' : ''}
        ${explosionEffect ? 'animate-explode' : ''}
      `}
      style={{
        background: 'rgba(10, 14, 23, 0.6)',
        backdropFilter: 'blur(20px)',
        borderImage: 'linear-gradient(135deg, #00f0ff, #ff007f) 1',
        borderImageSlice: 1,
      }}
      data-card-id={card.id}
    >
      <div className="absolute inset-0 rounded-xl pointer-events-none" style={{
        border: '1px solid transparent',
        background: 'linear-gradient(135deg, rgba(0,240,255,0.3), rgba(255,0,127,0.3)) border-box',
        mask: 'linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)',
        maskComposite: 'exclude',
        WebkitMaskComposite: 'xor',
        borderRadius: '0.75rem',
      }} />

      <div className="relative p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="cursor-grab active:cursor-grabbing text-cyber-cyan/50 hover:text-cyber-cyan transition-colors">
              <GripVertical size={14} />
            </div>
            <span className="text-cyber-cyan">{ICON_MAP[card.icon]}</span>
            <span className="text-sm font-medium text-cyber-cyan/90 truncate">{card.title}</span>
            {currentValue !== null && (
              <span
                className={`ml-auto text-sm font-bold tabular-nums transition-all duration-200 px-2 py-0.5 rounded ${
                  valueFlash
                    ? 'text-white bg-cyber-cyan/30 scale-110'
                    : 'text-cyber-cyan bg-cyber-cyan/10'
                }`}
              >
                {currentValue.toFixed(1)}{card.unit}
              </span>
            )}
          </div>
          <button
            onClick={() => toggleCollapse(card.id)}
            className="ml-2 p-1 rounded text-cyber-cyan/60 hover:text-cyber-cyan hover:bg-cyber-cyan/10 transition-all duration-200 hover:scale-105 relative overflow-hidden btn-shimmer"
          >
            {collapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        </div>

        <div
          className="transition-all duration-300 ease-out overflow-hidden"
          style={{
            maxHeight: collapsed ? '0px' : '240px',
            opacity: collapsed ? 0 : 1,
          }}
        >
          <div className="h-[220px]">
            {ChartComponent && <ChartComponent />}
          </div>
        </div>
      </div>
    </div>
  );
}
