/**
 * ================================================================
 *  App.tsx  ——  React UI 主组件 (赛博朋克暗色主题)
 * ================================================================
 *
 * 【职责】
 *  - 三栏布局：左侧(难度/属性/装备/按钮) / 中间(怪物/战利品/背包) / 右侧(战斗日志)
 *  - 订阅 MainSimulator 的 GameState 变更驱动 UI 刷新
 *  - 用户操作 → 调用 simulator.enterBattle() / runCombat() / craft() 等
 *  - 提供合成弹窗：拖拽(drag & drop) + 粒子爆散 + 新道具旋转放大动画
 *
 * 【文件间调用关系】
 *
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  外部: 用户交互 (点击/拖拽)                                  │
 *  └─────────────────────────┬───────────────────────────────────┘
 *                            │
 *  ┌─────────────────────────▼───────────────────────────────────┐
 *  │                        App.tsx (本文件)                     │
 *  │                                                             │
 *  │  ┌─ useState<GameState>  ←  simulator.subscribe()          │
 *  │  │  └─ 每次 emit → setState → React 重绘                    │
 *  │  │                                                          │
 *  │  ├─ 难度按钮 onClick → simulator.setDifficulty()           │
 *  │  │                          └─ ▶ resetLevel()              │
 *  │  │                                                          │
 *  │  ├─ "进入关卡" onClick → handleBattle()                     │
 *  │  │   ├─ simulator.enterBattle() → 战利品+怪物              │
 *  │  │   └─ setTimeout → simulator.runCombat() → CombatResult  │
 *  │  │                                                          │
 *  │  ├─ 背包 ItemCard onClick → simulator.equipItem()          │
 *  │  ├─ 装备 Card "卸下" → simulator.unequipItem()             │
 *  │  │                                                          │
 *  │  └─ "合成工坊" → CraftModal 子组件:                         │
 *  │      ├─ ItemCard onDragStart(e)  → 加 .item-dragging 类   │
 *  │      │   e.dataTransfer.setData('itemId', id)              │
 *  │      ├─ Slot onDragEnter/Leave → 切换 .slot-drop-zone     │
 *  │      ├─ Slot onDrop(e) → onDropSlot(e, idx)                │
 *  │      │  → 读取 itemId → 更新 slots[3]                       │
 *  │      └─ "开始合成" → simulator.craft(slots)                 │
 *  │         ├─ 成功 → 槽位 .craft-flash + 粒子爆散 .particle-burst
 *  │         │         + 结果卡 .card-spawn                     │
 *  │         └─ 失败 → 显示错误信息                              │
 *  └────────────────────────────┬────────────────────────────────┘
 *                               │ 调用
 *  ┌────────────────────────────▼────────────────────────────────┐
 *  │                 MainSimulator (全局单例)                    │
 *  │    (ItemGenerator / CraftRecipe / CombatEngine 调度器)     │
 *  └─────────────────────────────────────────────────────────────┘
 *
 * ================================================================
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import type { Item, Difficulty, CombatLogEntry, ItemQuality } from './types';
import { simulator, type GameState } from './MainSimulator';

/* ==================== 常量：品质配色 / 文字 ==================== */

const QUALITY_COLORS: Record<ItemQuality, {
  border: string; glow: string; text: string; bg: string;
}> = {
  white:  { border: '#b0b0b0', glow: 'rgba(176,176,176,0.35)', text: '#e8e8e8', bg: 'rgba(176,176,176,0.08)' },
  blue:   { border: '#4fa8ff', glow: 'rgba(79,168,255,0.45)', text: '#7cc4ff', bg: 'rgba(79,168,255,0.10)' },
  purple: { border: '#c77dff', glow: 'rgba(199,125,255,0.5)', text: '#e0b0ff', bg: 'rgba(199,125,255,0.12)' },
  gold:   { border: '#ffd166', glow: 'rgba(255,209,102,0.6)', text: '#ffe39a', bg: 'rgba(255,209,102,0.14)' },
};

const QUALITY_NAMES: Record<ItemQuality, string> = {
  white: '普通', blue: '稀有', purple: '史诗', gold: '传说',
};

const TYPE_NAMES: Record<string, string> = {
  weapon: '武器', armor: '防具', accessory: '饰品',
};

const DIFF_LABELS: Record<Difficulty, { label: string; color: string }> = {
  easy:   { label: '简单', color: '#4ade80' },
  normal: { label: '普通', color: '#60a5fa' },
  hard:   { label: '困难', color: '#f87171' },
};

/* ==================== 子组件：ItemCard ==================== */

/**
 * 拖拽来源标识 —— 防止从浏览器外部/非道具区域拖入触发异常合成
 *   'inventory'   = 背包道具
 *   'equipped'    = 已装备道具（合成时允许直接拖装备合成）
 *   'craftSlot'   = 合成槽内道具（在 3 个槽之间互换）
 *   'reward'      = 战利品区道具（拾取前就允许拖？保留扩展）
 */
export type DragSource = 'inventory' | 'equipped' | 'craftSlot' | 'reward';

/** 写入 dataTransfer 的 JSON 负载，避免多处字符串拼接 */
interface DragPayload {
  itemId: string;
  source: DragSource;
  /** 拖拽开始时的时间戳，用于简单反欺诈（防跨页面伪造） */
  ts: number;
}

/** dataTransfer 中使用的 mime 类型，自定义避免与浏览器其他数据冲突 */
export const DRAG_MIME = 'application/x-roguelike-item';
export const DRAG_MIME_LEGACY = 'text/plain';

/** 序列化 + 写入合法拖拽来源（ItemCard 必须经过此函数才允许 drop） */
export function writeDragPayload(
  e: React.DragEvent,
  itemId: string,
  source: DragSource,
): void {
  const payload: DragPayload = { itemId, source, ts: Date.now() };
  const json = JSON.stringify(payload);
  try {
    e.dataTransfer.setData(DRAG_MIME, json);
    // 兼容：某些浏览器需要 text/plain 才能被 drop 读取
    e.dataTransfer.setData(DRAG_MIME_LEGACY, json);
    e.dataTransfer.effectAllowed = 'move';
  } catch { /* ignore */ }
}

/** 读取并校验 payload：返回 null 表示非法来源 / 伪造数据 */
export function readDragPayload(e: React.DragEvent): DragPayload | null {
  let raw = '';
  try   { raw = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData(DRAG_MIME_LEGACY); }
  catch { return null; }
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as DragPayload;
    if (!p || !p.itemId || !p.source) return null;
    if (!['inventory', 'equipped', 'craftSlot', 'reward'].includes(p.source)) return null;
    if (typeof p.ts === 'number' && Date.now() - p.ts > 60_000) return null; // 超过 60s 过期
    return p;
  } catch {
    return null;
  }
}

interface ItemCardProps {
  item: Item;
  compact?: boolean;
  onClick?: () => void;
  /** 拖拽开始 —— 通常调用 writeDragPayload */
  onDragStart?: (e: React.DragEvent, item: Item) => void;
  draggable?: boolean;
  /** ⭐ 拖拽来源（写入 payload），校验非法拖拽的关键 */
  dragSource?: DragSource;
  /** 合成成功时的霓虹高光 */
  highlight?: boolean;
  /** 右上角小标签 (例: "品质↑") */
  tag?: string;
  /** 合成成功后槽位闪烁 */
  flash?: boolean;
  /** 新卡旋转放大动画 */
  spawn?: boolean;
  /** className 追加 */
  className?: string;
}

const ItemCard: React.FC<ItemCardProps> = ({
  item, compact, onClick, onDragStart, draggable, dragSource,
  highlight, tag, flash, spawn, className,
}) => {
  const c = QUALITY_COLORS[item.quality];
  const style: React.CSSProperties = {
    border: `1.5px solid ${c.border}`,
    boxShadow: highlight
      ? `0 0 16px ${c.glow}, 0 0 8px #0ff inset, 0 0 24px rgba(255,0,255,0.35)`
      : `0 0 10px ${c.glow}`,
    background: c.bg,
    borderRadius: 12,
    padding: compact ? 8 : 12,
    cursor: onClick || draggable ? 'grab' : 'default',
    transition: 'transform 0.18s ease, box-shadow 0.18s ease',
    userSelect: 'none',
    position: 'relative',
    overflow: 'hidden',
  };

  const cls = [
    'item-card',
    item.upgraded ? 'upgraded' : '',
    highlight ? 'hl' : '',
    flash ? 'craft-flash' : '',
    spawn ? 'card-spawn' : '',
    className || '',
  ].filter(Boolean).join(' ');

  // ⭐ 默认拖拽来源：未传则根据 draggable 降级用 inventory（兼容旧调用）
  const src: DragSource = dragSource || (draggable ? 'inventory' : 'inventory');

  return (
    <div
      className={cls}
      style={style}
      onClick={onClick}
      draggable={draggable}
      onDragStart={(e) => {
        if (!onDragStart && !draggable) return;
        const el = e.currentTarget;
        el.classList.add('item-dragging');
        // ⭐ 统一通过 writeDragPayload 写入，含 source + ts 过期校验
        writeDragPayload(e, item.id, src);
        onDragStart?.(e, item);
      }}
      onDragEnd={(e) => {
        const el = e.currentTarget;
        el.classList.remove('item-dragging');
      }}
    >
      {tag && (
        <span className="item-tag" style={{
          position: 'absolute', top: 6, right: 6, fontSize: 10,
          padding: '1px 6px', borderRadius: 4, letterSpacing: 0.5,
          background: 'rgba(0,255,255,0.18)',
          color: '#0ff',
          border: '1px solid rgba(0,255,255,0.4)',
        }}>{tag}</span>
      )}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: compact ? 4 : 8,
      }}>
        <span style={{
          color: c.text, fontWeight: 700,
          fontSize: compact ? 13 : 15,
          textShadow: `0 0 6px ${c.glow}`,
        }}>
          {item.name}
        </span>
      </div>
      <div style={{
        display: 'flex', gap: 6, marginBottom: compact ? 4 : 8, flexWrap: 'wrap',
      }}>
        <span style={{
          fontSize: 11, padding: '2px 6px', borderRadius: 4,
          border: `1px solid ${c.border}`, color: c.text,
        }}>{TYPE_NAMES[item.type]}</span>
        <span style={{
          fontSize: 11, padding: '2px 6px', borderRadius: 4,
          background: c.bg, color: c.text,
          border: `1px solid ${c.border}`,
        }}>{QUALITY_NAMES[item.quality]}</span>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.7, color: '#b9c7ff' }}>
        {item.stats.attack   > 0 && <div>⚔ 攻击 +{item.stats.attack}</div>}
        {item.stats.defense  > 0 && <div>🛡 防御 +{item.stats.defense}</div>}
        {item.stats.critRate > 0 && <div>💥 暴击率 +{item.stats.critRate}%</div>}
      </div>
      {item.effect && !compact && (
        <div style={{
          marginTop: 10, padding: '6px 8px', borderRadius: 6, fontSize: 11,
          background: 'rgba(255,0,255,0.08)',
          border: '1px dashed rgba(255,0,255,0.45)',
          color: '#f0a6ff',
        }}>
          ✦ {item.effect.name}：{item.effect.desc}
        </div>
      )}
    </div>
  );
};

/* ==================== 子组件：CraftModal 合成弹窗 ==================== */

interface CraftModalProps {
  open: boolean;
  inventory: Item[];
  /** 已装备道具也允许直接拖入合成槽（用户常想把旧装备合成掉） */
  equipped: { weapon?: Item; armor?: Item; accessory?: Item };
  onClose: () => void;
  onCraft: (mats: (Item | undefined | null)[]) => {
    success: boolean; result?: Item; error?: string;
  };
}

interface Particle { id: number; tx: number; ty: number; c: string; size: number; delay: number; }

/** 品质 → 粒子密度/颜色配置，便于不同品质合成差异明显 */
const QUALITY_PARTICLE_CFG: Record<string, {
  count: number;
  colors: string[];
  baseDist: [number, number];
  sizeRange: [number, number];
}> = {
  white:  { count: 16, colors: ['#cccccc', '#b0b0b0'],             baseDist: [80,  110], sizeRange: [5, 7]  },
  blue:   { count: 22, colors: ['#4fa8ff', '#0ff', '#80e0ff'],     baseDist: [100, 140], sizeRange: [6, 9]  },
  purple: { count: 30, colors: ['#c77dff', '#f0f', '#a080ff'],     baseDist: [110, 170], sizeRange: [7, 11] },
  gold:   { count: 40, colors: ['#ffd166', '#ff0', '#ffa040', '#fff'], baseDist: [120, 200], sizeRange: [8, 14] },
};

const CraftModal: React.FC<CraftModalProps> = ({
  open, inventory, equipped, onClose, onCraft,
  /** ★ 外部可传入自定义粒子配置；不传则根据最高材料品质自动取 QUALITY_PARTICLE_CFG */
  overrideParticleCfg,
}: CraftModalProps & { overrideParticleCfg?: typeof QUALITY_PARTICLE_CFG[string] }) => {
  const [slots, setSlots]     = useState<(Item | undefined)[]>([undefined, undefined, undefined]);
  const [result, setResult]   = useState<{ item?: Item; error?: string } | null>(null);
  const [anim, setAnim]       = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [hoverSlotIdx, setHoverSlotIdx] = useState<number | null>(null);
  const [flashSlots, setFlashSlots] = useState<boolean[]>([false, false, false]);
  const [resultSpawn, setResultSpawn] = useState(false);
  /** ⭐ 非法拖拽时 toast 提示 */
  const [dragError, setDragError] = useState<string | null>(null);

  const particleIdRef = useRef(0);

  // 关闭弹窗时清空
  useEffect(() => {
    if (!open) {
      setSlots([undefined, undefined, undefined]);
      setResult(null);
      setAnim(false);
      setParticles([]);
      setHoverSlotIdx(null);
      setFlashSlots([false, false, false]);
      setResultSpawn(false);
      setDragError(null);
    }
  }, [open]);

  // 拖拽错误自动消失
  useEffect(() => {
    if (!dragError) return;
    const t = window.setTimeout(() => setDragError(null), 1800);
    return () => window.clearTimeout(t);
  }, [dragError]);

  /* ---------- 拖放：槽位 onDrop ---------- */

  const onDragOverSlot = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  const onDragEnterSlot = (_e: React.DragEvent, idx: number) => {
    setHoverSlotIdx(idx);
  };
  const onDragLeaveSlot = (idx: number) => {
    if (hoverSlotIdx === idx) setHoverSlotIdx(null);
  };

  const onDropSlot = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setHoverSlotIdx(null);

    // ---- ⭐ 第一步：校验 payload 合法性（MIME类型 + 来源 + 过期）----
    const payload = readDragPayload(e);
    if (!payload) {
      setDragError('⚠ 非法拖拽：请从背包/装备/槽位中拖入道具');
      return;
    }
    // 第二步：来源必须是 4 类合法来源之一
    const allowedSources: DragSource[] = ['inventory', 'equipped', 'craftSlot', 'reward'];
    if (!allowedSources.includes(payload.source)) {
      setDragError(`⚠ 不允许的拖拽来源：${payload.source}`);
      return;
    }
    const id = payload.itemId;

    // ---- 第三步：从合法来源池（背包 + 装备 + 已有槽位）中查找对应 Item ----
    const equippedList: Item[] = [equipped.weapon, equipped.armor, equipped.accessory].filter(Boolean) as Item[];
    const item = inventory.find((it) => it.id === id)
              || equippedList.find((it) => it.id === id)
              || slots.find((s) => s?.id === id);
    if (!item) {
      setDragError('⚠ 拖拽失败：未找到对应道具');
      return;
    }

    const next = [...slots];
    const prevIdx = next.findIndex((s) => s?.id === id);

    if (prevIdx >= 0) next[prevIdx] = undefined;

    if (next[idx] && prevIdx < 0) {
      const empty = next.findIndex((s, i) => s === undefined && i !== idx);
      if (empty >= 0) next[empty] = next[idx];
    } else if (next[idx] && prevIdx >= 0) {
      next[prevIdx] = next[idx];
    }
    next[idx] = item;
    setSlots(next);
    setResult(null);
    setResultSpawn(false);
  };

  // 背包 + 装备 中尚未入槽的道具（全部可用）
  const equippedList: Item[] = [equipped.weapon, equipped.armor, equipped.accessory].filter(Boolean) as Item[];
  const availableItems = [...inventory, ...equippedList]
    .filter((i) => !slots.some((s) => s?.id === i.id));

  // 最高材料品质 → 计算粒子配置
  const maxMaterialQuality: string = (() => {
    const order = ['white', 'blue', 'purple', 'gold'];
    let maxIdx = 0;
    slots.forEach((s) => { if (s) maxIdx = Math.max(maxIdx, order.indexOf(s.quality)); });
    return order[maxIdx];
  })();

  /* ---------- 生成 28 个粒子 (使用 CSS 变量 --tx/--ty) ---------- */

  const spawnParticles = useCallback(() => {
    const list: Particle[] = [];
    const colors = ['#0ff', '#f0f', '#ff0', '#8f0', '#0f8'];
    const count = 28;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const dist  = 110 + Math.random() * 130;
      list.push({
        id: ++particleIdRef.current,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist - 40,
        c:  colors[(Math.random() * colors.length) | 0],
        size: 6 + Math.random() * 8,
        delay: Math.random() * 90,
      });
    }
    setParticles(list);
    setTimeout(() => setParticles([]), 1100);
  }, []);

  /* ---------- 点击合成 ---------- */

  const handleCraft = () => {
    setResult(null);
    setResultSpawn(false);
    const out = onCraft(slots);
    setAnim(true);
    setFlashSlots([false, false, false]);

    setTimeout(() => {
      setAnim(false);
      if (out.success && out.result) {
        setFlashSlots([true, true, true]);
        spawnParticles();
        setTimeout(() => setResultSpawn(true), 320);
        setResult({ item: out.result });
        setTimeout(() => {
          setSlots([undefined, undefined, undefined]);
          setFlashSlots([false, false, false]);
        }, 1400);
      } else {
        setResult({ error: out.error || '合成失败' });
      }
    }, 260);
  };

  if (!open) return null;

  const canCraft = slots.every(Boolean) && slots.length === 3;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(10, 2, 28, 0.82)',
      backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>

      {/* 背景六边形 */}
      <div className="hex-grid-bg" style={{ opacity: 0.08 }} />

      <div className="craft-modal" style={{
        width: 'min(920px, 100%)', maxHeight: '92vh', overflow: 'auto',
        background: 'linear-gradient(180deg, rgba(36,12,68,0.95), rgba(20,6,42,0.95))',
        border: '1.5px solid rgba(0,255,255,0.35)',
        borderRadius: 18,
        boxShadow: '0 0 60px rgba(0,255,255,0.22), 0 0 120px rgba(255,0,255,0.12) inset',
        padding: 22, position: 'relative',
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 14, right: 14,
          background: 'rgba(255,0,80,0.18)', border: '1px solid rgba(255,80,120,0.5)',
          color: '#ff8fa8', borderRadius: 8, padding: '4px 12px',
          fontSize: 13, fontWeight: 700, minHeight: 34,
        }}>✕ 关闭</button>

        <h2 style={{
          margin: 0, marginBottom: 18,
          color: '#0ff', fontSize: 22, letterSpacing: 2,
          textShadow: '0 0 12px rgba(0,255,255,0.6)',
        }}>⚗ 合成工坊 <span style={{ fontSize: 13, color: '#888', marginLeft: 12 }}>
          拖拽 3 件同类型道具到槽位
        </span></h2>

        {/* -------- 合成三槽 -------- */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 14, marginBottom: 18, position: 'relative',
        }}>
          {slots.map((s, idx) => {
            const isHover = hoverSlotIdx === idx;
            const cls = ['craft-slot', isHover ? 'slot-drop-zone' : ''].filter(Boolean).join(' ');
            return (
              <div
                key={idx}
                className={cls}
                onDragOver={onDragOverSlot}
                onDragEnter={(e) => onDragEnterSlot(e, idx)}
                onDragLeave={() => onDragLeaveSlot(idx)}
                onDrop={(e) => onDropSlot(e, idx)}
                style={{
                  minHeight: 170,
                  border: '2px dashed rgba(0,255,255,0.28)',
                  borderRadius: 14,
                  padding: 10,
                  background: 'rgba(0,255,255,0.04)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {s ? (
                  <ItemCard item={s} flash={flashSlots[idx]}
                    draggable
                    onDragStart={() => {}}
                  />
                ) : (
                  <div style={{
                    color: 'rgba(0,255,255,0.35)', fontSize: 13,
                    letterSpacing: 1,
                  }}>
                    槽位 {idx + 1} · 拖入道具
                  </div>
                )}
              </div>
            );
          })}

          {/* 粒子爆散层 */}
          <div className="particle-layer">
            {particles.map((p) => (
              <span
                key={p.id}
                className="particle-burst"
                style={{
                  width: p.size, height: p.size,
                  marginLeft: -p.size / 2, marginTop: -p.size / 2,
                  ['--tx' as any]: `${p.tx}px`,
                  ['--ty' as any]: `${p.ty}px`,
                  ['--c' as any]:  p.c,
                  animationDelay: `${p.delay}ms`,
                }}
              />
            ))}
          </div>
        </div>

        {/* -------- 按钮 + 结果 -------- */}
        <div style={{
          display: 'flex', gap: 14, alignItems: 'center',
          marginBottom: 22, flexWrap: 'wrap',
        }}>
          <button
            disabled={!canCraft || anim}
            onClick={handleCraft}
            style={{
              padding: '12px 22px', fontSize: 15, fontWeight: 700,
              borderRadius: 12, letterSpacing: 1,
              background: canCraft && !anim
                ? 'linear-gradient(90deg, #0ff, #a0f, #f0f)'
                : 'rgba(80,80,100,0.3)',
              color: canCraft && !anim ? '#1a0a2e' : '#777',
              border: 'none',
              boxShadow: canCraft && !anim
                ? '0 0 24px rgba(0,255,255,0.5), 0 0 44px rgba(255,0,255,0.35)'
                : 'none',
              cursor: canCraft && !anim ? 'pointer' : 'not-allowed',
            }}
          >
            {anim ? '⚙ 合成中…' : '✦ 开始合成'}
          </button>

          <button onClick={() => {
            setSlots([undefined, undefined, undefined]);
            setResult(null);
            setResultSpawn(false);
            setFlashSlots([false, false, false]);
          }} style={{
            padding: '10px 18px', borderRadius: 10,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.18)',
            color: '#aab', fontSize: 13,
          }}>清空槽位</button>

          {/* 合成结果卡 */}
          {result?.item && (
            <div style={{
              marginLeft: 'auto', display: 'flex',
              alignItems: 'center', gap: 14,
            }}>
              <span style={{
                color: '#ffd166', fontWeight: 700, letterSpacing: 1,
                textShadow: '0 0 10px rgba(255,209,102,0.6)',
              }}>合成成功！</span>
              <div style={{ width: 220 }}>
                <ItemCard
                  item={result.item}
                  spawn={resultSpawn}
                  highlight
                  tag="✨ NEW"
                />
              </div>
            </div>
          )}
          {result?.error && (
            <div style={{
              marginLeft: 'auto',
              color: '#ff6b8a', fontSize: 13,
              padding: '8px 14px', borderRadius: 8,
              background: 'rgba(255,60,100,0.1)',
              border: '1px solid rgba(255,80,120,0.4)',
            }}>⚠ {result.error}</div>
          )}
        </div>

        {/* -------- 背包网格 (可拖拽) -------- */}
        <div style={{
          borderTop: '1px dashed rgba(0,255,255,0.2)',
          paddingTop: 16,
        }}>
          <div style={{
            color: '#aac', fontSize: 13, marginBottom: 10, letterSpacing: 0.5,
          }}>🎒 可用道具（拖入上方槽位） <span style={{color:'#667'}}>
            · 共 {availableItems.length} 件
          </span></div>
          {availableItems.length === 0 ? (
            <div style={{
              color: '#667', fontSize: 13, padding: 32, textAlign: 'center',
              background: 'rgba(255,255,255,0.02)', borderRadius: 10,
              border: '1px dashed rgba(255,255,255,0.08)',
            }}>背包中暂无可用道具</div>
          ) : (
            <div className="inventory-grid grid scroll" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 12, maxHeight: 320, overflow: 'auto',
              padding: 4,
            }}>
              {availableItems.map((it) => (
                <ItemCard
                  key={it.id}
                  item={it}
                  draggable
                  onDragStart={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ==================== 根组件 App ==================== */

export const App: React.FC = () => {
  const [state, setState] = useState<GameState>(() => simulator.getState());
  const [craftOpen, setCraftOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const autoScrollRef = useRef<HTMLDivElement>(null);

  /* ----- 订阅全局状态 ----- */
  useEffect(() => {
    const unsub = simulator.subscribe((s) => setState({ ...s }));
    return unsub;
  }, []);

  /* ----- toast 自动消失 ----- */
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }, []);

  /* ----- 战斗日志自动滚动 ----- */
  useEffect(() => {
    const el = autoScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [state.combatLog.length]);

  /* ----- 动作处理 ----- */
  const handleBattle = () => {
    if (state.inBattle) { showToast('战斗进行中…'); return; }
    simulator.enterBattle();
    showToast(`进入关卡 Lv.${state.level} · 怪物 ${state.monsters.length} 只`);
    window.setTimeout(() => {
      const r = simulator.runCombat();
      if (r?.win) showToast(`🏆 战斗胜利！获得 ${r.rewardItems?.length || 0} 件战利品`);
      else if (r) showToast('💀 战斗失败');
    }, 200);
  };

  const handleSetDifficulty = (d: Difficulty) => {
    if (state.inBattle) { showToast('战斗中无法切换难度'); return; }
    simulator.setDifficulty(d);
    showToast(`难度已切换：${DIFF_LABELS[d].label}`);
  };

  const handleEquip = (it: Item) => {
    const r = simulator.equipItem(it);
    if (!r.ok) showToast(`装备失败：${r.error || '未知'}`);
    else showToast(`已装备 ${it.name}`);
  };
  const handleUnequip = (slot: 'weapon' | 'armor' | 'accessory') => {
    const r = simulator.unequipItem(slot);
    if (!r.ok) showToast(`卸下失败：${r.error || '未知'}`);
  };

  const handleCraft = (mats: (Item | undefined | null)[]) => {
    const r = simulator.craft(mats);
    if (!r.success) return { success: false, error: r.error };
    showToast(`合成成功：${r.result?.name}`);
    return { success: true, result: r.result };
  };

  /* ----- 派生计算 ----- */
  const totalStats = useMemo(() => state.playerStats, [state.playerStats]);

  const HP_PCT = (hp: number, max: number) =>
    Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100));

  /* ==================== 渲染 ==================== */

  return (
    <div className="app-root" style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #2a0f4a 0%, #1a0a2e 45%, #0a051a 100%)',
      color: '#e0e8ff', position: 'relative',
    }}>
      <div className="hex-grid-bg" />

      {/* 顶部标题 - 霓虹呼吸边框 */}
      <header className="neon-header" style={{
        padding: '26px 24px 18px', textAlign: 'center', position: 'relative',
        borderBottom: '1px solid rgba(0,255,255,0.18)',
        background: 'linear-gradient(180deg, rgba(0,255,255,0.05), transparent)',
      }}>
        <h1 style={{
          margin: 0, fontSize: 28, letterSpacing: 6, fontWeight: 800,
          color: '#fff',
          textShadow:
            '0 0 10px #0ff, 0 0 22px #0ff, 0 0 4px #f0f, 0 0 18px #f0f',
        }}>
          CYBER&nbsp;ROGUE · 道具合成模拟器
        </h1>
        <div style={{
          marginTop: 8, fontSize: 12, color: '#89a', letterSpacing: 2,
        }}>PROCEDURAL · CRAFT · TURN-BASED COMBAT · v1.0</div>
      </header>

      {/* Toast */}
      {toast && (
        <div className="toast-slide" style={{
          position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 200, padding: '10px 20px', borderRadius: 10,
          background: 'rgba(26,10,46,0.96)',
          border: '1px solid rgba(0,255,255,0.45)',
          boxShadow: '0 0 22px rgba(0,255,255,0.35)',
          color: '#0ff', fontSize: 13, fontWeight: 600, letterSpacing: 0.5,
        }}>{toast}</div>
      )}

      {/* 主体三栏 */}
      <main style={{ padding: 18, position: 'relative' }}>
        <div className="main-grid" style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr 360px',
          gap: 16, alignItems: 'start',
        }}>
          {/* -------- 左栏：难度 / 属性 / 装备 / 按钮 -------- */}
          <section style={{
            background: 'rgba(26,14,56,0.55)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(0,255,255,0.22)',
            borderRadius: 14, padding: 16,
            boxShadow: '0 0 30px rgba(0,0,0,0.4)',
          }}>
            {/* 难度按钮 */}
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ margin: 0, marginBottom: 10, color: '#f0f', fontSize: 14, letterSpacing: 1.5, textShadow: '0 0 8px rgba(255,0,255,0.5)' }}>
                ◈ 难度选择
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
                {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => {
                  const active = state.difficulty === d;
                  const meta = DIFF_LABELS[d];
                  return (
                    <button key={d} onClick={() => handleSetDifficulty(d)} disabled={state.inBattle} style={{
                      padding: '10px 4px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                      background: active
                        ? `linear-gradient(180deg, ${meta.color}33, ${meta.color}11)`
                        : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${active ? meta.color : 'rgba(255,255,255,0.12)'}`,
                      color: active ? meta.color : '#aac',
                      boxShadow: active ? `0 0 14px ${meta.color}66` : 'none',
                      transition: 'all 0.2s',
                    }}>{meta.label}</button>
                  );
                })}
              </div>
            </div>

            {/* 关卡信息 */}
            <div style={{ marginBottom: 18, padding: 12, borderRadius: 10, background: 'rgba(0,255,255,0.04)', border: '1px solid rgba(0,255,255,0.16)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ab' }}>
                <span>关卡等级</span><span style={{ color: '#ffd166', fontWeight: 700 }}>Lv.{state.level}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#9ab', marginTop: 6 }}>
                <span>累计关卡</span><span style={{ color: '#0ff' }}>{state.totalRuns}</span>
              </div>
            </div>

            {/* HP条 */}
            <div style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                <span style={{ color: '#9ab' }}>❤ 生命值</span>
                <span style={{ color: '#ff7a8a', fontWeight: 700 }}>
                  {totalStats.hp} / {totalStats.maxHp}
                </span>
              </div>
              <div style={{
                height: 14, borderRadius: 7, overflow: 'hidden',
                background: 'rgba(255,60,100,0.12)',
                border: '1px solid rgba(255,80,120,0.3)',
              }}>
                <div
                  className="hp-bar-fill"
                  style={{
                    height: '100%',
                    width: `${HP_PCT(totalStats.hp, totalStats.maxHp)}%`,
                    background: 'linear-gradient(90deg, #ff5577, #ff8080)',
                    boxShadow: '0 0 10px rgba(255,80,120,0.6)',
                  }}
                />
              </div>
            </div>

            {/* 玩家属性面板 */}
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ margin: 0, marginBottom: 10, color: '#0ff', fontSize: 14, letterSpacing: 1.5, textShadow: '0 0 8px rgba(0,255,255,0.5)' }}>
                ⚡ 玩家属性
              </h3>
              <div style={{ display: 'grid', gap: 7, fontSize: 13 }}>
                <StatRow label="⚔ 攻击" value={`+${totalStats.attack}`} color="#ff9a66" />
                <StatRow label="🛡 防御" value={`+${totalStats.defense}`} color="#66b3ff" />
                <StatRow label="💥 暴击率" value={`${totalStats.critRate}%`} color="#ffd166" />
                <StatRow label="💨 闪避率" value={`${totalStats.dodgeRate}%`} color="#a0f0ff" />
              </div>
            </div>

            {/* 装备槽 */}
            <div style={{ marginBottom: 18 }}>
              <h3 style={{ margin: 0, marginBottom: 10, color: '#c77dff', fontSize: 14, letterSpacing: 1.5, textShadow: '0 0 8px rgba(199,125,255,0.5)' }}>
                ◆ 当前装备
              </h3>
              <div style={{ display: 'grid', gap: 10 }}>
                {(['weapon', 'armor', 'accessory'] as const).map((slot) => {
                  const eq = state.equipped[slot];
                  return (
                    <div key={slot} style={{
                      padding: 10, borderRadius: 10,
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}>
                      <div style={{
                        fontSize: 11, color: '#89a', marginBottom: 6, letterSpacing: 1,
                      }}>{TYPE_NAMES[slot]}槽</div>
                      {eq ? (
                        <div>
                          <ItemCard item={eq} compact />
                          <button onClick={() => handleUnequip(slot)} style={{
                            marginTop: 6, width: '100%', padding: '6px 8px',
                            fontSize: 11, borderRadius: 6,
                            background: 'rgba(255,100,100,0.12)',
                            border: '1px solid rgba(255,120,120,0.3)',
                            color: '#ff99aa', minHeight: 30,
                          }}>卸下</button>
                        </div>
                      ) : (
                        <div style={{ color: '#556', fontSize: 11, textAlign: 'center', padding: '14px 0' }}>
                          — 空 —
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 动作按钮 */}
            <div style={{ display: 'grid', gap: 10 }}>
              <button onClick={handleBattle} disabled={state.inBattle} style={{
                padding: '14px 16px', fontSize: 15, fontWeight: 800,
                letterSpacing: 2, borderRadius: 12,
                background: state.inBattle
                  ? 'rgba(100,100,120,0.3)'
                  : 'linear-gradient(90deg, #00ffaacc, #00ffff)',
                color: state.inBattle ? '#778' : '#0a0520',
                border: 'none',
                boxShadow: state.inBattle ? 'none' : '0 0 22px rgba(0,255,255,0.55)',
              }}>{state.inBattle ? '⚔ 战斗中…' : `▶ 进入关卡 Lv.${state.level}`}</button>

              <button onClick={() => setCraftOpen(true)} style={{
                padding: '12px 16px', fontSize: 14, fontWeight: 700,
                letterSpacing: 1.5, borderRadius: 12,
                background: 'linear-gradient(90deg, rgba(199,125,255,0.25), rgba(255,0,255,0.25))',
                border: '1.5px solid rgba(255,0,255,0.5)',
                color: '#f0a6ff',
                boxShadow: '0 0 20px rgba(255,0,255,0.28)',
              }}>⚗ 合成工坊（背包 {state.inventory.length}）</button>

              <button onClick={() => simulator.resetLevel()} disabled={state.inBattle} style={{
                padding: '10px 12px', fontSize: 12, borderRadius: 10,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#89a',
              }}>↺ 重置当前关卡</button>
            </div>
          </section>

          {/* -------- 中栏：怪物 / 战利品 / 背包 -------- */}
          <section style={{ display: 'grid', gap: 16 }}>
            {/* 怪物面板 */}
            <div style={{
              background: 'rgba(56,12,32,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255,80,130,0.22)',
              borderRadius: 14, padding: 16,
              boxShadow: '0 0 30px rgba(0,0,0,0.4)',
            }}>
              <h3 style={{ margin: 0, marginBottom: 12, color: '#ff6b8a', fontSize: 14, letterSpacing: 1.5, textShadow: '0 0 8px rgba(255,100,140,0.5)' }}>
                👾 敌方单位 · {state.monsters.length}
              </h3>
              {state.monsters.length === 0 ? (
                <div style={{ color: '#667', fontSize: 12, padding: 28, textAlign: 'center',
                  border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10, }}>
                  尚未进入关卡 —— 点击左侧「进入关卡」开始战斗
                </div>
              ) : (
                <div style={{ display: 'grid', gap: 10,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
                  {state.monsters.map((m) => {
                    const pct = HP_PCT(m.stats.hp, m.stats.maxHp);
                    return (
                      <div key={m.id} style={{
                        padding: 12, borderRadius: 10,
                        background: 'linear-gradient(180deg, rgba(255,60,100,0.08), rgba(100,20,40,0.08))',
                        border: `1px solid ${m.stats.hp <= 0 ? 'rgba(120,120,120,0.3)' : 'rgba(255,100,140,0.3)'}`,
                        opacity: m.stats.hp <= 0 ? 0.45 : 1,
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ color: '#ffaabb', fontWeight: 700, fontSize: 14 }}>{m.name}</span>
                          <span style={{ fontSize: 10, color: '#888', padding: '1px 6px',
                            border: '1px solid rgba(255,120,160,0.3)', borderRadius: 4 }}>
                            Lv.{m.level}
                          </span>
                        </div>
                        <div style={{
                          height: 10, borderRadius: 5, overflow: 'hidden',
                          background: 'rgba(255,60,100,0.1)', marginBottom: 8,
                          border: '1px solid rgba(255,80,120,0.2)',
                        }}>
                          <div className="hp-bar-fill" style={{
                            height: '100%', width: `${pct}%`,
                            background: 'linear-gradient(90deg, #ff3366, #ff8899)',
                          }} />
                        </div>
                        <div style={{ display: 'grid', gap: 3, fontSize: 11, color: '#cda' }}>
                          <div>❤ {m.stats.hp} / {m.stats.maxHp}</div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <span>⚔ {m.stats.attack}</span>
                            <span>🛡 {m.stats.defense}</span>
                          </div>
                        </div>
                        {m.skills.length > 0 && (
                          <div style={{ marginTop: 8, padding: 6, borderRadius: 6,
                            background: 'rgba(255,160,40,0.06)',
                            border: '1px dashed rgba(255,180,60,0.25)', fontSize: 10,
                            color: '#ffc980', lineHeight: 1.6 }}>
                            {m.skills.map((s) => (
                              <div key={s.id}>✧ {s.name}（CD {s.cd}回合）</div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 战利品 */}
            <div style={{
              background: 'rgba(26,54,56,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0,255,180,0.22)',
              borderRadius: 14, padding: 16,
            }}>
              <h3 style={{ margin: 0, marginBottom: 12, color: '#4fffc8', fontSize: 14, letterSpacing: 1.5, textShadow: '0 0 8px rgba(0,255,180,0.4)' }}>
                🎁 战利品（点击拾取到背包） · {state.battleRewards.length}
              </h3>
              {state.battleRewards.length === 0 ? (
                <div style={{ color: '#556', fontSize: 12, padding: 20, textAlign: 'center',
                  border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  暂无战利品 —— 完成战斗后可获得随机道具
                </div>
              ) : (
                <div className="items-grid grid" style={{
                  display: 'grid', gap: 12,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                }}>
                  {state.battleRewards.map((it) => (
                    <ItemCard
                      key={it.id}
                      item={it}
                      onClick={() => {
                        const r = simulator.pickupReward(it.id);
                        if (r.ok) showToast(`已拾取 ${it.name}`);
                      }}
                      tag="拾取"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* 背包 */}
            <div style={{
              background: 'rgba(44,26,74,0.55)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(199,125,255,0.22)',
              borderRadius: 14, padding: 16,
            }}>
              <h3 style={{ margin: 0, marginBottom: 12, color: '#c77dff', fontSize: 14, letterSpacing: 1.5, textShadow: '0 0 8px rgba(199,125,255,0.4)' }}>
                🎒 背包（点击装备） · {state.inventory.length}
              </h3>
              {state.inventory.length === 0 ? (
                <div style={{ color: '#556', fontSize: 12, padding: 20, textAlign: 'center',
                  border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 10 }}>
                  背包为空
                </div>
              ) : (
                <div className="items-grid grid" style={{
                  display: 'grid', gap: 12,
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                }}>
                  {state.inventory.map((it) => (
                    <ItemCard
                      key={it.id}
                      item={it}
                      onClick={() => handleEquip(it)}
                      tag="装备"
                    />
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* -------- 右栏：战斗日志 -------- */}
          <section style={{
            background: 'rgba(10,14,38,0.65)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(120,150,255,0.22)',
            borderRadius: 14, padding: 16,
            position: 'sticky', top: 16,
          }}>
            <h3 style={{ margin: 0, marginBottom: 12, color: '#8ab4ff', fontSize: 14, letterSpacing: 1.5, textShadow: '0 0 8px rgba(120,160,255,0.5)' }}>
              📜 战斗日志 · {state.combatLog.length}
            </h3>
            <div
              ref={autoScrollRef}
              className="log-scroll scroll"
              style={{
                maxHeight: '72vh', minHeight: 520, overflow: 'auto',
                padding: 10, borderRadius: 10,
                background: 'rgba(0,4,20,0.55)',
                border: '1px solid rgba(120,160,255,0.12)',
                fontSize: 12.5, lineHeight: 1.75,
              }}
            >
              {state.combatLog.length === 0 ? (
                <div style={{ color: '#445', padding: '40px 12px', textAlign: 'center', fontSize: 12 }}>
                  暂无战斗记录<br /><span style={{color:'#334', fontSize: 11}}>
                    点击「进入关卡」开始战斗
                  </span>
                </div>
              ) : (
                <LogList logs={state.combatLog} />
              )}
            </div>
          </section>
        </div>
      </main>

      {/* 合成弹窗 */}
      <CraftModal
        open={craftOpen}
        inventory={state.inventory}
        onClose={() => setCraftOpen(false)}
        onCraft={handleCraft}
      />
    </div>
  );
};

/* ==================== 小组件 ==================== */

const StatRow: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '8px 12px', borderRadius: 8,
    background: 'rgba(255,255,255,0.03)',
    border: `1px solid ${color}22`,
  }}>
    <span style={{ color: '#cde' }}>{label}</span>
    <span style={{ color, fontWeight: 700, textShadow: `0 0 6px ${color}66` }}>{value}</span>
  </div>
);

/**
 * 战斗日志渲染：
 *  - 按回合分组（turn > 0 且 turn 递增时显示分隔线）
 *  - 每行动显示时间戳
 *  - 数字全部洋红高亮 (#ff50ff)
 */
const LogList: React.FC<{ logs: CombatLogEntry[] }> = ({ logs }) => {
  const MAGENTA = '#ff4fff';
  const highlightNumbers = (text: string): React.ReactNode => {
    if (!text) return text;
    const parts: React.ReactNode[] = [];
    const re = /-?\d+\.?\d*/g;
    let last = 0; let m: RegExpExecArray | null; let key = 0;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      parts.push(
        <span key={key++} style={{
          color: MAGENTA, fontWeight: 700,
          textShadow: `0 0 6px ${MAGENTA}aa`,
        }}>{m[0]}</span>
      );
      last = m.index + m[0].length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts;
  };

  let lastTurn = -1;
  const elements: React.ReactNode[] = [];
  let k = 0;
  logs.forEach((log) => {
    if (log.turn > 0 && log.turn !== lastTurn) {
      lastTurn = log.turn;
      elements.push(
        <div key={`turn-${log.turn}-${k++}`} style={{
          marginTop: 6, marginBottom: 6,
          fontSize: 11, color: '#0ff', letterSpacing: 2, fontWeight: 700,
          padding: '4px 8px', borderRadius: 6,
          background: 'linear-gradient(90deg, rgba(0,255,255,0.1), transparent)',
          borderLeft: '2px solid #0ff',
          textShadow: '0 0 6px rgba(0,255,255,0.6)',
        }}>
          ━━━ 回合 {log.turn} ━━━
        </div>
      );
    }
    const t = log.timestamp;
    const ts = typeof t === 'number'
      ? new Date(t).toLocaleTimeString('zh-CN', { hour12: false })
      : String(t || '').split(' ').pop() || '';
    const tsShort = ts.slice(3); // mm:ss

    const colorMap: Record<string, string> = {
      info:    '#b9c7ff',
      player:  '#66ffbb',
      monster: '#ff8faa',
      crit:    '#ffd166',
      dodge:   '#80d8ff',
      effect:  '#ffaaff',
      system:  '#8ab4ff',
      win:     '#66ff99',
      lose:    '#ff6b8a',
    };

    elements.push(
      <div key={`log-${log.id || k++}`} className="log-line" style={{
        display: 'grid',
        gridTemplateColumns: '44px 52px 1fr',
        gap: 8, marginBottom: 3, padding: '2px 2px',
        alignItems: 'start',
      }}>
        <span style={{ color: '#557', fontSize: 11, fontFamily: 'monospace' }}>
          {tsShort}
        </span>
        <span style={{
          fontSize: 10, padding: '1px 6px', borderRadius: 4,
          background: (colorMap[log.type] || '#888') + '22',
          color: colorMap[log.type] || '#aaa',
          border: `1px solid ${colorMap[log.type] || '#888'}44`,
          textAlign: 'center',
          letterSpacing: 0.3,
          textTransform: 'uppercase',
        }}>{log.type}</span>
        <span style={{ color: colorMap[log.type] || '#ccd', lineHeight: 1.6 }}>
          {highlightNumbers(log.message)}
        </span>
      </div>
    );
  });

  return <>{elements}</>;
};

export default App;
