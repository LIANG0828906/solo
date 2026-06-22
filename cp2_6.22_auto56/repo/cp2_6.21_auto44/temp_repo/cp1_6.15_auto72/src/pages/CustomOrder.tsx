import { useState, useEffect } from 'react'
import axios from 'axios'
import FlowerSelector from '../components/FlowerSelector'
import { X, Gift, Check, Loader2 } from 'lucide-react'

interface Flower {
  id: string
  name: string
  category: string
  image: string
  price: number
  stock: number
  threshold: number
}

interface SelectedFlower extends Flower {
  quantity: number
  removing?: boolean
}

type WrappingType = 'kraft' | 'plain' | 'floral'

const wrappingOptions: { type: WrappingType; label: string; image: string }[] = [
  { type: 'kraft', label: '牛皮纸', image: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=300&h=150&fit=crop' },
  { type: 'plain', label: '素色纸', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=150&fit=crop' },
  { type: 'floral', label: '碎花纸', image: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=300&h=150&fit=crop' },
]

function getNext3Days() {
  const dates: { value: string; label: string }[] = []
  const today = new Date()
  for (let i = 0; i < 3; i++) {
    const d = new Date(today)
    d.setDate(d.getDate() + i)
    const iso = d.toISOString().split('T')[0]
    const label = i === 0 ? '今天' : i === 1 ? '明天' : '后天'
    dates.push({ value: iso, label: `${label} (${iso})` })
  }
  return dates
}

function CustomOrder() {
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [selected, setSelected] = useState<SelectedFlower[]>([])
  const [wrapping, setWrapping] = useState<WrappingType>('kraft')
  const [cardMessage, setCardMessage] = useState('')
  const [address, setAddress] = useState('')
  const [deliveryDate, setDeliveryDate] = useState(getNext3Days()[0].value)
  const [deliverySlot, setDeliverySlot] = useState<'morning' | 'afternoon'>('morning')
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [orderResult, setOrderResult] = useState<{ orderId: string; estimatedDelivery: string } | null>(null)

  useEffect(() => {
    axios.get('/api/flowers').then(res => setFlowers(res.data))
  }, [])

  const handleSelectFlower = (flower: Flower) => {
    setSelected(prev => {
      const existing = prev.find(f => f.id === flower.id)
      if (existing) {
        return prev.map(f =>
          f.id === flower.id ? { ...f, quantity: f.quantity + 1 } : f
        )
      }
      return [...prev, { ...flower, quantity: 1 }]
    })
  }

  const handleRemoveFlower = (flowerId: string) => {
    setSelected(prev =>
      prev.map(f =>
        f.id === flowerId ? { ...f, removing: true } : f
      )
    )
    setTimeout(() => {
      setSelected(prev => prev.filter(f => f.id !== flowerId))
    }, 300)
  }

  const totalPrice = selected.reduce((sum, f) => sum + f.price * f.quantity, 0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selected.length === 0) {
      alert('请至少选择一种花材')
      return
    }
    if (!address.trim()) {
      alert('请填写配送地址')
      return
    }
    setSubmitting(true)
    try {
      const res = await axios.post('/api/orders', {
        flowers: selected.map(f => ({ flowerId: f.id, quantity: f.quantity })),
        wrapping,
        cardMessage,
        address,
        deliveryTime: deliveryDate,
        deliverySlot,
      })
      setOrderResult(res.data)
      setSubmitting(false)
      setShowModal(true)
    } catch (err) {
      console.error('提交失败', err)
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelected([])
    setCardMessage('')
    setAddress('')
    setShowModal(false)
  }

  return (
    <div className="container">
      <h1 className="page-title">定制专属花束</h1>
      <p className="page-subtitle">自由选择花材，搭配包装，定制独一无二的心意</p>

      <form onSubmit={handleSubmit}>
        <div className="custom-order-container">
          <div className="flower-selector-panel">
            <h2 className="section-title" style={{ marginBottom: 20 }}>选择花材</h2>
            <FlowerSelector flowers={flowers} onSelect={handleSelectFlower} />
          </div>

          <div className="assembly-panel">
            <h2 className="section-title" style={{ marginBottom: 20 }}>花束组装区</h2>

            <div className="assembly-stack">
              {selected.length === 0 ? (
                <div className="assembly-empty">
                  <div className="assembly-empty-icon">💐</div>
                  <p>点击左侧花材添加到花束</p>
                </div>
              ) : (
                selected.map(f => (
                  <div key={f.id} className={`assembly-item ${f.removing ? 'removing' : ''}`}>
                    <div className="assembly-item-qty">{f.quantity}</div>
                    <div className="assembly-item-info">
                      <img src={f.image} alt={f.name} className="assembly-item-img" />
                      <div>
                        <div className="assembly-item-name">{f.name}</div>
                        <div style={{ fontSize: 12, color: '#E8B4B8' }}>¥{f.price} × {f.quantity}</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="assembly-item-remove"
                      onClick={() => handleRemoveFlower(f.id)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="order-total">
              <span className="order-total-label">花材合计</span>
              <span className="order-total-amount">¥{totalPrice}</span>
            </div>

            <div className="form-group">
              <label className="form-label">选择包装纸</label>
              <div className="wrapping-options">
                {wrappingOptions.map(opt => (
                  <div
                    key={opt.type}
                    className={`wrapping-option ${wrapping === opt.type ? 'active' : ''}`}
                    onClick={() => setWrapping(opt.type)}
                  >
                    <img src={opt.image} alt={opt.label} className="wrapping-img" />
                    <div className="wrapping-label">{opt.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">贺卡文字（限50字）</label>
              <textarea
                className="form-textarea"
                placeholder="写下你想说的话..."
                maxLength={50}
                value={cardMessage}
                onChange={e => setCardMessage(e.target.value)}
              />
              <div style={{ textAlign: 'right', fontSize: 12, color: '#9B9B9B' }}>
                {cardMessage.length}/50
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">配送地址</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入详细配送地址"
                value={address}
                onChange={e => setAddress(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">期望送达日期</label>
                <select
                  className="form-select"
                  value={deliveryDate}
                  onChange={e => setDeliveryDate(e.target.value)}
                >
                  {getNext3Days().map(d => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">配送时间段</label>
                <select
                  className="form-select"
                  value={deliverySlot}
                  onChange={e => setDeliverySlot(e.target.value as any)}
                >
                  <option value="morning">上午 9:00-12:00</option>
                  <option value="afternoon">下午 14:00-17:00</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-accent"
              style={{ width: '100%', marginTop: 8 }}
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="spinner" style={{ animation: 'spin 0.5s linear infinite' }} />
                  提交中...
                </>
              ) : (
                <>
                  <Gift size={18} />
                  提交订单（¥{totalPrice}）
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {showModal && orderResult && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-icon">
              <Check size={32} color="#4CAF50" />
            </div>
            <h2 className="modal-title">下单成功！</h2>
            <p style={{ color: '#6B6B6B' }}>感谢您的订购，我们将按时为您送达</p>
            <div className="modal-info">
              <div className="modal-info-row">
                <span className="modal-info-label">订单号</span>
                <span className="modal-info-value" style={{ fontFamily: 'monospace' }}>{orderResult.orderId}</span>
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">预计送达</span>
                <span className="modal-info-value">{orderResult.estimatedDelivery}</span>
              </div>
              <div className="modal-info-row">
                <span className="modal-info-label">金额</span>
                <span className="modal-info-value" style={{ color: '#E8B4B8' }}>¥{totalPrice}</span>
              </div>
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={resetForm}>
              确定
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CustomOrder
