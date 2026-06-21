import { useEffect, useState, useCallback } from 'react';
import { Swords, Shield, Sparkles, Layers } from 'lucide-react';
import { useGameContext } from '@/contexts/GameContext';
import { breathAnimation } from '@/utils/animations';
import type { BattleStats } from '@/types/game';

export default function StatsPanel() {
  const { battleState, nextWave } = useGameContext();
  const [animated, setAnimated] = useState<BattleStats>({
    rounds: 0,
    totalDamage: 0,
    totalShield: 0,
    cardsDrawn: 0,
  });

  const stats = battleState.stats;

  const animateTo = useCallback((target: BattleStats) => {
    const duration = 800;
    const startTime = performance.now();
    const from = { ...animated };

    function tick(now: number) {
      const progress = Math.min((now - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setAnimated({
        rounds: Math.round(from.rounds + (target.rounds - from.rounds) * ease),
        totalDamage: Math.round(from.totalDamage + (target.totalDamage - from.totalDamage) * ease),
        totalShield: Math.round(from.totalShield + (target.totalShield - from.totalShield) * ease),
        cardsDrawn: Math.round(from.cardsDrawn + (target.cardsDrawn - from.cardsDrawn) * ease),
      });
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }, [animated]);

  useEffect(() => {
    animateTo(stats);
  }, [stats]);

  if (battleState.phase !== 'victory') return null;

  const items = [
    { icon: Swords, label: '战斗回合', value: animated.rounds, color: '#FF4D4D' },
    { icon: Swords, label: '总伤害', value: animated.totalDamage, color: '#FFD700' },
    { icon: Shield, label: '总护盾', value: animated.totalShield, color: '#4D79FF' },
    { icon: Layers, label: '抽牌数', value: animated.cardsDrawn, color: '#9B59B6' },
  ];

  return (
    <>
      <style>{breathAnimation()}</style>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fade-in">
        <div
          className="w-full max-w-md rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(45, 27, 78, 0.85)',
            backdropFilter: 'blur(5px)',
            WebkitBackdropFilter: 'blur(5px)',
          }}
        >
          <h2 className="text-3xl font-bold text-yellow-400 mb-6">🎉 胜利！</h2>

          <div className="grid grid-cols-2 gap-4 mb-8">
            {items.map((item) => (
              <div
                key={item.label}
                className="rounded-xl p-4"
                style={{ background: 'rgba(26, 15, 46, 0.6)' }}
              >
                <item.icon className="mx-auto mb-2" size={24} color={item.color} />
                <div className="text-3xl font-bold text-white">{item.value}</div>
                <div className="text-xs text-white/60 mt-1">{item.label}</div>
              </div>
            ))}
          </div>

          <button
            className="w-full py-3 rounded-xl text-white font-bold text-lg"
            style={{
              background: 'linear-gradient(135deg, #4a3075, #6b4c9a)',
              animation: 'breath 2s ease-in-out infinite',
            }}
            onClick={nextWave}
          >
            下一波
          </button>
        </div>
      </div>
    </>
  );
}
