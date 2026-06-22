import { useState, useEffect, useMemo } from 'react'
import { User, PurchaseRecord, Coupon } from '../types'
import { api } from '../api'
import CouponCard from '../components/CouponCard'

interface UserDashboardProps {
  user: User
}

interface DailyData {
  date: string
  amount: number
}

function aggregateDailyData(records: PurchaseRecord[]): DailyData[] {
  const map = new Map<string, number>()
  const today = new Date()
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    map.set(dateStr, 0)
  }
  
  for (const record of records) {
    const current = map.get(record.date) || 0
    map.set(record.date, current + record.amount)
  }
  
  return Array.from(map.entries()).map(([date, amount]) => ({ date, amount }))
}

function LineChart({ data }: { data: DailyData[] }) {
  const width = 760
  const height = 280
  const padding = { top: 20, right: 20, bottom: 40, left: 50 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const maxAmount = Math.max(...data.map(d => d.amount), 100)
  const xStep = chartWidth / (data.length - 1)

  const points = data.map((d, i) => {
    const x = padding.left + i * xStep
    const y = padding.top + chartHeight - (d.amount / maxAmount) * chartHeight
    return { x, y, amount: d.amount, date: d.date }
  })

  const pathD = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ')

  const yTicks = 5
  const yTickValues = Array.from({ length: yTicks + 1 }, (_, i) => Math.round((maxAmount / yTicks) * i))

  const xLabelCount = 6
  const xLabelInterval = Math.ceil(data.length / xLabelCount)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="line-chart">
      {yTickValues.map((value, i) => {
        const y = padding.top + chartHeight - (value / maxAmount) * chartHeight
        return (
          <g key={i}>
            <line
              x1={padding.left}
              y1={y}
              x2={width - padding.right}
              y2={y}
              stroke="#f0f0f0"
              strokeDasharray="4,4"
            />
            <text
              x={padding.left - 8}
              y={y + 4}
              textAnchor="end"
              fontSize="11"
              fill="#999"
            >
              ¥{value}
            </text>
          </g>
        )
      })}

      <path
        d={pathD}
        fill="none"
        stroke="#722ed1"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="5" fill="#fff" stroke="#722ed1" strokeWidth="2.5" />
          <title>{`${p.date}: ¥${p.amount}`}</title>
        </g>
      ))}

      {data.map((d, i) => {
        if (i % xLabelInterval !== 0 && i !== data.length - 1) return null
        const x = padding.left + i * xStep
        const dateStr = d.date.slice(5)
        return (
          <text
            key={i}
            x={x}
            y={height - padding.bottom + 20}
            textAnchor="middle"
            fontSize="11"
            fill="#999"
          >
            {dateStr}
          </text>
        )
      })}

      <text
        x={padding.left - 38}
        y={padding.top - 6}
        fontSize="11"
        fill="#666"
      >
        金额
      </text>
      <text
        x={width - padding.right}
        y={height - 6}
        fontSize="11"
        fill="#666"
        textAnchor="end"
      >
        日期
      </text>
    </svg>
  )
}

function UserDashboard({ user }: UserDashboardProps) {
  const [purchases, setPurchases] = useState<PurchaseRecord[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [purchaseAmount, setPurchaseAmount] = useState('')
  const [purchaseCategory, setPurchaseCategory] = useState('食品')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const loadData = () => {
    api.getUserPurchases(user.id, 30).then(setPurchases)
    api.getUserCoupons(user.id).then(setCoupons)
  }

  useEffect(() => {
    loadData()
  }, [user.id])

  const dailyData = useMemo(() => aggregateDailyData(purchases), [purchases])
  const totalAmount = useMemo(() => purchases.reduce((sum, r) => sum + r.amount, 0), [purchases])
  
  const availableCoupons = useMemo(() => 
    coupons.filter(c => {
      const isExpired = new Date(c.expireTime) < new Date()
      return !c.used && !isExpired
    }),
    [coupons]
  )

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 2500)
  }

  const handleAddPurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    const amount = Number(purchaseAmount)
    if (!amount || amount <= 0) {
      showToast('请输入有效金额', 'error')
      return
    }

    try {
      const result = await api.createPurchase(user.id, {
        amount,
        category: purchaseCategory
      })
      showToast(
        result.coupon 
          ? `消费成功！获得优惠券：${result.coupon.activityName}` 
          : '消费记录已添加',
        'success'
      )
      setPurchaseAmount('')
      loadData()
    } catch (err: any) {
      showToast(err.message || '添加失败', 'error')
    }
  }

  const handleUseCoupon = async (couponId: string) => {
    try {
      await api.useCoupon(couponId)
      showToast('优惠券使用成功', 'success')
      loadData()
    } catch (err: any) {
      showToast(err.message || '使用失败', 'error')
      loadData()
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h2>
          <span className="user-avatar-large">{user.avatar}</span>
          {user.name} 的仪表盘
        </h2>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">近30天消费总额</div>
          <div className="stat-value">¥{totalAmount.toFixed(2)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">近30天消费次数</div>
          <div className="stat-value">{purchases.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">可用优惠券</div>
          <div className="stat-value highlight">{availableCoupons.length}</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>近30天消费趋势</h3>
        </div>
        <div className="chart-container">
          <LineChart data={dailyData} />
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>模拟消费（触发优惠券发放）</h3>
        </div>
        <form className="purchase-form" onSubmit={handleAddPurchase}>
          <div className="form-group inline">
            <label>消费金额</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={purchaseAmount}
              onChange={e => setPurchaseAmount(e.target.value)}
              placeholder="输入消费金额"
            />
          </div>
          <div className="form-group inline">
            <label>消费品类</label>
            <select value={purchaseCategory} onChange={e => setPurchaseCategory(e.target.value)}>
              <option value="食品">食品</option>
              <option value="日用品">日用品</option>
              <option value="饮料">饮料</option>
              <option value="生鲜">生鲜</option>
              <option value="零食">零食</option>
              <option value="洗护">洗护</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            记录消费
          </button>
        </form>
        <p className="form-hint">提示：当消费金额达到满减活动门槛时，将自动获得对应的优惠券</p>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>待使用优惠券</h3>
          <span className="badge">{availableCoupons.length} 张</span>
        </div>
        {availableCoupons.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎟️</div>
            <p>暂无可用优惠券</p>
            <p className="empty-hint">尝试记录一笔消费来获得优惠券吧！</p>
          </div>
        ) : (
          <div className="coupon-grid">
            {availableCoupons.map(coupon => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                onUse={handleUseCoupon}
              />
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}

export default UserDashboard
