import { useState, useEffect } from 'react'
import RiskDashboard from './components/RiskDashboard'
import DepartmentDetail from './components/DepartmentDetail'
import { DepartmentSummary, DepartmentDetail as DepartmentDetailType, EmployeeDetail, riskApi } from './api/riskApi'

type View =
  | { type: 'dashboard' }
  | { type: 'department'; departmentId: string }

function App() {
  const [view, setView] = useState<View>({ type: 'dashboard' })
  const [departments, setDepartments] = useState<DepartmentSummary[]>([])
  const [currentDepartment, setCurrentDepartment] = useState<DepartmentDetailType | null>(null)
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await riskApi.getRiskSummary()
      setDepartments(data)
    } catch (err) {
      setError('加载数据失败，请刷新页面重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDepartmentClick = async (departmentId: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await riskApi.getDepartmentDetail(departmentId)
      setCurrentDepartment(data)
      setView({ type: 'department', departmentId })
    } catch (err) {
      setError('加载部门详情失败')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    setView({ type: 'dashboard' })
    setCurrentDepartment(null)
    setSelectedEmployee(null)
  }

  const handleEmployeeClick = async (employeeId: string) => {
    try {
      const data = await riskApi.getEmployeeDetail(employeeId)
      setSelectedEmployee(data)
    } catch (err) {
      console.error('加载员工详情失败')
    }
  }

  const handleCloseEmployee = () => {
    setSelectedEmployee(null)
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>员工离职影响预警与分析系统</h1>
        <p>通过多维度数据分析，提前识别离职风险员工，助力主动管理</p>
      </header>

      <main className="app-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <div>正在加载数据...</div>
          </div>
        ) : error ? (
          <div className="error-state">
            <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
            <div>{error}</div>
          </div>
        ) : view.type === 'dashboard' ? (
          <RiskDashboard
            departments={departments}
            onDepartmentClick={handleDepartmentClick}
          />
        ) : currentDepartment ? (
          <DepartmentDetail
            department={currentDepartment}
            onBack={handleBack}
            onEmployeeClick={handleEmployeeClick}
            selectedEmployee={selectedEmployee}
            onCloseEmployee={handleCloseEmployee}
          />
        ) : null}
      </main>
    </div>
  )
}

export default App
