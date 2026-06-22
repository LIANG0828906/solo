import { useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { useDashboardStore } from './store/useDashboardStore'
import './index.css'

const POLL_INTERVAL = 30000

function App() {
  const { fetchData } = useDashboardStore()

  useEffect(() => {
    fetchData()

    const interval = setInterval(() => {
      fetchData()
    }, POLL_INTERVAL)

    return () => clearInterval(interval)
  }, [fetchData])

  return (
    <div className="app">
      <Dashboard />
    </div>
  )
}

export default App
