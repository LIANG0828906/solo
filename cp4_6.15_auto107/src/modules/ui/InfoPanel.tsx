import { useMemo } from 'react';
import { X, Star, Hash, MoveRight, Layers } from 'lucide-react';
import { useUniverseStore, useSelectedParticles } from '../../store/universeStore';
import type { Particle } from '../../modules/data/ParticleGenerator';

interface InfoItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color?: string;
}

function InfoItem({ icon, label, value, color = 'text-gray-400' }: InfoItemProps) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className={`w-8 h-8 rounded-lg bg-[rgba(255,255,255,0.05)] 
                      flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[10px] text-gray-500 uppercase tracking-wider">
          {label}
        </div>
        <div className="text-sm text-white font-mono">
          {value}
        </div>
      </div>
    </div>
  );
}

function ParticleInfoCard({ particle }: { particle: Particle }) {
  const { selectParticle } = useUniverseStore();

  const redshiftColor = useMemo(() => {
    if (particle.redshift >= 0.3) return 'text-orange-400';
    if (particle.redshift >= 0) return 'text-yellow-400';
    if (particle.redshift >= -0.3) return 'text-cyan-400';
    return 'text-purple-400';
  }, [particle.redshift]);

  const redshiftDisplay = useMemo(() => {
    return particle.redshift >= 0 
      ? `+${particle.redshift.toFixed(4)}` 
      : particle.redshift.toFixed(4);
  }, [particle.redshift]);

  const distanceLightYears = useMemo(() => {
    const mpc = particle.distance * 3.26156;
    if (mpc < 1000) {
      return `${mpc.toFixed(1)} Mly`;
    }
    return `${(mpc / 1000).toFixed(2)} Gly`;
  }, [particle.distance]);

  return (
    <div
      className="w-80 rounded-2xl
                 bg-[rgba(26,26,46,0.85)] border border-[rgba(255,255,255,0.1)]
                 backdrop-blur-xl
                 shadow-[0_0_40px_rgba(76,201,240,0.2)]
                 overflow-hidden
                 animate-[slideIn_0.3s_ease-out]"
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      <div className="p-4 border-b border-[rgba(255,255,255,0.1)] 
                      flex items-center justify-between
                      bg-gradient-to-r from-[rgba(76,201,240,0.1)] to-transparent">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${redshiftColor} 
                          shadow-[0_0_10px_currentColor]`} />
          <span className="text-white font-bold text-sm tracking-wider">
            星系信息
          </span>
        </div>
        <button
          onClick={() => selectParticle(null)}
          className="w-7 h-7 rounded-lg
                     hover:bg-[rgba(255,255,255,0.1)]
                     flex items-center justify-center
                     transition-all duration-200
                     hover:scale-110"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="p-4 space-y-1">
        <InfoItem
          icon={<Hash className="w-4 h-4" />}
          label="模拟ID"
          value={particle.id.slice(0, 8).toUpperCase()}
          color="text-cyan-400"
        />
        
        <InfoItem
          icon={<MoveRight className="w-4 h-4" />}
          label="红移值 z"
          value={redshiftDisplay}
          color={redshiftColor}
        />
        
        <InfoItem
          icon={<Star className="w-4 h-4" />}
          label="估计距离"
          value={distanceLightYears}
          color="text-yellow-400"
        />
        
        <InfoItem
          icon={<Layers className="w-4 h-4" />}
          label="所属星簇"
          value={particle.clusterName}
          color="text-purple-400"
        />
      </div>

      <div className="p-4 border-t border-[rgba(255,255,255,0.1)]">
        <div className="flex items-center justify-between text-[10px] text-gray-500">
          <span>质量: {particle.mass.toFixed(2)} M☉</span>
          <span>大小: {particle.size.toFixed(1)} 单位</span>
        </div>
      </div>
    </div>
  );
}

function SelectionStats({ count }: { count: number }) {
  const { clearSelection } = useUniverseStore();

  return (
    <div
      className="w-72 rounded-2xl
                 bg-[rgba(26,26,46,0.85)] border border-[rgba(76,201,240,0.3)]
                 backdrop-blur-xl
                 shadow-[0_0_40px_rgba(76,201,240,0.2)]
                 overflow-hidden
                 animate-[slideIn_0.3s_ease-out]"
      style={{ fontFamily: "'Space Mono', monospace" }}
    >
      <div className="p-4 border-b border-[rgba(255,255,255,0.1)] 
                      flex items-center justify-between
                      bg-gradient-to-r from-[rgba(76,201,240,0.15)] to-transparent">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-cyan-400 
                          shadow-[0_0_10px_rgba(76,201,240,0.8)]
                          animate-[pulse_2s_infinite]" />
          <span className="text-white font-bold text-sm tracking-wider">
            框选统计
          </span>
        </div>
        <button
          onClick={clearSelection}
          className="w-7 h-7 rounded-lg
                     hover:bg-[rgba(255,255,255,0.1)]
                     flex items-center justify-center
                     transition-all duration-200
                     hover:scale-110"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="p-6">
        <div className="text-center">
          <div className="text-4xl font-bold text-cyan-400 mb-1
                          drop-shadow-[0_0_20px_rgba(76,201,240,0.5)]">
            {count.toLocaleString()}
          </div>
          <div className="text-sm text-gray-400">
            个星系被选中
          </div>
        </div>

        <div className="mt-4 h-2 rounded-full bg-[rgba(76,201,240,0.1)] overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-cyan-500 to-cyan-300
                       transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, (count / 5000) * 100)}%` }}
          />
        </div>

        <div className="mt-2 text-center text-[10px] text-gray-500">
          占总数 {((count / 5000) * 100).toFixed(1)}%
        </div>
      </div>
    </div>
  );
}

export default function InfoPanel() {
  const selectedParticles = useSelectedParticles();
  const { isBoxSelecting, boxSelection } = useUniverseStore();

  const selectionStyle = useMemo(() => {
    if (!boxSelection.start || !boxSelection.end) return null;
    
    const left = Math.min(boxSelection.start.x, boxSelection.end.x);
    const top = Math.min(boxSelection.start.y, boxSelection.end.y);
    const width = Math.abs(boxSelection.end.x - boxSelection.start.x);
    const height = Math.abs(boxSelection.end.y - boxSelection.start.y);

    if (width < 5 && height < 5) return null;

    return {
      left,
      top,
      width,
      height,
    };
  }, [boxSelection]);

  return (
    <>
      {isBoxSelecting && selectionStyle && (
        <div
          className="fixed z-30 pointer-events-none
                     border-2 border-cyan-400/60
                     bg-cyan-400/10
                     rounded-sm"
          style={{
            ...selectionStyle,
            boxShadow: '0 0 20px rgba(76, 201, 240, 0.3)',
          }}
        />
      )}

      {selectedParticles.length === 1 && (
        <div className="fixed right-6 bottom-6 z-20">
          <ParticleInfoCard particle={selectedParticles[0]} />
        </div>
      )}

      {selectedParticles.length > 1 && (
        <div className="fixed right-6 bottom-6 z-20">
          <SelectionStats count={selectedParticles.length} />
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.2);
          }
        }
      `}</style>
    </>
  );
}

export { InfoPanel };
