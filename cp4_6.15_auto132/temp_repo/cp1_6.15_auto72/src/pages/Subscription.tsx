import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Package } from 'lucide-react'

interface Flower {
  id: string
  name: string
  category: string
  image: string
  price: number
  stock: number
  threshold: number
}

interface Subscription {
  id: string
  name: string
  price: number
  cycle: 'weekly' | 'biweekly' | 'monthly'
  flowers: string[]
  deliveryArea: string
  image: string
  createdAt: string
}

const cycleLabels: Record<string, string> = {
  weekly: '每周配送一次',
  biweekly: '每两周配送一次',
  monthly: '每月配送一次'
}

function Subscription() {
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    cycle: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    flowers: [] as string[],
    deliveryArea: '花店周边5公里内',
    image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=300&fit=crop'
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [flowersRes, subsRes] = await Promise.all([
        axios.get('/api/flowers'),
        axios.get('/api/subscriptions')
      ])
      setFlowers(flowersRes.data)
      setSubscriptions(subsRes.data)
    } catch (err) {
      console.error('加载数据失败', err)
    }
  }

  const getFlowerName = (id: string) => {
    return flowers.find(f => f.id === id)?.name || id
  }

  const handleFlowerToggle = (flowerId: string) => {
    setFormData(prev => {
      const exists = prev.flowers.includes(flowerId)
      return {
        ...prev,
        flowers: exists
          ? prev.flowers.filter(id => id !== flowerId)
          : [...prev.flowers, flowerId]
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.flowers.length < 3) {
      alert('请至少选择3种花材')
      return
    }
    try {
      const res = await axios.post('/api/subscriptions', {
        ...formData,
        price: Number(formData.price)
      })
      setSubscriptions(prev => [res.data, ...prev])
      setFormData({
        name: '',
        price: '',
        cycle: 'weekly',
        flowers: [],
        deliveryArea: '花店周边5公里内',
        image: 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&h=300&fit=crop'
      })
      setShowForm(false)
    } catch (err) {
      console.error('创建失败', err)
    }
  }

  return (
    <div className="container">
      <h1 className="page-title">订阅套餐管理</h1>
      <p className="page-subtitle">创建和管理鲜花订阅套餐，为客户提供定期配送服务</p>

      <div className="section-header">
        <h2 className="section-title">套餐列表</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(!showForm)}
        >
          <Plus size={18} />
          {showForm ? '收起表单' : '创建新套餐'}
        </button>
      </div>

      {showForm && (
        <form className="subscription-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">套餐名称</label>
              <input
                type="text"
                className="form-input"
                placeholder="如：每周一花·清新款"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">价格（元）</label>
              <input
                type="number"
                className="form-input"
                placeholder="99"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                required
                min="1"
              />
            </div>
            <div className="form-group">
              <label className="form-label">配送周期</label>
              <select
                className="form-select"
                value={formData.cycle}
                onChange={e => setFormData({ ...formData, cycle: e.target.value as any })}
              >
                <option value="weekly">每周配送</option>
                <option value="biweekly">每两周配送</option>
                <option value="monthly">每月配送</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">示例图URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://..."
                value={formData.image}
                onChange={e => setFormData({ ...formData, image: e.target.value })}
              />
            </div>
            <div className="form-group full-width">
              <label className="form-label">选择花材（至少3种）</label>
              <div className="flower-checkbox-group">
                {flowers.map(f => (
                  <label key={f.id} className="flower-checkbox-item">
                    <input
                      type="checkbox"
                      checked={formData.flowers.includes(f.id)}
                      onChange={() => handleFlowerToggle(f.id)}
                    />
                    <span>{f.name}</span>
                  </label>
                ))}
              </div>
              <small style={{ color: '#6B6B6B', marginTop: 8, display: 'block' }}>
                已选择 {formData.flowers.length} / 至少3种
              </small>
            </div>
            <div className="form-group full-width">
              <label className="form-label">配送区域</label>
              <input
                type="text"
                className="form-input"
                value={formData.deliveryArea}
                onChange={e => setFormData({ ...formData, deliveryArea: e.target.value })}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              创建套餐
            </button>
          </div>
        </form>
      )}

      <div className="subscriptions-grid">
        {subscriptions.map((sub, index) => (
          <div
            key={sub.id}
            className="flip-card-wrapper"
            style={{ animationDelay: `${index * 0.08}s` }}
          >
            <div className="flip-card">
              <div className="flip-card-face flip-card-front">
                <img src={sub.image} alt={sub.name} />
                <div className="flip-card-front-content">
                  <h3>{sub.name}</h3>
                  <div className="flip-card-price">¥{sub.price}</div>
                </div>
              </div>
              <div className="flip-card-face flip-card-back">
                <h4><Package size={16} style={{ verticalAlign: -3 }} /> 套餐详情</h4>
                <div className="flip-card-cycle">{cycleLabels[sub.cycle]}</div>
                <h4 style={{ marginBottom: 8, fontSize: 14 }}>包含花材</h4>
                <div className="flip-card-flowers">
                  {sub.flowers.map(fid => (
                    <span key={fid} className="flip-card-flower-tag">
                      {getFlowerName(fid)}
                    </span>
                  ))}
                </div>
                <div className="flip-card-area">📍 配送范围：{sub.deliveryArea}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {subscriptions.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#9B9B9B' }}>
          <Package size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
          <p>暂无订阅套餐，点击上方按钮创建第一个套餐</p>
        </div>
      )}
    </div>
  )
}

export default Subscription
