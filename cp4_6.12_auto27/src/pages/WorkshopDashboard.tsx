import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  useAppStore,
  STATUS_LABELS,
  CATEGORY_ICONS,
  GLAZE_COLORS,
  CLAY_TYPES,
  Order,
  ProcessStep,
  Material,
} from '@/store'
import { ordersApi, materialsApi, statsApi } from '@/api'

const ORDER_STATUS_OPTIONS: Array<{ key: Order['status']; label: string }> = [
  { key: 'pending', label: '待确认' },
  { key: 'making', label: '制作中' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' },
]

const STEP_STATUS_OPTIONS: Array<{ key: ProcessStep['status']; label: string }> = [
  { key: 'pending', label: '未开始' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
]

function StatCard({
  icon,
  label,
  value,
  suffix = '',
}: {
  icon: string
  label: string
  value: string | number
  suffix?: string
}) {
  return (
    <div className="stat-card fade-in-up">
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {suffix && <span style={{ fontSize: 14, fontWeight: 500, marginLeft: 4 }}>{suffix}</span>}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  )
}

function OrderSkeleton() {
  return (
    <div className="order-card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div className="skeleton" style={{ width: 56, height: 56, borderRadius: 14 }} />
        <div style={{ flex: 1 }}>
          <div className="skeleton" style={{ height: 20, width: '50%', marginBottom: 10 }} />
          <div className="skeleton" style={{ height: 14, width: '80%' }} />
        </div>
        <div className="skeleton" style={{ width: 80, height: 40 }} />
      </div>
    </div>
  )
}

function OrderCard({
  order,
  expanded,
  onToggle,
  onUpdateStep,
  onStatusChange,
}: {
  order: Order
  expanded: boolean
  onToggle: () => void
  onUpdateStep: (stepId: number, status: ProcessStep['status'], assignee?: string) => void
  onStatusChange: (status: Order['status']) => void
}) {
  const [updatingStep, setUpdatingStep] = useState<number | null>(null)
  const [tempStatus, setTempStatus] = useState<ProcessStep['status']>('in_progress')
  const [tempAssignee, setTempAssignee] = useState('')

  const category = order.product_name.includes('杯')
    ? '杯子'
    : order.product_name.includes('碗')
      ? '碗'
      : order.product_name.includes('瓶') || order.product_name.includes('花')
        ? '花瓶'
        : order.product_name.includes('壶')
          ? '茶壶'
          : '摆件'
  const icon = CATEGORY_ICONS[category] || '🏺'

  const steps = order.steps || []
  const completedCount = steps.filter((s) => s.status === 'completed').length
  const progressPct = steps.length > 0 ? (completedCount / steps.length) * 100 : 0

  const clayKey = Object.keys(CLAY_TYPES).find((k) => k.startsWith(order.clay_type.slice(0, 2)))
  const clayInfo = clayKey ? CLAY_TYPES[clayKey] : null
  const glazeInfo = GLAZE_COLORS[order.glaze_color]

  const startUpdating = (step: ProcessStep) => {
    setUpdatingStep(step.id)
    setTempStatus(step.status === 'pending' ? 'in_progress' : 'completed')
    setTempAssignee(step.assignee || '')
  }

  const confirmUpdate = (step: ProcessStep) => {
    onUpdateStep(step.id, tempStatus, tempAssignee.trim() || undefined)
    setUpdatingStep(null)
  }

  return (
    <div className={`order-card ${expanded ? 'expanded' : ''} fade-in-up`}>
      <div className="order-card-header" onClick={onToggle}>
        <div className="order-card-icon">{icon}</div>
        <div className="order-card-info">
          <div className="order-card-row1">
            <div className="order-card-title">
              #{String(order.id).padStart(4, '0')} · {order.product_name}
            </div>
            <span className={`status-tag status-${order.status}`}>
              {STATUS_LABELS[order.status]}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>×{order.quantity}</span>
          </div>
          <div className="order-card-meta">
            <span>👤 {order.customer_name}</span>
            <span>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: clayInfo?.hex,
                  display: 'inline-block',
                  border: '1px solid rgba(0,0,0,0.1)',
                }}
              />
              {order.clay_type}
            </span>
            <span>
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: glazeInfo?.hex,
                  display: 'inline-block',
                }}
              />
              {order.glaze_color}
            </span>
            <span>🕒 {order.created_at}</span>
          </div>
        </div>
        <div className="order-card-price">¥{order.total_price}</div>
        <div className="order-card-expand">
          <span style={{ transform: expanded ? 'rotate(180deg)' : '', transition: '0.3s' }}>▼</span>
        </div>
      </div>

      <div className="order-card-body">
        <div className="order-card-content">
          <div className="order-detail-grid">
            <div>
              <div className="order-section-title">📋 订单详情</div>
              <div className="order-detail-item">
                <span className="order-detail-label">订单号</span>
                <span className="order-detail-value">#{String(order.id).padStart(4, '0')}</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">下单时间</span>
                <span className="order-detail-value">{order.created_at}</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">数量</span>
                <span className="order-detail-value">{order.quantity} 件</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">泥料</span>
                <span className="order-detail-value">{order.clay_type}</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">釉色</span>
                <span className="order-detail-value">{order.glaze_color}</span>
              </div>
              <div className="order-detail-item">
                <span className="order-detail-label">预计用料</span>
                <span className="order-detail-value">
                  泥 {order.clay_used}kg / 釉 {order.glaze_used}L
                </span>
              </div>
              {order.customer_phone && (
                <div className="order-detail-item">
                  <span className="order-detail-label">联系电话</span>
                  <span className="order-detail-value">{order.customer_phone}</span>
                </div>
              )}
              {order.customer_email && (
                <div className="order-detail-item">
                  <span className="order-detail-label">邮箱</span>
                  <span className="order-detail-value">{order.customer_email}</span>
                </div>
              )}
              {order.special_notes && (
                <div className="order-detail-item" style={{ alignItems: 'flex-start' }}>
                  <span className="order-detail-label" style={{ marginTop: 2 }}>
                    备注
                  </span>
                  <span
                    className="order-detail-value"
                    style={{ flex: 1, textAlign: 'right', whiteSpace: 'pre-wrap' }}
                  >
                    {order.special_notes}
                  </span>
                </div>
              )}
              {order.reference_images?.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <div className="order-section-title">🖼️ 参考图</div>
                  <div className="preview-images">
                    {order.reference_images.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`参考${i + 1}`}
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: 10,
                          objectFit: 'cover',
                          border: '2px solid var(--border)',
                          cursor: 'zoom-in',
                        }}
                        onClick={() => window.open(src, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div style={{ marginTop: 20 }}>
                <div className="order-section-title">🔄 更新订单状态</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {ORDER_STATUS_OPTIONS.map((st) => (
                    <span
                      key={st.key}
                      className={`status-tag status-${st.key}`}
                      style={{
                        cursor: 'pointer',
                        padding: '8px 16px',
                        fontSize: 13,
                        opacity: order.status === st.key ? 1 : 0.6,
                        border:
                          order.status === st.key
                            ? '2px solid currentColor'
                            : '2px solid transparent',
                      }}
                      onClick={() => onStatusChange(st.key)}
                    >
                      {st.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="order-section-title">
                📊 制作进度 ({completedCount}/{steps.length})
              </div>
              <div className="progress-bar">
                {steps.map((s, i) => {
                  const className =
                    s.status === 'completed'
                      ? 'completed'
                      : s.status === 'in_progress'
                        ? 'current'
                        : ''
                  return (
                    <div
                      key={s.id}
                      className={`progress-segment ${className}`}
                      title={`${s.step_name} - ${
                        s.status === 'completed'
                          ? '已完成'
                          : s.status === 'in_progress'
                            ? '进行中'
                            : '未开始'
                      }`}
                    />
                  )
                })}
              </div>

              <div className="progress-steps">
                {steps.map((step, idx) => {
                  const isUpdating = updatingStep === step.id
                  const isCurrent =
                    step.status !== 'completed' &&
                    (idx === 0 || steps[idx - 1].status === 'completed')
                  const stepClass =
                    step.status === 'completed'
                      ? 'completed'
                      : isCurrent
                        ? 'current'
                        : ''
                  return (
                    <div key={step.id} style={{ marginBottom: 4 }}>
                      <div className={`progress-step ${stepClass}`}>
                        <div className="progress-step-num">
                          {step.status === 'completed' ? '✓' : idx + 1}
                        </div>
                        <div className="progress-step-name">{step.step_name}</div>
                        <div className="progress-step-assignee">
                          {step.assignee ? `👷 ${step.assignee}` : '—'}
                        </div>
                        <div className="progress-step-time">
                          {step.completed_at ||
                            (step.status === 'in_progress' ? '进行中' : '未开始')}
                        </div>
                      </div>

                      {isUpdating ? (
                        <div className="step-actions">
                          <select
                            className="step-select"
                            value={tempStatus}
                            onChange={(e) => setTempStatus(e.target.value as ProcessStep['status'])}
                          >
                            {STEP_STATUS_OPTIONS.map((opt) => (
                              <option key={opt.key} value={opt.key}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                          <input
                            className="step-input"
                            placeholder="负责人名字"
                            value={tempAssignee}
                            onChange={(e) => setTempAssignee(e.target.value)}
                          />
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => confirmUpdate(step)}
                          >
                            确认
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setUpdatingStep(null)}
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        step.status !== 'completed' &&
                        isCurrent && (
                          <div className="step-actions" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => startUpdating(step)}
                            >
                              + 更新此工序
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function OrdersPanel() {
  const {
    orders,
    ordersTotal,
    ordersPage,
    loading,
    setOrders,
    updateOrderInList,
    setLoading,
    stats,
    setStats,
    addToast,
    setMaterials,
  } = useAppStore()

  const [filter, setFilter] = useState<string>('全部')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const PAGE_SIZE = 20

  const loadOrders = useCallback(
    async (page = 1, filterVal = '全部') => {
      setLoading('orders', true)
      try {
        const res = await ordersApi.getList(page, PAGE_SIZE)
        let data = res.data
        if (filterVal !== '全部') {
          data = data.filter((o) => o.status === filterVal)
        }
        setOrders(data, filterVal === '全部' ? res.total : data.length, page)
      } catch (e) {
        addToast('error', '加载订单失败')
      } finally {
        setLoading('orders', false)
      }
    },
    [setOrders, setLoading, addToast]
  )

  const loadStats = useCallback(async () => {
    try {
      const s = await statsApi.get()
      setStats(s)
    } catch (_) {}
  }, [setStats])

  const refreshMaterials = useCallback(async () => {
    try {
      const res = await materialsApi.getList()
      setMaterials(res.materials, res.warnings, res.warningCount)
    } catch (_) {}
  }, [setMaterials])

  useEffect(() => {
    loadOrders(ordersPage, filter)
    loadStats()
  }, [])

  useEffect(() => {
    loadOrders(1, filter)
    setExpandedId(null)
  }, [filter])

  const totalPages = Math.max(1, Math.ceil(ordersTotal / PAGE_SIZE))

  const handleUpdateStep = async (
    orderId: number,
    stepId: number,
    status: ProcessStep['status'],
    assignee?: string
  ) => {
    try {
      const res = await ordersApi.updateStep(orderId, stepId, { status, assignee })
      const updated = orders.find((o) => o.id === orderId)
      if (updated) {
        updateOrderInList({ ...updated, steps: res.steps })
        addToast('success', '工序状态已更新')
        loadStats()
        refreshMaterials()
      }
    } catch (e) {
      addToast('error', '更新失败')
    }
  }

  const handleStatusChange = async (orderId: number, status: Order['status']) => {
    try {
      await ordersApi.updateStatus(orderId, status)
      const updated = orders.find((o) => o.id === orderId)
      if (updated) {
        updateOrderInList({ ...updated, status })
        addToast('success', `订单状态已更新为「${STATUS_LABELS[status]}」`)
        loadStats()
      }
    } catch (e) {
      addToast('error', '更新失败')
    }
  }

  const filterOptions = [
    { key: '全部', label: '全部订单' },
    ...ORDER_STATUS_OPTIONS.map((o) => ({ key: o.key, label: o.label })),
  ]

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div>
          <div className="page-title">工作室后台</div>
          <div className="page-subtitle">订单管理 · 进度跟踪 · 数据一览</div>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard icon="📦" label="全部订单" value={stats.totalOrders} />
        <StatCard icon="⏳" label="待确认" value={stats.pendingOrders} />
        <StatCard icon="🔨" label="制作中" value={stats.makingOrders} />
        <StatCard icon="💰" label="累计收入" value={`¥${stats.totalRevenue.toFixed(0)}`} />
      </div>

      <div className="tabs">
        {filterOptions.map((opt) => (
          <div
            key={opt.key}
            className={`tab ${filter === opt.key ? 'active' : ''}`}
            onClick={() => setFilter(opt.key)}
          >
            {opt.label}
          </div>
        ))}
      </div>

      <div className="orders-list">
        {loading.orders && orders.length === 0 ? (
          Array.from({ length: 5 }).map((_, i) => <OrderSkeleton key={i} />)
        ) : orders.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: 60,
              color: 'var(--text-secondary)',
              background: 'white',
              borderRadius: 16,
              boxShadow: 'var(--shadow)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>暂无订单</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>客户提交的定制订单将在这里显示</div>
          </div>
        ) : (
          orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              onUpdateStep={(stepId, status, assignee) =>
                handleUpdateStep(order.id, stepId, status, assignee)
              }
              onStatusChange={(s) => handleStatusChange(order.id, s)}
            />
          ))
        )}
      </div>

      {orders.length > 0 && totalPages > 1 && (
        <div className="pagination">
          <button
            className="page-btn"
            disabled={ordersPage <= 1 || loading.orders}
            onClick={() => loadOrders(ordersPage - 1, filter)}
          >
            ‹
          </button>
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let page =
              totalPages <= 5
                ? i + 1
                : ordersPage <= 3
                  ? i + 1
                  : ordersPage >= totalPages - 2
                    ? totalPages - 4 + i
                    : ordersPage - 2 + i
            if (page < 1 || page > totalPages) return null
            return (
              <button
                key={page}
                className={`page-btn ${ordersPage === page ? 'active' : ''}`}
                disabled={loading.orders}
                onClick={() => loadOrders(page, filter)}
              >
                {page}
              </button>
            )
          })}
          <button
            className="page-btn"
            disabled={ordersPage >= totalPages || loading.orders}
            onClick={() => loadOrders(ordersPage + 1, filter)}
          >
            ›
          </button>
          <span className="page-info">
            共 {ordersTotal} 条 · 第 {ordersPage}/{totalPages} 页
          </span>
        </div>
      )}
    </div>
  )
}

function MaterialsPanel() {
  const { materials, warningMaterials, warningCount, addToast, setMaterials, setLoading, loading } =
    useAppStore()

  const [viewMode, setViewMode] = useState<'warning' | 'all'>('warning')
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async () => {
    setLoading('materials', true)
    try {
      const res = await materialsApi.getList()
      setMaterials(res.materials, res.warnings, res.warningCount)
    } catch (e) {
      addToast('error', '加载库存数据失败')
    } finally {
      setLoading('materials', false)
    }
  }, [setMaterials, setLoading, addToast])

  useEffect(() => {
    if (materials.length === 0) load()
  }, [materials.length, load])

  useEffect(() => {
    if (viewMode === 'warning') {
      setSelectedIds(new Set(warningMaterials.map((m) => m.id)))
    }
  }, [warningMaterials, viewMode])

  const displayList = viewMode === 'warning' ? warningMaterials : materials

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === displayList.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(displayList.map((m) => m.id)))
    }
  }

  const handleExport = async () => {
    if (selectedIds.size === 0) {
      addToast('error', '请先选择需要采购的材料')
      return
    }
    setExporting(true)
    try {
      await materialsApi.exportCSV(Array.from(selectedIds))
      addToast('success', `采购单已生成（${selectedIds.size}项）`)
    } catch (e) {
      addToast('error', '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const getStockClass = (m: Material) => {
    const ratio = m.current_stock / m.threshold
    if (ratio < 0.5) return 'danger'
    if (ratio < 1) return 'warning'
    return 'ok'
  }

  const suggestedAmount = (m: Material) => {
    const deficit = Math.max(0, m.threshold - m.current_stock)
    const safety = m.consumption_30d * 1.5
    return Math.ceil((deficit + safety) * 10) / 10
  }

  const allSelected = displayList.length > 0 && selectedIds.size === displayList.length

  return (
    <div className="fade-in-up">
      <div className="page-header">
        <div>
          <div className="page-title">库存预警中心</div>
          <div className="page-subtitle">
            自动监控泥料釉料库存 · 智能计算补货建议
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div className="tabs" style={{ marginBottom: 0 }}>
            <div
              className={`tab ${viewMode === 'warning' ? 'active' : ''}`}
              onClick={() => setViewMode('warning')}
            >
              仅预警 ({warningCount})
            </div>
            <div
              className={`tab ${viewMode === 'all' ? 'active' : ''}`}
              onClick={() => setViewMode('all')}
            >
              全部材料
            </div>
          </div>
          <button className="btn btn-secondary btn-sm ripple-btn" onClick={load}>
            🔄 刷新
          </button>
        </div>
      </div>

      {warningCount > 0 && viewMode === 'warning' && (
        <div
          style={{
            padding: '16px 20px',
            borderRadius: 14,
            background: 'linear-gradient(135deg, #FFF3E0, #FFE0B2)',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            border: '1px solid #FFCC80',
          }}
        >
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, color: '#E65100', fontSize: 15 }}>
              有 {warningCount} 种材料库存低于警戒线
            </div>
            <div style={{ fontSize: 13, color: '#EF6C00', marginTop: 2 }}>
              建议及时补货以免影响订单制作，可勾选下方材料后一键生成采购单
            </div>
          </div>
        </div>
      )}

      <div className="warning-panel">
        <div className="warning-panel-header">
          <div className="warning-panel-title">
            📦 {viewMode === 'warning' ? '库存预警清单' : '材料库存总览'}
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                background: 'white',
                padding: '4px 10px',
                borderRadius: 12,
                marginLeft: 8,
              }}
            >
              共 {displayList.length} 项
            </span>
          </div>
        </div>

        {loading.materials && displayList.length === 0 ? (
          <div style={{ padding: 40 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 60, marginBottom: 12 }} />
            ))}
          </div>
        ) : displayList.length === 0 ? (
          <div
            style={{
              padding: 60,
              textAlign: 'center',
              color: 'var(--text-secondary)',
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#2E7D32' }}>库存状态良好！</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>暂无低于警戒线的材料</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="warning-table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <div
                      className={`checkbox ${allSelected ? 'checked' : ''}`}
                      onClick={toggleSelectAll}
                    >
                      {allSelected ? '✓' : ''}
                    </div>
                  </th>
                  <th>材料名称</th>
                  <th>类型</th>
                  <th>当前库存</th>
                  <th>警戒阈值</th>
                  <th>近30天消耗</th>
                  <th>建议补货量</th>
                </tr>
              </thead>
              <tbody>
                {displayList.map((m) => {
                  const ratio = m.current_stock / m.threshold
                  const pct = Math.min(100, Math.round(ratio * 100))
                  return (
                    <tr key={m.id}>
                      <td>
                        <div
                          className={`checkbox ${selectedIds.has(m.id) ? 'checked' : ''}`}
                          onClick={() => toggleSelect(m.id)}
                        >
                          {selectedIds.has(m.id) ? '✓' : ''}
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-dark)' }}>
                        {m.name}
                      </td>
                      <td>
                        <span className={`material-tag material-${m.type}`}>
                          {m.type === 'clay' ? '泥料' : '釉料'}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {m.current_stock} {m.unit}
                        </div>
                        <div className="stock-bar">
                          <div
                            className={`stock-bar-fill ${getStockClass(m)}`}
                            style={{ width: pct + '%' }}
                          />
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {m.threshold} {m.unit}
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {m.consumption_30d} {m.unit}
                      </td>
                      <td>
                        <span className="suggestion-amount">
                          ≈ {suggestedAmount(m)} {m.unit}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {displayList.length > 0 && (
          <div className="warning-panel-footer">
            <div className="selection-count">
              已选择 <strong style={{ color: 'var(--primary-dark)' }}>{selectedIds.size}</strong> 项材料
              {selectedIds.size > 0 && (
                <span style={{ marginLeft: 8, color: 'var(--text-light)' }}>
                  建议补货总量约{' '}
                  {Array.from(selectedIds)
                    .reduce(
                      (sum, id) =>
                        sum + (suggestedAmount(displayList.find((m) => m.id === id)!) || 0),
                      0
                    )
                    .toFixed(1)}{' '}
                  单位
                </span>
              )}
            </div>
            <button
              className="btn btn-primary ripple-btn"
              disabled={exporting || selectedIds.size === 0}
              onClick={handleExport}
            >
              {exporting ? '生成中...' : '📄 一键生成采购单 (CSV)'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function WorkshopDashboard({ tab }: { tab: 'orders' | 'materials' }) {
  return tab === 'materials' ? <MaterialsPanel /> : <OrdersPanel />
}
