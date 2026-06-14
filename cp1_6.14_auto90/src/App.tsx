import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Workbench from '@/pages/Workbench'
import WeeklyReport from '@/pages/WeeklyReport'
import SettingsPage from '@/pages/SettingsPage'
import Navigation from '@/components/Navigation'
import GlobalLoading from '@/components/GlobalLoading'
import Toasts from '@/components/Toasts'
import { useAppStore } from '@/store/app'
import { bootstrap } from '@/lib/api'

function Shell() {
  const {
    setTasks,
    setHabits,
    setTimerSessions,
    setSettings,
    setLoading,
    loading,
    pushToast,
  } = useAppStore()
  const [fading, setFading] = useState(false)

  useEffect(() => {
    let mounted = true
    bootstrap()
      .then((data) => {
        if (!mounted) return
        setTasks(data.tasks)
        setHabits(data.habits)
        setTimerSessions(data.timerSessions)
        setSettings(data.settings)
        setFading(true)
        setTimeout(() => setLoading(false), 320)
      })
      .catch(() => {
        pushToast('数据加载失败，请刷新页面', 'error')
        setFading(true)
        setTimeout(() => setLoading(false), 320)
      })
    return () => {
      mounted = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="flex h-full min-h-screen flex-col bg-soft-bg">
      <Navigation />
      <main className="min-h-0 flex-1">
        <Routes>
          <Route path="/" element={<Workbench />} />
          <Route path="/weekly" element={<WeeklyReport />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <Toasts />
      {loading && <GlobalLoading fadingOut={fading} />}
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Shell />
    </Router>
  )
}
