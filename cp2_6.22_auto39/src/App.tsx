import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { Item, Difficulty, CombatLogEntry, ItemQuality } from './types';
import { simulator, GameState } from './MainSimulator';

const QUALITY_COLORS: Record<ItemQuality, { border: string; glow: string; text: string; bg: string }> = {
  white: { border: '#b0b0b0', glow: 'rgba(176,176,176,0.35)', text: '#e8e8e8', bg: 'rgba(176,176,176,0.08)' },
  blue: { border: '#4fa8ff', glow: 'rgba(79,168,255,0.45)', text: '#7cc4ff', bg: 'rgba(79,168,255,0.10)' },
  purple: { border: '#c77dff', glow: 'rgba(199,125,255,0.5)', text: '#e0b0ff', bg: 'rgba(199,125,255,0.12)' },
  gold: { border: '#ffd166', glow: 'rgba(255,209,102,0.6)', text: '#ffe39a', bg: 'rgba(255,209,102,0.14)' },
};

const QUALITY_NAMES: Record<ItemQuality, string> = {
  white: '普通',
  blue: '稀有',
  purple: '史诗',
  gold: '传说',
};

const TYPE_NAMES: Record<string, string> = {
  weapon: '武器',
  armor: '防具',
  accessory: '饰品',
};

const DIFF_LABELS: Record<Difficulty, { label: string; color: string }> = {
  easy: { label: '简单', color: '#4ade80' },
  normal: { label: '普通', color: '#60a5fa' },
  hard: { label: '困难', color: '#f87171' },
};

// ---------- Item Card ----------
interface ItemCardProps {
  item: Item;
  compact?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent, item: Item) => void;
  draggable?: boolean;
  highlight?: boolean;
  tag?: string;
}
const ItemCard: React.FC<ItemCardProps> = ({ item, compact, onClick, onDragStart, draggable, highlight, tag }) => {
  const c = QUALITY_COLORS[item.quality];
  const style: React.CSSProperties = {
    border: `1.5px solid ${c.border}`,
    boxShadow: highlight ? `0 0 16px ${c.glow}, 0 0 8px #0ff inset` : `0 0 10px ${c.glow}`,
    background: c.bg,
    borderRadius: 12,
    padding: compact ? 8 : 12,
    cursor: onClick || draggable ? 'pointer' : 'default',
    transition: 'transform 0.18s, box-shadow 0.18s',
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
  };
  return (
    <div
      className={`item-card ${item.upgraded ? 'upgraded' : ''} ${highlight ? 'hl' : ''}`}
      style={style}
      onClick={onClick}
      draggable={draggable}
      onDragStart={(e) => onDragStart && onDragStart(e, item)}
    >
      {tag && (
        <span style={{
          position: 'absolute', top: 6, right: 6, fontSize: 10, padding: '1px 6px',
          borderRadius: 4, background: 'rgba(0,255,255,0.18)', color: '#0ff', border: '1px solid rgba(0,255,255,0.4)',
          letterSpacing: 0.5
        }}>{tag}</span>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: compact ? 4 : 8 }}>
        <span style={{ color: c.text, fontWeight: 700, fontSize: compact ? 13 : 15, textShadow: `0 0 6px ${c.glow}` }}>
          {item.name}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: compact ? 4 : 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, border: `1px solid ${c.border}`, color: c.text }}>{TYPE_NAMES[item.type]}</span>
        <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>{QUALITY_NAMES[item.quality]}</span>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.7, color: '#b9c7ff' }}>
        {item.stats.attack > 0 && <div>⚔ 攻击 +{item.stats.attack}</div>}
        {item.stats.defense > 0 && <div>🛡 防御 +{item.stats.defense}</div>}
        {item.stats.critRate > 0 && <div>💥 暴击率 +{item.stats.critRate}%</div>}
      </div>
      {item.effect && !compact && (
        <div style={{
          marginTop: 10, padding: '6px 8px', borderRadius: 6, fontSize: 11,
          background: 'rgba(255,0,255,0.08)', border: '1px dashed rgba(255,0,255,0.45)', color: '#f0a6ff'
        }}>
          ✦ {item.effect.name}：{item.effect.desc}
        </div>
      )}
    </div>
  );
};

// ---------- Craft Modal ----------
interface CraftModalProps {
  open: boolean;
  inventory: Item[];
  onClose: () => void;
  onCraft: (mats: (Item | undefined)[]) => { success: boolean; result?: Item; error?: string };
}
const CraftModal: React.FC<CraftModalProps> = ({ open, inventory, onClose, onCraft }) => {
  const [slots, setSlots] = useState<(Item | undefined)[]>([undefined, undefined, undefined]);
  const [result, setResult] = useState<{ item?: Item; error?: string } | null>(null);
  const [anim, setAnim] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; c: string }[]>([]);

  useEffect(() => { if (!open) { setSlots([undefined, undefined, undefined]); setResult(null); setAnim(false); } }, [open]);

  const onDropSlot = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('itemId');
    if (!id) return;
    const item = inventory.find((it) => it.id === id) || slots.find((s) => s?.id === id);
    if (!item) return;
    const next = [...slots];
    const prevIdx = next.findIndex((s) => s?.id === id);
    if (prevIdx >= 0) next[prevIdx] = undefined;
    if (next[idx] && prevIdx < 0) {
      const old = next[idx]!;
      const invIdx = inventory.findIndex((i) => i.id === old.id);
      if (invIdx >= 0 || inventory.length === 0) {
      } else {
        const empty = next.findIndex((s, i) => s === undefined && i !== idx && i !== prevIdx);
        if (empty >= 0) next[empty] = old; else return;
      }
    }
    next[idx] = item;
    setSlots(next);
    setResult(null);
  };

  const availableItems = inventory.filter((i) => !slots.some((s) => s?.id === i.id));

  const handleCraft = () => {
    setResult(null);
    const r = onCraft(slots);
    if (r.success && r.result) {
      const ps: { id: number; x: number; y: number; c: string }[] = [];
      const colors = ['#0ff', '#f0f', '#ffd166', '#c77dff', '#4fa8ff'];
      for (let i = 0; i < 28; i++) {
        ps.push({
          id: i,
          x: (Math.random() - 0.5) * 260,
          y: (Math.random() - 0.5) * 260,
          c: colors[Math.floor(Math.random() * colors.length)],
        });
      }
      setParticles(ps);
      setAnim(true);
      setResult({ item: r.result });
      setTimeout(() => { setSlots([undefined, undefined, undefined]); setParticles([]); }, 1400);
    } else {
      setResult({ error: r.error });
    }
  };

  if (!open) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(10, 0, 25, 0.72)', backdropFilter: 'blur(10px)', padding: 16
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="craft-modal"
        style={{
          width: '100%', maxWidth: 720, maxHeight: '92vh', overflow: 'auto',
          borderRadius: 16, padding: 24,
          background: 'linear-gradient(135deg, rgba(26,10,46,0.95), rgba(12,30,60,0.92))',
          border: '1.5px solid #0ff',
          boxShadow: '0 0 40px rgba(0,255,255,0.28), 0 0 90px rgba(255,0,255,0.12) inset',
          position: 'relative'
        }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: '#0ff', textShadow: '0 0 12px rgba(0,255,255,0.7)', letterSpacing: 1 }}>
            ⚗ 道具合成工坊
          </h2>
          <button onClick={onClose} style={{
            background: 'transparent', border: '1px solid rgba(255,0,255,0.5)', color: '#f0f',
            padding: '6px 14px', borderRadius: 6, cursor: 'pointer', minHeight: 36, minWidth: 44, fontSize: 14
          }}>✕ 关闭</button>
        </div>

        <div style={{
          display: 'flex', gap: 14, alignItems: 'center', justifyContent: 'center',
          padding: 24, margin: '0 -24px 16px',
          background: 'rgba(0,0,0,0.25)', borderTop: '1px dashed rgba(0,255,255,0.3)', borderBottom: '1px dashed rgba(255,0,255,0.3)',
          position: 'relative', overflow: 'hidden'
        }}>
          {particles.map((p) => (
            <span key={p.id} className="particle" style={{
              position: 'absolute', left: '50%', top: '50%',
              width: 6, height: 6, borderRadius: '50%',
              background: p.c, boxShadow: `0 0 10px ${p.c}`,
              transform: `translate(${p.x}px, ${p.y}px)`,
              opacity: 0,
              transition: 'transform 0.9s ease-out, opacity 0.9s ease-out',
            }} />
          ))}
          {slots.map((s, i) => (
            <React.Fragment key={i}>
              <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropSlot(e, i)}
                style={{
                  width: 150, height: 180, borderRadius: 12,
                  border: `2px dashed ${s ? QUALITY_COLORS[s.quality].border : 'rgba(0,255,255,0.5)'}`,
                  background: s ? QUALITY_COLORS[s.quality].bg : 'rgba(0,255,255,0.04)',
                  boxShadow: s ? `0 0 14px ${QUALITY_COLORS[s.quality].glow}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, position: 'relative',
                }}>
                {s ? (
                  <div style={{ width: '100%', padding: 6 }}>
                    <ItemCard item={s} compact onClick={() => { const next = [...slots]; next[i] = undefined; setSlots(next); }} />
                  </div>
                ) : (
                  <span style={{ color: 'rgba(0,255,255,0.55)', fontSize: 36 }}>＋</span>
                )}
                <span style={{ position: 'absolute', top: 6, left: 8, fontSize: 11, color: 'rgba(0,255,255,0.75)' }}>槽 {i + 1}</span>
              </div>
              {i < 2 && <span style={{ color: '#0ff', fontSize: 26, textShadow: '0 0 10px #0ff' }}>+</span>}
            </React.Fragment>
          ))}
          <span style={{ color: '#f0f', fontSize: 26, textShadow: '0 0 10px #f0f', margin: '0 6px' }}>=</span>
          <div style={{
            width: 150, height: 180, borderRadius: 12, flexShrink: 0,
            border: `2px solid ${result?.item ? QUALITY_COLORS[result.item.quality].border : 'rgba(255,0,255,0.55)'}`,
            background: result?.item ? QUALITY_COLORS[result.item.quality].bg : 'rgba(255,0,255,0.06)',
            boxShadow: result?.item ? `0 0 20px ${QUALITY_COLORS[result.item.quality].glow}` : 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
            overflow: 'hidden'
          }}>
            {result?.item ? (
              <div className={`craft-result ${anim ? 'show' : ''}`} style={{ width: '100%', padding: 6 }}>
                <ItemCard item={result.item} compact highlight tag={result.item.upgraded ? '品质↑' : '合成'} />
              </div>
            ) : result?.error ? (
              <span style={{ color: '#f87171', fontSize: 12, textAlign: 'center', padding: 8 }}>{result.error}</span>
            ) : (
              <span style={{ color: 'rgba(255,0,255,0.65)', fontSize: 32 }}>?</span>
            )}
            <span style={{ position: 'absolute', top: 6, left: 8, fontSize: 11, color: 'rgba(255,0,255,0.85)' }}>结果</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 18 }}>
          <button onClick={handleCraft}
            style={{
              minHeight: 44, minWidth: 140, padding: '10px 24px', fontSize: 15, fontWeight: 700,
              borderRadius: 8, cursor: 'pointer', letterSpacing: 1,
              background: 'linear-gradient(135deg, rgba(0,255,255,0.2), rgba(255,0,255,0.2))',
              color: '#fff', border: '1.5px solid #0ff',
              boxShadow: '0 0 18px rgba(0,255,255,0.45)',
              transition: 'all 0.2s'
            }}>
            ⚡ 开始合成
          </button>
          <button onClick={() => { setSlots([undefined, undefined, undefined]); setResult(null); }}
            style={{
              minHeight: 44, minWidth: 120, padding: '10px 20px', fontSize: 14,
              borderRadius: 8, cursor: 'pointer',
              background: 'transparent', color: '#8fa3ff',
              border: '1px solid rgba(143,163,255,0.4)',
            }}>清空槽位</button>
        </div>

        <div style={{ fontSize: 12, color: '#6b82c5', textAlign: 'center', marginBottom: 18 }}>
          提示：将3件相同类型道具（武器/防具/饰品）拖入槽位即可合成，有概率提升品质 ✦
        </div>

        <div>
          <div style={{ fontSize: 14, color: '#0ff', marginBottom: 10, fontWeight: 600 }}>📦 背包（{availableItems.length}） - 拖拽至上方槽位</div>
          {availableItems.length === 0 ? (
            <div style={{ padding: 24, textAlign: 'center', color: 'rgba(143,163,255,0.6)', fontSize: 13, border: '1px dashed rgba(143,163,255,0.25)', borderRadius: 8 }}>
              背包暂无可用道具，战斗胜利后可获得战利品
            </div>
          ) : (
            <div className="inventory-grid" style={{
              display: 'grid', gap: 10,
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            }}>
              {availableItems.map((it) => (
                <ItemCard key={it.id} item={it} compact draggable
                  onDragStart={(e, item) => e.dataTransfer.setData('itemId', item.id)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------- Main App ----------
const App: React.FC = () => {
  const [state, setState] = useState<GameState>(simulator.getState());
  const [craftOpen, setCraftOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [visibleLogs, setVisibleLogs] = useState<CombatLogEntry[]>([]);
  const logRef = useRef<HTMLDivElement>(null);
  const timeoutsRef = useRef<number[]>([]);

  useEffect(() => simulator.subscribe(setState), []);

  useEffect(() => {
    if (state.lastCombat && playing) {
      timeoutsRef.current.forEach(clearTimeout);
      timeoutsRef.current = [];
      setVisibleLogs([]);
      const total = state.lastCombat.logs.length;
      const perStep = Math.max(1, Math.ceil(total / 40));
      const delay = Math.max(25, 1800 / Math.max(total, 1));
      let i = 0;
      const step = () => {
        i += perStep;
        setVisibleLogs(state.lastCombat!.logs.slice(0, Math.min(i, total)));
        if (i < total) {
          const t = window.setTimeout(step, delay);
          timeoutsRef.current.push(t);
        } else {
          setPlaying(false);
        }
      };
      const t0 = window.setTimeout(step, 80);
      timeoutsRef.current.push(t0);
      return () => timeoutsRef.current.forEach(clearTimeout);
    } else if (!state.lastCombat) {
      setVisibleLogs([]);
    }
  }, [state.lastCombat, playing]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visibleLogs]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2400);
  }, []);

  const playerTotal = useMemo(() => {
    const equipped = [state.equipped.weapon, state.equipped.armor, state.equipped.accessory].filter(Boolean) as Item[];
    return {
      maxHp: state.playerBase.maxHp,
      attack: state.playerBase.attack + equipped.reduce((s, i) => s + i.stats.attack, 0),
      defense: state.playerBase.defense + equipped.reduce((s, i) => s + i.stats.defense, 0),
      critRate: +(state.playerBase.critRate + equipped.reduce((s, i) => s + i.stats.critRate, 0)).toFixed(1),
    };
  }, [state.playerBase, state.equipped]);

  const handleBattle = () => {
    if (playing) return;
    simulator.enterBattle();
    setPlaying(true);
    window.setTimeout(() => {
      simulator.runCombat();
    }, 260);
  };

  const handleEquip = (item: Item) => {
    simulator.equipItem(item);
    showToast(`已装备：${item.name}`);
  };

  const handleCraft = (mats: (Item | undefined)[]) => {
    const r = simulator.craft(mats);
    if (r.success && r.result) {
      showToast(`合成成功！获得 ${r.result.name}${r.result.upgraded ? '（品质提升）' : ''}`);
    }
    return r;
  };

  const groupedLogs = useMemo(() => {
    const map = new Map<number, CombatLogEntry[]>();
    for (const l of visibleLogs) {
      if (!map.has(l.round)) map.set(l.round, []);
      map.get(l.round)!.push(l);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [visibleLogs]);

  const hpPct = Math.max(0, Math.min(100, (state.playerBase.hp / state.playerBase.maxHp) * 100));

  return (
    <div className="app-root" style={{
      minHeight: '100vh', width: '100%',
      background: 'radial-gradient(ellipse at 20% 10%, rgba(0,255,255,0.08), transparent 50%), radial-gradient(ellipse at 80% 90%, rgba(255,0,255,0.08), transparent 50%), #1a0a2e',
      color: '#e0e7ff', fontFamily: '"PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
      position: 'relative', overflowX: 'hidden',
    }}>
      {/* Hex grid bg */}
      <div className="hex-grid" aria-hidden="true" />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 200,
          padding: '10px 22px', borderRadius: 8,
          background: 'linear-gradient(135deg, rgba(26,10,46,0.95), rgba(12,30,60,0.92))',
          border: '1px solid #0ff', color: '#0ff', fontSize: 14,
          boxShadow: '0 0 22px rgba(0,255,255,0.4)', animation: 'slideIn 0.3s ease',
        }}>{toast}</div>
      )}

      {/* Header */}
      <header style={{
        padding: '28px 24px 18px', textAlign: 'center', position: 'relative',
      }}>
        <div style={{
          display: 'inline-block', padding: '14px 44px', borderRadius: 14,
          border: '2px solid #0ff', position: 'relative',
          boxShadow: '0 0 30px rgba(0,255,255,0.35), 0 0 60px rgba(255,0,255,0.18) inset',
          background: 'rgba(10, 4, 28, 0.55)', backdropFilter: 'blur(6px)',
        }}>
          <h1 style={{
            margin: 0, fontSize: 'clamp(22px, 4vw, 34px)',
            background: 'linear-gradient(90deg, #0ff 0%, #f0f 50%, #0ff 100%)',
            WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
            fontWeight: 900, letterSpacing: 3,
            textShadow: '0 0 24px rgba(0,255,255,0.5)',
          }}>
            ROGUELIKE · 道具掉落与合成模拟器
          </h1>
          <div style={{ fontSize: 12, color: '#7890c8', marginTop: 6, letterSpacing: 4 }}>
            ▸ CYBER · DUNGEON · ROGUE ◂
          </div>
        </div>
      </header>

      {/* Main layout */}
      <main style={{
        display: 'grid', gap: 16, padding: '8px 16px 32px', maxWidth: 1600, margin: '0 auto',
        gridTemplateColumns: 'minmax(0, 320px) minmax(0, 1fr) minmax(0, 380px)',
      }} className="main-grid">

        {/* LEFT: status & actions */}
        <section style={{
          borderRadius: 14, padding: 16,
          background: 'rgba(20, 8, 40, 0.72)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(0,255,255,0.25)',
          boxShadow: '0 0 20px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', gap: 16,
          minHeight: 0
        }}>
          <div>
            <div style={{ fontSize: 13, color: '#7ca6ff', marginBottom: 10, fontWeight: 600, letterSpacing: 1 }}>⚙ 难度选择</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(Object.keys(DIFF_LABELS) as Difficulty[]).map((d) => (
                <button key={d} onClick={() => simulator.setDifficulty(d)}
                  style={{
                    minHeight: 44, padding: '8px 6px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 13, fontWeight: 700,
                    background: state.difficulty === d
                      ? `linear-gradient(135deg, ${DIFF_LABELS[d].color}33, ${DIFF_LABELS[d].color}11)`
                      : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${state.difficulty === d ? DIFF_LABELS[d].color : 'rgba(143,163,255,0.25)'}`,
                    color: state.difficulty === d ? DIFF_LABELS[d].color : '#9db4ff',
                    boxShadow: state.difficulty === d ? `0 0 14px ${DIFF_LABELS[d].color}55` : 'none',
                    transition: 'all 0.2s',
                  }}>
                  {DIFF_LABELS[d].label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: 14, borderRadius: 10, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(143,163,255,0.15)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 13, color: '#0ff', fontWeight: 700 }}>👤 冒险者</span>
              <span style={{ fontSize: 11, color: '#f0f', padding: '2px 8px', borderRadius: 4, background: 'rgba(255,0,255,0.12)', border: '1px solid rgba(255,0,255,0.4)' }}>LV {state.level}</span>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#b9c7ff', marginBottom: 4 }}>
                <span>HP</span>
                <span style={{ color: hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#fbbf24' : '#f87171' }}>
                  {state.playerBase.hp} / {playerTotal.maxHp}
                </span>
              </div>
              <div style={{ height: 10, borderRadius: 6, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  width: `${hpPct}%`, height: '100%', transition: 'width 0.6s',
                  background: `linear-gradient(90deg, ${hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#fbbf24' : '#f87171'}, #0ff)`,
                  boxShadow: `0 0 10px ${hpPct > 50 ? '#4ade80' : hpPct > 25 ? '#fbbf24' : '#f87171'}`,
                }} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <StatRow label="⚔ 攻击" value={playerTotal.attack} base={state.playerBase.attack} color="#0ff" />
              <StatRow label="🛡 防御" value={playerTotal.defense} base={state.playerBase.defense} color="#4fa8ff" />
              <StatRow label="💥 暴击" value={`${playerTotal.critRate}%`} base={`${state.playerBase.critRate}%`} color="#ffd166" />
            </div>
          </div>

          <div>
            <div style={{ fontSize: 13, color: '#7ca6ff', marginBottom: 8, fontWeight: 600, letterSpacing: 1 }}>🎽 装备栏</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['weapon', 'armor', 'accessory'] as const).map((t) => {
                const item = state.equipped[t];
                return (
                  <div key={t} style={{
                    padding: 8, borderRadius: 8,
                    background: 'rgba(0,0,0,0.2)',
                    border: `1px dashed ${item ? QUALITY_COLORS[item.quality].border : 'rgba(143,163,255,0.25)'}`,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: '#7ca6ff', marginBottom: 4 }}>
                      <span>{TYPE_NAMES[t]}</span>
                      {item && <button onClick={() => simulator.unequipItem(t)}
                        style={{ background: 'transparent', border: 'none', color: '#f87171', fontSize: 11, cursor: 'pointer', padding: 2 }}>卸下</button>}
                    </div>
                    {item ? <ItemCard item={item} compact onClick={() => simulator.unequipItem(t)} />
                      : <div style={{ padding: 10, textAlign: 'center', fontSize: 12, color: 'rgba(143,163,255,0.5)' }}>未装备（从背包装备）</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
            <button onClick={handleBattle} disabled={playing || state.playerBase.hp <= 0}
              style={{
                minHeight: 48, padding: '12px 16px', fontSize: 15, fontWeight: 800, letterSpacing: 2,
                borderRadius: 10, cursor: playing || state.playerBase.hp <= 0 ? 'not-allowed' : 'pointer',
                background: playing ? 'rgba(124,166,255,0.15)' : 'linear-gradient(135deg, rgba(0,255,255,0.3), rgba(255,0,255,0.22))',
                color: playing ? '#7ca6ff' : '#fff',
                border: `2px solid ${playing ? 'rgba(124,166,255,0.4)' : '#f0f'}`,
                boxShadow: playing ? 'none' : '0 0 22px rgba(255,0,255,0.45)',
                transition: 'all 0.2s', opacity: state.playerBase.hp <= 0 ? 0.5 : 1,
              }}>
              {playing ? '⚔ 战斗中...' : state.playerBase.hp <= 0 ? '☠ 你已阵亡（切换难度重置）' : `⚔ 进入第 ${state.level} 关`}
            </button>
            <button onClick={() => setCraftOpen(true)}
              style={{
                minHeight: 44, padding: '10px 16px', fontSize: 14, fontWeight: 700,
                borderRadius: 10, cursor: 'pointer',
                background: 'rgba(255,209,102,0.1)',
                color: '#ffd166',
                border: '1.5px solid rgba(255,209,102,0.6)',
                boxShadow: '0 0 14px rgba(255,209,102,0.25)',
              }}>
              ⚗ 打开合成工坊（背包 {state.inventory.length}）
            </button>
            <button onClick={() => simulator.resetLevel()}
              style={{
                minHeight: 40, padding: '8px 16px', fontSize: 12,
                borderRadius: 8, cursor: 'pointer',
                background: 'transparent', color: '#8fa3ff',
                border: '1px solid rgba(143,163,255,0.25)',
              }}>↻ 重置角色进度</button>
          </div>
        </section>

        {/* CENTER: Items, rewards, monsters */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16, minHeight: 0 }}>
          {state.monsters.length > 0 && (
            <div style={{
              borderRadius: 14, padding: 16,
              background: 'linear-gradient(135deg, rgba(40,8,16,0.7), rgba(26,10,46,0.82))', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(248,113,113,0.4)',
              boxShadow: '0 0 24px rgba(248,113,113,0.15)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 15, color: '#f87171', fontWeight: 700, letterSpacing: 1 }}>
                  👹 当前战场 · 第 {state.level} 关
                </div>
                {state.lastCombat && (
                  <div style={{
                    padding: '4px 12px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                    background: state.lastCombat.victory ? 'rgba(74,222,128,0.18)' : 'rgba(248,113,113,0.18)',
                    color: state.lastCombat.victory ? '#4ade80' : '#f87171',
                    border: `1px solid ${state.lastCombat.victory ? 'rgba(74,222,128,0.5)' : 'rgba(248,113,113,0.5)'}`,
                  }}>
                    {state.lastCombat.victory ? '✓ 战斗胜利' : '✗ 战斗失败'}（{state.lastCombat.rounds} 回合）
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }}>
                {state.monsters.map((m) => {
                  const last = state.lastCombat;
                  const isDead = last && !last.victory ? false : false;
                  const hpP = Math.max(0, m.stats.hp / m.stats.maxHp * 100);
                  return (
                    <div key={m.id} style={{
                      padding: 12, borderRadius: 10,
                      background: 'rgba(0,0,0,0.35)',
                      border: `1px solid rgba(248,113,113,${isDead ? 0.15 : 0.4})`,
                      opacity: isDead ? 0.5 : 1,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'center' }}>
                        <span style={{ color: '#ffb4b4', fontWeight: 700, fontSize: 14 }}>{m.name}</span>
                        <span style={{ fontSize: 10, color: '#8b9ad1' }}>[{m.type}]</span>
                      </div>
                      <div style={{ height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.08)', marginBottom: 6, overflow: 'hidden' }}>
                        <div style={{
                          width: `${hpP}%`, height: '100%',
                          background: 'linear-gradient(90deg, #f87171, #fbbf24)',
                          boxShadow: '0 0 8px #f87171',
                        }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#c7b4ff', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                        <span>❤ {m.stats.hp}/{m.stats.maxHp}</span>
                        <span>⚔ {m.stats.attack}</span>
                        <span>🛡 {m.stats.defense}</span>
                      </div>
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {m.skills.map((s) => (
                          <span key={s.id} style={{
                            fontSize: 10, padding: '2px 6px', borderRadius: 4,
                            background: 'rgba(255,0,255,0.08)', color: '#f0a6ff',
                            border: '1px solid rgba(255,0,255,0.35)',
                          }} title={s.desc}>{s.name}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {state.battleRewards.length > 0 && (
            <div style={{
              borderRadius: 14, padding: 16,
              background: 'linear-gradient(135deg, rgba(8,24,40,0.75), rgba(26,10,46,0.82))', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,209,102,0.35)',
              boxShadow: '0 0 20px rgba(255,209,102,0.12)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: 15, color: '#ffd166', fontWeight: 700, letterSpacing: 1 }}>
                  🎁 战利品（{state.battleRewards.length} 件）{state.lastCombat?.victory ? '— 已存入背包' : '— 战斗胜利后可获得'}
                </div>
              </div>
              <div className="items-grid" style={{
                display: 'grid', gap: 12,
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              }}>
                {state.battleRewards.map((it) => (
                  <ItemCard key={it.id} item={it} />
                ))}
              </div>
            </div>
          )}

          <div style={{
            borderRadius: 14, padding: 16, flex: 1, minHeight: 300,
            background: 'rgba(16, 8, 34, 0.72)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(79,168,255,0.25)',
            boxShadow: '0 0 20px rgba(0,0,0,0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 15, color: '#4fa8ff', fontWeight: 700, letterSpacing: 1 }}>
                📦 背包 · 道具仓库（{state.inventory.length}）
              </div>
              <div style={{ fontSize: 11, color: '#7890c8' }}>点击道具可装备</div>
            </div>
            {state.inventory.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(143,163,255,0.55)', fontSize: 13,
                border: '1px dashed rgba(143,163,255,0.25)', borderRadius: 10 }}>
                背包空空如也，进入关卡战斗获得战利品吧！
              </div>
            ) : (
              <div style={{
                display: 'grid', gap: 12,
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                maxHeight: 520, overflow: 'auto', paddingRight: 4,
              }} className="scroll">
                {state.inventory.map((it) => (
                  <ItemCard key={it.id} item={it} onClick={() => handleEquip(it)}
                    draggable onDragStart={(e, i) => e.dataTransfer.setData('itemId', i.id)} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT: combat log */}
        <section style={{
          borderRadius: 14, padding: 16,
          background: 'rgba(12, 20, 42, 0.72)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,0,255,0.25)',
          boxShadow: '0 0 20px rgba(0,0,0,0.4)',
          display: 'flex', flexDirection: 'column', minHeight: 0
        }}>
          <div style={{ fontSize: 15, color: '#f0f', fontWeight: 700, letterSpacing: 1, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>📜 战斗日志</span>
            <span style={{ fontSize: 10, color: '#7890c8', fontWeight: 400, marginLeft: 'auto' }}>
              {visibleLogs.length} / {state.lastCombat?.logs.length ?? 0} 条
            </span>
          </div>
          <div ref={logRef} className="log-scroll scroll" style={{
            flex: 1, minHeight: 400, maxHeight: 720, overflow: 'auto',
            paddingRight: 6,
          }}>
            {groupedLogs.length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: 'rgba(185,199,255,0.45)', fontSize: 13, lineHeight: 1.8 }}>
                暂无战斗记录<br/>
                <span style={{ fontSize: 11 }}>点击「进入关卡」开启战斗，日志将实时展示于此</span>
              </div>
            ) : (
              groupedLogs.map(([round, entries]) => (
                <div key={round} style={{ marginBottom: 14 }}>
                  <div style={{
                    display: 'inline-block', fontSize: 11, padding: '2px 10px', marginBottom: 6,
                    borderRadius: 4, letterSpacing: 1,
                    background: 'rgba(0,255,255,0.1)', border: '1px solid rgba(0,255,255,0.4)',
                    color: '#0ff',
                  }}>
                    {round === 0 ? '◇ 战斗开始' : `回合 ${round}`}
                  </div>
                  {entries.map((l, idx) => (
                    <div key={idx} className="log-line"
                      style={{
                        display: 'grid', gridTemplateColumns: '64px 80px 1fr', gap: 8,
                        padding: '5px 8px', borderRadius: 5, fontSize: 12.5, lineHeight: 1.65,
                        alignItems: 'start',
                        borderLeft: `2px solid ${l.actor === '系统' ? '#7890c8' : l.actor === '玩家' ? '#0ff' : '#f87171'}55`,
                        marginBottom: 2,
                        background: l.isCrit ? 'rgba(255,0,255,0.06)' : 'rgba(255,255,255,0.02)',
                      }}>
                      <span style={{
                        fontFamily: '"Consolas", "SF Mono", monospace',
                        fontSize: 11, color: '#6b82c5', paddingTop: 2
                      }}>{l.timestamp}</span>
                      <span style={{
                        fontFamily: '"Consolas", monospace', fontSize: 11.5,
                        color: l.actor === '玩家' ? '#0ff' : l.actor === '系统' ? '#c7c9d6' : '#ffb4b4',
                        textShadow: l.actor === '玩家' ? '0 0 6px #0ff55' : '',
                        paddingTop: 2, whiteSpace: 'nowrap',
                      }}>{l.actor.padEnd(6, ' ')}</span>
                      <span style={{
                        fontFamily: '"Consolas", "Source Code Pro", monospace',
                        color: '#d7ddf5', wordBreak: 'break-all',
                      }}
                        dangerouslySetInnerHTML={{
                          __html: l.action
                            .replace(/(\d+)/g, (_, n) => `<span style="color:#f0f;font-weight:700;text-shadow:0 0 6px #f0f66;">${n}</span>`)
                            .replace(/（暴击！）/g, '<span style="color:#f0f;font-weight:700">（暴击！）</span>')
                            .replace(/（穿透）/g, '<span style="color:#ffd166">（穿透）</span>'),
                        }}
                      />
                    </div>
                  ))}
                </div>
              ))
            )}
          </div>
          {state.lastCombat && !playing && (
            <div style={{
              marginTop: 12, padding: 12, borderRadius: 10,
              background: state.lastCombat.victory ? 'linear-gradient(135deg, rgba(74,222,128,0.12), rgba(0,255,255,0.08))' : 'linear-gradient(135deg, rgba(248,113,113,0.12), rgba(255,0,255,0.06))',
              border: `1px solid ${state.lastCombat.victory ? 'rgba(74,222,128,0.45)' : 'rgba(248,113,113,0.45)'}`,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                <span>{state.lastCombat.victory ? '🏆' : '💀'}</span>
                <span style={{ color: state.lastCombat.victory ? '#4ade80' : '#f87171' }}>
                  {state.lastCombat.victory ? '战斗胜利！' : '战斗失败...'}
                </span>
              </div>
              <div style={{ fontSize: 11.5, color: '#b9c7ff', lineHeight: 1.7 }}>
                回合数：{state.lastCombat.rounds} · 剩余HP：{state.lastCombat.playerHp} · 存活怪物：{state.lastCombat.monstersRemaining}
              </div>
            </div>
          )}
        </section>
      </main>

      <CraftModal open={craftOpen} inventory={state.inventory} onClose={() => setCraftOpen(false)} onCraft={handleCraft} />

      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translate(-50%, -12px);} to { opacity: 1; transform: translate(-50%, 0);} }
        @keyframes craftShow {
          0% { transform: scale(0.3) rotate(-180deg); opacity: 0; }
          60% { transform: scale(1.15) rotate(15deg); opacity: 1; }
          100% { transform: scale(1) rotate(0); opacity: 1; }
        }
        .craft-result { opacity: 0; transform: scale(0.3) rotate(-90deg); }
        .craft-result.show { animation: craftShow 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
        .particle.show { opacity: 1; }
        .craft-modal .particle { animation: particleFly 1s ease-out forwards; }
        @keyframes particleFly {
          0% { opacity: 0; transform: translate(0, 0) scale(1); }
          20% { opacity: 1; }
          100% { opacity: 0; transform: translate(var(--px, 0), var(--py, 0)) scale(0.2); }
        }
        .hex-grid {
          position: absolute; inset: 0; pointer-events: none; opacity: 0.08;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'><path d='M28 2 L52 16 L52 48 L28 62 L4 48 L4 16 Z' fill='none' stroke='%230ff' stroke-width='1'/></svg>");
          background-size: 56px 64px;
          mask-image: radial-gradient(ellipse at center, black 30%, transparent 85%);
        }
        .item-card:hover { transform: translateY(-2px); }
        .scroll::-webkit-scrollbar { width: 6px; height: 6px; }
        .scroll::-webkit-scrollbar-track { background: transparent; }
        .scroll::-webkit-scrollbar-thumb { background: rgba(0,255,255,0.25); border-radius: 3px; }
        .scroll::-webkit-scrollbar-thumb:hover { background: rgba(0,255,255,0.45); }
        @media (max-width: 1080px) {
          .main-grid { grid-template-columns: 1fr !important; }
        }
        button:active { transform: scale(0.97); }
        .log-line:hover { background: rgba(0,255,255,0.04) !important; }
      `}</style>
    </div>
  );
};

const StatRow: React.FC<{ label: string; value: string | number; base: string | number; color: string }> = ({ label, value, base, color }) => {
  const diff = typeof value === 'number' && typeof base === 'number' ? value - base : 0;
  return (
    <div style={{
      background: 'rgba(0,0,0,0.25)', borderRadius: 6, padding: '6px 8px',
      border: `1px solid ${color}22`, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>
      <span style={{ color: '#b9c7ff' }}>{label}</span>
      <span style={{ color, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
        {value}
        {typeof diff === 'number' && diff > 0 && (
          <span style={{ fontSize: 10, color: '#4ade80' }}>+{diff}</span>
        )}
      </span>
    </div>
  );
};

export default App;
