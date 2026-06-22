import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useRef, useState, useEffect } from 'react';
import {
  ELIXIR_ARRAY,
  getEmojiById,
  getNameById,
  type ElementType,
  type Elixir,
  type ChainProduct,
} from './elixirSystem';
import {
  getResistanceLabelColor,
  getResistanceLabelText,
  type Monster,
} from './monsterSystem';
import type { CombatResult } from './combatSimulator';

export interface Particle {
  id: number;
  angle: number;
  distance: number;
  size: number;
  delay: number;
  color: string;
}

export const TopStatusBar: React.FC<{
  wave: number;
  totalWaves: number;
  turn: number;
  timeLeft: number;
  maxTime: number;
  playerHp: number;
  playerMaxHp: number;
}> = ({ wave, totalWaves, turn, timeLeft, maxTime, playerHp, playerMaxHp }) => {
  const hpPercent = Math.max(0, (playerHp / playerMaxHp) * 100);
  const timePercent = Math.max(0, (timeLeft / maxTime) * 100);
  const isUrgent = timeLeft <= 5;

  return (
    <div style={styles.topBar}>
      <div style={styles.waveInfo}>
        <span style={styles.waveLabel}>波次</span>
        <span style={styles.waveValue}>
          {wave} / {totalWaves}
        </span>
        <span style={styles.turnInfo}>· 第 {turn} 回合</span>
      </div>

      <div style={styles.timerWrapper}>
        <AnimatePresence mode="wait">
          <motion.div
            key={timeLeft}
            initial={{ rotateX: 90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: -90, opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              ...styles.timerValue,
              color: isUrgent ? '#F44336' : '#FF9800',
            }}
          >
            {String(timeLeft).padStart(2, '0')}s
          </motion.div>
        </AnimatePresence>
        <div style={styles.timerBarBg}>
          <motion.div
            style={{
              ...styles.timerBarFill,
              width: `${timePercent}%`,
              backgroundColor: isUrgent ? '#F44336' : '#FF9800',
            }}
            animate={isUrgent ? { scale: [1, 1.05, 1] } : {}}
            transition={{ repeat: isUrgent ? Infinity : 0, duration: 0.6 }}
          />
        </div>
        {isUrgent && (
          <motion.div
            style={styles.urgentLabel}
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
          >
            时间紧迫！
          </motion.div>
        )}
      </div>

      <div style={styles.playerHpWrapper}>
        <span style={styles.hpLabel}>🧙 炼金术士</span>
        <div style={styles.hpBarBg}>
          <motion.div
            style={{
              ...styles.hpBarFill,
              width: `${hpPercent}%`,
            }}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span style={styles.hpValue}>
          {playerHp} / {playerMaxHp}
        </span>
      </div>
    </div>
  );
};

export const ElixirPanel: React.FC<{
  selectedSequence: ElementType[];
  minSlots: number;
  maxSlots: number;
  disabled: boolean;
  onSelect: (elixir: ElementType) => void;
  onRemoveAt: (index: number) => void;
  onConfirm: () => void;
  onClear: () => void;
}> = ({
  selectedSequence,
  minSlots,
  maxSlots,
  disabled,
  onSelect,
  onRemoveAt,
  onConfirm,
  onClear,
}) => {
  const [ripples, setRipples] = useState<Record<string, number>>({});
  const canConfirm = selectedSequence.length >= minSlots && !disabled;

  const handleElixirClick = (e: React.MouseEvent<HTMLButtonElement>, elixir: Elixir) => {
    if (disabled || selectedSequence.length >= maxSlots) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rippleKey = `${elixir.id}_${Date.now()}_${x}_${y}`;
    setRipples((prev) => ({ ...prev, [rippleKey]: Date.now() }));
    setTimeout(() => {
      setRipples((prev) => {
        const next = { ...prev };
        delete next[rippleKey];
        return next;
      });
    }, 600);
    onSelect(elixir.id);
  };

  return (
    <div style={styles.elixirPanel}>
      <div style={styles.panelTitle}>⚗️ 药剂选择</div>

      <div style={styles.elixirGrid}>
        {ELIXIR_ARRAY.map((elixir) => {
          const isFull = selectedSequence.length >= maxSlots;
          return (
            <motion.button
              key={elixir.id}
              onClick={(e) => handleElixirClick(e, elixir)}
              disabled={disabled || isFull}
              whileHover={disabled || isFull ? {} : { scale: 1.15 }}
              whileTap={disabled || isFull ? {} : { scale: 0.95 }}
              transition={{ duration: 0.2 }}
              title={`${elixir.name} · 基础伤害 ${elixir.baseDamage}`}
              style={{
                ...styles.elixirButton,
                backgroundColor: elixir.color,
                boxShadow: `0 0 18px ${elixir.glowColor}`,
                opacity: disabled || isFull ? 0.4 : 1,
                cursor: disabled || isFull ? 'not-allowed' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <span style={styles.elixirEmoji}>{elixir.emoji}</span>
              {Object.keys(ripples)
                .filter((k) => k.startsWith(elixir.id))
                .map((key) => {
                  const parts = key.split('_');
                  const rx = Number(parts[2]) || 24;
                  const ry = Number(parts[3]) || 24;
                  return (
                    <motion.span
                      key={key}
                      initial={{
                        left: rx - 5,
                        top: ry - 5,
                        width: 10,
                        height: 10,
                        opacity: 0.7,
                      }}
                      animate={{
                        left: rx - 60,
                        top: ry - 60,
                        width: 120,
                        height: 120,
                        opacity: 0,
                      }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      style={{
                        position: 'absolute',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.6)',
                        pointerEvents: 'none',
                      }}
                    />
                  );
                })}
            </motion.button>
          );
        })}
      </div>

      <div style={styles.elixirNamesRow}>
        {ELIXIR_ARRAY.map((e) => (
          <div key={e.id} style={styles.elixirName}>
            {e.name}
          </div>
        ))}
      </div>

      <div style={styles.sequenceLabel}>
        序列 ({selectedSequence.length}/{maxSlots})
        {selectedSequence.length < minSlots && !disabled && (
          <span style={styles.hintText}> · 至少 {minSlots} 个</span>
        )}
      </div>

      <div style={styles.sequenceSlotsRow}>
        {Array.from({ length: maxSlots }).map((_, idx) => {
          const selected = selectedSequence[idx];
          if (!selected) {
            return (
              <div key={`slot-${idx}`} style={styles.emptySlot}>
                {idx + 1}
              </div>
            );
          }
          const elixirData = ELIXIR_ARRAY.find((e) => e.id === selected)!;
          return (
            <motion.button
              key={`slot-${idx}-${selected}`}
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 280, damping: 20 }}
              onClick={() => !disabled && onRemoveAt(idx)}
              disabled={disabled}
              title={`点击移除 ${elixirData.name}`}
              style={{
                ...styles.filledSlot,
                backgroundColor: elixirData.color,
                boxShadow: `0 0 10px ${elixirData.glowColor}`,
                cursor: disabled ? 'default' : 'pointer',
              }}
            >
              {elixirData.emoji}
            </motion.button>
          );
        })}
      </div>

      <div style={styles.actionRow}>
        <motion.button
          onClick={onClear}
          disabled={disabled || selectedSequence.length === 0}
          whileHover={disabled || selectedSequence.length === 0 ? {} : { scale: 1.05 }}
          whileTap={disabled || selectedSequence.length === 0 ? {} : { scale: 0.97 }}
          style={{
            ...styles.actionBtn,
            ...styles.clearBtn,
            opacity: disabled || selectedSequence.length === 0 ? 0.5 : 1,
            cursor: disabled || selectedSequence.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          清空
        </motion.button>
        <motion.button
          onClick={onConfirm}
          disabled={!canConfirm}
          whileHover={canConfirm ? { scale: 1.05 } : {}}
          whileTap={canConfirm ? { scale: 0.97 } : {}}
          animate={canConfirm ? { boxShadow: ['0 0 15px #FF9800', '0 0 25px #FF5722', '0 0 15px #FF9800'] } : {}}
          transition={{ repeat: canConfirm ? Infinity : 0, duration: 1.5 }}
          style={{
            ...styles.actionBtn,
            ...styles.confirmBtn,
            opacity: canConfirm ? 1 : 0.5,
            cursor: canConfirm ? 'pointer' : 'not-allowed',
          }}
        >
          施放 ✨
        </motion.button>
      </div>
    </div>
  );
};

export const MonsterCard: React.FC<{
  monster: Monster;
  isShaking: boolean;
  isFlashWhite: boolean;
}> = ({ monster, isShaking, isFlashWhite }) => {
  const hpPercent = Math.max(0, (monster.currentHp / monster.maxHp) * 100);
  const elements: ElementType[] = ['fire', 'frost', 'lightning', 'life', 'shadow'];
  const elementEmojis: Record<ElementType, string> = {
    fire: '🔥',
    frost: '❄️',
    lightning: '⚡',
    life: '💚',
    shadow: '🌑',
  };

  return (
    <motion.div
      style={styles.monsterCard}
      animate={isShaking ? { x: [0, -5, 5, -5, 5, 0] } : { x: 0 }}
      transition={{ duration: 0.5, ease: 'easeInOut' }}
    >
      <div style={styles.monsterNameRow}>
        <span style={styles.monsterWaveTag}>第{monster.wave}波</span>
        <span style={styles.monsterName}>{monster.name}</span>
      </div>

      <div style={styles.monsterEmojiBox}>
        <motion.span
          style={styles.monsterEmoji}
          animate={{
            y: [0, -6, 0],
          }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        >
          {monster.emoji}
        </motion.span>
        {isFlashWhite && (
          <motion.div
            style={styles.flashOverlay}
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          />
        )}
      </div>

      <div style={styles.monsterHpRow}>
        <span style={styles.monsterHpLabel}>HP</span>
        <div style={styles.monsterHpBg}>
          <motion.div
            style={{
              ...styles.monsterHpFill,
              width: `${hpPercent}%`,
            }}
            animate={{ width: `${hpPercent}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
          />
        </div>
        <span style={styles.monsterHpValue}>
          {monster.currentHp}/{monster.maxHp}
        </span>
      </div>

      <div style={styles.monsterAttackRow}>
        攻击: <span style={styles.attackValue}>{monster.attackDamage}</span>
      </div>

      <div style={styles.resistanceSection}>
        <div style={styles.resistanceTitle}>元素抗性</div>
        <div style={styles.resistanceGrid}>
          {elements.map((el) => {
            const tier = monster.resistances[el];
            return (
              <div key={el} style={styles.resistanceItem}>
                <span style={styles.resistanceElemEmoji}>{elementEmojis[el]}</span>
                <span
                  style={{
                    ...styles.resistanceTierTag,
                    backgroundColor: getResistanceLabelColor(tier),
                  }}
                >
                  {getResistanceLabelText(tier)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

export const BattleArena: React.FC<{
  animatingStep: number | null;
  combatResult: CombatResult | null;
  monster: Monster;
  onAllStepsDone: () => void;
}> = ({ animatingStep, combatResult, monster, onAllStepsDone }) => {
  const step =
    animatingStep !== null && combatResult ? combatResult.steps[animatingStep] : null;
  const product = step?.output ?? null;
  const particleCount = useMemo(() => {
    const base = typeof window !== 'undefined' && window.devicePixelRatio > 1.5 ? 80 : 65;
    return base;
  }, []);

  const particles: Particle[] = useMemo(() => {
    const arr: Particle[] = [];
    for (let i = 0; i < particleCount; i++) {
      arr.push({
        id: i,
        angle: (Math.PI * 2 * i) / particleCount + Math.random() * 0.3,
        distance: 120 + Math.random() * 180,
        size: 4 + Math.random() * 8,
        delay: Math.random() * 0.25,
        color: product?.color ?? '#FF9800',
      });
    }
    return arr;
  }, [particleCount, animatingStep, product?.color]);

  const phaseKey = animatingStep ?? 'idle';
  const doneTriggeredRef = useRef<number | null>(null);
  useEffect(() => {
    if (animatingStep === null || !combatResult) return;
    if (doneTriggeredRef.current === animatingStep) return;
    doneTriggeredRef.current = animatingStep;
    const timer = setTimeout(() => {
      onAllStepsDone();
    }, 1500);
    return () => clearTimeout(timer);
  }, [animatingStep, combatResult, onAllStepsDone]);

  return (
    <div style={styles.battleArena}>
      <div style={styles.arenaGlow} />
      <AnimatePresence>
        {animatingStep !== null && step && (
          <motion.div
            key={`arena-${phaseKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.2 }}
              animate={{ opacity: [0, 0.6, 0], scale: [0.2, 2.4, 4] }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
              style={{
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${product?.glowColor ?? 'rgba(255,255,255,0.6)'} 0%, transparent 70%)`,
                position: 'absolute',
                filter: 'blur(8px)',
              }}
            />

            <motion.div
              initial={{ x: -300, y: -80, opacity: 0, scale: 0.6 }}
              animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              transition={{ duration: 0.55, ease: 'easeInOut' }}
              style={{ position: 'absolute', fontSize: 54, filter: 'drop-shadow(0 0 10px ' + (step.inputs[0] ? getElemColor(step.inputs[0]) : '#fff') + ')' }}
            >
              {getEmojiById(step.inputs[0] ?? '')}
            </motion.div>
            {step.inputs[1] && (
              <motion.div
                initial={{ x: 300, y: -80, opacity: 0, scale: 0.6 }}
                animate={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                transition={{ duration: 0.55, ease: 'easeInOut' }}
                style={{ position: 'absolute', fontSize: 54, filter: 'drop-shadow(0 0 10px ' + getElemColor(step.inputs[1]) + ')' }}
              >
                {getEmojiById(step.inputs[1])}
              </motion.div>
            )}

            <motion.div
              initial={{ scale: 0, rotate: -180, opacity: 0 }}
              animate={{ scale: 1.3, rotate: 0, opacity: 1 }}
              transition={{ delay: 0.55, duration: 0.5, type: 'spring', stiffness: 260, damping: 18 }}
              style={{
                position: 'absolute',
                fontSize: 90,
                filter: `drop-shadow(0 0 25px ${product?.color ?? '#FFD700'})`,
                zIndex: 3,
              }}
            >
              {product?.emoji ?? '💫'}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              style={{
                position: 'absolute',
                bottom: 130,
                padding: '8px 22px',
                borderRadius: 24,
                backgroundColor: 'rgba(0,0,0,0.75)',
                border: `2px solid ${product?.color ?? '#FF9800'}`,
                color: '#FFF',
                fontWeight: 700,
                fontSize: 18,
                zIndex: 4,
              }}
            >
              {product?.name ?? getNameById(step.inputs[0] ?? '')}
              {step.weaknessHit.length > 0 && (
                <span style={{ marginLeft: 10, color: '#FFEB3B' }}>弱点 ×2!</span>
              )}
              <span style={{ marginLeft: 10, color: '#FF5252' }}>-{step.finalDamage}HP</span>
            </motion.div>

            {particles.map((p) => (
              <motion.span
                key={p.id}
                initial={{
                  x: Math.cos(p.angle) * 10,
                  y: Math.sin(p.angle) * 10,
                  scale: 0,
                  opacity: 1,
                }}
                animate={{
                  x: Math.cos(p.angle) * p.distance,
                  y: Math.sin(p.angle) * p.distance,
                  scale: 1,
                  opacity: 0,
                }}
                transition={{
                  delay: 0.55 + p.delay,
                  duration: 0.9,
                  ease: 'easeOut',
                }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  borderRadius: '50%',
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  zIndex: 2,
                }}
              />
            ))}

            {product?.id === 'storm_cloud' || product?.id === 'spark_shadow' || product?.id === 'lightning' ? (
              <>
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={`lightning-${i}`}
                    initial={{ opacity: 0, scaleY: 0 }}
                    animate={{ opacity: [0, 1, 0, 1, 0], scaleY: [0, 1, 1, 1, 0] }}
                    transition={{
                      delay: 0.6 + i * 0.12,
                      duration: 0.5,
                    }}
                    style={{
                      position: 'absolute',
                      width: 3,
                      height: 180,
                      background:
                        'linear-gradient(to bottom, #FFEB3B, rgba(255,235,59,0.1))',
                      boxShadow: '0 0 20px #FFEB3B',
                      left: `${35 + i * 10}%`,
                      top: '15%',
                      transformOrigin: 'top center',
                      zIndex: 1,
                    }}
                  />
                ))}
              </>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {animatingStep === null && combatResult && combatResult.steps.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: 'absolute',
            bottom: 160,
            padding: '14px 28px',
            borderRadius: 18,
            backgroundColor: 'rgba(0,0,0,0.8)',
            border: '2px solid #FF9800',
            color: '#FFF',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 14, opacity: 0.8 }}>本次攻击总伤害</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#FF5252', marginTop: 4 }}>
            -{combatResult.finalDamage}
          </div>
          {combatResult.totalWeaknessHits > 0 && (
            <div style={{ fontSize: 13, color: '#FFEB3B', marginTop: 4 }}>
              触发 {combatResult.totalWeaknessHits} 次弱点！
            </div>
          )}
          {combatResult.monsterDefeated && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring' }}
              style={{
                marginTop: 10,
                padding: '6px 14px',
                borderRadius: 12,
                background:
                  'linear-gradient(90deg, #FFD54F, #FF9800)',
                color: '#2E1A0F',
                fontWeight: 800,
                fontSize: 15,
              }}
            >
              🎉 {monster.name} 被击败！
            </motion.div>
          )}
        </motion.div>
      )}

      {animatingStep === null && !combatResult && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            pointerEvents: 'none',
          }}
        >
          <motion.div
            animate={{ y: [0, -10, 0], opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
            style={{ fontSize: 90, opacity: 0.5 }}
          >
            🧙‍♂️
          </motion.div>
          <div
            style={{
              marginTop: 16,
              fontSize: 18,
              color: '#D7B899',
              letterSpacing: 2,
              opacity: 0.85,
            }}
          >
            在左侧选择药剂 · 触发连锁反应
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 13,
              color: '#9B8166',
            }}
          >
            提示：火焰+冰霜=蒸汽，蒸汽+闪电=雷暴云！
          </div>
        </motion.div>
      )}
    </div>
  );
};

const getElemColor = (id: string): string => {
  const map: Record<string, string> = {
    fire: '#FF5722',
    frost: '#03A9F4',
    lightning: '#FFEB3B',
    life: '#4CAF50',
    shadow: '#9C27B0',
  };
  return map[id] ?? '#FFFFFF';
};

export const ChainProductBar: React.FC<{
  history: Array<{ product: ChainProduct; damage: number; weakness: number }>;
}> = ({ history }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [history.length]);

  return (
    <div style={styles.chainBarWrapper}>
      <div style={styles.chainBarTitle}>连锁产物记录</div>
      <div ref={scrollRef} style={styles.chainBarScroll}>
        {history.length === 0 && (
          <div style={styles.emptyChainHint}>尚未触发连锁反应 · 组合不同元素试试！</div>
        )}
        {history.map((item, idx) => (
          <motion.div
            key={`${item.product.id}-${idx}`}
            initial={{ x: 60, opacity: 0, scale: 0.8 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            style={{
              ...styles.chainItem,
              borderColor: item.product.color,
              boxShadow: `0 0 12px ${item.product.glowColor}`,
              flexShrink: 0,
            }}
          >
            <span style={styles.chainItemEmoji}>{item.product.emoji}</span>
            <div style={styles.chainItemInfo}>
              <div style={{ fontWeight: 700, color: item.product.color }}>
                {item.product.name}
              </div>
              <div style={{ fontSize: 12, color: '#C9B48E', marginTop: 2 }}>
                伤害 {item.damage}
                {item.weakness > 0 && <span style={{ color: '#FFEB3B' }}> · 弱点</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const GameOverlay: React.FC<{
  phase: 'wave_cleared' | 'victory' | 'defeat' | null;
  wave: number;
  totalWaves: number;
  onContinue: () => void;
  onRestart: () => void;
}> = ({ phase, wave, totalWaves, onContinue, onRestart }) => {
  if (phase === null) return null;
  let title = '';
  let subtitle = '';
  let emoji = '';
  let actionLabel = '';
  let action = onRestart;
  let accentColor = '#FF9800';
  if (phase === 'wave_cleared') {
    title = `第 ${wave} 波通过！`;
    subtitle = wave < totalWaves ? `下一波魔物即将出现（血量 +20%）` : '最终波次完成！';
    emoji = '🏆';
    actionLabel = wave < totalWaves ? '进入下一波' : '查看胜利';
    action = onContinue;
    accentColor = '#FFD54F';
  } else if (phase === 'victory') {
    title = '伟大的炼金术士！';
    subtitle = `你成功击退了所有 ${totalWaves} 波魔物 · 荣耀归于实验室！`;
    emoji = '👑';
    actionLabel = '再来一局';
    accentColor = '#FFD54F';
  } else if (phase === 'defeat') {
    title = '实验失败...';
    subtitle = `你在第 ${wave} 波倒下了 · 调整药剂组合再次挑战吧`;
    emoji = '💀';
    actionLabel = '重新开始';
    accentColor = '#F44336';
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={styles.overlayBg}
    >
      <motion.div
        initial={{ scale: 0.7, rotateX: -40, opacity: 0 }}
        animate={{ scale: 1, rotateX: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
        style={{
          ...styles.overlayCard,
          borderColor: accentColor,
          boxShadow: `0 0 60px ${accentColor}66`,
        }}
      >
        <motion.div
          animate={{ rotate: [0, -8, 8, 0], scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          style={{ fontSize: 100 }}
        >
          {emoji}
        </motion.div>
        <div style={{ ...styles.overlayTitle, color: accentColor }}>{title}</div>
        <div style={styles.overlaySub}>{subtitle}</div>
        <motion.button
          onClick={action}
          whileHover={{ scale: 1.06 }}
          whileTap={{ scale: 0.97 }}
          style={{
            ...styles.overlayBtn,
            background: `linear-gradient(135deg, ${accentColor}, #FF5722)`,
          }}
        >
          {actionLabel}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 24,
    padding: '14px 28px',
    background: 'linear-gradient(180deg, #1A0D08 0%, #2E1A0F 100%)',
    borderBottom: '2px solid #5C3A21',
    color: '#F3E5D5',
    flexWrap: 'wrap',
  },
  waveInfo: { display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 180 },
  waveLabel: { fontSize: 13, opacity: 0.7 },
  waveValue: { fontSize: 22, fontWeight: 900, color: '#FFD54F' },
  turnInfo: { fontSize: 14, opacity: 0.8, marginLeft: 8 },
  timerWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 6,
    minWidth: 180,
  },
  timerValue: {
    fontFamily: "'Courier New', monospace",
    fontSize: 36,
    fontWeight: 900,
    letterSpacing: 3,
    perspective: 400,
  },
  timerBarBg: {
    width: 140,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  timerBarFill: { height: '100%', borderRadius: 3 },
  urgentLabel: { fontSize: 11, color: '#F44336', fontWeight: 700, letterSpacing: 1 },
  playerHpWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 4,
    minWidth: 200,
  },
  hpLabel: { fontSize: 13, opacity: 0.85 },
  hpBarBg: {
    width: '100%',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  hpBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
    borderRadius: 5,
  },
  hpValue: { fontSize: 13, fontFamily: "'Courier New', monospace", opacity: 0.85 },

  elixirPanel: {
    width: 280,
    backgroundColor: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(8px)',
    borderRadius: 16,
    padding: 20,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
    color: '#F3E5D5',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    border: '1px solid rgba(255,215,150,0.15)',
    flexShrink: 0,
  },
  panelTitle: {
    fontSize: 18,
    fontWeight: 800,
    color: '#FFD54F',
    letterSpacing: 1,
    textAlign: 'center',
    paddingBottom: 8,
    borderBottom: '1px dashed rgba(255,215,150,0.2)',
  },
  elixirGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 48px)',
    justifyContent: 'space-between',
    gap: 8,
  },
  elixirButton: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: '3px solid rgba(255,255,255,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
  },
  elixirEmoji: { fontSize: 24, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' },
  elixirNamesRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 11,
    opacity: 0.7,
    padding: '0 4px',
  },
  elixirName: { width: 48, textAlign: 'center' },
  sequenceLabel: { fontSize: 13, opacity: 0.85, marginTop: 4 },
  hintText: { color: '#FFEB3B', fontSize: 11 },
  sequenceSlotsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 8,
  },
  emptySlot: {
    aspectRatio: '1',
    minHeight: 40,
    borderRadius: 10,
    border: '2px dashed rgba(255,255,255,0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    fontWeight: 700,
  },
  filledSlot: {
    aspectRatio: '1',
    minHeight: 40,
    borderRadius: 10,
    border: '2px solid rgba(255,255,255,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    color: '#FFF',
    padding: 0,
  },
  actionRow: { display: 'flex', gap: 10, marginTop: 6 },
  actionBtn: {
    flex: 1,
    padding: '10px 0',
    borderRadius: 10,
    border: 'none',
    fontWeight: 800,
    fontSize: 14,
    color: '#FFF',
    letterSpacing: 1,
  },
  clearBtn: {
    background: 'linear-gradient(135deg, #5D4037, #3E2723)',
    border: '1px solid #8D6E63',
  },
  confirmBtn: {
    background: 'linear-gradient(135deg, #FF9800, #F44336)',
    border: '1px solid #FFB74D',
  },

  monsterCard: {
    width: 200,
    height: 260,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#2D1B4E',
    color: '#F3E5D5',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 0 24px rgba(76,29,149,0.3)',
    border: '2px solid #4A148C',
    position: 'relative',
    overflow: 'hidden',
  },
  monsterNameRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  monsterWaveTag: {
    fontSize: 10,
    padding: '2px 7px',
    borderRadius: 8,
    backgroundColor: '#6A1B9A',
    fontWeight: 700,
  },
  monsterName: { fontSize: 15, fontWeight: 800, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  monsterEmojiBox: {
    flex: 1,
    minHeight: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    background: 'radial-gradient(circle, rgba(106,27,154,0.5) 0%, transparent 70%)',
    position: 'relative',
    overflow: 'hidden',
  },
  monsterEmoji: { fontSize: 58 },
  flashOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    pointerEvents: 'none',
  },
  monsterHpRow: { display: 'flex', alignItems: 'center', gap: 6 },
  monsterHpLabel: { fontSize: 10, opacity: 0.8, width: 18 },
  monsterHpBg: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  monsterHpFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #FF5252, #B71C1C)',
    borderRadius: 5,
  },
  monsterHpValue: { fontSize: 11, fontFamily: "'Courier New', monospace", width: 58, textAlign: 'right' },
  monsterAttackRow: {
    fontSize: 11,
    padding: '3px 8px',
    borderRadius: 6,
    backgroundColor: 'rgba(255,82,82,0.18)',
    alignSelf: 'flex-start',
  },
  attackValue: { fontWeight: 800, color: '#FF8A80', marginLeft: 4 },
  resistanceSection: {
    marginTop: 2,
    borderTop: '1px dashed rgba(255,255,255,0.12)',
    paddingTop: 6,
  },
  resistanceTitle: { fontSize: 10, opacity: 0.7, marginBottom: 4 },
  resistanceGrid: { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 3 },
  resistanceItem: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 },
  resistanceElemEmoji: { fontSize: 14 },
  resistanceTierTag: {
    width: 40,
    height: 18,
    borderRadius: 9,
    fontSize: 10,
    fontWeight: 800,
    color: '#1A0D08',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  battleArena: {
    width: 900,
    maxWidth: '100%',
    height: 600,
    maxHeight: '70vh',
    borderRadius: 12,
    position: 'relative',
    overflow: 'hidden',
    background: `
      radial-gradient(ellipse at 50% 20%, rgba(255,200,120,0.08) 0%, transparent 55%),
      radial-gradient(ellipse at 20% 80%, rgba(120,60,20,0.18) 0%, transparent 45%),
      radial-gradient(ellipse at 80% 75%, rgba(90,40,10,0.15) 0%, transparent 45%),
      linear-gradient(180deg, #4A3425 0%, #3D2B1F 40%, #2B1D14 100%)
    `,
    border: '2px solid #5C3A21',
    boxShadow:
      '0 12px 48px rgba(0,0,0,0.7), inset 0 0 60px rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  arenaGlow: {
    position: 'absolute',
    inset: 0,
    background:
      'radial-gradient(circle at center, rgba(255,180,90,0.04) 0%, transparent 60%)',
    pointerEvents: 'none',
  },

  chainBarWrapper: {
    width: 800,
    maxWidth: '100%',
    height: 80,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.55)',
    border: '1px solid rgba(255,215,150,0.15)',
    padding: '8px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    flexShrink: 0,
  },
  chainBarTitle: {
    fontSize: 12,
    color: '#FFD54F',
    fontWeight: 700,
    letterSpacing: 1,
  },
  chainBarScroll: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    overflowX: 'auto',
    overflowY: 'hidden',
    paddingBottom: 4,
    scrollbarWidth: 'thin',
  },
  emptyChainHint: {
    fontSize: 12,
    color: '#9B8166',
    fontStyle: 'italic',
    width: '100%',
    textAlign: 'center',
  },
  chainItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '5px 10px',
    borderRadius: 10,
    backgroundColor: 'rgba(30,20,14,0.9)',
    border: '2px solid',
  },
  chainItemEmoji: { fontSize: 26 },
  chainItemInfo: { display: 'flex', flexDirection: 'column' },

  overlayBg: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.78)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  overlayCard: {
    width: 420,
    maxWidth: '90%',
    padding: 36,
    borderRadius: 24,
    backgroundColor: '#1A0F09',
    border: '3px solid',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 14,
    color: '#F3E5D5',
    textAlign: 'center',
  },
  overlayTitle: { fontSize: 28, fontWeight: 900, letterSpacing: 2 },
  overlaySub: { fontSize: 14, opacity: 0.85, lineHeight: 1.6 },
  overlayBtn: {
    marginTop: 10,
    padding: '12px 34px',
    borderRadius: 12,
    border: 'none',
    color: '#2E1A0F',
    fontWeight: 900,
    fontSize: 16,
    letterSpacing: 2,
    cursor: 'pointer',
  },
};
