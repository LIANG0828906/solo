import { useEffect, useState, useMemo } from 'react';
import { useAttackStore, toggleSimulation } from '../data/generator';
import type { FilterType, TopCountryEntry } from '../data/types';
import { Play, Pause, Shield, Activity, Zap } from 'lucide-react';

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

function useTickingNumber(target: number, speed = 200): number {
  const [current, setCurrent] = useState(target);

  useEffect(() => {
    if (current === target) return;
    const diff = target - current;
    const step = Math.max(0.5, Math.abs(diff) / speed);
    const direction = diff > 0 ? 1 : -1;
    const interval = setInterval(() => {
      setCurrent((prev) => {
        const next = prev + step * direction;
        if ((direction > 0 && next >= target) || (direction < 0 && next <= target)) {
          return target;
        }
        return next;
      });
    }, 16);
    return () => clearInterval(interval);
  }, [target]);

  return current;
}

function TopCountryRow({
  entry,
  index,
  side,
}: {
  entry: TopCountryEntry;
  index: number;
  side: 'left' | 'right';
}) {
  const [mounted, setMounted] = useState(false);
  const [displayCount, setDisplayCount] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), index * 120);
    return () => clearTimeout(timer);
  }, [index, entry.country]);

  useEffect(() => {
    setDisplayCount(entry.count);
  }, [entry.count]);

  return (
    <div
      className="flex items-center justify-between py-1.5 px-3 rounded-md transition-all duration-500 ease-out"
      style={{
        background: 'rgba(0, 212, 255, 0.06)',
        borderLeft: '2px solid rgba(0, 212, 255, 0.3)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateX(0)' : side === 'left' ? 'translateX(-12px)' : 'translateX(12px)',
      }}
    >
      <span
        className="text-sm truncate mr-2"
        style={{
          color: '#a0e0ff',
          fontFamily: "'Share Tech Mono', monospace",
        }}
      >
        {String(index + 1).padStart(2, '0')}. {entry.country}
      </span>
      <span
        className="text-sm font-bold flex-shrink-0"
        style={{
          color: '#ff4060',
          fontFamily: "'Share Tech Mono', monospace",
          textShadow: '0 0 8px rgba(255, 0, 64, 0.4)',
        }}
      >
        {formatNumber(displayCount)}
      </span>
    </div>
  );
}

const filterOptions: { value: FilterType; label: string }[] = [
  { value: 'ALL', label: 'ALL' },
  { value: 'DDoS', label: 'DDoS' },
  { value: 'DoS', label: 'DoS' },
  { value: 'Scan', label: 'SCAN' },
];

export default function ControlPanel() {
  const isRunning = useAttackStore((s) => s.isRunning);
  const filterType = useAttackStore((s) => s.filterType);
  const setFilter = useAttackStore((s) => s.setFilter);
  const stats = useAttackStore((s) => s.stats);

  const tickingTotal = useTickingNumber(stats.totalAttacks, 150);
  const tickingPeak = useTickingNumber(stats.peakBandwidth, 120);

  const topCountries = useMemo(() => {
    const result = [...stats.topTargetCountries];
    const placeholderCountries = [
      'United States',
      'United Kingdom',
      'Germany',
      'Japan',
      'South Korea',
    ];
    if (result.length === 0) {
      return placeholderCountries.map((country, i) => ({
        country,
        count: Math.floor(Math.random() * 5) + i,
      }));
    }
    while (result.length < 5) {
      const idx = result.length;
      result.push({ country: placeholderCountries[idx] || `Region ${idx + 1}`, count: 0 });
    }
    return result.slice(0, 5);
  }, [stats.topTargetCountries]);

  const handleToggle = () => {
    toggleSimulation();
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        padding: '24px',
        paddingTop: '60px',
        background: 'linear-gradient(to top, rgba(10, 10, 26, 0.95) 0%, rgba(10, 10, 26, 0.7) 50%, transparent 100%)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          borderRadius: '16px',
          padding: '24px',
          border: '1px solid rgba(255, 0, 64, 0.25)',
          background: 'rgba(15, 15, 35, 0.5)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 40px rgba(255, 0, 64, 0.08), inset 0 1px 0 rgba(0, 212, 255, 0.1)',
          pointerEvents: 'auto',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} style={{ color: '#00d4ff' }} />
            <h2
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 'bold',
                letterSpacing: '2px',
                fontFamily: "'Share Tech Mono', monospace",
                color: '#00d4ff',
                textShadow: '0 0 12px rgba(0, 212, 255, 0.5)',
              }}
            >
              GLOBAL DDoS MONITOR
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                gap: '4px',
                borderRadius: '8px',
                padding: '4px',
                background: 'rgba(0, 0, 0, 0.3)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              {filterOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    letterSpacing: '1px',
                    transition: 'all 0.3s ease',
                    fontFamily: "'Share Tech Mono', monospace",
                    background: filterType === opt.value ? 'rgba(255, 0, 64, 0.85)' : 'transparent',
                    color: filterType === opt.value ? '#ffffff' : 'rgba(255, 255, 255, 0.6)',
                    boxShadow: filterType === opt.value ? '0 0 12px rgba(255, 0, 64, 0.5)' : 'none',
                    cursor: 'pointer',
                    border: 'none',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={handleToggle}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
                background: isRunning ? 'rgba(0, 212, 255, 0.15)' : 'rgba(255, 0, 64, 0.15)',
                border: `1px solid ${isRunning ? 'rgba(0, 212, 255, 0.5)' : 'rgba(255, 0, 64, 0.5)'}`,
                boxShadow: isRunning
                  ? '0 0 15px rgba(0, 212, 255, 0.3)'
                  : '0 0 15px rgba(255, 0, 64, 0.3)',
                color: isRunning ? '#00d4ff' : '#ff0040',
              }}
            >
              {isRunning ? <Pause size={18} /> : <Play size={18} />}
            </button>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1.5fr',
            gap: '16px',
          }}
        >
          <div
            style={{
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(255, 0, 64, 0.2)',
              background: 'rgba(255, 0, 64, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Activity size={16} style={{ color: '#ff0040' }} />
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              >
                Total Attacks
              </span>
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                fontFamily: "'Share Tech Mono', monospace",
                color: '#ff0040',
                textShadow: '0 0 20px rgba(255, 0, 64, 0.6)',
                lineHeight: 1,
              }}
            >
              {formatNumber(tickingTotal)}
            </div>
          </div>

          <div
            style={{
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(0, 212, 255, 0.2)',
              background: 'rgba(0, 212, 255, 0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <Zap size={16} style={{ color: '#00d4ff' }} />
              <span
                style={{
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  color: 'rgba(255, 255, 255, 0.5)',
                  fontFamily: "'Share Tech Mono', monospace",
                }}
              >
                Peak Bandwidth
              </span>
            </div>
            <div
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                fontFamily: "'Share Tech Mono', monospace",
                color: '#00d4ff',
                textShadow: '0 0 20px rgba(0, 212, 255, 0.6)',
                lineHeight: 1,
              }}
            >
              {tickingPeak.toFixed(1)}
              <span style={{ fontSize: '16px', marginLeft: '6px', opacity: 0.7 }}>Gbps</span>
            </div>
          </div>

          <div
            style={{
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid rgba(138, 43, 226, 0.2)',
              background: 'rgba(138, 43, 226, 0.04)',
            }}
          >
            <div
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '1.5px',
                marginBottom: '10px',
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: "'Share Tech Mono', monospace",
              }}
            >
              Top Target Countries
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {topCountries.map((entry, i) => (
                <TopCountryRow
                  key={`${entry.country}-${i}`}
                  entry={entry}
                  index={i}
                  side={i % 2 === 0 ? 'left' : 'right'}
                />
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '2px',
              fontFamily: "'Share Tech Mono', monospace",
              color: isRunning ? 'rgba(0, 212, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)',
            }}
          >
            {isRunning ? '● LIVE ' : '○ PAUSED '}
            <span style={{ opacity: 0.5 }}>• DATA REFRESH EVERY 500MS</span>
          </span>
        </div>
      </div>
    </div>
  );
}
