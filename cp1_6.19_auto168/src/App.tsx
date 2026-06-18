import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StoreProvider, useStore, OrderStatus } from './store';
import OrderForm from './components/OrderForm';
import OrderList from './components/OrderList';
import KanbanBoard from './components/KanbanBoard';

const STATUS_COLOR: Record<OrderStatus, string> = {
  design: '#64B5F6',
  making: '#FFB74D',
  qc: '#CE93D8',
  done: '#81C784',
};

const STATUS_LABEL: Record<OrderStatus, string> = {
  design: '设计',
  making: '制作',
  qc: '质检',
  done: '完成',
};

const Sidebar = () => {
  const { state, setActiveTab, toggleSidebar } = useStore();
  const { activeTab, sidebarCollapsed } = state;
  const [isMobile, setIsMobile] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const tabs = [
    { key: 'orders' as const, label: '订单列表', icon: '📦' },
    { key: 'stats' as const, label: '统计概览', icon: '📊' },
  ];

  if (isMobile) {
    return (
      <>
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-5 shadow-md"
          style={{
            height: 50,
            backgroundColor: '#2C3E50',
            borderBottom: '2px solid #64B5F6',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 24,
                color: '#fff',
                fontWeight: 700,
              }}
            >
              匠心工坊
            </span>
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="text-white text-2xl w-9 h-9 rounded-lg hover:bg-white/10 transition-colors"
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
                className="fixed inset-0 bg-black/30 z-40"
                style={{ top: 50 }}
              />
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed left-0 right-0 z-40 p-3 shadow-lg"
                style={{ top: 50, backgroundColor: '#2C3E50' }}
              >
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => {
                      setActiveTab(t.key);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2.5 transition-all mb-1 ${
                      activeTab === t.key
                        ? 'bg-white/15 text-white'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className="text-lg">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col text-white shadow-xl"
      style={{
        width: sidebarCollapsed ? 72 : 220,
        backgroundColor: '#2C3E50',
        borderRadius: '0 12px 12px 0',
        borderRight: '2px solid #64B5F6',
        transition: 'width 0.3s ease-out',
      }}
    >
      <div className="px-5 pt-6 pb-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-2xl flex-shrink-0">🎨</span>
          {!sidebarCollapsed && (
            <span
              style={{
                fontFamily: "'Caveat', cursive",
                fontSize: 24,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              匠心工坊
            </span>
          )}
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1.5">
        {tabs.map((t) => (
          <motion.button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            whileHover={{ x: 3 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className={`w-full rounded-xl flex items-center transition-all duration-300 ${
              activeTab === t.key
                ? 'bg-white/15 text-white shadow-inner'
                : 'text-white/75 hover:bg-white/10 hover:text-white'
            }`}
            style={{
              padding: sidebarCollapsed ? '12px 0' : '12px 16px',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: sidebarCollapsed ? 0 : 12,
              borderLeft:
                activeTab === t.key ? `3px solid #64B5F6` : '3px solid transparent',
            }}
          >
            <span className="text-xl flex-shrink-0">{t.icon}</span>
            {!sidebarCollapsed && (
              <span className="text-sm font-medium whitespace-nowrap">{t.label}</span>
            )}
          </motion.button>
        ))}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={toggleSidebar}
          className="w-full py-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 text-xs flex items-center justify-center gap-1 transition-all"
        >
          <span>{sidebarCollapsed ? '→' : '←'}</span>
          {!sidebarCollapsed && <span>收起侧栏</span>}
        </button>
      </div>
    </aside>
  );
};

const TopBar = () => {
  const { state } = useStore();
  const { orders, selectedOrderId } = state;
  const selected = orders.find((o) => o.id === selectedOrderId);

  const inProgress = orders.filter((o) => o.status !== 'done').length;
  const done = orders.filter((o) => o.status === 'done').length;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-5 rounded-2xl bg-white shadow-sm border-2 border-[#D7C4B0]">
      <div>
        <div className="text-xs text-[#8B7355] mb-1">👋 欢迎使用</div>
        <h1 className="text-2xl font-bold text-[#2C3E50]">
          {selected
            ? `${selected.customerName} 的定制进度`
            : '手工艺品定制工坊'}
        </h1>
        <p className="text-sm text-[#5D4E37] mt-1">
          {selected
            ? `当前单号: ${selected.orderNo} · ${selected.craftType}`
            : '共管理 '}
          {!selected && (
            <>
              <span className="font-semibold text-[#8B7355]">{orders.length}</span>
              {' '}个订单 · '
              <span className="text-[#FFB74D] font-semibold">{inProgress}</span>
              {' '}进行中 · '
              <span className="text-[#81C784] font-semibold">{done}</span>
              {' '}已完成
            </>
          )}
        </p>
      </div>

      <div className="flex gap-3">
        {orders.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FFF3E0] border border-[#FFE0B2]">
              <span className="text-lg">⚒️</span>
              <div>
                <div className="text-[10px] text-[#E65100] font-medium">进行中</div>
                <div className="text-lg font-bold text-[#E65100] leading-none">{inProgress}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#E8F5E9] border border-[#C8E6C9]">
              <span className="text-lg">✅</span>
              <div>
                <div className="text-[10px] text-[#2E7D32] font-medium">已完成</div>
                <div className="text-lg font-bold text-[#2E7D32] leading-none">{done}</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const StatsView = () => {
  const { state } = useStore();
  const { orders } = state;

  const stats = useMemo(() => {
    const statusCounts: Record<OrderStatus, number> = {
      design: 0, making: 0, qc: 0, done: 0,
    };
    const craftCounts: Record<string, number> = {};
    let overdueCount = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    orders.forEach((o) => {
      statusCounts[o.status]++;
      craftCounts[o.craftType] = (craftCounts[o.craftType] || 0) + 1;
      if (o.status !== 'done' && new Date(o.expectedDate) < today) {
        overdueCount++;
      }
    });

    const total = orders.length;
    const completionRate = total ? Math.round((statusCounts.done / total) * 100) : 0;

    return { statusCounts, craftCounts, overdueCount, total, completionRate };
  }, [orders]);

  const statCards = [
    { label: '订单总数', value: stats.total, icon: '📦', color: '#2C3E50', bg: '#ECEFF1' },
    { label: '设计阶段', value: stats.statusCounts.design, icon: '✏️', color: '#1976D2', bg: '#E3F2FD' },
    { label: '制作阶段', value: stats.statusCounts.making, icon: '🔨', color: '#F57C00', bg: '#FFF3E0' },
    { label: '质检阶段', value: stats.statusCounts.qc, icon: '🔍', color: '#8E24AA', bg: '#F3E5F5' },
    { label: '已完成', value: stats.statusCounts.done, icon: '✅', color: '#388E3C', bg: '#E8F5E9' },
    { label: '已超期', value: stats.overdueCount, icon: '⚠️', color: '#D32F2F', bg: '#FFEBEE' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {statCards.map((s) => (
          <motion.div
            key={s.label}
            whileHover={{ y: -3, boxShadow: '0 8px 20px rgba(0,0,0,0.08)' }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl p-4 border-2 transition-all"
            style={{ backgroundColor: s.bg, borderColor: s.color + '33' }}
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-xs font-medium mb-1" style={{ color: s.color }}>
              {s.label}
            </div>
            <div className="text-3xl font-bold" style={{ color: s.color }}>
              {s.value}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 border-2 border-[#D7C4B0] shadow-sm">
          <h3 className="font-semibold text-lg text-[#2C3E50] mb-4 flex items-center gap-2">
            <span>📊</span> 状态分布
          </h3>
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#5D4E37]">整体完成率</span>
              <span className="font-bold text-[#388E3C]">{stats.completionRate}%</span>
            </div>
            <div className="h-4 bg-[#F5F5F5] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.completionRate}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #64B5F6, #FFB74D, #CE93D8, #81C784)',
                }}
              />
            </div>
          </div>
          <div className="space-y-3">
            {(Object.keys(stats.statusCounts) as OrderStatus[]).map((key) => {
              const count = stats.statusCounts[key];
              const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
              return (
                <div key={key}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-medium flex items-center gap-1.5">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: STATUS_COLOR[key] }}
                      />
                      {STATUS_LABEL[key]}
                    </span>
                    <span className="text-[#5D4E37]">
                      {count} 单 · {pct}%
                    </span>
                  </div>
                  <div className="h-2 bg-[#FAFAFA] rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.1 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: STATUS_COLOR[key] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border-2 border-[#D7C4B0] shadow-sm">
          <h3 className="font-semibold text-lg text-[#2C3E50] mb-4 flex items-center gap-2">
            <span>🎨</span> 作品类型分布
          </h3>
          {Object.keys(stats.craftCounts).length === 0 ? (
            <div className="text-center py-12 text-[#8B7355]">
              <div className="text-5xl mb-3">📭</div>
              <p>暂无数据</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(stats.craftCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count], idx) => {
                  const pct = Math.round((count / stats.total) * 100);
                  const colors = ['#8D6E63', '#64B5F6', '#FFB74D', '#81C784', '#CE93D8', '#4DD0E1', '#FF8A65', '#A1887F'];
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium text-[#5D4E37]">{type}</span>
                        <span className="text-[#5D4E37]">
                          {count} 单 · {pct}%
                        </span>
                      </div>
                      <div className="h-2.5 bg-[#FAFAFA] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: colors[idx % colors.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

const Footer = () => (
  <footer
    className="text-center py-3 text-center"
    style={{ opacity: 0.6, fontSize: 11, color: '#5D4E37' }}
  >
    匠心工坊 Craft Workshop Tracker v1.0.0 · © 2026 版权所有 · 用心雕琢每一件作品 ✨
  </footer>
);

const AppContent = () => {
  const { state } = useStore();
  const { activeTab } = state;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <div
      className="min-h-screen relative"
      style={{ backgroundColor: '#FFF8F0' }}
    >
      <Sidebar />
      <main
        className="pb-6"
        style={{
          marginLeft: isMobile ? 0 : state.sidebarCollapsed ? 72 : 220,
          padding: isMobile ? '70px 20px 20px' : '28px 36px 20px',
          minWidth: isMobile ? '100%' : 800,
          transition: 'margin-left 0.3s ease-out',
        }}
      >
        <TopBar />
        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            <motion.div
              key="orders"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              <OrderForm />
              <OrderList />
              <KanbanBoard />
            </motion.div>
          ) : (
            <motion.div
              key="stats"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
            >
              <StatsView />
            </motion.div>
          )}
        </AnimatePresence>
        <Footer />
      </main>

      <style>{`
        @media (max-width: 1024px) {
          .kanban-columns {
            flex-direction: column !important;
          }
          .kanban-columns > * {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
};

const App = () => (
  <StoreProvider>
    <AppContent />
  </StoreProvider>
);

export default App;
