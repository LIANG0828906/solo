import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useGameStore,
  SKILLS,
  getClassColor,
  getClassColorLight,
  CLASS_DATA,
} from '@/store/gameStore';
import type { BattleLog, ClassId } from '@/store/gameStore';

interface DmgDisplay {
  value: number;
  isHeal: boolean;
  isMiss: boolean;
}

export default function BattleSimulator() {
  const character = useGameStore((s) => s.character);
  const enemy = useGameStore((s) => s.enemy);
  const battleRecord = useGameStore((s) => s.battleRecord);
  const startBattle = useGameStore((s) => s.startBattle);
  const setPhase = useGameStore((s) => s.setPhase);

  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(-1);
  const [pHp, setPHp] = useState(character?.maxHp ?? 0);
  const [eHp, setEHp] = useState(enemy?.maxHp ?? 0);
  const [pFlash, setPFlash] = useState('');
  const [eFlash, setEFlash] = useState('');
  const [pDmg, setPDmg] = useState<DmgDisplay | null>(null);
  const [eDmg, setEDmg] = useState<DmgDisplay | null>(null);
  const [logs, setLogs] = useState<BattleLog[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const handleStart = useCallback(() => {
    startBattle();
    setPhase('battle');
    setStarted(true);
  }, [startBattle, setPhase]);

  useEffect(() => {
    if (!started || !battleRecord) return;
    setPHp(battleRecord.player.maxHp);
    setEHp(battleRecord.enemy.maxHp);
    setStep(0);
    setLogs([]);
  }, [started, battleRecord]);

  useEffect(() => {
    if (!battleRecord || step < 0) return;
    if (step >= battleRecord.logs.length) {
      setTimeout(() => setPhase('report'), 800);
      return;
    }

    const log = battleRecord.logs[step];
    const skill = SKILLS.find((s) => s.id === log.skillId);
    const color = skill ? getClassColor(skill.classId) : '#fff';

    if (log.healAmount > 0) {
      if (log.isPlayer) {
        setPHp((p) => Math.min(battleRecord.player.maxHp, p + log.healAmount));
        setPFlash('#22c55e');
        setPDmg({ value: log.healAmount, isHeal: true, isMiss: false });
      } else {
        setEHp((p) => Math.min(battleRecord.enemy.maxHp, p + log.healAmount));
        setEFlash('#22c55e');
        setEDmg({ value: log.healAmount, isHeal: true, isMiss: false });
      }
    } else if (log.hit) {
      if (log.isPlayer) {
        setEHp((p) => Math.max(0, p - log.damage));
        setEFlash(color);
        setEDmg({ value: log.damage, isHeal: false, isMiss: false });
      } else {
        setPHp((p) => Math.max(0, p - log.damage));
        setPFlash(color);
        setPDmg({ value: log.damage, isHeal: false, isMiss: false });
      }
    } else {
      if (log.isPlayer) {
        setEDmg({ value: 0, isHeal: false, isMiss: true });
      } else {
        setPDmg({ value: 0, isHeal: false, isMiss: true });
      }
    }

    setLogs((prev) => [...prev, log]);

    const timer = setTimeout(() => {
      setPFlash('');
      setEFlash('');
      setPDmg(null);
      setEDmg(null);
      setStep((s) => s + 1);
    }, 500);

    return () => clearTimeout(timer);
  }, [step, battleRecord, setPhase]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const hpBar = (current: number, max: number) => {
    const pct = Math.max(0, (current / max) * 100);
    const color = pct > 50 ? '#22c55e' : pct > 25 ? '#eab308' : '#ef4444';
    return (
      <div className="w-full">
        <div className="flex justify-between text-xs mb-1">
          <span>HP</span>
          <span>
            {Math.max(0, current)}/{max}
          </span>
        </div>
        <div className="h-3 bg-black/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    );
  };

  const dmgLabel = (d: DmgDisplay | null) =>
    d && (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none">
        <span
          className={`damage-number text-2xl ${
            d.isMiss ? 'text-gray-400' : d.isHeal ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {d.isMiss ? 'MISS' : d.isHeal ? `+${d.value}` : `-${d.value}`}
        </span>
      </div>
    );

  const charPanel = (
    name: string,
    classId: ClassId,
    maxHp: number,
    skills: string[],
    currentHp: number,
    flash: string,
    dmg: DmgDisplay | null,
  ) => {
    const color = getClassColor(classId);
    const light = getClassColorLight(classId);
    return (
      <div className="glass-card p-4 flex flex-col items-center gap-3 relative overflow-hidden">
        <AnimatePresence>
          {flash && (
            <motion.div
              className="absolute inset-0 z-10 pointer-events-none rounded-xl"
              style={{ backgroundColor: flash }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.35 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </AnimatePresence>
        {dmgLabel(dmg)}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl bg-black/30"
          style={{ border: `3px solid ${color}`, boxShadow: `0 0 12px ${color}40` }}
        >
          {CLASS_DATA[classId].icon}
        </div>
        <span className="font-display text-sm" style={{ color: light }}>
          {name}
        </span>
        {hpBar(currentHp, maxHp)}
        <div className="w-full flex flex-col gap-1">
          {skills.map((id, i) => {
            const s = SKILLS.find((sk) => sk.id === id);
            if (!s) return null;
            return (
              <div
                key={id}
                className="flex items-center gap-2 px-2 py-1 rounded text-xs"
                style={{ backgroundColor: `${getClassColor(s.classId)}20` }}
              >
                <span className="font-display text-gold w-4">{i + 1}</span>
                <span style={{ color: getClassColorLight(s.classId) }}>{s.name}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      <div className="flex flex-1 gap-4 min-h-0">
        <div className="w-1/4 flex items-center">
          {character &&
            charPanel(
              character.name,
              character.classId,
              character.maxHp,
              character.equippedSkillIds,
              pHp,
              pFlash,
              pDmg,
            )}
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="relative p-[3px] rounded-xl">
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                background:
                  'linear-gradient(135deg, #c0392b, #d4a843, #8e44ad, #1a6b3c, #c0392b)',
                animation: 'led-breathe 3s ease-in-out infinite',
              }}
            />
            <div className="relative bg-deep/90 rounded-xl p-3">
              <div className="grid grid-cols-8 gap-[2px] w-56 h-56">
                {Array.from({ length: 64 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-[2px]"
                    style={{
                      background:
                        'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.04), #0d1117)',
                    }}
                  />
                ))}
              </div>
              {started && battleRecord && step < battleRecord.logs.length && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <motion.div
                    className="text-gold/60 font-display text-lg"
                    animate={{ opacity: [0.3, 0.8, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    ⚔ 战斗中 ⚔
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-1/4 flex items-center">
          {enemy &&
            charPanel(
              enemy.name,
              enemy.classId,
              enemy.maxHp,
              enemy.equippedSkillIds,
              eHp,
              eFlash,
              eDmg,
            )}
        </div>
      </div>

      <div
        ref={logRef}
        className="glass-card h-1/3 overflow-y-auto p-3 flex flex-col gap-1"
        style={{ background: 'rgba(10, 14, 39, 0.85)' }}
      >
        {!started ? (
          <div className="flex-1 flex items-center justify-center">
            <motion.button
              onClick={handleStart}
              className="px-8 py-3 font-display text-gold border-2 border-gold rounded-lg hover:bg-gold/10 transition-colors gold-glow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              开始战斗
            </motion.button>
          </div>
        ) : (
          logs.map((log, i) => {
            const actorColor = getClassColor(
              log.isPlayer ? character!.classId : enemy!.classId,
            );
            return (
              <motion.div
                key={i}
                className="flex items-center gap-2 px-3 py-1.5 rounded text-xs"
                style={{
                  borderLeft: `3px solid ${actorColor}`,
                  background: 'rgba(255,255,255,0.03)',
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <span className="text-gold font-display">R{log.round}</span>
                <span style={{ color: actorColor }}>{log.actorName}</span>
                <span className="text-gray-400">使用</span>
                <span className="text-white">{log.skillName}</span>
                {log.healAmount > 0 && (
                  <span className="text-green-400">+{log.healAmount}HP</span>
                )}
                {log.damage > 0 && log.hit && (
                  <span className="text-red-400">-{log.damage}</span>
                )}
                {!log.hit && <span className="text-gray-500">未命中</span>}
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
