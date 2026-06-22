import { useWorkshopStore, OrderStatus, ProductCategory, Order } from '../store'
import './OrderPanel.css'

const statusLabels: Record<OrderStatus, string> = {
  pending: '待确认',
  confirmed: '已确认',
  producing: '生产中',
  completed: '已完成',
  delivered: '已交付'
}

const categoryLabels: Record<ProductCategory, string> = {
  wallet: '钱包',
  belt: '皮带',
  backpack: '背包',
  cardholder: '卡包',
  keycase: '钥匙包'
}

const statusColors: Record<OrderStatus, string> = {
  pending: '#e67e22',
  confirmed: '#3498db',
  producing: '#9b59b6',
  completed: '#27ae60',
  delivered: '#7f8c8d'
}

const nextStatusMap: Record<OrderStatus, OrderStatus | null> = {
  pending: 'confirmed',
  confirmed: 'producing',
  producing: 'completed',
  completed: 'delivered',
  delivered: null
}

const nextStatusButtonText: Record<OrderStatus, string> = {
  pending: '确认订单',
  confirmed: '开始生产',
  producing: '完成生产',
  completed: '确认交付',
  delivered: ''
}

function OrderCard({ order }: { order: Order }) {
  const updateOrderStatus = useWorkshopStore(state => state.updateOrderStatus)
  const nextStatus = nextStatusMap[order.status]

  const handleStatusUpdate = () => {
    if (nextStatus) {
      updateOrderStatus(order.id, nextStatus)
    }
  }

  return (
    <div className="order-card">
      <div className="order-card-header">
        <span className="order-category">{categoryLabels[order.category]}</span>
        <span
          className="order-status"
          style={{ backgroundColor: statusColors[order.status] + '20', color: statusColors[order.status] }}
        >
          {statusLabels[order.status]}
        </span>
      </div>

      <div className="order-customer">
        <span className="customer-label">客户：</span>
        <span className="customer-name">{order.customerName}</span>
      </div>

      <div className="order-details">
        <div className="detail-item">
          <span className="detail-label">尺寸</span>
          <span className="detail-value">{order.size}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">颜色</span>
          <span className="detail-value">{order.color}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">五金</span>
          <span className="detail-value">{order.hardware}</span>
        </div>
      </div>

      <div className="order-stats">
        <div className="stat-item">
          <span className="stat-label">预估工时</span>
          <span className="stat-value">{order.estimatedHours}h</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">材料成本</span>
          <span className="stat-value">¥{order.materialCost}</span>
        </div>
      </div>

      {order.statusTimestamps[order.status] && (
        <div className="order-timestamp">
          <span>当前状态更新于：{order.statusTimestamps[order.status]}</span>
        </div>
      )}

      {nextStatus && (
        <button className="btn-action" onClick={handleStatusUpdate}>
          {nextStatusButtonText[order.status]}
        </button>
      )}
    </div>
  )
}

function OrderPanel() {
  const {
    statusFilter,
    categoryFilter,
    setStatusFilter,
    setCategoryFilter,
    getFilteredOrders
  } = useWorkshopStore()

  const filteredOrders = getFilteredOrders()

  const statusOptions: (OrderStatus | 'all')[] = ['all', 'pending', 'confirmed', 'producing', 'completed', 'delivered']
  const categoryOptions: (ProductCategory | 'all')[] = ['all', 'wallet', 'belt', 'backpack', 'cardholder', 'keycase']

  const statusLabelMap: Record<OrderStatus | 'all', string> = {
    all: '全部状态',
    ...statusLabels
  }

  const categoryLabelMap: Record<ProductCategory | 'all', string> = {
    all: '全部品类',
    ...categoryLabels
  }

  return (
    <div className="order-panel">
      <div className="panel-header">
        <h2>订单管理</h2>
        <span className="order-count">共 {filteredOrders.length} 个订单</span>
      </div>

      <div className="filter-bar">
        <div className="filter-group">
          <label className="filter-label">状态筛选</label>
          <div className="filter-buttons">
            {statusOptions.map(status => (
              <button
                key={status}
                className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {statusLabelMap[status]}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label className="filter-label">品类筛选</label>
          <select
            className="filter-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as ProductCategory | 'all')}
          >
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{categoryLabelMap[cat]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="orders-list">
        {filteredOrders.length === 0 ? (
          <div className="empty-state">
            <p>暂无符合条件的订单</p>
          </div>
        ) : (
          filteredOrders.map(order => (
            <OrderCard key={order.id} order={order} />
          ))
        )}
      </div>
    </div>
  )
}

export default OrderPanel
