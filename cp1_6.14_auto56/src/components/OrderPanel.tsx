import { useState, useEffect, useCallback, useRef } from 'react';
import { customerApi, bouquetApi, orderApi, statusApi, Customer, Bouquet, Order } from '../api';

const CUSTOMER_NAMES = ['小明', '小红', '小华', '阿花', '大壮', '小美', '阿强', '小雪', '阿宝', '小兰'];
const CUSTOMER_AVATARS = ['👧', '👦', '👩', '🧑', '👨', '👩‍🦰', '👨‍🦱', '👩‍🦳', '🧓', '👶'];
const FLOWER_NAMES: Record<string, string> = { rose: '🌹玫瑰', lily: '🌸百合', sunflower: '🌻向日葵', baby_breath: '💐满天星' };
const COLOR_NAMES: Record<string, string> = { '#E8899E': '粉色', '#FFD6E0': '浅粉', '#FFD93D': '黄色', '#F0E6FF': '淡紫', '#FFFFFF': '白色' };

function SatisfactionHearts({ value, max = 5 }: { value: number; max?: number }) {
  const [shaking, setShaking] = useState(false);
  const prevValue = useRef(value);

  useEffect(() => {
    if (value < prevValue.current) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 500);
      return () => clearTimeout(t);
    }
    prevValue.current = value;
  }, [value]);

  const hearts = [];
  for (let i = 0; i < max; i++) {
    const diff = value - i;
    if (diff >= 1) {
      hearts.push({ fill: 'full', key: i });
    } else if (diff >= 0.5) {
      hearts.push({ fill: 'half', key: i });
    } else {
      hearts.push({ fill: 'empty', key: i });
    }
  }

  return (
    <div
      className={shaking ? 'shake' : ''}
      style={{ display: 'flex', gap: '4px', alignItems: 'center' }}
    >
      {hearts.map(h => (
        <span key={h.key} style={{
          fontSize: '22px',
          filter: h.fill === 'full' ? 'none' : h.fill === 'half' ? 'saturate(0.5)' : 'saturate(0) opacity(0.3)',
          transition: 'filter 0.3s, transform 0.3s',
        }}>
          {h.fill === 'half' ? '💔' : '❤️'}
        </span>
      ))}
      <span style={{ fontSize: '13px', color: 'var(--color-text-light)', marginLeft: '6px', fontWeight: 500 }}>
        {value.toFixed(1)}/{max}
      </span>
    </div>
  );
}

function BubbleRequirement({ customer }: { customer: Customer }) {
  const req = customer.requirements;
  return (
    <div style={{
      position: 'relative',
      background: 'var(--color-white)',
      borderRadius: 'var(--radius-md)',
      padding: '10px 14px',
      boxShadow: 'var(--shadow-soft)',
      fontSize: '12px',
      lineHeight: 1.6,
      maxWidth: '200px',
    }}>
      <div style={{
        position: 'absolute',
        left: '-8px',
        top: '12px',
        width: 0,
        height: 0,
        borderTop: '6px solid transparent',
        borderBottom: '6px solid transparent',
        borderRight: '8px solid var(--color-white)',
      }} />
      {req.flowerTypes && req.flowerTypes.length > 0 && (
        <div>
          <span style={{ color: 'var(--color-text-light)' }}>花种:</span>{' '}
          {req.flowerTypes.map(t => FLOWER_NAMES[t] || t).join('、')}
        </div>
      )}
      {req.colors && req.colors.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ color: 'var(--color-text-light)' }}>颜色:</span>
          {req.colors.map(c => (
            <span key={c} style={{
              display: 'inline-block',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: c,
              border: '1px solid rgba(0,0,0,0.1)',
            }} />
          ))}
          <span style={{ fontSize: '11px', color: 'var(--color-text-light)' }}>
            {req.colors.map(c => COLOR_NAMES[c] || c).join('/')}
          </span>
        </div>
      )}
      {req.maxPrice != null && (
        <div>
          <span style={{ color: 'var(--color-text-light)' }}>预算:</span>{' '}
          ¥{req.minPrice || 0}~¥{req.maxPrice}
        </div>
      )}
    </div>
  );
}

interface DragBouquetState {
  active: boolean;
  bouquet: Bouquet | null;
  offsetX: number;
  offsetY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
}

export default function OrderPanel() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [bouquets, setBouquets] = useState<Bouquet[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [matchResult, setMatchResult] = useState<'success' | 'fail' | null>(null);
  const [reputation, setReputation] = useState(100);
  const [dragBouquet, setDragBouquet] = useState<DragBouquetState>({
    active: false, bouquet: null, offsetX: 0, offsetY: 0,
    currentX: 0, currentY: 0, targetX: 0, targetY: 0,
  });
  const [dropZoneHover, setDropZoneHover] = useState(false);
  const rafRef = useRef<number>(0);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      if (customers.length < 4) spawnCustomer();
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (customers.length === 0) {
      const t = setTimeout(() => spawnCustomer(), 2000);
      return () => clearTimeout(t);
    }
  }, [customers.length]);

  const loadData = async () => {
    try {
      const [c, b, o, s] = await Promise.all([
        customerApi.getAll(),
        bouquetApi.getAll(),
        orderApi.getAll(),
        statusApi.get(),
      ]);
      setCustomers(c);
      setBouquets(b);
      setOrders(o);
      setReputation(s.reputation);
    } catch {
      setBouquets([]);
      setOrders([]);
    }
  };

  const spawnCustomer = async () => {
    const flowerTypes = ['rose', 'lily', 'sunflower', 'baby_breath'];
    const colors = ['#E8899E', '#FFD6E0', '#FFD93D', '#F0E6FF', '#FFFFFF'];
    const numTypes = Math.floor(Math.random() * 2) + 1;
    const numColors = Math.floor(Math.random() * 2) + 1;
    const selectedTypes = [...flowerTypes].sort(() => Math.random() - 0.5).slice(0, numTypes);
    const selectedColors = [...colors].sort(() => Math.random() - 0.5).slice(0, numColors);
    const maxPrice = Math.floor(Math.random() * 30) + 20;

    const newCustomer: Customer = {
      id: crypto.randomUUID(),
      name: CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)],
      avatar: CUSTOMER_AVATARS[Math.floor(Math.random() * CUSTOMER_AVATARS.length)],
      requirements: {
        flowerTypes: selectedTypes,
        colors: selectedColors,
        maxPrice,
        minPrice: Math.max(0, maxPrice - 15),
      },
      satisfaction: 5,
    };

    try {
      const created = await customerApi.create();
      setCustomers(prev => [...prev, created]);
    } catch {
      setCustomers(prev => [...prev, newCustomer]);
    }
  };

  const playSound = useCallback((type: 'success' | 'fail') => {
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, ctx.currentTime);
        osc.frequency.setValueAtTime(659, ctx.currentTime + 0.1);
        osc.frequency.setValueAtTime(784, ctx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {}
  }, []);

  const checkMatch = (customer: Customer, bouquet: Bouquet): boolean => {
    const req = customer.requirements;
    if (req.maxPrice != null && bouquet.price > req.maxPrice) return false;
    if (req.minPrice != null && bouquet.price < req.minPrice) return false;
    if (req.flowerTypes && req.flowerTypes.length > 0) {
      const bouquetTypes = bouquet.flowers.map(f => f.name);
      const hasMatchingType = req.flowerTypes.some(t => bouquetTypes.includes(t));
      if (!hasMatchingType) return false;
    }
    if (req.colors && req.colors.length > 0) {
      const bouquetColors = bouquet.flowers.map(f => f.color);
      const hasMatchingColor = req.colors.some(c => bouquetColors.includes(c));
      if (!hasMatchingColor) return false;
    }
    return true;
  };

  const handleBouquetMouseDown = useCallback((e: React.MouseEvent, bouquet: Bouquet) => {
    e.preventDefault();
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragBouquet({
      active: true,
      bouquet,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      currentX: e.clientX,
      currentY: e.clientY,
      targetX: e.clientX,
      targetY: e.clientY,
    });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragBouquet.active) return;
    setDragBouquet(prev => ({ ...prev, targetX: e.clientX, targetY: e.clientY }));
    if (dropZoneRef.current) {
      const rect = dropZoneRef.current.getBoundingClientRect();
      const isOver = e.clientX >= rect.left && e.clientX <= rect.right
        && e.clientY >= rect.top && e.clientY <= rect.bottom;
      setDropZoneHover(isOver);
    }
  }, [dragBouquet.active]);

  useEffect(() => {
    if (!dragBouquet.active) return;
    const animate = () => {
      setDragBouquet(prev => {
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
  }, [dragBouquet.active]);

  const handleMouseUp = useCallback(() => {
    if (!dragBouquet.active || !dragBouquet.bouquet || !selectedCustomer) {
      setDragBouquet(prev => ({ ...prev, active: false }));
      setDropZoneHover(false);
      return;
    }

    if (dropZoneRef.current) {
      const rect = dropZoneRef.current.getBoundingClientRect();
      const isOver = dragBouquet.currentX >= rect.left && dragBouquet.currentX <= rect.right
        && dragBouquet.currentY >= rect.top && dragBouquet.currentY <= rect.bottom;

      if (isOver) {
        const matched = checkMatch(selectedCustomer, dragBouquet.bouquet);
        if (matched) {
          playSound('success');
          setMatchResult('success');
          const newOrder: Order = {
            id: crypto.randomUUID(),
            customerId: selectedCustomer.id,
            bouquetId: dragBouquet.bouquet.id,
            status: 'success',
            price: dragBouquet.bouquet.price,
            timestamp: new Date().toISOString(),
            satisfactionDelta: 0,
          };
          setOrders(prev => [...prev, newOrder]);
          setBouquets(prev => prev.filter(b => b.id !== dragBouquet.bouquet!.id));
          setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
          setSelectedCustomer(null);
          try { orderApi.match(selectedCustomer.id, dragBouquet.bouquet.id); } catch {}
        } else {
          playSound('fail');
          setMatchResult('fail');
          const updatedCustomers = customers.map(c => {
            if (c.id === selectedCustomer.id) {
              return { ...c, satisfaction: Math.max(0, c.satisfaction - 0.5) };
            }
            return c;
          });
          setCustomers(updatedCustomers);
          const updatedCustomer = updatedCustomers.find(c => c.id === selectedCustomer.id);
          if (updatedCustomer && updatedCustomer.satisfaction < 2) {
            const newRep = Math.max(0, reputation - 5);
            setReputation(newRep);
            setCustomers(prev => prev.filter(c => c.id !== selectedCustomer.id));
            setSelectedCustomer(null);
            try {
              statusApi.updateReputation(-5);
              customerApi.delete(selectedCustomer.id);
            } catch {}
          }
        }
        setTimeout(() => setMatchResult(null), 1500);
      }
    }
    setDragBouquet({
      active: false, bouquet: null, offsetX: 0, offsetY: 0,
      currentX: 0, currentY: 0, targetX: 0, targetY: 0,
    });
    setDropZoneHover(false);
  }, [dragBouquet, selectedCustomer, customers, reputation, playSound, dropZoneHover]);

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setMatchResult(null);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      style={{ width: '100%', minHeight: 'calc(100vh - 100px)', padding: '20px' }}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gridTemplateRows: 'auto auto',
        gap: '20px',
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        {/* 顾客队列 */}
        <div style={{
          gridColumn: '1 / 2',
          gridRow: '1 / 3',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-white)',
          padding: '20px',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '18px', color: 'var(--color-pink-dark)' }}>🚶 顾客队列</h3>
            <button
              onClick={spawnCustomer}
              style={{
                padding: '6px 14px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, var(--color-green), var(--color-green-dark))',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              + 新顾客
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {customers.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '13px' }}>
                暂无顾客，点击上方按钮或等待新顾客到来~
              </div>
            )}
            {customers.map(c => (
              <div
                key={c.id}
                onClick={() => handleSelectCustomer(c)}
                className={selectedCustomer?.id === c.id ? '' : 'fade-in'}
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: selectedCustomer?.id === c.id
                    ? 'linear-gradient(135deg, #FFF0F5, #FFE4E1)'
                    : 'var(--color-cream)',
                  border: selectedCustomer?.id === c.id
                    ? '2px solid var(--color-pink-dark)'
                    : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '28px' }}>{c.avatar}</span>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600 }}>{c.name}</div>
                    <SatisfactionHearts value={c.satisfaction} />
                  </div>
                </div>
                <BubbleRequirement customer={c} />
                {c.satisfaction < 2 && (
                  <div style={{
                    marginTop: '8px',
                    padding: '4px 8px',
                    borderRadius: 'var(--radius-sm)',
                    background: '#FFE0E0',
                    color: '#C0392B',
                    fontSize: '11px',
                    fontWeight: 600,
                    textAlign: 'center',
                  }}>
                    ⚠️ 即将离开！
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 订单区域 */}
        <div style={{
          gridColumn: '2 / 3',
          gridRow: '1 / 2',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-white)',
          padding: '20px',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <h3 style={{ fontSize: '18px', color: 'var(--color-pink-dark)', marginBottom: '16px' }}>📋 当前订单</h3>

          {!selectedCustomer ? (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: 'var(--color-text-light)',
              fontSize: '14px',
            }}>
              👈 请先从顾客队列中选择一位顾客
            </div>
          ) : (
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #FFF0F5, #FFE4E1)',
              }}>
                <span style={{ fontSize: '32px' }}>{selectedCustomer.avatar}</span>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedCustomer.name} 的订单</div>
                  <SatisfactionHearts value={selectedCustomer.satisfaction} />
                </div>
              </div>

              <BubbleRequirement customer={selectedCustomer} />

              <div
                ref={dropZoneRef}
                style={{
                  marginTop: '16px',
                  minHeight: '100px',
                  borderRadius: 'var(--radius-md)',
                  border: dropZoneHover
                    ? '3px dashed var(--color-green-dark)'
                    : matchResult === 'success'
                    ? '3px solid var(--color-green-dark)'
                    : '3px dashed rgba(0,0,0,0.15)',
                  background: matchResult === 'success'
                    ? 'linear-gradient(135deg, #E8F5E9, #C8E6C9)'
                    : matchResult === 'fail'
                    ? 'linear-gradient(135deg, #FFEBEE, #FFCDD2)'
                    : dropZoneHover
                    ? 'rgba(168, 213, 186, 0.2)'
                    : 'rgba(0,0,0,0.02)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.3s ease',
                  animation: matchResult === 'success' ? 'pulse-green 0.6s ease-out' : 'none',
                }}
              >
                {matchResult === 'success' ? (
                  <span style={{ fontSize: '24px', fontWeight: 700, color: 'var(--color-green-dark)' }}>
                    ✅ 匹配成功！订单完成！
                  </span>
                ) : matchResult === 'fail' ? (
                  <span style={{ fontSize: '16px', fontWeight: 600, color: '#C0392B' }}>
                    ❌ 花束不匹配，请重新选择（满意度 -0.5）
                  </span>
                ) : (
                  <span style={{ fontSize: '14px', color: 'var(--color-text-light)' }}>
                    🫳 从下方展示区拖拽花束到这里
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 花束选择区 */}
        <div style={{
          gridColumn: '2 / 3',
          gridRow: '2 / 3',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-white)',
          padding: '20px',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <h3 style={{ fontSize: '18px', color: 'var(--color-pink-dark)', marginBottom: '16px' }}>💐 可用花束</h3>
          <div style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            minHeight: '80px',
          }}>
            {bouquets.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '13px', width: '100%' }}>
                暂无花束，请先到花店大厅加工区制作花束
              </div>
            )}
            {bouquets.map((b, i) => (
              <div
                key={b.id}
                onMouseDown={e => handleBouquetMouseDown(e, b)}
                style={{
                  width: '100px',
                  padding: '10px',
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #FFF0F5, #FFE4E1)',
                  border: '2px solid rgba(232, 137, 158, 0.2)',
                  cursor: 'grab',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '4px',
                  animation: `breathe 3s ease-in-out infinite`,
                  animationDelay: `${(i * 0.5) % 3}s`,
                  userSelect: 'none',
                  transition: 'transform 0.2s, box-shadow 0.2s',
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
                <span style={{ fontSize: '20px' }}>{b.flowers.slice(0, 3).map(f => f.emoji).join('')}</span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-pink-dark)', textAlign: 'center' }}>
                  {b.name}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--color-text)' }}>¥{b.price}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 订单历史 */}
        <div style={{
          gridColumn: '1 / 3',
          gridRow: '3 / 4',
          borderRadius: 'var(--radius-lg)',
          background: 'var(--color-white)',
          padding: '20px',
          boxShadow: 'var(--shadow-soft)',
        }}>
          <h3 style={{ fontSize: '18px', color: 'var(--color-pink-dark)', marginBottom: '16px' }}>📝 今日订单记录</h3>
          {orders.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--color-text-light)', fontSize: '13px' }}>
              暂无订单记录
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {orders.map(o => (
                <div key={o.id} style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: o.status === 'success' ? '#E8F5E9' : '#FFEBEE',
                  border: `1px solid ${o.status === 'success' ? '#A5D6A7' : '#EF9A9A'}`,
                  fontSize: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}>
                  <span>{o.status === 'success' ? '✅' : '❌'}</span>
                  <span>¥{o.price}</span>
                  <span style={{ color: 'var(--color-text-light)' }}>
                    {new Date(o.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 拖拽跟随 */}
      {dragBouquet.active && dragBouquet.bouquet && (
        <div style={{
          position: 'fixed',
          left: dragBouquet.currentX - dragBouquet.offsetX,
          top: dragBouquet.currentY - dragBouquet.offsetY,
          pointerEvents: 'none',
          zIndex: 1000,
          opacity: 0.85,
          transform: 'scale(1.1)',
          filter: 'drop-shadow(0 4px 12px rgba(232, 137, 158, 0.4))',
          willChange: 'left, top',
        }}>
          <div style={{
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #FFF0F5, #FFE4E1)',
            border: '2px solid var(--color-pink-dark)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}>
            <span style={{ fontSize: '20px' }}>
              {dragBouquet.bouquet.flowers.slice(0, 3).map(f => f.emoji).join('')}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-pink-dark)' }}>
              {dragBouquet.bouquet.name}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700 }}>¥{dragBouquet.bouquet.price}</span>
          </div>
        </div>
      )}
    </div>
  );
}
