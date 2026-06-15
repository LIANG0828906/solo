import { useEffect, useState, useRef } from 'react';
import {
  Package,
  Layers,
  Users,
  AlertTriangle,
  Plus,
  Check,
  ChevronRight,
  TrendingUp,
  Scissors,
  Palette,
} from 'lucide-react';
import {
  useStore,
  type Order,
  type OrderStatus,
  type Leather,
  type LeatherType,
  type LeatherColor,
  type LeatherThickness,
  type RestockSuggestion,
  STATUS_LIST,
  STATUS_LABELS,
  STATUS_COLORS,
  PRODUCT_LABELS,
  LEATHER_TYPE_LABELS,
  LEATHER_COLOR_LABELS,
  LEATHER_COLOR_HEX,
  HARDWARE_LABELS,
  HARDWARE_COLORS,
} from '../store/useStore';

function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className="px-2.5 py-1 rounded-full text-xs font-medium text-white inline-block"
      style={{ backgroundColor: STATUS_COLORS[status] }}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}

function DonutChart({ data }: { data: { status: OrderStatus; count: number }[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const size = 260;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = 105;
    const innerRadius = 70;

    const total = data.reduce((sum, d) => sum + d.count, 0);
    let startAngle = -Math.PI / 2;

    ctx.clearRect(0, 0, size, size);

    let progress = 0;
    const duration = 600;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);

      ctx.clearRect(0, 0, size, size);

      let currentAngle = startAngle;

      data.forEach((d) => {
        if (d.count === 0) return;
        const sliceAngle = (d.count / total) * Math.PI * 2 * easeProgress;

        ctx.beginPath();
        ctx.arc(centerX, centerY, outerRadius, currentAngle, currentAngle + sliceAngle);
        ctx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
        ctx.closePath();
        ctx.fillStyle = STATUS_COLORS[d.status];
        ctx.fill();

        currentAngle += sliceAngle;
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
    setAnimated(true);
  }, [data]);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas ref={canvasRef} />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-[#5D4037]">{total}</div>
          <div className="text-sm text-[#8B7355]">总订单</div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-4 w-full">
        {data.map((d) => (
          <div key={d.status} className="flex items-center gap-2 text-xs">
            <div
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: STATUS_COLORS[d.status] }}
            />
            <span className="text-[#5D4037] flex-1">{STATUS_LABELS[d.status]}</span>
            <span className="font-semibold text-[#8B4513]">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeatherCard({ leather }: { leather: Leather }) {
  const isLow = leather.area < leather.threshold;

  return (
    <div
      className={`rounded-lg p-4 border transition-all duration-300 ${
        isLow ? 'animate-blink-red border-red-300' : 'bg-white border-[#D2B48C]/40'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-lg shadow-inner flex-shrink-0"
          style={{
            backgroundColor: LEATHER_COLOR_HEX[leather.color],
            backgroundImage: 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(0,0,0,0.15))',
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#3E2723] text-sm truncate">
            {LEATHER_TYPE_LABELS[leather.type]}
          </div>
          <div className="text-xs text-[#8B7355]">
            {LEATHER_COLOR_LABELS[leather.color]} · {leather.thickness}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-xs">
        <div>
          <span className="text-[#8B7355]">库存: </span>
          <span className={`font-semibold ${isLow ? 'text-red-600' : 'text-[#5D4037]'}`}>
            {leather.area.toFixed(1)} 平方英尺
          </span>
        </div>
        <div className="text-[#8B7355]">¥{leather.unitCost}/平方尺</div>
      </div>
      {isLow && (
        <div className="mt-2 flex items-center gap-1 text-xs text-red-600 font-medium">
          <AlertTriangle size={12} />
          <span>低于阈值 {leather.threshold} 平方英尺</span>
        </div>
      )}
    </div>
  );
}

function RestockCard({ suggestion, onResolve }: { suggestion: RestockSuggestion; onResolve: () => void }) {
  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded shadow-inner flex-shrink-0"
            style={{
              backgroundColor: LEATHER_COLOR_HEX[suggestion.color],
            }}
          />
          <div>
            <div className="text-sm font-medium text-[#5D4037]">
              {LEATHER_TYPE_LABELS[suggestion.type]} - {LEATHER_COLOR_LABELS[suggestion.color]}
            </div>
            <div className="text-xs text-[#8B7355]">{suggestion.thickness}</div>
          </div>
        </div>
        <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" />
      </div>
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-[#8B7355]">
          当前库存: <span className="text-red-600 font-medium">{suggestion.currentArea.toFixed(1)} 平方尺</span>
        </span>
        <span className="text-[#8B7355]">
          建议补货: <span className="text-green-700 font-medium">{suggestion.suggestedArea.toFixed(0)} 平方尺</span>
        </span>
      </div>
      <button
        onClick={onResolve}
        className="w-full py-1.5 bg-gradient-to-r from-[#8B4513] to-[#5D4037] text-white text-xs font-medium rounded-md hover:opacity-90 transition-opacity"
      >
        标记已处理
      </button>
    </div>
  );
}

export default function VendorDashboard() {
  const {
    orders,
    leathers,
    restockSuggestions,
    fetchOrders,
    fetchLeathers,
    fetchRestockSuggestions,
    updateOrderStatus,
    resolveRestockSuggestion,
    addLeather,
    loading,
  } = useStore();

  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'customers'>('orders');
  const [showAddLeather, setShowAddLeather] = useState(false);
  const [newLeatherType, setNewLeatherType] = useState<LeatherType>('cowhide');
  const [newLeatherColor, setNewLeatherColor] = useState<LeatherColor>('brown');
  const [newLeatherThickness, setNewLeatherThickness] = useState<LeatherThickness>('1.5mm');
  const [newLeatherArea, setNewLeatherArea] = useState('10');
  const [newLeatherCost, setNewLeatherCost] = useState('30');

  useEffect(() => {
    fetchOrders();
    fetchLeathers();
    fetchRestockSuggestions();
  }, [fetchOrders, fetchLeathers, fetchRestockSuggestions]);

  const statusCounts = STATUS_LIST.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status).length,
  }));

  const lowStockLeathers = leathers.filter((l) => l.area < l.threshold);

  const customerStats = orders.reduce((acc, order) => {
    const email = order.customerEmail;
    if (!acc[email]) {
      acc[email] = {
        name: order.customerName,
        email,
        count: 0,
        hardwareColor: order.hardwareColor,
      };
    }
    acc[email].count++;
    return acc;
  }, {} as Record<string, { name: string; email: string; count: number; hardwareColor: string }>);

  const topCustomers = Object.values(customerStats)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const handleAddLeather = async (e: React.FormEvent) => {
    e.preventDefault();
    await addLeather({
      type: newLeatherType,
      color: newLeatherColor,
      thickness: newLeatherThickness,
      area: parseFloat(newLeatherArea) || 0,
      unitCost: parseFloat(newLeatherCost) || 0,
      threshold: 5,
    });
    setShowAddLeather(false);
    fetchRestockSuggestions();
  };

  const handleNextStatus = async (order: Order) => {
    const currentIdx = STATUS_LIST.indexOf(order.status);
    if (currentIdx < STATUS_LIST.length - 1) {
      const nextStatus = STATUS_LIST[currentIdx + 1];
      await updateOrderStatus(order.id, nextStatus);
    }
  };

  const tabs = [
    { id: 'orders' as const, label: '订单管理', icon: Package },
    { id: 'inventory' as const, label: '库存管理', icon: Layers },
    { id: 'customers' as const, label: '客户偏好', icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#5D4037]">工作室后台</h1>
          <p className="text-[#8B7355] text-sm mt-1">管理订单、库存与客户偏好</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white rounded-lg px-4 py-2 border border-[#D2B48C]/40 flex items-center gap-2">
            <TrendingUp size={18} className="text-[#8B4513]" />
            <div>
              <div className="text-xs text-[#8B7355]">今日订单</div>
              <div className="font-bold text-[#5D4037]">{orders.length}</div>
            </div>
          </div>
          <div className="bg-white rounded-lg px-4 py-2 border border-[#D2B48C]/40 flex items-center gap-2">
            <AlertTriangle size={18} className="text-orange-500" />
            <div>
              <div className="text-xs text-[#8B7355]">库存预警</div>
              <div className="font-bold text-orange-600">{lowStockLeathers.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-[#D2B48C]/40 p-5">
          <h2 className="text-lg font-semibold text-[#5D4037] mb-4 flex items-center gap-2">
            <Scissors size={20} />
            订单统计
          </h2>
          <DonutChart data={statusCounts} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-[#D2B48C]/40 p-5">
          <h2 className="text-lg font-semibold text-[#5D4037] mb-4 flex items-center gap-2">
            <AlertTriangle size={20} className="text-orange-500" />
            库存预警与补货建议
          </h2>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-8 h-8 border-4 border-[#D2B48C] border-t-[#8B4513] rounded-full animate-spin" />
            </div>
          ) : restockSuggestions.length === 0 && lowStockLeathers.length === 0 ? (
            <div className="text-center py-10 text-[#8B7355]">
              <Check size={36} className="mx-auto mb-2 text-green-500" />
              <p>库存充足，暂无预警</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-2">
              {restockSuggestions.length > 0 ? (
                restockSuggestions.map((s) => (
                  <RestockCard
                    key={s.id}
                    suggestion={s}
                    onResolve={() => resolveRestockSuggestion(s.id)}
                  />
                ))
              ) : (
                lowStockLeathers.map((l) => (
                  <LeatherCard key={l.id} leather={l} />
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-[#D2B48C]/40 overflow-hidden">
        <div className="border-b border-[#D2B48C]/40 flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px ${
                  active
                    ? 'text-[#8B4513] border-[#8B4513] bg-[#FAF6EC]'
                    : 'text-[#8B7355] border-transparent hover:text-[#5D4037] hover:bg-[#FAF6EC]/50'
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-5">
          {activeTab === 'orders' && (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-8 h-8 border-4 border-[#D2B48C] border-t-[#8B4513] rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16 text-[#8B7355]">
                  <Package size={36} className="mx-auto mb-2 opacity-50" />
                  <p>暂无订单</p>
                </div>
              ) : (
                orders.map((order) => {
                  const currentIdx = STATUS_LIST.indexOf(order.status);
                  const isLast = currentIdx === STATUS_LIST.length - 1;
                  return (
                    <div
                      key={order.id}
                      className="flex items-center gap-4 p-4 bg-[#FAF6EC] rounded-lg border border-[#E8DCC4] hover:border-[#D2B48C] transition-colors"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, ${STATUS_COLORS[order.status]}, ${STATUS_COLORS[order.status]}dd)`,
                        }}
                      >
                        #{order.id}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[#3E2723]">
                            {PRODUCT_LABELS[order.productType]}
                          </span>
                          <StatusBadge status={order.status} />
                        </div>
                        <div className="text-sm text-[#8B7355]">
                          {order.customerName} · {order.customerEmail}
                        </div>
                        {order.engravingText && (
                          <div className="text-xs text-[#8B7355] mt-1">
                            刻字: {order.engravingText}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {!isLast && (
                          <button
                            onClick={() => handleNextStatus(order)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#8B4513] to-[#5D4037] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity"
                          >
                            下一阶段
                            <ChevronRight size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'inventory' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#5D4037]">皮革库存列表</h3>
                <button
                  onClick={() => setShowAddLeather(true)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-[#8B4513] to-[#5D4037] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Plus size={14} />
                  添加皮革
                </button>
              </div>

              {showAddLeather && (
                <form
                  onSubmit={handleAddLeather}
                  className="mb-5 p-4 bg-[#F5F0E1] rounded-lg border border-[#D2B48C]/50 space-y-3"
                >
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-[#5D4037] mb-1 block">皮革种类</label>
                      <select
                        value={newLeatherType}
                        onChange={(e) => setNewLeatherType(e.target.value as LeatherType)}
                        className="w-full px-3 py-2 border border-[#D2B48C] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30"
                      >
                        {Object.entries(LEATHER_TYPE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#5D4037] mb-1 block">颜色</label>
                      <select
                        value={newLeatherColor}
                        onChange={(e) => setNewLeatherColor(e.target.value as LeatherColor)}
                        className="w-full px-3 py-2 border border-[#D2B48C] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30"
                      >
                        {Object.entries(LEATHER_COLOR_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#5D4037] mb-1 block">厚度</label>
                      <select
                        value={newLeatherThickness}
                        onChange={(e) => setNewLeatherThickness(e.target.value as LeatherThickness)}
                        className="w-full px-3 py-2 border border-[#D2B48C] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30"
                      >
                        <option value="1.0mm">1.0mm</option>
                        <option value="1.2mm">1.2mm</option>
                        <option value="1.5mm">1.5mm</option>
                        <option value="2.0mm">2.0mm</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[#5D4037] mb-1 block">面积 (平方尺)</label>
                      <input
                        type="number"
                        value={newLeatherArea}
                        onChange={(e) => setNewLeatherArea(e.target.value)}
                        className="w-full px-3 py-2 border border-[#D2B48C] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30"
                        step="0.1"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-[#5D4037] mb-1 block">单位成本 (元)</label>
                      <input
                        type="number"
                        value={newLeatherCost}
                        onChange={(e) => setNewLeatherCost(e.target.value)}
                        className="w-full px-3 py-2 border border-[#D2B48C] rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30"
                        step="1"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2 bg-gradient-to-r from-[#8B4513] to-[#5D4037] text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
                      >
                        添加
                      </button>
                    </div>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 max-h-[420px] overflow-y-auto pr-2">
                {leathers.map((leather) => (
                  <LeatherCard key={leather.id} leather={leather} />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div>
              <h3 className="text-sm font-semibold text-[#5D4037] mb-4">客户偏好记录</h3>
              {topCustomers.length === 0 ? (
                <div className="text-center py-16 text-[#8B7355]">
                  <Users size={36} className="mx-auto mb-2 opacity-50" />
                  <p>暂无客户数据</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[450px] overflow-y-auto pr-2">
                  {topCustomers.map((customer) => (
                    <div
                      key={customer.email}
                      className="flex items-center gap-3 p-4 bg-[#FFF8E7] border border-[#D2B48C] rounded-lg"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{
                          background: `linear-gradient(135deg, #D4A574, #8B4513)`,
                        }}
                      >
                        {customer.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[#3E2723] text-sm truncate">
                          {customer.name}
                        </div>
                        <div className="text-xs text-[#8B7355] truncate">
                          {customer.email}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs text-[#8B7355]">订单数</div>
                        <div className="font-bold text-[#8B4513]">{customer.count}</div>
                      </div>
                      <div className="flex items-center gap-1 pl-3 border-l border-[#D2B48C]/50">
                        <Palette size={14} className="text-[#8B7355]" />
                        <div
                          className="w-5 h-5 rounded-full border-2 border-white shadow"
                          style={{
                            backgroundColor:
                              HARDWARE_COLORS[customer.hardwareColor as keyof typeof HARDWARE_COLORS] ||
                              '#D4A574',
                          }}
                          title={
                            HARDWARE_LABELS[customer.hardwareColor as keyof typeof HARDWARE_LABELS] ||
                            '古铜'
                          }
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
