import { useState } from 'react'
import type { TravelPlan } from '../types'

interface TravelListProps {
  travels: TravelPlan[]
  onAddTravel: (data: { city: string; startDate: string; days: number; budget: number }) => Promise<any>
  onDeleteTravel: (id: string) => void
  onSelectTravel: (id: string) => void
}

function TravelList({ travels, onAddTravel, onDeleteTravel, onSelectTravel }: TravelListProps) {
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    city: '',
    startDate: '',
    days: 3,
    budget: 2000,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [animatingCard, setAnimatingCard] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.city || !formData.startDate) return

    setIsSubmitting(true)
    try {
      const newTravel = await onAddTravel(formData)
      setAnimatingCard(newTravel.id)
      setTimeout(() => setAnimatingCard(null), 500)
      setShowModal(false)
      setFormData({ city: '', startDate: '', days: 3, budget: 2000 })
    } catch (error) {
      console.error('创建失败', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}月${date.getDate()}日`
  }

  const getTotalSpots = (travel: TravelPlan) => {
    return travel.spots.length
  }

  const getTotalCost = (travel: TravelPlan) => {
    return travel.spots.reduce((sum, spot) => sum + spot.cost, 0)
  }

  return (
    <div>
      <div className="travel-list-header">
        <h2>我的旅行计划</h2>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + 创建新计划
        </button>
      </div>

      {travels.length === 0 ? (
        <div className="spot-empty">
          <div className="spot-empty-icon">🗺️</div>
          <p>还没有旅行计划，点击上方按钮创建一个吧！</p>
        </div>
      ) : (
        <div className="travel-grid">
          {travels.map((travel) => (
            <div
              key={travel.id}
              className="travel-card"
              onClick={() => onSelectTravel(travel.id)}
            >
              <span className="travel-card-icon">{travel.icon}</span>
              <h3>{travel.city}</h3>
              <div className="travel-card-info">
                <span>📅 {formatDate(travel.startDate)} 出发</span>
                <span>⏱️ {travel.days} 天行程</span>
                <span>💰 预算 ¥{travel.budget}</span>
              </div>
              <div className="travel-card-footer">
                <span className="spot-count">{getTotalSpots(travel)} 个景点</span>
                <span style={{ fontSize: '13px', color: '#666' }}>
                  已花费 ¥{getTotalCost(travel)}
                </span>
                <button
                  className="delete-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('确定删除这个旅行计划吗？')) {
                      onDeleteTravel(travel.id)
                    }
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">创建旅行计划</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>目的地城市</label>
                <select
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                >
                  <option value="">请选择城市</option>
                  <option value="北京">北京</option>
                  <option value="上海">上海</option>
                  <option value="杭州">杭州</option>
                  <option value="成都">成都</option>
                  <option value="厦门">厦门</option>
                </select>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>出发日期</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>行程天数</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.days}
                    onChange={(e) => setFormData({ ...formData, days: Number(e.target.value) })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>总预算 (¥)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                  required
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  取消
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? '创建中...' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TravelList
