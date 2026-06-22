import { useMemo } from 'react'
import { ChevronRight, Search, Filter } from 'lucide-react'
import {
  useAppStore,
  STATUS_LABELS,
  STATUS_COLORS,
  STATUS_FLOW,
} from '@/stores/useAppStore'
import { formatDate, vesselTypeName, clayTypeName } from '@/utils/format'
import type { Order, OrderStatus } from '../../shared/types'

const FILTER_OPTIONS: Array<{ value: OrderStatus | 'all'; label: string }> = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'preparing', label: '制作中' },
  { value: 'throwing', label: '拉坯中' },
  { value: 'trimming', label: '修坯中' },
  { value: 'bisque', label: '素烧' },
  { value: 'glaze', label: '釉烧' },
  { value: 'polishing', label: '打磨' },
  { value: 'completed', label: '已完成' },
]

function getNextStatus(current: OrderStatus): OrderStatus | null {
  const idx = STATUS_FLOW.indexOf(current)
  if (idx === -1 || idx >= STATUS_FLOW.length - 1) return null
  return STATUS_FLOW[idx + 1]
}

function OrderTimeline({ order }: { order: Order }) {
  const updateOrderStatus = useAppStore((s) => s.updateOrderStatus)
  const nextStatus = getNextStatus(order.status)

  const handleAdvance = async () => {
    if (!nextStatus) return
    await updateOrderStatus(order.id, nextStatus)
  }

  return (
    <div className="relative pl-8 py-4">
      {order.statusHistory.map((item, idx) => {
        const isLast = idx === order.statusHistory.length - 1
        const color = STATUS_COLORS[item.status]
        return (
          <div key={idx} className="relative pb-8 last:pb-0">
            {!isLast && (
              <div
                className="absolute left-[-17px] top-5 w-0.5 h-full"
                style={{ backgroundColor: color, opacity: 0.3 }}
              />
            )}
            <div
              className="absolute left-[-24px] top-1 w-4 h-4 rounded-full border-2 border-white"
              style={{ backgroundColor: color, boxShadow: `0 0 0 2px ${color}40` }}
            />
            <div className="flex items-center gap-2">
              <span
                className="text-sm font-medium px-2 py-0.5 rounded-full text-white"
                style={{ backgroundColor: color }}
              >
                {STATUS_LABELS[item.status]}
              </span>
              <span className="text-sm text-earth-brown/60">
                {formatDate(item.timestamp)}
              </span>
            </div>
          </div>
        )
      })}

      {nextStatus && (
        <div className="mt-4 animate-fade-in">
          <button
            onClick={handleAdvance}
            className="w-full py-2.5 bg-celadon-green text-white rounded-lg font-medium hover:bg-celadon-green/90 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            推进至 {STATUS_LABELS[nextStatus]}
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function OrdersPage() {
  const {
    orders,
    selectedOrderId,
    orderStatusFilter,
    searchKeyword,
    selectOrder,
    setOrderStatusFilter,
    setSearchKeyword,
  } = useAppStore()

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false
      if (searchKeyword) {
        const kw = searchKeyword.toLowerCase()
        return (
          o.customerName.toLowerCase().includes(kw) ||
          o.customerPhone.includes(kw) ||
          o.id.toLowerCase().includes(kw)
        )
      }
      return true
    })
  }, [orders, orderStatusFilter, searchKeyword])

  const selectedOrder = useMemo(
    () => orders.find((o) => o.id === selectedOrderId) || null,
    [orders, selectedOrderId],
  )

  return (
    <div className="min-h-screen bg-rice-white">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6 animate-fade-up">
          <h1 className="font-serif text-3xl text-earth-brown mb-2">订单管理</h1>
          <p className="text-earth-brown/60 text-sm">
            共 {orders.length} 个订单，{filteredOrders.length} 个符合筛选条件
          </p>
        </div>

        <div className="flex flex-wrap gap-3 mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
          <div className="flex-1 min-w-[200px] relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-brown/40" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="搜索客户姓名、电话或订单号"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-earth-brown/15 rounded-lg focus:border-celadon-green transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-earth-brown/50" />
            <div className="flex flex-wrap gap-1.5">
              {FILTER_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setOrderStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    orderStatusFilter === opt.value
                      ? 'bg-celadon-green text-white'
                      : 'bg-white text-earth-brown/70 hover:bg-earth-brown/5 border border-earth-brown/10'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-2 space-y-3 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-earth-brown/50">
                暂无订单
              </div>
            ) : (
              filteredOrders.map((order, idx) => (
                <div
                  key={order.id}
                  onClick={() => selectOrder(order.id)}
                  className={`bg-white rounded-xl p-4 cursor-pointer transition-all card-animate ${
                    selectedOrderId === order.id
                      ? 'ring-2 ring-celadon-green shadow-card-hover'
                      : 'shadow-card hover:shadow-card-hover'
                  }`}
                  style={{ animationDelay: `${0.1 + idx * 0.03}s` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-earth-brown">{order.customerName}</p>
                      <p className="text-xs text-earth-brown/50 font-mono">{order.id.slice(0, 8)}...</p>
                    </div>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full text-white whitespace-nowrap"
                      style={{ backgroundColor: STATUS_COLORS[order.status] }}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-earth-brown/70">
                    <span>{vesselTypeName(order.vesselType)}</span>
                    <span className="w-px h-4 bg-earth-brown/10" />
                    <span>{clayTypeName(order.clayType)}</span>
                    <span className="w-px h-4 bg-earth-brown/10" />
                    <span>
                      {order.caliber}×{order.height}cm
                    </span>
                  </div>
                  <p className="text-xs text-earth-brown/40 mt-2">
                    提交于 {formatDate(order.createdAt)}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="lg:col-span-3 animate-fade-up" style={{ animationDelay: '0.15s' }}>
            {selectedOrder ? (
              <div className="bg-white rounded-xl shadow-card p-6 h-full">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-serif text-xl text-earth-brown mb-1">订单详情</h2>
                    <p className="text-sm text-earth-brown/50 font-mono">{selectedOrder.id}</p>
                  </div>
                  <span
                    className="text-sm font-medium px-3 py-1 rounded-full text-white"
                    style={{ backgroundColor: STATUS_COLORS[selectedOrder.status] }}
                  >
                    {STATUS_LABELS[selectedOrder.status]}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-3 bg-rice-white rounded-lg">
                    <p className="text-xs text-earth-brown/50 mb-1">客户姓名</p>
                    <p className="font-medium">{selectedOrder.customerName}</p>
                  </div>
                  <div className="p-3 bg-rice-white rounded-lg">
                    <p className="text-xs text-earth-brown/50 mb-1">联系电话</p>
                    <p className="font-medium">{selectedOrder.customerPhone}</p>
                  </div>
                  <div className="p-3 bg-rice-white rounded-lg">
                    <p className="text-xs text-earth-brown/50 mb-1">器型</p>
                    <p className="font-medium">{vesselTypeName(selectedOrder.vesselType)}</p>
                  </div>
                  <div className="p-3 bg-rice-white rounded-lg">
                    <p className="text-xs text-earth-brown/50 mb-1">坯体</p>
                    <p className="font-medium">{clayTypeName(selectedOrder.clayType)}</p>
                  </div>
                  <div className="col-span-2 p-3 bg-rice-white rounded-lg">
                    <p className="text-xs text-earth-brown/50 mb-1">尺寸</p>
                    <p className="font-medium">
                      口径 {selectedOrder.caliber}cm × 高度 {selectedOrder.height}cm × 底径 {selectedOrder.baseDiameter}cm
                    </p>
                  </div>
                </div>

                {selectedOrder.notes && (
                  <div className="mb-6 p-3 bg-rice-white rounded-lg">
                    <p className="text-xs text-earth-brown/50 mb-1">备注</p>
                    <p className="text-sm">{selectedOrder.notes}</p>
                  </div>
                )}

                <h3 className="font-serif text-lg text-earth-brown mb-2">制作进度</h3>
                <OrderTimeline order={selectedOrder} />
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-card p-12 text-center h-full flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-rice-white flex items-center justify-center mb-4">
                  <ChevronRight size={24} className="text-earth-brown/30" />
                </div>
                <p className="text-earth-brown/50">选择左侧订单查看详情</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
