import { useState, useEffect } from 'react'
import axios from 'axios'
import { Plus, Calendar, MapPin } from 'lucide-react'
import './Subscription.css'

interface Flower {
  id: string
  name: string
  category: string
  image: string
  price: number
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
  weekly: '每周',
  biweekly: '每两周',
  monthly: '每月'
}

function Subscription() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [flowers, setFlowers] = useState<Flower[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newSub, setNewSub] = useState({
    name: '',
    price: '',
    cycle: 'weekly' as const,
    flowers: [] as string[],
    deliveryArea: '花店周边5公里内',
    image: ''
  })
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchSubscriptions()
    fetchFlowers()
  }, [])

  const fetchSubscriptions = async () => {
    try {
      const res = await axios.get('/api/subscriptions')
      setSubscriptions(res.data)
    } catch (err) {
      console.error('获取订阅套餐失败', err)
    }
  }

  const fetchFlowers = async () => {
    try {
      const res = await axios.get('/api/flowers')
      setFlowers(res.data)
    } catch (err) {
      console.error('获取花材列表失败', err)
    }
  }

  const getFlowerName = (id: string) => {
    return flowers.find(f => f.id === id)?.name || id
  }

  const toggleFlower = (flowerId: string) => {
    setNewSub(prev => {
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
    if (newSub.flowers.length < 3) {
      alert('请至少选择3种花材')
      return
    }
    setIsCreating(true)
    try {
      const subData = {
        ...newSub,
        price: Number(newSub.price),
        image: newSub.image || `https://images.unsplash.com/photo-1518882605630-8eb56d7e78c2?w=400&h=300&fit=crop`
      }
      const res = await axios.post('/api/subscriptions', subData)
      setSubscriptions([res.data, ...subscriptions])
      setShowForm(false)
      setNewSub({
        name: '',
        price: '',
        cycle: 'weekly',
        flowers: [],
        deliveryArea: '花店周边5公里内',
        image: ''
      })
    } catch (err) {
      console.error('创建套餐失败', err)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="subscription-page">
      <div className="container">
        <div className="page-header">
          <div>
            <h1 className="page-title">订阅管理</h1>
            <p className="page-subtitle">管理鲜花订阅套餐，为客户提供多样化选择</p>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
          >
            <Plus size={18} />
            创建套餐
          </button>
        </div>

        {showForm && (
          <div className="create-form card">
            <h3 className="form-title">创建新套餐</h3>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>套餐名称</label>
                  <input
                    type="text"
                    value={newSub.name}
                    onChange={e => setNewSub({ ...newSub, name: e.target.value })}
                    placeholder="如：每周一花·清新款"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>价格（元）</label>
                  <input
                    type="number"
                    value={newSub.price}
                    onChange={e => setNewSub({ ...newSub, price: e.target.value })}
                    placeholder="99"
                    required
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>配送周期</label>
                  <select
                    value={newSub.cycle}
                    onChange={e => setNewSub({ ...newSub, cycle: e.target.value as 'weekly' | 'biweekly' | 'monthly' })}
                  >
                    <option value="weekly">每周</option>
                    <option value="biweekly">每两周</option>
                    <option value="monthly">每月</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>配送区域</label>
                  <input
                    type="text"
                    value={newSub.deliveryArea}
                    onChange={e => setNewSub({ ...newSub, deliveryArea: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>套餐图片URL</label>
                <input
                  type="url"
                  value={newSub.image}
                  onChange={e => setNewSub({ ...newSub, image: e.target.value })}
                  placeholder="留空将使用默认图片"
                />
              </div>
              <div className="form-group">
                <label>选择花材（至少3种）</label>
                <div className="flower-picker">
                  {flowers.map(flower => (
                    <div
                      key={flower.id}
                      className={`flower-picker-item ${newSub.flowers.includes(flower.id) ? 'selected' : ''}`}
                      onClick={() => toggleFlower(flower.id)}
                    >
                      <img src={flower.image} alt={flower.name} />
                      <span className="flower-picker-name">{flower.name}</span>
                    </div>
                  ))}
                </div>
                <p className="form-hint">已选择 {newSub.flowers.length} 种花材</p>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowForm(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={isCreating}>
                  {isCreating ? '创建中...' : '创建套餐'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="subscriptions-grid">
          {subscriptions.map((sub, index) => (
            <div 
              key={sub.id} 
              className="flip-card-container"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flip-card">
                <div className="flip-card-front">
                  <img src={sub.image} alt={sub.name} className="card-image" />
                  <div className="card-info">
                    <h3 className="card-name">{sub.name}</h3>
                    <p className="card-price">¥{sub.price}<span>/期</span></p>
                  </div>
                </div>
                <div className="flip-card-back">
                  <div className="back-content">
                    <div className="back-item">
                      <Calendar size={16} />
                      <span>{cycleLabels[sub.cycle]}配送</span>
                    </div>
                    <div className="back-item">
                      <MapPin size={16} />
                      <span>{sub.deliveryArea}</span>
                    </div>
                    <div className="back-flowers">
                      <span className="back-label">包含花材：</span>
                      <div className="back-flower-list">
                        {sub.flowers.map(fId => (
                          <span key={fId} className="back-flower-tag">
                            {getFlowerName(fId)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {subscriptions.length === 0 && (
          <div className="empty-state">
            <p>暂无订阅套餐，点击上方按钮创建第一个套餐</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Subscription
