import { useState, useEffect, useRef } from 'react';
import { X, Zap, Move, Target } from 'lucide-react';
import { usePhysicsStore } from '@/store/usePhysicsStore';
import { hslToString } from '@/utils/hsl';

interface DataDisplayProps {
  label: string;
  value: number;
  unit?: string;
  decimals?: number;
}

function DataDisplay({ label, value, unit = '', decimals = 2 }: DataDisplayProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);
  const lastValueRef = useRef(value);

  useEffect(() => {
    if (Math.abs(value - lastValueRef.current) > 0.01) {
      setIsAnimating(true);
      const start = lastValueRef.current;
      const end = value;
      const duration = 150;
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setDisplayValue(start + (end - start) * eased);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setIsAnimating(false);
          lastValueRef.current = value;
        }
      };

      requestAnimationFrame(animate);
    } else {
      setDisplayValue(value);
    }
  }, [value]);

  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-xs text-cyan-300/70 font-medium">{label}</span>
      <span
        className={`font-mono-sans text-sm text-white ${
          isAnimating ? 'animate-number-jitter' : ''
        }`}
      >
        {displayValue.toFixed(decimals)}
        <span className="text-cyan-400/60 text-xs ml-1">{unit}</span>
      </span>
    </div>
  );
}

function VectorDisplay({
  label,
  vector,
  unit = '',
}: {
  label: string;
  vector: [number, number, number];
  unit?: string;
}) {
  return (
    <div className="py-1.5">
      <div className="text-xs text-cyan-300/70 font-medium mb-1">{label}</div>
      <div className="flex gap-2">
        {vector.map((v, i) => (
          <div key={i} className="flex-1 text-center">
            <span className="text-[10px] text-purple-400/60 block">
              {['X', 'Y', 'Z'][i]}
            </span>
            <span className="font-mono-sans text-xs text-white animate-data-flicker block">
              {v.toFixed(2)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function InfoPanel() {
  const selectedBodyId = usePhysicsStore((s) => s.selectedBodyId);
  const physicsData = usePhysicsStore((s) => s.physicsData);
  const bodies = usePhysicsStore((s) => s.bodies);
  const setSelectedBodyId = usePhysicsStore((s) => s.setSelectedBodyId);

  const body = bodies.find((b) => b.id === selectedBodyId);
  const data = selectedBodyId ? physicsData.get(selectedBodyId) : null;

  if (!body || !data) return null;

  const speed = data.speed || 0;
  const momentum = data.momentum || 0;

  const bodyTypeLabels: Record<string, string> = {
    box: '立方体',
    sphere: '球体',
    cylinder: '圆柱体',
  };

  return (
    <div className="absolute top-4 right-4 w-72 glass-panel rounded-2xl p-5 shadow-2xl animate-[float-in_0.3s_ease-out]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl shadow-lg"
            style={{
              background: hslToString(body.color),
              boxShadow: `0 0 20px ${hslToString(body.color)}40`,
            }}
          />
          <div>
            <h3 className="text-white font-semibold text-base leading-tight">
              {bodyTypeLabels[body.type]}
            </h3>
            <p className="text-cyan-400/60 text-xs font-mono-sans">
              ID: {body.id.slice(0, 8)}
            </p>
          </div>
        </div>
        <button
          onClick={() => setSelectedBodyId(null)}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="space-y-0.5 border-t border-cyan-500/10 pt-3">
        <div className="flex items-center gap-2 py-2 text-purple-400/80 text-xs font-medium">
          <Target size={14} />
          位置坐标
        </div>
        <VectorDisplay label="" vector={data.position} unit="m" />
      </div>

      <div className="space-y-0.5 border-t border-cyan-500/10 pt-3">
        <div className="flex items-center gap-2 py-2 text-purple-400/80 text-xs font-medium">
          <Move size={14} />
          速度矢量 (m/s)
        </div>
        <VectorDisplay label="" vector={data.velocity} />
      </div>

      <div className="space-y-0.5 border-t border-cyan-500/10 pt-3">
        <div className="flex items-center gap-2 py-2 text-purple-400/80 text-xs font-medium">
          <Zap size={14} />
          物理参数
        </div>
        <DataDisplay label="速率" value={speed} unit="m/s" />
        <DataDisplay label="动量" value={momentum} unit="kg·m/s" />
        <DataDisplay label="质量" value={body.mass} unit="kg" decimals={1} />
        <DataDisplay label="弹性系数" value={body.restitution} decimals={2} />
      </div>

      <div className="mt-4 pt-3 border-t border-cyan-500/10">
        <div className="flex items-center justify-between">
          <span className="text-xs text-cyan-300/70">状态</span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              speed > 0.1
                ? 'bg-green-500/20 text-green-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}
          >
            {speed > 0.1 ? '运动中' : '静止'}
          </span>
        </div>
      </div>
    </div>
  );
}
