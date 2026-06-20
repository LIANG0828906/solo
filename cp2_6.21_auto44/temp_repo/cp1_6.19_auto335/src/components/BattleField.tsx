import { useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { useBattleStore } from '../store/battleStore';
import { STATUS_CONFIG, StatusEffectType, FloatingNumber } from '../engine/types';

function HPBar({ current, max, color, label }: { current: number; max: number; color: string; label: string }) {
  const motionVal = useMotionValue(current);
  const width = useTransform(motionVal, [0, max], [0, 100]);

  useEffect(() => {
    animate(motionVal, current, { duration: 0.5, ease: 'easeInOut' });
  }, [current, motionVal]);

  return (
    <div style={{ marginBottom: '4px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '2px', color: '#ccc' }}>
        <span>{label}</span>
        <span>{Math.max(0, Math.round(current))} / {max}</span>
      </div>
      <div style={{
        width: '100%',
        height: '12px',
        background: '#333',
        borderRadius: '6px',
        overflow: 'hidden',
        position: 'relative',
      }}>
        <motion.div
          style={{
            width,
            height: '100%',
            background: color,
            borderRadius: '6px',
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </div>
    </div>
  );
}

function StatusIcons({ effects }: { effects: { type: StatusEffectType; duration: number; stacks: number }[] }) {
  return (
    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
      {effects.map((effect) => {
        const config = STATUS_CONFIG[effect.type];
        return (
          <div
            key={effect.type}
            style={{
              background: `${config.color}33`,
              border: `1px solid ${config.color}`,
              borderRadius: '4px',
              padding: '2px 6px',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px',
            }}
            title={`${config.name}: ${effect.stacks}层, 剩余${effect.duration}回合`}
          >
            <span>{config.icon}</span>
            <span style={{ color: config.color }}>{effect.duration}</span>
          </div>
        );
      })}
    </div>
  );
}

function FloatingNumbers({ numbers, side }: { numbers: FloatingNumber[]; side: 'player' | 'enemy' }) {
  const filtered = numbers.filter((n) => n.target === side);
  return (
    <>
      {filtered.map((fn) => (
        <div
          key={fn.id}
          className={`float-number ${fn.type}`}
          style={{
            left: '50%',
            top: '30%',
            transform: 'translateX(-50%)',
          }}
        >
          {fn.type === 'damage' ? '-' : '+'}{Math.round(fn.value)}
        </div>
      ))}
    </>
  );
}

export default function BattleField() {
  const player = useBattleStore((s) => s.player);
  const enemy = useBattleStore((s) => s.enemy);
  const floatingNumbers = useBattleStore((s) => s.floatingNumbers);
  const turnCount = useBattleStore((s) => s.turnCount);
  const clearFloatingNumbers = useBattleStore((s) => s.clearFloatingNumbers);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (floatingNumbers.length > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        clearFloatingNumbers();
      }, 1100);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [floatingNumbers, clearFloatingNumbers]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 24px',
      position: 'relative',
    }}>
      <div style={{
        textAlign: 'center',
        fontFamily: "'Orbitron', sans-serif",
        fontSize: '12px',
        color: '#666',
        letterSpacing: '2px',
        marginBottom: '12px',
      }}>
        ROUND {turnCount}
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '40px',
      }}>
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}>
          <motion.div
            animate={{
              x: player.isFrozen ? [0, -4, 4, -4, 4, 0] : 0,
            }}
            transition={{ duration: 0.4 }}
          >
            <div style={{
              fontSize: '64px',
              textAlign: 'center',
              filter: player.isFrozen ? 'hue-rotate(180deg) brightness(0.7)' : 'none',
              marginBottom: '8px',
            }}>
              👨‍🔧
            </div>
          </motion.div>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            color: '#42A5F5',
            marginBottom: '8px',
            textAlign: 'center',
          }}>
            玩家
          </div>
          <div style={{ width: '180px' }}>
            <HPBar current={player.hp} max={player.maxHp} color="#4CAF50" label="HP" />
            <HPBar current={player.mp} max={player.maxMp} color="#42A5F5" label="MP" />
            <HPBar current={player.shield} max={player.maxHp} color="#FFC107" label="盾" />
          </div>
          <StatusIcons effects={player.statusEffects} />
          <FloatingNumbers numbers={floatingNumbers} side="player" />
        </div>

        <div style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: '24px',
          fontWeight: 900,
          color: '#E53935',
          textShadow: '0 0 20px rgba(229,57,53,0.4)',
          letterSpacing: '4px',
        }}>
          VS
        </div>

        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          position: 'relative',
        }}>
          <motion.div
            animate={{
              x: enemy.isFrozen ? [0, -4, 4, -4, 4, 0] : 0,
            }}
            transition={{ duration: 0.4 }}
          >
            <div style={{
              fontSize: '64px',
              textAlign: 'center',
              filter: enemy.isFrozen ? 'hue-rotate(180deg) brightness(0.7)' : 'none',
              marginBottom: '8px',
            }}>
              👾
            </div>
          </motion.div>
          <div style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '14px',
            fontWeight: 700,
            color: '#EF5350',
            marginBottom: '8px',
            textAlign: 'center',
          }}>
            AI
          </div>
          <div style={{ width: '180px' }}>
            <HPBar current={enemy.hp} max={enemy.maxHp} color="#4CAF50" label="HP" />
            <HPBar current={enemy.mp} max={enemy.maxMp} color="#42A5F5" label="MP" />
            <HPBar current={enemy.shield} max={enemy.maxHp} color="#FFC107" label="盾" />
          </div>
          <StatusIcons effects={enemy.statusEffects} />
          <FloatingNumbers numbers={floatingNumbers} side="enemy" />
        </div>
      </div>
    </div>
  );
}
