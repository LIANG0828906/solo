import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import WelcomePage from './pages/WelcomePage'
import RoutePlanner from './pages/RoutePlanner'
import TeamTracker from './pages/TeamTracker'
import MemberJoinPage from './pages/MemberJoinPage'
import { useRouteStore } from './stores/routeStore'
import { useTeamStore } from './stores/teamStore'

function App() {
  const { currentRoute } = useRouteStore()
  const { currentMember } = useTeamStore()

  return (
    <div className="app">
      <Navbar />
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/planner/:routeId" element={<RoutePlanner />} />
        <Route path="/tracker/:routeId" element={<TeamTracker />} />
        <Route path="/join/:routeCode" element={<MemberJoinPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {currentRoute && currentMember && <MemberSelfBar />}
    </div>
  )
}

function MemberSelfBar() {
  const { currentMember, error } = useTeamStore()
  if (!currentMember) return null

  const statusLabels: Record<string, { label: string; cls: string }> = {
    moving: { label: '行进中', cls: 'status-moving' },
    resting: { label: '休息中', cls: 'status-resting' },
    trouble: { label: '遇到困难', cls: 'status-trouble' },
  }

  return (
    <>
      <div className="member-self-bar">
        <div>
          <strong style={{ fontSize: 14 }}>{currentMember.name}</strong>
          <span className="coord-readout" style={{ marginLeft: 12 }}>
            {currentMember.lat.toFixed(4)}, {currentMember.lng.toFixed(4)}
          </span>
        </div>
        <span
          className={`status-tag ${statusLabels[currentMember.status].cls}`}
        >
          {statusLabels[currentMember.status].label}
        </span>
      </div>
      {error && error.includes('位置同步失败') && (
        <div className="sync-error">⚠️ {error}</div>
      )}
    </>
  )
}

export default App
