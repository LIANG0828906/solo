import { useState } from 'react';
import { X } from 'lucide-react';
import { usePlanetStore } from '@/store/useStore';
import type { Planet } from '@/types/planet';

interface CompareViewProps {
  onClose: () => void;
}

function PlanetCard({ planet, onRemove }: { planet: Planet; onRemove: () => void }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className={`card-flip ${flipped ? 'flipped' : ''} group w-full`}
      style={{ minHeight: '260px' }}
      onClick={() => setFlipped(!flipped)}
    >
      <div className="card-flip-inner">
        <div className="card-front glass rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white">{planet.name}</h3>
              <p className="text-xs text-[var(--text-secondary)]">{planet.nameEn}</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="glow-hover rounded-full p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label={`移除${planet.name}`}
            >
              <X size={16} />
            </button>
          </div>
          <div className="mt-4 flex items-center justify-center py-4">
            <div
              className="animate-pulse-glow rounded-full"
              style={{
                width: `${Math.min(Math.log(planet.diameter) * 12, 100)}px`,
                height: `${Math.min(Math.log(planet.diameter) * 12, 100)}px`,
                background: `radial-gradient(circle at 35% 35%, ${planet.color}cc, ${planet.color}44)`,
                boxShadow: `0 0 30px ${planet.color}66`,
              }}
            />
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <div className="text-[var(--text-muted)]">直径</div>
              <div className="font-mono-data text-white">{planet.diameter.toLocaleString()} km</div>
            </div>
            <div>
              <div className="text-[var(--text-muted)]">质量</div>
              <div className="font-mono-data text-white">{planet.mass}×10²⁴kg</div>
            </div>
            <div>
              <div className="text-[var(--text-muted)]">引力</div>
              <div className="font-mono-data text-white">{planet.gravity} m/s²</div>
            </div>
          </div>
        </div>

        <div className="card-back glass rounded-xl p-4">
          <h3 className="text-lg font-semibold text-white">{planet.name}</h3>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">{planet.description}</p>
          <div className="mt-3 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">公转周期</span>
              <span className="font-mono-data text-white">{planet.orbitalPeriod} 天</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">卫星数量</span>
              <span className="font-mono-data text-white">{planet.moons}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">自转周期</span>
              <span className="font-mono-data text-white">{planet.rotationPeriod} 小时</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">轨道倾角</span>
              <span className="font-mono-data text-white">{planet.orbitalInclination}°</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CompareBarChart({ planets }: { planets: Planet[] }) {
  const metrics = [
    { key: 'diameter' as const, label: '直径 (km)', getValue: (p: Planet) => p.diameter },
    { key: 'mass' as const, label: '质量 (×10²⁴kg)', getValue: (p: Planet) => p.mass },
    { key: 'gravity' as const, label: '引力 (m/s²)', getValue: (p: Planet) => p.gravity },
  ];

  const colors = ['#4f8cff', '#8b5cf6', '#06b6d4'];

  return (
    <div className="space-y-4">
      {metrics.map((metric) => {
        const values = planets.map((p) => metric.getValue(p));
        const maxVal = Math.max(...values);
        return (
          <div key={metric.key}>
            <div className="mb-1 text-xs font-medium text-[var(--text-secondary)]">{metric.label}</div>
            <div className="space-y-1.5">
              {planets.map((planet, i) => {
                const val = metric.getValue(planet);
                const pct = maxVal > 0 ? (val / maxVal) * 100 : 0;
                return (
                  <div key={planet.id} className="flex items-center gap-2">
                    <span className="w-16 shrink-0 truncate text-xs text-[var(--text-muted)]">{planet.name}</span>
                    <div className="h-5 flex-1 overflow-hidden rounded-full bg-white/5">
                      <div
                        className="flex h-full items-center rounded-full transition-all duration-700"
                        style={{
                          width: `${Math.max(pct, 2)}%`,
                          background: `linear-gradient(90deg, ${colors[i % 3]}cc, ${colors[i % 3]}66)`,
                        }}
                      >
                        <span className="ml-2 text-[10px] font-medium text-white whitespace-nowrap">
                          {val.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CompareView({ onClose }: CompareViewProps) {
  const { compareList, planets, removeFromCompare } = usePlanetStore();
  const [realScale, setRealScale] = useState(false);

  const selected = compareList
    .map((id) => planets.find((p) => p.id === id))
    .filter((p): p is Planet => p !== undefined);

  if (selected.length === 0) {
    return (
      <div className="glass fixed inset-0 z-40 flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[var(--text-secondary)]">请先选择要对比的行星</p>
          <button
            onClick={onClose}
            className="glow-hover mt-4 rounded-lg bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20"
          >
            关闭
          </button>
        </div>
      </div>
    );
  }

  const maxSize = Math.max(...selected.map((p) => p.diameter));

  return (
    <div className="glass fixed inset-0 z-40 overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gradient">行星对比</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRealScale(!realScale)}
              className="glow-hover rounded-lg bg-white/10 px-3 py-1.5 text-xs text-white transition-colors hover:bg-white/20"
            >
              {realScale ? '统一比例' : '真实比例'}
            </button>
            <button
              onClick={onClose}
              className="glow-hover rounded-full p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="关闭对比视图"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${selected.length}, 1fr)` }}>
          {selected.map((planet) => (
            <PlanetCard
              key={planet.id}
              planet={planet}
              onRemove={() => removeFromCompare(planet.id)}
            />
          ))}
        </div>

        <div className="mt-6 glass rounded-xl p-4">
          <h3 className="mb-3 text-sm font-medium text-[var(--text-secondary)]">数据对比</h3>
          <CompareBarChart planets={selected} />
        </div>
      </div>
    </div>
  );
}
