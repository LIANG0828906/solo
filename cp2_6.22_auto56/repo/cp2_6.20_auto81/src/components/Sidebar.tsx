import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import type { Attributes } from '../types';

interface AttrBarProps {
  icon: string;
  label: string;
  value: number;
  maxValue?: number;
  prevValue: number;
}

const AttrBar = ({ icon, label, value, maxValue = 100, prevValue }: AttrBarProps) => {
  const [animating, setAnimating] = useState(false);
  const clampedValue = Math.max(0, Math.min(maxValue, value));
  const percent = (clampedValue / maxValue) * 100;

  useEffect(() => {
    if (value !== prevValue) {
      setAnimating(true);
      const t = setTimeout(() => setAnimating(false), 500);
      return () => clearTimeout(t);
    }
  }, [value, prevValue]);

  const getBarColor = () => {
    if (percent < 33) return 'var(--text-danger)';
    if (percent < 66) return 'var(--text-warning)';
    return 'var(--text-success)';
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-mono text-xs uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
            {label}
          </span>
        </div>
        <span
          className={`font-mono text-sm font-bold ${animating ? 'animate-number-roll' : ''}`}
          style={{ color: getBarColor() }}
        >
          {clampedValue}
        </span>
      </div>
      <div
        className="h-2 rounded overflow-hidden"
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}
      >
        <div
          className="h-full rounded transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            background: `linear-gradient(90deg, ${getBarColor()}aa, ${getBarColor()})`,
            boxShadow: `0 0 8px ${getBarColor()}80`,
          }}
        />
      </div>
    </div>
  );
};

const Sidebar = () => {
  const { sidebarOpen, gameState } = useGameStore();
  const [prevAttrs, setPrevAttrs] = useState<Attributes>(gameState.attributes);

  useEffect(() => {
    const timer = setTimeout(() => setPrevAttrs(gameState.attributes), 100);
    return () => clearTimeout(timer);
  }, [gameState.attributes]);

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 md:hidden"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => useGameStore.getState().setSidebarOpen(false)}
        />
      )}

      <aside
        className={`flex-shrink-0 flex flex-col overflow-hidden md:relative z-40 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0 md:w-0 md:opacity-0'
        }`}
        style={{
          width: sidebarOpen ? '280px' : '0',
          backgroundColor: 'var(--bg-secondary)',
          borderLeft: sidebarOpen ? '1px solid var(--border-color)' : 'none',
        }}
      >
        <div className="flex-1 overflow-y-auto p-4">
          <div
            className="font-mono text-sm font-bold mb-4 pb-2 border-b uppercase tracking-wider"
            style={{
              color: 'var(--text-accent)',
              borderColor: 'var(--border-color)',
            }}
          >
            ⚙ 角色状态
          </div>

          <AttrBar
            icon="❤️"
            label="生命值"
            value={gameState.attributes.health}
            prevValue={prevAttrs.health}
          />
          <AttrBar
            icon="🧠"
            label="理智值"
            value={gameState.attributes.sanity}
            prevValue={prevAttrs.sanity}
          />
          <AttrBar
            icon="💰"
            label="金币"
            value={gameState.attributes.gold}
            maxValue={500}
            prevValue={prevAttrs.gold}
          />
          <AttrBar
            icon="✨"
            label="魅力"
            value={gameState.attributes.charisma}
            prevValue={prevAttrs.charisma}
          />

          <div
            className="font-mono text-sm font-bold mb-4 mt-6 pb-2 border-b uppercase tracking-wider"
            style={{
              color: 'var(--text-accent)',
              borderColor: 'var(--border-color)',
            }}
          >
            🎒 背包
          </div>

          {gameState.inventory.length === 0 ? (
            <div
              className="font-mono text-xs italic"
              style={{ color: 'var(--text-secondary)' }}
            >
              (背包空空如也)
            </div>
          ) : (
            <div className="space-y-2">
              {gameState.inventory.map((item) => (
                <div
                  key={item.id}
                  className="font-mono text-xs p-2 rounded"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <div className="font-bold" style={{ color: 'var(--text-accent)' }}>
                    {item.name}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>{item.description}</div>
                </div>
              ))}
            </div>
          )}

          <div
            className="font-mono text-sm font-bold mb-4 mt-6 pb-2 border-b uppercase tracking-wider"
            style={{
              color: 'var(--text-accent)',
              borderColor: 'var(--border-color)',
            }}
          >
            📜 历史记录
          </div>

          <div
            className="font-mono text-xs"
            style={{ color: 'var(--text-secondary)' }}
          >
            已探索 {gameState.history.length} 个场景
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
