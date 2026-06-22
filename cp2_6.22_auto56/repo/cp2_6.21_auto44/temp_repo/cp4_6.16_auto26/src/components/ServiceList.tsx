import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { useStore, getMonthlyAmount } from '../store'
import ServiceModal from './ServiceModal'
import type { Subscription, ServiceStatus } from '../types'

const cycleLabel = (cycle: string): string => {
  switch (cycle) {
    case 'monthly': return '每月'
    case 'quarterly': return '每季'
    case 'yearly': return '每年'
    default: return ''
  }
}

const statusLabel = (status: ServiceStatus): string => {
  switch (status) {
    case 'active': return '活跃'
    case 'paused': return '暂停'
    case 'cancelled': return '已取消'
  }
}

const statusGroups: { status: ServiceStatus; label: string; icon: string }[] = [
  { status: 'active', label: '活跃订阅', icon: 'fa-circle-play' },
  { status: 'paused', label: '暂停订阅', icon: 'fa-pause' },
  { status: 'cancelled', label: '已取消', icon: 'fa-ban' }
]

const ServiceList = () => {
  const navigate = useNavigate()
  const {
    getFilteredSubscriptions,
    ui,
    setSearchQuery,
    setSortOrder,
    toggleCompare,
    clearCompare,
    deleteSubscription,
    subscriptions
  } = useStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingSub, setEditingSub] = useState<Subscription | null>(null)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const filtered = useMemo(() => getFilteredSubscriptions(), [getFilteredSubscriptions])

  const groupedByStatus = useMemo(() => {
    const groups: Record<ServiceStatus, Subscription[]> = {
      active: [],
      paused: [],
      cancelled: []
    }
    filtered.forEach(s => groups[s.status].push(s))
    return groups
  }, [filtered])

  const handleCardClick = (sub: Subscription) => {
    setEditingSub(sub)
    setModalOpen(true)
  }

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (window.confirm('确定要删除这条订阅记录吗？此操作不可恢复。')) {
      setRemovingId(id)
      setTimeout(() => {
        deleteSubscription(id)
        setRemovingId(null)
      }, 300)
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleAddNew = () => {
    setEditingSub(null)
    setModalOpen(true)
  }

  return (
    <>
      <div className="page-header">
        <h1 className="page-title">
          <i className="fas fa-list-check"></i>
          服务管理
          <span style={{
            fontSize: 14,
            fontWeight: 400,
            color: 'var(--text-secondary)',
            marginLeft: 12
          }}>
            ({subscriptions.length} 条)
          </span>
        </h1>
        <button className="btn btn-primary" onClick={handleAddNew}>
          <i className="fas fa-plus"></i>
          添加订阅
        </button>
      </div>

      {ui.compareList.length > 0 && (
        <div className="compare-info" style={{ marginBottom: 24 }}>
          <i className="fas fa-layer-group"></i>
          已选择 <span>{ui.compareList.length}</span> 个服务用于对比
          <div style={{ flex: 1 }}></div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={clearCompare}
          >
            <i className="fas fa-times"></i> 清除
          </button>
          <button
            className="btn btn-sm btn-primary"
            disabled={ui.compareList.length < 2 || ui.compareList.length > 4}
            onClick={() => navigate('/charts')}
            title={ui.compareList.length < 2 ? '请至少选择2个服务' : ui.compareList.length > 4 ? '最多选择4个服务' : ''}
          >
            <i className="fas fa-chart-pie"></i> 对比分析
          </button>
        </div>
      )}

      <div className="toolbar">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="搜索服务名称或备注..."
            value={ui.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <select
          className="sort-select"
          value={ui.sortOrder}
          onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
        >
          <option value="desc">费用：从高到低</option>
          <option value="asc">费用：从低到高</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <i className={`fas ${ui.searchQuery ? 'fa-magnifying-glass' : 'fa-inbox'}`}></i>
          <h3>{ui.searchQuery ? '没有找到匹配的服务' : '还没有订阅记录'}</h3>
          <p>{ui.searchQuery ? '试试其他搜索关键词' : '添加您的第一个SaaS订阅开始管理'}</p>
          {!ui.searchQuery && (
            <button className="btn btn-primary" onClick={handleAddNew}>
              <i className="fas fa-plus"></i>
              添加订阅
            </button>
          )}
        </div>
      ) : (
        statusGroups.map(group =>
          groupedByStatus[group.status].length > 0 && (
            <div key={group.status} className="services-group">
              <div className="services-group-title">
                <i className={`fas ${group.icon}`} style={{ color: 'var(--accent-secondary)' }}></i>
                {group.label}
                <span style={{ marginLeft: 8 }}>({groupedByStatus[group.status].length})</span>
              </div>
              <div className="services-grid">
                {groupedByStatus[group.status].map((sub, idx) => (
                  <div
                    key={sub.id}
                    className={`service-card ${ui.compareList.includes(sub.id) ? 'selected' : ''} ${removingId === sub.id ? 'removing' : ''}`}
                    style={{ animationDelay: `${idx * 60}ms` }}
                    onClick={() => handleCardClick(sub)}
                  >
                    <input
                      type="checkbox"
                      className="service-card-checkbox"
                      checked={ui.compareList.includes(sub.id)}
                      onChange={() => toggleCompare(sub.id)}
                      onClick={(e) => handleCheckboxClick(e)}
                      title="勾选以对比服务"
                    />
                    <div className="service-card-header">
                      <div>
                        <div className="service-card-name">{sub.name}</div>
                        <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span className={`status-badge ${sub.status}`}>
                            {statusLabel(sub.status)}
                          </span>
                          <span style={{
                            fontSize: 11,
                            padding: '2px 8px',
                            borderRadius: 10,
                            background: 'rgba(129, 140, 248, 0.15)',
                            color: 'var(--gradient-end)'
                          }}>
                            {cycleLabel(sub.billingCycle)}
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn btn-sm btn-danger"
                        style={{ opacity: 0, transition: 'opacity 300ms' }}
                        onClick={(e) => handleDelete(e, sub.id)}
                        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                        title="删除订阅"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                    <div className="service-card-amount">
                      ¥{getMonthlyAmount(sub.amount, sub.billingCycle).toFixed(2)}
                    </div>
                    <div className="service-card-cycle">
                      月均 · 实付 ¥{sub.amount.toFixed(2)}/{cycleLabel(sub.billingCycle).replace('每', '')}
                    </div>
                    <div className="service-card-meta">
                      <div className="service-card-meta-item">
                        <i className="fas fa-calendar-day"></i>
                        下次扣款：{format(parseISO(sub.nextBillingDate), 'yyyy-MM-dd')}
                      </div>
                    </div>
                    {sub.notes && (
                      <div className="service-card-notes">
                        <i className="fas fa-sticky-note" style={{ marginRight: 6, opacity: 0.6 }}></i>
                        {sub.notes}
                      </div>
                    )}
                    <div className="service-ratings">
                      <div className="rating-item">
                        <div className="rating-label">使用频率</div>
                        <div className="rating-value">
                          <i className="fas fa-clock"></i>
                          {sub.usageFrequency}
                        </div>
                      </div>
                      <div className="rating-item">
                        <div className="rating-label">满意度</div>
                        <div className="rating-value">
                          <i className="fas fa-star"></i>
                          {sub.satisfaction}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )
      )}

      {modalOpen && (
        <ServiceModal
          subscription={editingSub}
          onClose={() => {
            setModalOpen(false)
            setEditingSub(null)
          }}
        />
      )}
    </>
  )
}

export default ServiceList
