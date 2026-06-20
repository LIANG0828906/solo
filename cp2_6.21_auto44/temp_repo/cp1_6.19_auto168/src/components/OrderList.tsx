import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Order, OrderStatus, FilterType } from '../store';

const STATUS_LABEL: Record<OrderStatus, string> = {
  design: '设计',
  making: '制作',
  qc: '质检',
  done: '完成',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  design: '#64B5F6',
  making: '#FFB74D',
  qc: '#CE93D8',
  done: '#81C784',
};

const FILTERS: { key: FilterType; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '📋' },
  { key: 'inProgress', label: '进行中', icon: '⚒️' },
  { key: 'done', label: '已完成', icon: '✅' },
];

const OrderCard = ({ order, isSelected, onClick }: { order: Order; isSelected: boolean; onClick: () => void }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      whileHover={{
        y: -3,
        borderColor: '#8B7355',
        boxShadow: '0 8px 24px rgba(44, 62, 80, 0.12)',
      }}
      className="relative cursor-pointer rounded-xl p-4 transition-all duration-300 ease-out"
      style={{
        width: 260,
        height: 140,
        backgroundColor: '#F9F3E7',
        border: `2px solid ${isSelected ? '#8B7355' : '#D7C4B0'}`,
        boxShadow: isSelected ? '0 6px 20px rgba(139, 115, 85, 0.2)' : undefined,
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-xs font-mono text-[#8B7355] font-semibold truncate max-w-[160px]">
          {order.orderNo}
        </span>
        <span
          className="text-xs font-bold rounded-lg px-2 py-1 whitespace-nowrap"
          style={{
            backgroundColor: STATUS_COLOR[order.status],
            color: '#fff',
          }}
        >
          {STATUS_LABEL[order.status]}
        </span>
      </div>

      <div className="text-base font-semibold text-[#2C3E50] truncate mb-1">
        {order.customerName}
      </div>

      <div className="text-sm text-[#5D4E37] mb-2 flex items-center gap-1">
        <span>🎨</span>
        <span>{order.craftType}</span>
      </div>

      <div className="text-xs text-[#8B7355] opacity-80 truncate">
        截止: {order.expectedDate}
      </div>

      {isSelected && (
        <motion.div
          layoutId="selected-indicator"
          className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-10 rounded-r-full bg-[#8B7355]"
        />
      )}
    </motion.div>
  );
};

const OrderList = () => {
  const { state, selectOrder, setFilter } = useStore();
  const { orders, filter, selectedOrderId } = state;

  const filteredOrders = useMemo(() => {
    switch (filter) {
      case 'inProgress':
        return orders.filter((o) => o.status !== 'done');
      case 'done':
        return orders.filter((o) => o.status === 'done');
      default:
        return orders;
    }
  }, [orders, filter]);

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">📦</span>
          <h2 className="text-xl font-semibold text-[#2C3E50]">订单列表</h2>
          <span className="text-sm text-[#8B7355] bg-[#F9F3E7] px-2.5 py-1 rounded-full border border-[#D7C4B0]">
            {filteredOrders.length} 条
          </span>
        </div>

        <div className="flex gap-2 bg-[#F9F3E7] p-1.5 rounded-xl border-2 border-[#D7C4B0]">
          {FILTERS.map((f) => (
            <motion.button
              key={f.key}
              onClick={() => setFilter(f.key)}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                filter === f.key
                  ? 'bg-white text-[#2C3E50] shadow-md border border-[#8B7355]'
                  : 'text-[#5D4E37] hover:bg-white/50'
              }`}
            >
              <span className="mr-1">{f.icon}</span>
              {f.label}
            </motion.button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 bg-[#F9F3E7] rounded-2xl border-2 border-dashed border-[#D7C4B0]"
        >
          <div className="text-5xl mb-3">📭</div>
          <p className="text-[#5D4E37] font-medium">暂无订单</p>
          <p className="text-sm text-[#8B7355] mt-1 opacity-70">请在上方提交您的第一个定制订单</p>
        </motion.div>
      ) : (
        <div className="flex flex-wrap gap-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                isSelected={selectedOrderId === order.id}
                onClick={() => selectOrder(order.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default OrderList;
