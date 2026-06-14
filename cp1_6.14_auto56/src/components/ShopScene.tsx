import { useState, useEffect, useRef, useCallback } from 'react';
import { flowerApi, bouquetApi, Flower, Bouquet } from '../api';

interface DragState {
  active: boolean;
  item: Flower | null;
  source: 'stock' | null;
  offsetX: number;
  offsetY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
}

const FLOWER_CATALOG = [
  { name: 'rose' as const, nameCn: '玫瑰', emoji: '🌹', color: '#E8899E', price: 15, shelfLife: 5, purchaseCost: 6 },
  { name: 'lily' as const, nameCn: '百合', emoji: '🌸', color: '#FFD6E0', price: 12, shelfLife: 4, purchaseCost: 5 },
  { name: 'sunflower' as const, nameCn: '向日葵', emoji: '🌻', color: '#FFD93D', price: 10, shelfLife: 6, purchaseCost: 4 },
  { name: 'baby_breath' as const, nameCn: '满天星', emoji: '💐', color: '#F0E6FF', price: 8, shelfLife: 7, purchaseCost: 3 },
];

const SHELF_ROWS = 3;
const SHELF_COLS = 4;

function SpoilageAnimation({ item, onDone }: { item: Flower | Bouquet; onDone: () => void }) {
  const [phase, setPhase] = useState<'yellow' | 'fall'>('yellow');
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('fall'), 600);
    const t2 = setTimeout(onDone, 1400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);
  const emoji = 'flowers' in item
    ? item.flowers.map(f => f.emoji).slice(0, 2).join('')
    : item.emoji;
  return (
    <div style={{
      position: 'absolute',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '28px',
      filter: phase === 'yellow' ? 'saturate(0.3) brightness(1.3)' : 'saturate(0.1) brightness(1.5)',
      transform: phase === 'fall' ? 'translateY(80px) scale(0.2) rotate(30deg)' : 'scale(0.9)',
      opacity: phase === 'fall' ? 0 : 0.7,
      transition: phase === 'fall'
        ? 'transform 0.8s ease-in, opacity 0.8s ease-in, filter 0.5s'
        : 'transform 0.6s, filter 0.6s',
      pointerEvents: 'none',
      zIndex: 50,
    }}>
      {emoji}
    </div>
  );
}

function FlowerCard({
  flower,
  onMouseDown,
  spoilage,
}: {
  flower: Flower;
  onMouseDown: (e: React.MouseEvent, flower: Flower) => void;
  spoilage?: boolean;
}) {
  const isExpiring = flower.remainingDays <= 1;
  return (
    <div
      onMouseDown={e => onMouseDown(e, flower)}
      style={{
        width: '72px',
        height: '88px',
        borderRadius: 'var(--radius-md)',
        background: isExpiring
          ? 'linear-gradient(135deg, #FFF3CD, #FFE082)'
          : 'var(--color-white)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        boxShadow: 'var(--shadow-soft)',
        transition: 'transform 0.2s, box-shadow 0.2s, background 0.5s',
        border: isExpiring ? '2px solid #FFB300' : '2px solid transparent',
        userSelect: 'none',
        position: 'relative',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-medium)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-soft)';
      }}
    >
      <span style={{ fontSize: '28px', lineHeight: 1 }}>{flower.emoji}</span>
      <span style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px', color: 'var(--color-text)' }}>
        {flower.nameCn}
      </span>
      <span style={{
        fontSize: '9px',
        marginTop: '2px',
        padding: '1px 6px',
        borderRadius: 'var(--radius-full)',
        background: isExpiring ? '#FF6B6B' : 'var(--color-green)',
        color: '#fff',
        fontWeight: 600,
      }}>
        {flower.remainingDays}天
      </span>
      {spoilage && (
        <SpoilageAnimation item={flower} onDone={() => {}} />
      )}
    </div>
  );
}

function BouquetCard({
  bouquet,
  index,
  onDragStartBouquet,
}: {
  bouquet: Bouquet;
  index: number;
  onDragStartBouquet?: (e: React.MouseEvent, bouquet: Bouquet) => void;
}) {
  const isExpiring = bouquet.remainingDays <= 1;
  const animDelay = `${(index * 0.4) % 3}s`;
  return (
    <div
      onMouseDown={e => onDragStartBouquet?.(e, bouquet)}
      style={{
        width: '80px',
        height: '96px',
        borderRadius: 'var(--radius-md)',
        background: isExpiring
          ? 'linear-gradient(135deg, #FFF3CD, #FFE082)'
          : 'linear-gradient(135deg, #FFF0F5, #FFE4E1)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onDragStartBouquet ? 'grab' : 'default',
        boxShadow: 'var(--shadow-soft)',
        border: isExpiring ? '2px solid #FFB300' : '2px solid rgba(232, 137, 158, 0.2)',
        animation: `breathe 3s ease-in-out infinite`,
        animationDelay: animDelay,
        userSelect: 'none',
        position: 'relative',
      }}
    >
      <span style={{ fontSize: '24px', lineHeight: 1 }}>
        {bouquet.flowers.slice(0, 3).map(f => f.emoji).join('')}
      </span>
      <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '4px', color: 'var(--color-pink-dark)', textAlign: 'center' }}>
        {bouquet.name}
      </span>
      <span style={{ fontSize: '9px', color: 'var(--color-text-light)' }}>¥{bouquet.price}</span>
      <span style={{
        fontSize: '8px',
        marginTop: '2px',
        padding: '1px 5px',
        borderRadius: 'var(--radius-full)',
        background: isExpiring ? '#FF6B6B' : 'var(--color-green)',
        color: '#fff',
        fontWeight: 500,
      }}>
        {bouquet.remainingDays}天
      </span>
    </div>
  );
}

export default function ShopScene() {
  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [craftSlots, setCraftSlots] = useState<Flower[]>([]);
  const [dragState, setDragState] = useState<DragState>({
    active: false, item: null, source: null,
    offsetX: 0, offsetY: 0, currentX: 0, currentY: 0, targetX: 0, targetY: 0,
  });
  const [craftHover, setCraftHover] = useState(false);
  const [spoilageItems, setSpoilageItems] = useState<{ id: string; type: 'flower' | 'bouquet' }[]>([]);
  const [trashCount, setTrashCount] = useState(0);
  const rafRef = useRef<number>(0);
  const craftZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      tickSpoilage();
    }, 15000);
    return () => clearInterval(interval);
  }, [flowers, bouquets]);

  const loadData = async () => {
    try {
      const [f, b] = await Promise.all([flowerApi.getAll(), bouquetApi.getAll()]);
      setFlowers(f);
      setBouquets(b);
    } catch {
      setFlowers([]);
      setBouquets([]);
    }
  };

  const tickSpoilage = async () => {
    let changed = false;
    const updatedFlowers = flowers.map(f => {
      if (f.remainingDays > 0) {
        return { ...f, remainingDays: f.remainingDays - 0.5 };
      }
      return f;
    }).filter(f => {
      if (f.remainingDays <= 0) {
        setSpoilageItems(prev => [...prev, { id: f.id, type: 'flower' }]);
        setTrashCount(prev => prev + 1);
        changed = true;
        return false;
      }
      return true;
    });

    const updatedBouquets = bouquets.map(b => {
      const minDays = Math.min(...b.flowers.map(f => f.remainingDays));
      return { ...b, remainingDays: Math.max(0, minDays) };
    }).filter(b => {
      if (b.remainingDays <= 0) {
        setSpoilageItems(prev => [...prev, { id: b.id, type: 'bouquet' }]);
        setTrashCount(prev => prev + 1);
        changed = true;
        return false;
      }
      return true;
    });

    if (changed) {
      setFlowers(updatedFlowers);
      setBouquets(updatedBouquets);
    }
  };

  const handlePurchase = async (catalogItem: typeof FLOWER_CATALOG[0]) => {
    try {
      const newFlowers = await flowerApi.create(catalogItem.name, 1);
      setFlowers(newFlowers);
    } catch {
      const newFlower: Flower = {
        id: crypto.randomUUID(),
        ...catalogItem,
        remainingDays: catalogItem.shelfLife,
      };
      setFlowers(prev => [...prev, newFlower]);
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent, flower: Flower) => {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragState({
      active: true,
      item: flower,
      source: 'stock',
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      currentX: e.clientX,
      currentY: e.clientY,
      targetX: e.clientX,
      targetY: e.clientY,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.active) return;
    setDragState(prev => ({
      ...prev,
      targetX: e.clientX,
      targetY: e.clientY,
    }));
  }, [dragState.active]);

  useEffect(() => {
    if (!dragState.active) return;
    const animate = () => {
      setDragState(prev => {
        const lerp = 0.25;
        const nextX = prev.currentX + (prev.targetX - prev.currentX) * lerp;
        const nextY = prev.currentY + (prev.targetY - prev.currentY) * lerp;
        if (Math.abs(nextX - prev.currentX) < 0.5 && Math.abs(nextY - prev.currentY) < 0.5) {
          return { ...prev, currentX: prev.targetX, currentY: prev.targetY };
        }
        return { ...prev, currentX: nextX, currentY: nextY };
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [dragState.active]);

  const handleMouseUp = useCallback(() => {
    if (!dragState.active || !dragState.item) {
      setDragState(prev => ({ ...prev, active: false }));
      return;
    }
    if (craftZoneRef.current && dragState.source === 'stock') {
      const rect = craftZoneRef.current.getBoundingClientRect();
      if (
        dragState.currentX >= rect.left &&
        dragState.currentX <= rect.right &&
        dragState.currentY >= rect.top &&
        dragState.currentY <= rect.bottom
      ) {
        if (craftSlots.length < 3 && !craftSlots.find(s => s.id === dragState.item!.id)) {
          setCraftSlots(prev => [...prev, dragState.item!]);
          setFlowers(prev => prev.filter(f => f.id !== dragState.item!.id));
        }
      }
    }
    setDragState({
      active: false, item: null, source: null,
      offsetX: 0, offsetY: 0, currentX: 0, currentY: 0, targetX: 0, targetY: 0,
    });
  }, [dragState.active, dragState.item, dragState.source, dragState.currentX, dragState.currentY, craftSlots]);

  const handleCraftBouquet = async () => {
    if (craftSlots.length < 2) return;
    const flowerIds = craftSlots.map(f => f.id);
    try {
      const newBouquet = await bouquetApi.create(flowerIds);
      setBouquets(prev => [...prev, newBouquet]);
    } catch {
      const totalPrice = craftSlots.reduce((sum, f) => sum + f.price, 0);
      const minDays = Math.min(...craftSlots.map(f => f.remainingDays));
      const dominantFlower = craftSlots.reduce((a, b) => a.price > b.price ? a : b);
      const newBouquet: Bouquet = {
        id: crypto.randomUUID(),
        flowers: [...craftSlots],
        name: craftSlots.map(f => f.nameCn).join('+'),
        price: Math.round(totalPrice * 1.3),
        color: dominantFlower.color,
        remainingDays: minDays,
      };
      setBouquets(prev => [...prev, newBouquet]);
    }
    setCraftSlots([]);
  };

  const clearCraft = () => {
    setFlowers(prev => [...prev, ...craftSlots]);
    setCraftSlots([]);
  };

  const removeFromCraft = (flowerId: string) => {
    const removed = craftSlots.find(f => f.id === flowerId);
    if (removed) {
      setCraftSlots(prev => prev.filter(f => f.id !== flowerId));
      setFlowers(prev => [...prev, removed]);
    }
  };

  const removeSpoilage = (id: string) => {
    setSpoilageItems(prev => prev.filter(s => s.id !== id));
  };

  const shelfGrid: (Bouquet | null)[][] = Array.from({ length: SHELF_ROWS }, (_, row) =>
    Array.from({ length: SHELF_COLS }, (_, col) => {
      const idx = row * SHELF_COLS + col;
      return bouquets[idx] || null;
    })
  );

  const craftPreview = craftSlots.length >= 2 ? (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px 16px',
      borderRadius: 'var(--radius-md)',
      background: 'linear-gradient(135deg, #FFF0F5, #FFE4E1)',
      border: '2px dashed var(--color-pink-dark)',
      marginTop: '8px',
    }}>
      <span style={{ fontSize: '24px' }}>
        {craftSlots.map(f => f.emoji).join('+')}
      </span>
      <span style={{ marginLeft: '8px', fontSize: '16px' }}>→</span>
      <span style={{ marginLeft: '8px', fontSize: '24px' }}>💐</span>
      <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--color-pink-dark)' }}>
        {craftSlots.map(f => f.nameCn).join('+')}
      </span>
      <span style={{ marginLeft: '6px', fontSize: '12px', color: 'var(--color-text-light)' }}>
        ¥{Math.round(craftSlots.reduce((s, f) => s + f.price, 0) * 1.3)}
      </span>
    </div>
  ) : null;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ width: '100%', minHeight: 'calc(100vh - 100px)', padding: '20px' }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: 'auto auto',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* 进货区 */}
        <div style={{
          gridColumn: '1 / 2',
          gridRow: '1 / 2',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-white)',
          padding: '20px',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-pink-dark)' }}>📦 进货区</h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
              点击下方按钮进货，拖拽花卉到加工区
            </span>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
            {FLOWER_CATALOG.map(c => (
              <button
                key={c.name}
                onClick={() => handlePurchase(c)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, var(--color-cream), var(--color-pink))',
                  border: '2px solid rgba(232, 137, 158, 0.2)',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--color-text)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span>{c.emoji}</span>
                <span>{c.nameCn}</span>
                <span style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>¥{c.purchaseCost}</span>
              </button>
            ))}
          </div>
          <div style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            minHeight: '100px',
            padding: '12px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-cream)',
            border: '2px dashed rgba(232, 137, 158, 0.2)',
          }}>
            {flowers.length === 0 && (
              <div style={{ color: 'var(--color-text-light)', fontSize: '13px', padding: '20px', textAlign: 'center', width: '100%' }}>
                还没有花卉，点击上方按钮进货吧~
              </div>
            )}
            {flowers.map(f => (
              <FlowerCard key={f.id} flower={f} onMouseDown={handleMouseDown} />
            ))}
          </div>
        </div>

        {/* 加工区 */}
        <div style={{
          gridColumn: '2 / 3',
          gridRow: '1 / 2',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-white)',
          padding: '20px',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-pink-dark)' }}>🔧 加工区</h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
              拖入2-3种花卉组合花束
            </span>
          </div>
          <div
            ref={craftZoneRef}
            onMouseEnter={() => setCraftHover(true)}
            onMouseLeave={() => setCraftHover(false)}
            style={{
              minHeight: '120px',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              background: craftHover
                ? 'linear-gradient(135deg, #FFF0F5, #FFE4E1)'
                : 'var(--color-cream)',
              border: craftHover
                ? '2px dashed var(--color-pink-dark)'
                : '2px dashed rgba(232, 137, 158, 0.3)',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {craftSlots.length === 0 && (
              <div style={{ color: 'var(--color-text-light)', fontSize: '13px', textAlign: 'center' }}>
                🫳 将花卉拖拽到这里
              </div>
            )}
            {craftSlots.map((f, i) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <div
                  onClick={() => removeFromCraft(f.id)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #FFF0F5, #FFE4E1)',
                    border: '2px solid var(--color-pink-dark)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ fontSize: '22px' }}>{f.emoji}</span>
                  <span style={{ fontSize: '12px', fontWeight: 600 }}>{f.nameCn}</span>
                </div>
                {i < craftSlots.length - 1 && (
                  <span style={{ fontSize: '18px', color: 'var(--color-pink-dark)', fontWeight: 700 }}>+</span>
                )}
              </div>
            ))}
          </div>

          {craftPreview}

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleCraftBouquet}
              disabled={craftSlots.length < 2}
              style={{
                padding: '10px 28px',
                borderRadius: 'var(--radius-md)',
                background: craftSlots.length >= 2
                  ? 'linear-gradient(135deg, var(--color-pink-dark), var(--color-pink))'
                  : 'var(--color-cream-dark)',
                color: craftSlots.length >= 2 ? '#fff' : 'var(--color-text-light)',
                fontSize: '14px',
                fontWeight: 600,
                boxShadow: craftSlots.length >= 2 ? 'var(--shadow-soft)' : 'none',
              }}
            >
              ✨ 组合花束
            </button>
            <button
              onClick={clearCraft}
              disabled={craftSlots.length === 0}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                background: craftSlots.length > 0 ? '#FFE0E0' : 'var(--color-cream-dark)',
                color: craftSlots.length > 0 ? '#C0392B' : 'var(--color-text-light)',
                fontSize: '13px',
              }}
            >
              🔄 清空
            </button>
          </div>
        </div>

        {/* 展示区货架 */}
        <div style={{
          gridColumn: '1 / 3',
          gridRow: '2 / 3',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-white)',
          padding: '20px',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-pink-dark)' }}>🏪 展示区货架</h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)' }}>
              花束自动上架，可拖拽至接单台完成订单
            </span>
          </div>
          <div style={{
            background: 'linear-gradient(180deg, #8B6F47 0%, #A0845C 8%, #C4A882 8.5%, #D4BC96 100%)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 12px',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {shelfGrid.map((row, rowIdx) => (
              <div key={rowIdx} style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${SHELF_COLS}, 1fr)`,
                gap: '10px',
                marginBottom: rowIdx < SHELF_ROWS - 1 ? '20px' : '0',
                padding: '8px 4px',
                position: 'relative',
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  left: '0',
                  right: '0',
                  height: '8px',
                  background: 'linear-gradient(180deg, #8B6F47, #6B5030)',
                  borderRadius: '0 0 4px 4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                }} />
                {row.map((bouquet, colIdx) => (
                  <div key={colIdx} style={{
                    height: '100px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: 'var(--radius-sm)',
                    background: bouquet ? 'transparent' : 'rgba(255,255,255,0.15)',
                    border: bouquet ? 'none' : '2px dashed rgba(255,255,255,0.2)',
                    position: 'relative',
                  }}>
                    {bouquet && (
                      <BouquetCard bouquet={bouquet} index={rowIdx * SHELF_COLS + colIdx} />
                    )}
                    {!bouquet && (
                      <span style={{ fontSize: '20px', opacity: 0.3 }}>💐</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* 收银台 + 垃圾桶 */}
        <div style={{
          gridColumn: '1 / 3',
          gridRow: '3 / 4',
          display: 'flex',
          gap: '20px',
        }}>
          <div style={{
            flex: 1,
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, var(--color-green), var(--color-green-dark))',
            padding: '20px',
            color: '#fff',
            boxShadow: 'var(--shadow-soft)',
          }}>
            <h3 style={{ fontSize: '18px', color: '#fff' }}>💰 收银台</h3>
            <div style={{ marginTop: '12px', display: 'flex', gap: '24px', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>今日营业额</div>
                <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: "'Noto Serif SC', serif" }}>
                  ¥{bouquets.filter(b => b.remainingDays > 0).reduce((s, b) => s + b.price, 0).toFixed(0)}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>在架花束</div>
                <div style={{ fontSize: '28px', fontWeight: 700 }}>{bouquets.length}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>库存花卉</div>
                <div style={{ fontSize: '28px', fontWeight: 700 }}>{flowers.length}</div>
              </div>
            </div>
          </div>

          <div style={{
            width: '180px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #F5F5F5, #E0E0E0)',
            padding: '16px',
            boxShadow: 'var(--shadow-soft)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <span style={{ fontSize: '32px' }}>🗑️</span>
            <span style={{ fontSize: '12px', color: 'var(--color-text-light)', marginTop: '4px' }}>垃圾桶</span>
            <span style={{ fontSize: '11px', color: '#999' }}>已丢弃: {trashCount}</span>
            {spoilageItems.map(s => (
              <SpoilageAnimation
                key={s.id}
                item={{ id: s.id, name: 'rose', nameCn: '腐烂', emoji: '🥀', color: '#999', price: 0, shelfLife: 0, remainingDays: 0, purchaseCost: 0 } as Flower}
                onDone={() => removeSpoilage(s.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 拖拽跟随元素 */}
      {dragState.active && dragState.item && (
        <div style={{
          position: 'fixed',
          left: dragState.currentX - dragState.offsetX,
          top: dragState.currentY - dragState.offsetY,
          pointerEvents: 'none',
          zIndex: 1000,
          opacity: 0.85,
          transform: 'scale(1.1)',
          filter: 'drop-shadow(0 4px 12px rgba(232, 137, 158, 0.4))',
          willChange: 'left, top',
        }}>
          <div style={{
            width: '72px',
            height: '88px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--color-white)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-medium)',
          }}>
            <span style={{ fontSize: '28px', lineHeight: 1 }}>{dragState.item.emoji}</span>
            <span style={{ fontSize: '11px', fontWeight: 600, marginTop: '4px' }}>
              {dragState.item.nameCn}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
