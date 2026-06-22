import { useState, useEffect, useRef, useCallback } from 'react';
import { flowerApi, bouquetApi, Flower, Bouquet } from '../api';

const FLOWER_CATALOG = [
  { name: 'rose' as const, nameCn: '玫瑰', emoji: '🌹', color: '#E8899E', price: 15, shelfLife: 5, purchaseCost: 6 },
  { name: 'lily' as const, nameCn: '百合', emoji: '🌸', color: '#FFD6E0', price: 12, shelfLife: 4, purchaseCost: 5 },
  { name: 'sunflower' as const, nameCn: '向日葵', emoji: '🌻', color: '#FFD93D', price: 10, shelfLife: 6, purchaseCost: 4 },
  { name: 'baby_breath' as const, nameCn: '满天星', emoji: '💐', color: '#F0E6FF', price: 8, shelfLife: 7, purchaseCost: 3 },
];

const SHELF_ROWS = 3;
const SHELF_COLS = 4;

interface SpoilageFX {
  id: string;
  emoji: string;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
}

/* -------------------- 组件：保质期进度条标签 -------------------- */
function ShelfLifeBadge({ remaining, total }: { remaining: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (remaining / total) * 100));
  const isCritical = remaining <= 1;
  const isWarning = remaining > 1 && remaining <= 2;
  const barColor = isCritical ? '#FF6B6B' : isWarning ? '#FFB300' : '#6BB88A';
  return (
    <div style={{
      width: '100%',
      marginTop: '3px',
      padding: '0 4px',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        fontSize: '9px',
        fontWeight: 600,
        color: isCritical ? '#FF6B6B' : 'var(--color-text-light)',
        marginBottom: '2px',
      }}>
        <span>保质期</span>
        <span>{remaining.toFixed(1)}天</span>
      </div>
      <div style={{
        height: '4px',
        borderRadius: '4px',
        background: '#F0E6E6',
        overflow: 'hidden',
      }}>
        <div
          className={isCritical ? 'expire-flash' : ''}
          style={{
            height: '100%',
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${barColor}, ${isCritical ? '#FF3B3B' : barColor})`,
            borderRadius: '4px',
            transition: 'width 0.4s ease, background 0.4s ease',
          }}
        />
      </div>
    </div>
  );
}

/* -------------------- 组件：花卉卡片 -------------------- */
function FlowerCard({
  flower,
  index,
  onMouseDown,
  fwdRef,
}: {
  flower: Flower;
  index: number;
  onMouseDown: (e: React.MouseEvent, flower: Flower, el: HTMLElement) => void;
  fwdRef: (el: HTMLElement | null) => void;
}) {
  const isCritical = flower.remainingDays <= 1;
  const isWarning = flower.remainingDays > 1 && flower.remainingDays <= 2;
  const delay = `${(index * 0.2) % 3}s`;
  return (
    <div
      ref={fwdRef}
      onMouseDown={e => onMouseDown(e, flower, e.currentTarget as HTMLElement)}
      data-flower-id={flower.id}
      className={`breathe ${isCritical ? 'expire-flash' : ''}`}
      style={{
        width: '80px',
        height: '108px',
        borderRadius: 'var(--radius-md)',
        background: isCritical
          ? 'linear-gradient(135deg, #FFF3CD, #FFE082)'
          : isWarning
          ? 'linear-gradient(135deg, #FFFAEC, #FFF0D1)'
          : 'linear-gradient(135deg, #FFFFFF, #FFF8F4)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        boxShadow: isCritical
          ? '0 4px 16px rgba(255, 107, 107, 0.25)'
          : 'var(--shadow-soft)',
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s',
        border: isCritical
          ? '2px solid #FF6B6B'
          : isWarning
          ? '2px solid #FFB300'
          : '2px solid rgba(232, 137, 158, 0.15)',
        userSelect: 'none',
        padding: '6px 4px',
        animationDelay: delay,
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'scale(1.1) translateY(-3px)';
        el.style.boxShadow = 'var(--shadow-medium)';
        el.style.cursor = 'grabbing';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = '';
        el.style.boxShadow = isCritical
          ? '0 4px 16px rgba(255, 107, 107, 0.25)'
          : 'var(--shadow-soft)';
        el.style.cursor = 'grab';
      }}
    >
      <span style={{ fontSize: '30px', lineHeight: 1 }}>{flower.emoji}</span>
      <span style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px', color: 'var(--color-text)' }}>
        {flower.nameCn}
      </span>
      <span style={{ fontSize: '10px', color: 'var(--color-pink-dark)', fontWeight: 700 }}>¥{flower.price}</span>
      <ShelfLifeBadge remaining={flower.remainingDays} total={flower.shelfLife} />
    </div>
  );
}

/* -------------------- 组件：花束卡片 -------------------- */
function BouquetCard({
  bouquet,
  index,
  fwdRef,
  onMouseDown,
}: {
  bouquet: Bouquet;
  index: number;
  fwdRef?: (el: HTMLElement | null) => void;
  onMouseDown?: (e: React.MouseEvent, bouquet: Bouquet, el: HTMLElement) => void;
}) {
  const isCritical = bouquet.remainingDays <= 1;
  const delay = `${(index * 0.35) % 3}s`;
  return (
    <div
      ref={fwdRef}
      onMouseDown={e => onMouseDown?.(e, bouquet, e.currentTarget as HTMLElement)}
      data-bouquet-id={bouquet.id}
      className={`breathe ${isCritical ? 'expire-flash' : ''}`}
      style={{
        width: '86px',
        height: '108px',
        borderRadius: 'var(--radius-md)',
        background: isCritical
          ? 'linear-gradient(135deg, #FFF3CD, #FFE082)'
          : 'linear-gradient(160deg, #FFF0F5, #FFE4E1 50%, #FFD1DC)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onMouseDown ? 'grab' : 'default',
        boxShadow: isCritical
          ? '0 4px 16px rgba(255, 107, 107, 0.25)'
          : '0 6px 20px rgba(232, 137, 158, 0.18)',
        border: isCritical ? '2px solid #FF6B6B' : '2px solid rgba(232, 137, 158, 0.25)',
        userSelect: 'none',
        padding: '6px 4px',
        animationDelay: delay,
        position: 'relative',
        transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = 'scale(1.08) translateY(-3px)';
        el.style.boxShadow = '0 12px 28px rgba(232, 137, 158, 0.32)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLElement;
        el.style.transform = '';
        el.style.boxShadow = isCritical
          ? '0 4px 16px rgba(255, 107, 107, 0.25)'
          : '0 6px 20px rgba(232, 137, 158, 0.18)';
      }}
    >
      <div style={{
        position: 'absolute',
        top: '-6px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '11px',
      }}>🎀</div>
      <span style={{ fontSize: '22px', lineHeight: 1, marginTop: '4px' }}>
        {bouquet.flowers.slice(0, 3).map(f => f.emoji).join('')}
      </span>
      <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px', color: 'var(--color-pink-dark)', textAlign: 'center', lineHeight: 1.2 }}>
        {bouquet.name}
      </span>
      <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)', marginTop: '2px' }}>¥{bouquet.price}</span>
      <ShelfLifeBadge remaining={bouquet.remainingDays} total={Math.max(...bouquet.flowers.map(f => f.shelfLife))} />
    </div>
  );
}

/* -------------------- 组件：花束组合预览 -------------------- */
function CraftPreview({ slots }: { slots: Flower[] }) {
  if (slots.length < 2) return null;
  const totalPrice = slots.reduce((s, f) => s + f.price, 0);
  const finalPrice = Math.round(totalPrice * 1.3);
  const dominant = slots.reduce((a, b) => a.price > b.price ? a : b);
  return (
    <div className="float-appear preview-glow" style={{
      marginTop: '14px',
      padding: '16px 20px',
      borderRadius: 'var(--radius-lg)',
      background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF0F5 60%, #FFE4E1 100%)',
      border: '2px solid var(--color-pink-dark)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: '8px',
        right: '12px',
        fontSize: '10px',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--color-pink-dark)',
        color: '#fff',
        fontWeight: 700,
      }}>组合预览</div>

      {/* 原料部分 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {slots.map((f, i) => (
          <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FFFFFF, #FFF0F5)',
              border: `2px solid ${f.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
            }}>{f.emoji}</div>
            {i < slots.length - 1 && (
              <span style={{ fontSize: '18px', color: 'var(--color-pink-dark)', fontWeight: 700, margin: '0 2px' }}>+</span>
            )}
          </div>
        ))}
      </div>

      {/* 箭头 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '4px',
          background: 'var(--color-green)',
          color: '#fff',
          fontWeight: 600,
          marginBottom: '3px',
        }}>组合</div>
        <span style={{ fontSize: '22px', color: 'var(--color-pink-dark)' }}>➡️</span>
      </div>

      {/* 预览花束 */}
      <div style={{
        width: '86px',
        height: '100px',
        borderRadius: 'var(--radius-md)',
        background: `linear-gradient(160deg, ${dominant.color}33, #FFE4E1 50%, #FFD1DC)`,
        border: '2px solid var(--color-pink-dark)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        boxShadow: '0 8px 20px rgba(232, 137, 158, 0.25)',
      }}>
        <div style={{
          position: 'absolute',
          top: '-6px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '12px',
        }}>🎀</div>
        <span style={{ fontSize: '22px', marginTop: '6px' }}>
          {slots.map(f => f.emoji).join('')}
        </span>
        <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-pink-dark)', marginTop: '4px', textAlign: 'center', padding: '0 4px' }}>
          {slots.map(f => f.nameCn).join('+')}
        </span>
      </div>

      {/* 价格 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '4px' }}>
        <div style={{
          fontSize: '10px',
          color: 'var(--color-text-light)',
          textDecoration: 'line-through',
        }}>成本 ¥{totalPrice}</div>
        <div style={{
          fontSize: '26px',
          fontWeight: 800,
          color: 'var(--color-pink-dark)',
          fontFamily: "'Noto Serif SC', serif",
          lineHeight: 1,
          marginTop: '2px',
        }}>¥{finalPrice}</div>
        <div style={{
          fontSize: '10px',
          padding: '2px 6px',
          borderRadius: '4px',
          background: 'var(--color-green)',
          color: '#fff',
          fontWeight: 600,
          marginTop: '2px',
        }}>+30% 利润</div>
      </div>
    </div>
  );
}

/* ======================================================================
   主组件：ShopScene
   ====================================================================== */
export default function ShopScene() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [craftSlots, setCraftSlots] = useState<Flower[]>([]);
  const [craftHover, setCraftHover] = useState(false);
  const [trashCount, setTrashCount] = useState(0);
  const [spoilageFX, setSpoilageFX] = useState<SpoilageFX[]>([]);

  const craftZoneRef = useRef<HTMLDivElement>(null);
  const trashZoneRef = useRef<HTMLDivElement>(null);
  const flowerRefsMap = useRef<Map<string, HTMLElement>>(new Map());
  const bouquetRefsMap = useRef<Map<string, HTMLElement>>(new Map());

  // ---- 拖拽系统（用Ref直接操作DOM实现丝滑跟随）----
  const dragRef = useRef<{
    active: boolean;
    type: 'flower' | 'bouquet' | null;
    id: string;
    itemData: Flower | Bouquet | null;
    originEl: HTMLElement | null;
    offsetX: number;
    offsetY: number;
  }>({
    active: false, type: null, id: '', itemData: null, originEl: null,
    offsetX: 0, offsetY: 0,
  });

  const dragFollowerRef = useRef<HTMLDivElement>(null);
  const dragPosRef = useRef({ currentX: 0, currentY: 0, targetX: 0, targetY: 0 });
  const dragRAFRef = useRef<number>(0);

  /* ----------- 数据加载 ----------- */
  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const i = setInterval(tickSpoilage, 20000);
    return () => clearInterval(i);
  }, [flowers, bouquets]);

  const loadData = async () => {
    try {
      const [f, b] = await Promise.all([flowerApi.getAll(), bouquetApi.getAll()]);
      setFlowers(f);
      setBouquets(b);
    } catch {
      const defaults: Flower[] = [];
      FLOWER_CATALOG.forEach(c => {
        for (let i = 0; i < 2; i++) {
          defaults.push({
            id: `f-${c.name}-${i}-${Date.now()}`,
            ...c,
            remainingDays: c.shelfLife,
          });
        }
      });
      setFlowers(defaults);
      setBouquets([]);
    }
  };

  /* ----------- 库存腐烂逻辑 + 飞入垃圾桶动画 ----------- */
  const triggerSpoilageAnim = (id: string, type: 'flower' | 'bouquet', emoji: string) => {
    const map = type === 'flower' ? flowerRefsMap.current : bouquetRefsMap.current;
    const el = map.get(id);
    const trash = trashZoneRef.current;
    if (!el || !trash) return;
    const r1 = el.getBoundingClientRect();
    const r2 = trash.getBoundingClientRect();
    const startX = r1.left + r1.width / 2;
    const startY = r1.top + r1.height / 2;
    const targetX = (r2.left + r2.width / 2) - startX;
    const targetY = (r2.top + r2.height / 2) - startY;
    const fx: SpoilageFX = {
      id: `${id}-${Date.now()}`,
      emoji,
      startX, startY, targetX, targetY,
    };
    setSpoilageFX(prev => [...prev, fx]);
    setTimeout(() => {
      setSpoilageFX(prev => prev.filter(p => p.id !== fx.id));
    }, 1000);
  };

  const tickSpoilage = () => {
    let changed = false;
    const updatedFlowers: Flower[] = [];
    const spoiledFlowers: { id: string; emoji: string }[] = [];
    for (const f of flowers) {
      const nd = Math.max(0, f.remainingDays - 0.5);
      if (nd <= 0) {
        spoiledFlowers.push({ id: f.id, emoji: f.emoji });
        changed = true;
      } else {
        updatedFlowers.push({ ...f, remainingDays: nd });
      }
    }
    if (spoiledFlowers.length > 0) {
      setTrashCount(prev => prev + spoiledFlowers.length);
      spoiledFlowers.forEach(s => triggerSpoilageAnim(s.id, 'flower', s.emoji));
    }

    const updatedBouquets: Bouquet[] = [];
    const spoiledBouquets: { id: string; emoji: string }[] = [];
    for (const b of bouquets) {
      const minDays = Math.min(...b.flowers.map(f => f.remainingDays));
      const nd = Math.max(0, minDays - 0.5);
      if (nd <= 0) {
        spoiledBouquets.push({ id: b.id, emoji: b.flowers.slice(0, 2).map(f => f.emoji).join('') });
        changed = true;
      } else {
        updatedBouquets.push({
          ...b,
          remainingDays: nd,
          flowers: b.flowers.map(f => ({ ...f, remainingDays: Math.max(0, f.remainingDays - 0.5) })),
        });
      }
    }
    if (spoiledBouquets.length > 0) {
      setTrashCount(prev => prev + spoiledBouquets.length);
      spoiledBouquets.forEach(s => triggerSpoilageAnim(s.id, 'bouquet', s.emoji));
    }

    if (changed) {
      setFlowers(updatedFlowers);
      setBouquets(updatedBouquets);
    }
  };

  /* ----------- 进货 ----------- */
  const handlePurchase = async (catalogItem: typeof FLOWER_CATALOG[0]) => {
    try {
      const newFlowers = await flowerApi.create(catalogItem.name, 1);
      setFlowers(newFlowers);
    } catch {
      const newFlower: Flower = {
        id: `f-${catalogItem.name}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        ...catalogItem,
        remainingDays: catalogItem.shelfLife,
      };
      setFlowers(prev => [...prev, newFlower]);
    }
  };

  /* ----------- 拖拽：开始 ----------- */
  const onFlowerMouseDown = useCallback((e: React.MouseEvent, flower: Flower, el: HTMLElement) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = el.getBoundingClientRect();
    dragRef.current = {
      active: true,
      type: 'flower',
      id: flower.id,
      itemData: flower,
      originEl: el,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
    dragPosRef.current = {
      currentX: rect.left,
      currentY: rect.top,
      targetX: e.clientX - dragRef.current.offsetX,
      targetY: e.clientY - dragRef.current.offsetY,
    };
    if (dragFollowerRef.current) {
      dragFollowerRef.current.style.display = 'block';
      // 渲染内容
      dragFollowerRef.current.innerHTML = buildFlowerFollowerHTML(flower);
      updateFollowerTransform();
    }
    el.style.visibility = 'hidden';
    startDragLoop();
  }, []);

  const buildFlowerFollowerHTML = (f: Flower) => `
    <div style="
      width: 80px; height: 108px;
      border-radius: 12px;
      background: linear-gradient(135deg, #FFFFFF, #FFF8F4);
      display: flex; flex-direction: column;
      align-items: center; justify-content: center;
      box-shadow: 0 12px 36px rgba(232, 137, 158, 0.4);
      border: 2px solid ${f.color};
      padding: 6px 4px;
    ">
      <div style="font-size: 30px; line-height: 1;">${f.emoji}</div>
      <div style="font-size: 11px; font-weight: 600; margin-top: 4px; color: #5A4A42;">${f.nameCn}</div>
      <div style="font-size: 10px; color: #E8899E; font-weight: 700;">¥${f.price}</div>
      <div style="width: 100%; padding: 0 4px; margin-top: 3px;">
        <div style="font-size: 9px; color: #8B7B72; margin-bottom: 2px;">保质期 ${f.remainingDays}天</div>
        <div style="height: 4px; border-radius: 4px; background: #F0E6E6;">
          <div style="height: 100%; width: ${Math.max(0, (f.remainingDays / f.shelfLife) * 100)}%; background: #6BB88A; border-radius: 4px;"></div>
        </div>
      </div>
    </div>
  `;

  const startDragLoop = () => {
    const animate = () => {
      if (!dragRef.current.active) return;
      const p = dragPosRef.current;
      // easeOutCubic 缓动
      const lerp = 0.22;
      const diffX = p.targetX - p.currentX;
      const diffY = p.targetY - p.currentY;
      p.currentX += diffX * lerp;
      p.currentY += diffY * lerp;
      if (Math.abs(diffX) < 0.2 && Math.abs(diffY) < 0.2) {
        p.currentX = p.targetX;
        p.currentY = p.targetY;
      }
      updateFollowerTransform();
      dragRAFRef.current = requestAnimationFrame(animate);
    };
    cancelAnimationFrame(dragRAFRef.current);
    dragRAFRef.current = requestAnimationFrame(animate);
  };

  const updateFollowerTransform = () => {
    if (!dragFollowerRef.current) return;
    const x = dragPosRef.current.currentX;
    const y = dragPosRef.current.currentY;
    dragFollowerRef.current.style.transform = `translate(${x}px, ${y}px) scale(1.12)`;
  };

  /* ----------- 拖拽：移动（document级别） ----------- */
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      dragPosRef.current.targetX = e.clientX - dragRef.current.offsetX;
      dragPosRef.current.targetY = e.clientY - dragRef.current.offsetY;
      // hover检测
      if (craftZoneRef.current) {
        const r = craftZoneRef.current.getBoundingClientRect();
        const over = e.clientX >= r.left && e.clientX <= r.right
          && e.clientY >= r.top && e.clientY <= r.bottom;
        setCraftHover(over);
      }
    };
    const onUp = () => handleMouseUp();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [craftSlots]);

  /* ----------- 拖拽：结束 ----------- */
  const handleMouseUp = () => {
    if (!dragRef.current.active) return;
    const { type, id, itemData, originEl } = dragRef.current;
    let placed = false;
    // 检测加工区
    if (craftZoneRef.current && type === 'flower' && itemData) {
      const r = craftZoneRef.current.getBoundingClientRect();
      const cx = dragPosRef.current.targetX + dragRef.current.offsetX;
      const cy = dragPosRef.current.targetY + dragRef.current.offsetY;
      if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
        const flower = itemData as Flower;
        if (craftSlots.length < 3 && !craftSlots.find(s => s.id === id)) {
          setCraftSlots(prev => [...prev, flower]);
          setFlowers(prev => prev.filter(f => f.id !== id));
          flowerRefsMap.current.delete(id);
          placed = true;
        }
      }
    }
    if (!placed && originEl) {
      originEl.style.visibility = 'visible';
    }
    if (dragFollowerRef.current) {
      dragFollowerRef.current.style.display = 'none';
    }
    setCraftHover(false);
    cancelAnimationFrame(dragRAFRef.current);
    dragRef.current = { active: false, type: null, id: '', itemData: null, originEl: null, offsetX: 0, offsetY: 0 };
  };

  /* ----------- 组合花束 ----------- */
  const handleCraftBouquet = async () => {
    if (craftSlots.length < 2) return;
    const ids = craftSlots.map(f => f.id);
    try {
      const b = await bouquetApi.create(ids);
      setBouquets(prev => [...prev, b]);
    } catch {
      const totalPrice = craftSlots.reduce((s, f) => s + f.price, 0);
      const minDays = Math.min(...craftSlots.map(f => f.remainingDays));
      const dominant = craftSlots.reduce((a, b) => a.price > b.price ? a : b);
      const nb: Bouquet = {
        id: `b-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        flowers: [...craftSlots],
        name: craftSlots.map(f => f.nameCn).join('+'),
        price: Math.round(totalPrice * 1.3),
        color: dominant.color,
        remainingDays: minDays,
      };
      setBouquets(prev => [...prev, nb]);
    }
    setCraftSlots([]);
  };

  const clearCraft = () => {
    setFlowers(prev => [...prev, ...craftSlots]);
    setCraftSlots([]);
  };

  const removeFromCraft = (fid: string) => {
    const f = craftSlots.find(s => s.id === fid);
    if (f) {
      setCraftSlots(prev => prev.filter(s => s.id !== fid));
      setFlowers(prev => [...prev, f]);
    }
  };

  /* ----------- 渲染辅助 ----------- */
  const shelfGrid: (Bouquet | null)[][] = Array.from({ length: SHELF_ROWS }, (_, row) =>
    Array.from({ length: SHELF_COLS }, (_, col) => {
      const idx = row * SHELF_COLS + col;
      return bouquets[idx] || null;
    })
  );

  const setFlowerRef = (id: string) => (el: HTMLElement | null) => {
    if (el) flowerRefsMap.current.set(id, el);
    else flowerRefsMap.current.delete(id);
  };
  const setBouquetRef = (id: string) => (el: HTMLElement | null) => {
    if (el) bouquetRefsMap.current.set(id, el);
    else bouquetRefsMap.current.delete(id);
  };

  /* ==================== 渲染 ==================== */
  return (
    <div style={{ width: '100%', minHeight: 'calc(100vh - 100px)', padding: '20px' }}>
      {/* 拖拽跟随元素：放在body级，transform实现高性能定位 */}
      <div
        ref={dragFollowerRef}
        className="drag-follower drag-follower-ghost"
        style={{ display: 'none', left: 0, top: 0 }}
      />

      {/* 腐烂动画特效层 */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 500, overflow: 'hidden' }}>
        {spoilageFX.map(fx => (
          <div
            key={fx.id}
            className="fall-into-trash"
            style={{
              position: 'absolute',
              left: fx.startX - 20,
              top: fx.startY - 20,
              fontSize: '28px',
              ['--tx' as any]: `${fx.targetX}px`,
              ['--ty' as any]: `${fx.targetY}px`,
            } as React.CSSProperties}
          >
            {fx.emoji}🥀
          </div>
        ))}
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'auto auto auto',
        gap: '20px',
        maxWidth: '1240px',
        margin: '0 auto',
      }}>

        {/* ========== 进货区 ========== */}
        <div style={{
          gridColumn: '1 / 2',
          gridRow: '1 / 2',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(180deg, #FFFFFF, #FFFBF6)',
          padding: '22px',
          boxShadow: 'var(--shadow-medium)',
          border: '1px solid rgba(232, 137, 158, 0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '19px', color: 'var(--color-pink-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>📦</span> 进货区
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--color-cream)' }}>
              拖拽花卉到右侧加工区
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
            {FLOWER_CATALOG.map(c => (
              <button
                key={c.name}
                onClick={() => handlePurchase(c)}
                style={{
                  padding: '9px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #FFFFFF, #FFEAEA)',
                  border: '2px solid rgba(232, 137, 158, 0.25)',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(232, 137, 158, 0.1)',
                }}
              >
                <span style={{ fontSize: '18px' }}>{c.emoji}</span>
                <span>进 {c.nameCn}</span>
                <span style={{
                  fontSize: '11px',
                  padding: '1px 6px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--color-green)',
                  color: '#fff',
                }}>¥{c.purchaseCost}</span>
              </button>
            ))}
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            minHeight: '136px',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #FFFCF8, #FFF4EC)',
            border: '2px dashed rgba(232, 137, 158, 0.25)',
          }}>
            {flowers.length === 0 && (
              <div style={{
                color: 'var(--color-text-light)',
                fontSize: '13px',
                padding: '20px',
                textAlign: 'center',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{ fontSize: '28px' }}>🌱</span>
                <span>还没有花卉库存，点击上方按钮进货~</span>
              </div>
            )}
            {flowers.map((f, i) => (
              <FlowerCard
                key={f.id}
                flower={f}
                index={i}
                onMouseDown={onFlowerMouseDown}
                fwdRef={setFlowerRef(f.id)}
              />
            ))}
          </div>
        </div>

        {/* ========== 加工区 ========== */}
        <div style={{
          gridColumn: '2 / 3',
          gridRow: '1 / 2',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(180deg, #FFFFFF, #FFF8FB)',
          padding: '22px',
          boxShadow: 'var(--shadow-medium)',
          border: '1px solid rgba(232, 137, 158, 0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '19px', color: 'var(--color-pink-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🔧</span> 加工区
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--color-cream)' }}>
              {craftSlots.length}/3 种 · 至少2种即可组合
            </span>
          </div>

          <div
            ref={craftZoneRef}
            style={{
              minHeight: '136px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: craftHover
                ? 'linear-gradient(135deg, #FFF0F5, #FFD6E0)'
                : 'linear-gradient(135deg, #FFFBFB, #FFF0F3)',
              border: craftHover
                ? '3px dashed var(--color-pink-dark)'
                : '2px dashed rgba(232, 137, 158, 0.3)',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              flexWrap: 'wrap',
              boxShadow: craftHover ? 'inset 0 0 0 4px rgba(232, 137, 158, 0.08)' : 'none',
            }}
          >
            {craftSlots.length === 0 && (
              <div style={{
                color: 'var(--color-text-light)',
                fontSize: '14px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
              }}>
                <span style={{ fontSize: '32px' }}>🫳</span>
                <span>从左侧拖拽2~3种花卉到这里组合花束</span>
              </div>
            )}
            {craftSlots.map((f, i) => (
              <div key={f.id} className="float-appear" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div
                  onClick={() => removeFromCraft(f.id)}
                  title="点击移除"
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #FFFFFF, #FFF0F5)',
                    border: `2px solid ${f.color}`,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(232, 137, 158, 0.15)',
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1.06)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'scale(1)'; }}
                >
                  <span style={{ fontSize: '24px' }}>{f.emoji}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text)' }}>{f.nameCn}</div>
                    <div style={{ fontSize: '10px', color: 'var(--color-text-light)' }}>¥{f.price}</div>
                  </div>
                </div>
                {i < craftSlots.length - 1 && (
                  <span style={{ fontSize: '22px', color: 'var(--color-pink-dark)', fontWeight: 700 }}>+</span>
                )}
              </div>
            ))}
          </div>

          {/* 组合预览 */}
          <CraftPreview slots={craftSlots} />

          <div style={{ display: 'flex', gap: '12px', marginTop: '14px', justifyContent: 'center' }}>
            <button
              onClick={handleCraftBouquet}
              disabled={craftSlots.length < 2}
              style={{
                padding: '11px 34px',
                borderRadius: 'var(--radius-md)',
                background: craftSlots.length >= 2
                  ? 'linear-gradient(135deg, var(--color-pink-dark), #F48FB1)'
                  : '#F0E6E6',
                color: craftSlots.length >= 2 ? '#fff' : 'var(--color-text-light)',
                fontSize: '15px',
                fontWeight: 700,
                boxShadow: craftSlots.length >= 2 ? '0 6px 18px rgba(232, 137, 158, 0.3)' : 'none',
                cursor: craftSlots.length >= 2 ? 'pointer' : 'not-allowed',
              }}
            >
              ✨ 组合成花束
            </button>
            <button
              onClick={clearCraft}
              disabled={craftSlots.length === 0}
              style={{
                padding: '11px 22px',
                borderRadius: 'var(--radius-md)',
                background: craftSlots.length > 0 ? 'linear-gradient(135deg, #FFE0E0, #FFCDD2)' : '#F0E6E6',
                color: craftSlots.length > 0 ? '#C0392B' : 'var(--color-text-light)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: craftSlots.length > 0 ? 'pointer' : 'not-allowed',
              }}
            >
              🔄 退回原料
            </button>
          </div>
        </div>

        {/* ========== 展示区货架 ========== */}
        <div style={{
          gridColumn: '1 / 3',
          gridRow: '2 / 3',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(180deg, #FFFFFF, #FFFBF7)',
          padding: '22px',
          boxShadow: 'var(--shadow-medium)',
          border: '1px solid rgba(232, 137, 158, 0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '19px', color: 'var(--color-pink-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🏪</span> 展示区货架
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)', padding: '4px 10px', borderRadius: 'var(--radius-full)', background: 'var(--color-green)', color: '#fff', fontWeight: 600 }}>
              {bouquets.length}/{SHELF_ROWS * SHELF_COLS} 束在售
            </span>
          </div>

          <div style={{
            background: 'linear-gradient(180deg, #7A5D37 0%, #9B7B52 7%, #B8996E 8%, #C9AD84 16%, #D6BA96 100%)',
            borderRadius: '16px',
            padding: '20px 16px',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.15)',
            position: 'relative',
          }}>
            {shelfGrid.map((row, rowIdx) => (
              <div key={rowIdx} style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${SHELF_COLS}, 1fr)`,
                gap: '14px',
                marginBottom: rowIdx < SHELF_ROWS - 1 ? '24px' : '0',
                padding: '6px 4px 14px',
                position: 'relative',
              }}>
                {/* 层板 */}
                <div style={{
                  position: 'absolute',
                  bottom: '-10px',
                  left: '-8px',
                  right: '-8px',
                  height: '12px',
                  background: 'linear-gradient(180deg, #8B6F47, #5D4830)',
                  borderRadius: '0 0 6px 6px',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                }} />
                {/* 货架支架 */}
                <div style={{
                  position: 'absolute',
                  bottom: '-10px',
                  left: '8px',
                  width: '8px',
                  height: '20px',
                  background: '#6B5030',
                  borderRadius: '0 0 4px 4px',
                }} />
                <div style={{
                  position: 'absolute',
                  bottom: '-10px',
                  right: '8px',
                  width: '8px',
                  height: '20px',
                  background: '#6B5030',
                  borderRadius: '0 0 4px 4px',
                }} />
                {row.map((bouquet, colIdx) => (
                  <div key={colIdx} style={{
                    height: '120px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)',
                    background: bouquet ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)',
                    border: bouquet ? 'none' : '2px dashed rgba(255,255,255,0.22)',
                    position: 'relative',
                  }}>
                    {bouquet ? (
                      <BouquetCard
                        bouquet={bouquet}
                        index={rowIdx * SHELF_COLS + colIdx}
                        fwdRef={setBouquetRef(bouquet.id)}
                      />
                    ) : (
                      <div style={{ opacity: 0.25, fontSize: '28px', filter: 'brightness(2)' }}>💐</div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* ========== 收银台 + 垃圾桶 ========== */}
        <div style={{
          gridColumn: '1 / 3',
          gridRow: '3 / 4',
          display: 'flex',
          gap: '20px',
        }}>
          <div style={{
            flex: 1,
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #81C784, #66BB6A 60%, #4CAF50)',
            padding: '22px 26px',
            color: '#fff',
            boxShadow: '0 10px 32px rgba(102, 187, 106, 0.35)',
          }}>
            <h3 style={{ fontSize: '19px', color: '#fff', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💰</span> 收银台
            </h3>
            <div style={{ display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>今日营业额</div>
                <div style={{ fontSize: '34px', fontWeight: 800, fontFamily: "'Noto Serif SC', serif", lineHeight: 1.1 }}>
                  ¥{bouquets.filter(b => b.remainingDays > 0).reduce((s, b) => s + b.price, 0).toFixed(0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>在架花束</div>
                <div style={{ fontSize: '28px', fontWeight: 700 }}>{bouquets.length} <span style={{ fontSize: '14px', opacity: 0.8 }}>束</span></div>
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>库存花卉</div>
                <div style={{ fontSize: '28px', fontWeight: 700 }}>{flowers.length} <span style={{ fontSize: '14px', opacity: 0.8 }}>支</span></div>
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>库存损耗</div>
                <div style={{ fontSize: '28px', fontWeight: 700 }}>{trashCount} <span style={{ fontSize: '14px', opacity: 0.8 }}>件</span></div>
              </div>
            </div>
          </div>

          <div
            ref={trashZoneRef}
            style={{
              width: '200px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, #EEEEEE, #E0E0E0, #BDBDBD)',
              padding: '20px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '14px',
              background: 'linear-gradient(180deg, #9E9E9E, #757575)',
              borderRadius: '12px 12px 0 0',
            }} />
            <span style={{ fontSize: '42px', marginTop: '6px' }}>🗑️</span>
            <span style={{ fontSize: '13px', color: '#616161', marginTop: '6px', fontWeight: 600 }}>垃圾桶</span>
            <span style={{
              fontSize: '11px',
              marginTop: '4px',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
              background: trashCount > 0 ? '#FFAB91' : '#EEEEEE',
              color: trashCount > 0 ? '#BF360C' : '#9E9E9E',
              fontWeight: 700,
            }}>已丢弃: {trashCount} 件</span>
            {spoilageFX.length > 0 && (
              <span style={{ fontSize: '10px', color: '#FF6B6B', marginTop: '4px', fontWeight: 600 }}>
                正在处理腐烂...
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
