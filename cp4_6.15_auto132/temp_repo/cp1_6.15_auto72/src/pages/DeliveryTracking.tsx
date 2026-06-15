import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { MapPin, User, Clock, CheckCircle2, Truck } from 'lucide-react'

interface OrderItem {
  flowerId: string
  quantity: number
}

interface CustomOrder {
  id: string
  flowers: OrderItem[]
  wrapping: 'kraft' | 'plain' | 'floral'
  cardMessage: string
  address: string
  deliveryTime: string
  deliverySlot: 'morning' | 'afternoon'
  status: 'pending' | 'delivering' | 'delivered'
  createdAt: string
  estimatedDelivery: string
}

function DeliveryTracking() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [deliveringCount, setDeliveringCount] = useState(0)
  const [deliveredCount, setDeliveredCount] = useState(0)
  const [animateDelivering, setAnimateDelivering] = useState(false)
  const [animateDelivered, setAnimateDelivered] = useState(false)
  const prevDeliveringRef = useRef(0)
  const prevDeliveredRef = useRef(0)

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const res = await axios.get('/api/orders/today')
      const todayOrders = res.data.filter((o: CustomOrder) => o.status !== 'delivered')
      setOrders(todayOrders)
      
      const newDelivering = todayOrders.filter((o: CustomOrder) => o.status === 'delivering').length
      const newDelivered = res.data.filter((o: CustomOrder) => o.status === 'delivered').length
      
      if (newDelivering !== prevDeliveringRef.current) {
        setAnimateDelivering(true)
        setTimeout(() => setAnimateDelivering(false), 250)
      }
      if (newDelivered !== prevDeliveredRef.current) {
        setAnimateDelivered(true)
        setTimeout(() => setAnimateDelivered(false), 250)
      }
      
      setDeliveringCount(newDelivering)
      setDeliveredCount(newDelivered)
      prevDeliveringRef.current = newDelivering
      prevDeliveredRef.current = newDelivered
    } catch (err) {
      console.error('加载订单失败', err)
    }
  }

  const handleStartDelivery = async (orderId: string) => {
    try {
      await axios.patch(`/api/orders/${orderId}/status`, { status: 'delivering' })
      loadOrders()
    } catch (err) {
      console.error('更新失败', err)
    }
  }

  const handleConfirmDelivery = async (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'delivered' as const } : o))
    setTimeout(async () => {
      try {
        await axios.patch(`/api/orders/${orderId}/status`, { status: 'delivered' })
        loadOrders()
      } catch (err) {
        console.error('更新失败', err)
      }
    }, 300)
  }

  const slotLabels: Record<string, string> = {
    morning: '上午 9:00-12:00',
    afternoon: '下午 14:00-17:00'
  }

  return (
    <div className="container">
      <h1 className="page-title">配送看板</h1>
      <p className="page-subtitle">管理当日配送订单，实时跟踪配送状态</p>

      <div className="delivery-stats">
        <div className="stat-badge">
          <div className="stat-badge-icon delivering"><Truck size={20} color="#FF9800" /></div>
          <div>
            <div className="stat-badge-label">配送中</div>
            <div className={`stat-badge-number delivering-num ${animateDelivering ? 'animate' : ''}`}>
              {deliveringCount}
            </div>
          </div>
        </div>
        <div className="stat-badge">
          <div className="stat-badge-icon delivered"><CheckCircle2 size={20} color="#7CB342" /></div>
          <div>
            <div className="stat-badge-label">已送达</div>
            <div className={`stat-badge-number delivered-num ${animateDelivered ? 'animate' : ''}`}>
              {deliveredCount}
            </div>
          </div>
        </div>
      </div>

      <div className="delivery-orders-list">
        {orders.map(order => (
          <div
            key={order.id}
            className={`delivery-order-card ${order.status === 'delivered' ? 'removing' : ''}`}
          >
            <div className={`delivery-status-indicator ${order.status}`}>
              {order.status === 'delivering' && (
                <div className="delivery-pulse-dot"></div>
              )}
            </div>
            <div className="delivery-order-body">
              <div className="delivery-order-header">
                <div className="delivery-order-id">#{order.id}</div>
                <span className={`tag ${order.status === 'pending' ? 'tag-info' : order.status === 'delivering' ? 'tag-warning' : 'tag-success'}`}>
                  {order.status === 'pending' ? '待配送' : order.status === 'delivering' ? '配送中' : '已送达'}
                </span>
              </div>
              <div className="delivery-order-meta">
                <div className="delivery-meta-item">
                  <User size={16} />
                  <span className="delivery-meta-label">收件人：</span>
                  <span>客户（{order.id}）</span>
                </div>
                <div className="delivery-meta-item">
                  <Clock size={16} />
                  <span className="delivery-meta-label">时间段：</span>
                  <span>{slotLabels[order.deliverySlot]}</span>
                </div>
                <div className="delivery-meta-item" style={{ gridColumn: 'span 2' }}>
                  <MapPin size={16} />
                  <span className="delivery-meta-label">地址：</span>
                  <span>{order.address}</span>
                </div>
              </div>
            </div>
            <div className="delivery-actions">
              {order.status === 'pending' && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleStartDelivery(order.id)}
                >
                  开始配送
                </button>
              )}
              {order.status === 'delivering' && (
                <button
                  className="btn btn-accent btn-sm"
                  onClick={() => handleConfirmDelivery(order.id)}
                >
                  确认送达
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9B9B9B' }}>
          <Truck size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>今日暂无待配送订单</p>
        </div>
      )}
    </div>
  )
}

export default DeliveryTracking
