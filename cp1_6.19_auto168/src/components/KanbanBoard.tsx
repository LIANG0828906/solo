import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useStore, Order, OrderStatus } from '../store';

const STATUS_CONFIG: {
  key: OrderStatus;
  label: string;
  emoji: string;
  bg: string;
  color: string;
}[] = [
  { key: 'design', label: '设计', emoji: '✏️', bg: '#E3F2FD', color: '#64B5F6' },
  { key: 'making', label: '制作', emoji: '🔨', bg: '#FFF3E0', color: '#FFB74D' },
  { key: 'qc', label: '质检', emoji: '🔍', bg: '#F3E5F5', color: '#CE93D8' },
  { key: 'done', label: '完成', emoji: '🎁', bg: '#E8F5E9', color: '#81C784' },
];

const formatShortTs = (ts: string | null): string => {
  if (!ts) return '';
  const parts = ts.split(' ');
  const datePart = parts[0].slice(5);
  const timePart = parts[1].slice(0, 5);
  return `${datePart} ${timePart}`;
};

const calcCountdown = (expectedDate: string): { text: string; isOverdue: boolean } => {
  const target = new Date(expectedDate + 'T23:59:59').getTime();
  const now = Date.now();
  const diff = target - now;
  const isOverdue = diff < 0;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((abs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const mins = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0) {
    return { text: `${isOverdue ? '已超期 ' : '剩余 '}${days}天${hours}小时`, isOverdue };
  }
  if (hours > 0) {
    return { text: `${isOverdue ? '已超期 ' : '剩余 '}${hours}小时${mins}分`, isOverdue };
  }
  return { text: `${isOverdue ? '已超期 ' : '剩余 '}${mins}分钟`, isOverdue };
};

const DragCard = ({
  order,
  onDragEnd,
}: {
  order: Order;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
}) => {
  const cfg = STATUS_CONFIG.find((c) => c.key === order.status)!;
  const ts = formatShortTs(order.statusTimestamps[order.status]);

  return (
    <motion.div
      layout
      layoutId={`card-${order.id}`}
      drag
      dragSnapToOrigin
      dragElastic={0.1}
      onDragEnd={onDragEnd}
      whileDrag={{ opacity: 0.7, scale: 1.03, zIndex: 50, cursor: 'grabbing' }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="rounded-xl p-3 bg-white shadow-md relative select-none"
      style={{
        borderLeft: `4px solid ${cfg.color}`,
        minHeight: 90,
      }}
    >
      <div className="font-mono text-[11px] text-[#8B7355] font-semibold truncate mb-1">
        {order.orderNo}
      </div>
      <div className="text-sm font-semibold text-[#2C3E50] truncate mb-0.5">
        {order.customerName} · {order.craftType}
      </div>
      {order.specialRequirements && (
        <div className="text-xs text-[#5D4E37] line-clamp-2 opacity-80 mb-2 leading-relaxed">
          {order.specialRequirements}
        </div>
      )}
      <div
        className="absolute bottom-2 right-3 text-[10px] font-medium"
        style={{ color: cfg.color }}
      >
        🕒 {ts}
      </div>
    </motion.div>
  );
};

const KanbanBoard = () => {
  const { state, updateOrderStatus } = useStore();
  const { orders, selectedOrderId } = state;
  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  const [, setTick] = useState(0);
  const dragOverCol = useRef<OrderStatus | null>(null);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const columnOrders = useMemo(() => {
    const map: Record<OrderStatus, Order[]> = { design: [], making: [], qc: [], done: [] };
    orders.forEach((o) => map[o.status].push(o));
    return map;
  }, [orders]);

  const countdown = selectedOrder ? calcCountdown(selectedOrder.expectedDate) : null;

  const handleDragOver = (e: React.DragEvent, col: OrderStatus) => {
    e.preventDefault();
    dragOverCol.current = col;
  };

  const handleDrop = (e: React.DragEvent, col: OrderStatus) => {
    e.preventDefault();
    if (selectedOrder && selectedOrder.status !== col) {
      updateOrderStatus(selectedOrder.id, col);
    }
    dragOverCol.current = null;
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!selectedOrder) return;
    const { point } = info;
    const cols = document.querySelectorAll<HTMLDivElement>('[data-kanban-col]');
    cols.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (
        point.x >= rect.left &&
        point.x <= rect.right &&
        point.y >= rect.top &&
        point.y <= rect.bottom
      ) {
        const target = el.getAttribute('data-kanban-col') as OrderStatus;
        if (target && selectedOrder.status !== target) {
          updateOrderStatus(selectedOrder.id, target);
        }
      }
    });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎯</span>
          <h2 className="text-xl font-semibold text-[#2C3E50]">工单进度看板</h2>
        </div>
        {selectedOrder && countdown && (
          <motion.div
            key={selectedOrder.id}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 bg-white"
            style={{
              borderColor: countdown.isOverdue ? '#FFCDD2' : '#C8E6C9',
            }}
          >
            <span className="text-lg">⏰</span>
            <span className="text-sm font-medium">
              预期完工: <span className="font-semibold">{selectedOrder.expectedDate}</span>
            </span>
            <span
              className="text-sm font-bold px-2.5 py-0.5 rounded-lg"
              style={{
                backgroundColor: countdown.isOverdue ? 'rgba(211, 47, 47, 0.1)' : 'rgba(76, 175, 80, 0.1)',
                color: countdown.isOverdue ? '#D32F2F' : '#2E7D32',
              }}
            >
              {countdown.text}
            </span>
          </motion.div>
        )}
      </div>

      {!selectedOrder ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-20 bg-[#F9F3E7] rounded-2xl border-2 border-dashed border-[#D7C4B0]"
        >
          <div className="text-6xl mb-4">👆</div>
          <p className="text-lg font-semibold text-[#5D4E37]">请选择一个订单查看进度</p>
          <p className="text-sm text-[#8B7355] mt-2 opacity-80">点击左侧订单卡片以显示详细看板和时间线</p>
        </motion.div>
      ) : (
        <>
          <div className="flex gap-5 overflow-x-auto pb-4 kanban-columns">
            {STATUS_CONFIG.map((col) => {
              const cards = columnOrders[col.key];
              const showCard = selectedOrder.status === col.key;
              const isTarget = dragOverCol.current === col.key;
              return (
                <div
                  key={col.key}
                  data-kanban-col={col.key}
                  onDragOver={(e) => handleDragOver(e, col.key)}
                  onDragLeave={() => (dragOverCol.current = null)}
                  onDrop={(e) => handleDrop(e, col.key)}
                  className="flex-shrink-0 rounded-2xl p-2 transition-all duration-300"
                  style={{
                    width: 220,
                    backgroundColor: col.bg,
                    outline: isTarget ? `3px dashed ${col.color}` : 'none',
                    outlineOffset: -2,
                  }}
                >
                  <div className="flex items-center justify-between px-2 py-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg">{col.emoji}</span>
                      <span className="font-bold text-sm" style={{ color: col.color }}>
                        {col.label}
                      </span>
                    </div>
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'white', color: col.color }}
                    >
                      {cards.length}
                    </span>
                  </div>

                  <div className="space-y-3 min-h-[120px]">
                    <AnimatePresence mode="popLayout">
                      {showCard && (
                        <DragCard
                          key={selectedOrder.id}
                          order={selectedOrder}
                          onDragEnd={handleDragEnd}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              );
            })}
          </div>

          <div
            className="rounded-xl mt-4 p-4 border border-[#EEE]"
            style={{ backgroundColor: '#FAFAFA', width: '100%' }}
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#E0E0E0]">
              <div className="flex items-center gap-2">
                <span className="text-xl">📜</span>
                <h3 className="font-semibold text-[#2C3E50]">制作里程碑时间线</h3>
              </div>
              <div className="text-xs text-[#8B7355]">
                {selectedOrder.customerName} · {selectedOrder.craftType} · {selectedOrder.orderNo}
              </div>
            </div>

            {selectedOrder.specialRequirements && (
              <div className="mb-4 p-3 bg-white rounded-lg border border-[#EEE]">
                <div className="text-xs font-semibold text-[#5D4E37] mb-1">📋 特殊要求</div>
                <div className="text-sm text-[#2C3E50] leading-relaxed">
                  {selectedOrder.specialRequirements}
                </div>
              </div>
            )}

            <div className="relative pl-2">
              <AnimatePresence>
                {selectedOrder.timeline.map((node, idx) => {
                  const cfg = STATUS_CONFIG.find((c) => c.key === node.status)!;
                  const isLast = idx === selectedOrder.timeline.length - 1;
                  return (
                    <motion.div
                      key={`${node.status}-${idx}`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: idx * 0.08 }}
                      className="relative pb-6 last:pb-0 pl-8"
                    >
                      {!isLast && (
                        <div
                          className="absolute left-[11px] top-[10px] w-0.5 bottom-0"
                          style={{ backgroundColor: '#BDBDBD' }}
                        />
                      )}
                      <div
                        className="absolute left-0 top-1.5 rounded-full shadow-sm"
                        style={{
                          width: 10,
                          height: 10,
                          backgroundColor: cfg.color,
                          boxShadow: `0 0 0 3px ${cfg.color}22`,
                        }}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base">{cfg.emoji}</span>
                        <span className="text-sm font-semibold" style={{ color: cfg.color }}>
                          进入{cfg.label}阶段
                        </span>
                        <span className="text-xs text-[#757575] font-mono">
                          - {node.timestamp}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default KanbanBoard;
