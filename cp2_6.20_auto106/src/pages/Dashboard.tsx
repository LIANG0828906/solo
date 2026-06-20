import { useEffect, useState } from 'react'
import {
  StockOutlined,
  WarningOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  HistoryOutlined,
} from '@ant-design/icons'
import { useInventoryStore } from '@/stores/inventoryStore'
import type { DashboardStats, StockRecord } from '@/types'
import dayjs from 'dayjs'
import axios from 'axios'

const StatCard = ({
  icon: Icon,
  title,
  value,
  suffix,
  color,
}: {
  icon: any
  title: string
  value: number
  suffix?: string
  color: string
}) => (
  <div className="card fade-in" style={{ padding: 24, flex: 1, minWidth: 200 }}>
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontSize: 14, color: '#8c8c8c', marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 36, fontWeight: 700, color }}>
          {value.toLocaleString()}
          {suffix && <span style={{ fontSize: 16, marginLeft: 4 }}>{suffix}</span>}
        </div>
      </div>
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon style={{ fontSize: 24, color }} />
      </div>
    </div>
  </div>
)

const SkeletonCard = () => (
  <div className="card" style={{ padding: 24, flex: 1, minWidth: 200 }}>
    <div className="skeleton" style={{ width: 80, height: 16, marginBottom: 12 }} />
    <div className="skeleton" style={{ width: 120, height: 36 }} />
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentRecords, setRecentRecords] = useState<StockRecord[]>([])
  const [loading, setLoading] = useState(true)
  const alertCount = useInventoryStore((state) => state.alertCount)
  const fetchRecords = useInventoryStore((state) => state.fetchRecords)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [statsRes, recordsRes] = await Promise.all([
          axios.get<DashboardStats>('/api/dashboard/stats'),
          axios.get<StockRecord[]>('/api/inventory/records?limit=7'),
        ])
        setStats(statsRes.data)
        setRecentRecords(recordsRes.data)
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    fetchRecords()

    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [fetchRecords, alertCount])

  const PageTitle = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div style={{ marginBottom: 24 }}>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          paddingLeft: 12,
          borderLeft: '4px solid #0050b3',
          marginBottom: subtitle ? 4 : 0,
        }}
      >
        {title}
      </h1>
      {subtitle && <p style={{ color: '#8c8c8c', fontSize: 14, marginLeft: 16 }}>{subtitle}</p>}
    </div>
  )

  return (
    <div>
      <PageTitle title="总览仪表盘" subtitle="实时监控实验室耗材库存状态" />

      <div style={{ display: 'flex', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              icon={StockOutlined}
              title="总库存量"
              value={stats?.totalStock || 0}
              suffix="件"
              color="#0050b3"
            />
            <StatCard
              icon={WarningOutlined}
              title="低预警数量"
              value={alertCount}
              color="#f5222d"
            />
            <StatCard
              icon={ArrowUpOutlined}
              title="今日入库"
              value={stats?.todayInCount || 0}
              suffix="件"
              color="#52c41a"
            />
            <StatCard
              icon={ArrowDownOutlined}
              title="今日出库"
              value={stats?.todayOutCount || 0}
              suffix="件"
              color="#faad14"
            />
          </>
        )}
      </div>

      <div className="card fade-in" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
          <HistoryOutlined style={{ fontSize: 18, color: '#0050b3' }} />
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>最近出入库记录</h2>
        </div>

        {loading ? (
          <div>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{ padding: '12px 0', borderBottom: i < 5 ? '1px solid #f5f5f5' : 'none' }}>
                <div className="skeleton" style={{ width: 200, height: 16, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: 120, height: 12 }} />
              </div>
            ))}
          </div>
        ) : recentRecords.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>
            暂无记录
          </div>
        ) : (
          <div>
            {recentRecords.map((record) => (
              <div
                key={record.id}
                className={`timeline-item ${record.type}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <span className={`tag ${record.type === 'in' ? 'tag-green' : 'tag-red'}`}>
                        {record.type === 'in' ? '入库' : '出库'}
                      </span>
                      <span style={{ fontWeight: 500, fontSize: 14 }}>{record.consumableName}</span>
                    </div>
                    <div style={{ fontSize: 13, color: '#8c8c8c' }}>
                      数量: <span style={{ color: record.type === 'in' ? '#52c41a' : '#f5222d', fontWeight: 500 }}>
                        {record.type === 'in' ? '+' : '-'}{record.quantity}
                      </span>
                      {record.remark && <span style={{ marginLeft: 8 }}>· {record.remark}</span>}
                    </div>
                  </div>
                  <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                    {dayjs(record.timestamp).format('MM-DD HH:mm')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
