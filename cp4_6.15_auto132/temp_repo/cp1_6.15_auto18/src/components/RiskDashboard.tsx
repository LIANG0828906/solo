import { useState, useRef, useEffect } from 'react'
import { DepartmentSummary } from '../api/riskApi'

interface RiskDashboardProps {
  departments: DepartmentSummary[]
  onDepartmentClick: (departmentId: string) => void
}

const getTrendIcon = (trend: string) => {
  switch (trend) {
    case 'up':
      return '↑'
    case 'down':
      return '↓'
    default:
      return '→'
  }
}

const getTrendText = (trend: string) => {
  switch (trend) {
    case 'up':
      return '上升'
    case 'down':
      return '下降'
    default:
      return '持平'
  }
}

const getRiskLevelText = (level: string) => {
  switch (level) {
    case 'low':
      return '低风险'
    case 'medium':
      return '中风险'
    case 'high':
      return '高风险'
    default:
      return '未知'
  }
}

function RiskDashboard({ departments, onDepartmentClick }: RiskDashboardProps) {
  const prevDataRef = useRef<string>('')
  const [animationKey, setAnimationKey] = useState<number>(0)

  useEffect(() => {
    const currentSig = JSON.stringify(departments.map((d) => ({
      id: d.id,
      riskLevel: d.riskLevel,
      riskCount: d.riskCount,
      trend: d.trend
    })))

    if (prevDataRef.current !== currentSig) {
      prevDataRef.current = currentSig
      setAnimationKey((prev) => prev + 1)
    }
  }, [departments])

  return (
    <div>
      <h2 className="section-title">
        <span>📊</span>
        各部门风险概况
      </h2>

      <div className="dashboard-grid" key={animationKey}>
        {departments.map((dept, index) => (
          <div
            key={dept.id}
            className="department-card"
            style={{ animationDelay: `${index * 50}ms` }}
            onClick={() => onDepartmentClick(dept.id)}
          >
            <div className="card-header">
              <div className="department-name">{dept.name}</div>
              <span className={`risk-badge ${dept.riskLevel}`}>
                {getRiskLevelText(dept.riskLevel)}
              </span>
            </div>

            <div className="card-stats">
              <div>
                <div className="risk-count">{dept.riskCount}</div>
                <div className="risk-count-label">风险员工数</div>
              </div>
              <div className={`trend-indicator ${dept.trend}`}>
                <span>{getTrendIcon(dept.trend)}</span>
                <span>{getTrendText(dept.trend)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RiskDashboard
