import { useEffect } from 'react'
import { useStore } from '@/store'
import HealthDashboard from '@/components/HealthDashboard'

export default function DashboardPage() {
  const { healthAnalysis, fetchHealthAnalysis } = useStore()

  useEffect(() => {
    fetchHealthAnalysis()
  }, [fetchHealthAnalysis])

  if (!healthAnalysis) {
    return (
      <div className="max-w-6xl mx-auto px-6 py-8 text-center" style={{ color: '#94a3b8' }}>
        加载中...
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      <h1
        className="mb-6 animate-fade-in-up opacity-0"
        style={{ fontSize: 24, fontWeight: 700, color: '#166534', margin: '0 0 24px' }}
      >
        健康看板
      </h1>
      <HealthDashboard data={healthAnalysis} />
    </div>
  )
}
