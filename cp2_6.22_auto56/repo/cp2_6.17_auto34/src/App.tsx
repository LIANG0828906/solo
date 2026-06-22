import React, { useEffect } from 'react'
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import SignaturePad from '@/modules/signing/SignaturePad'
import ReportDashboard from '@/modules/reports/ReportDashboard'
import { useSignStore } from '@/stores/signStore'

const AppInitializer: React.FC = () => {
  const initStore = useSignStore((s) => s.initStore)
  useEffect(() => {
    initStore()
  }, [initStore])
  return null
}

const TopNav: React.FC = () => {
  const location = useLocation()
  const isSigning = location.pathname === '/signing' || location.pathname === '/'

  return (
    <nav style={navStyle(isSigning)}>
      <a href="#/signing" style={tabStyle(isSigning)}>签收管理</a>
      <a href="#/reports" style={tabStyle(!isSigning)}>查询报告</a>
    </nav>
  )
}

const navStyle = (isSigning: boolean): React.CSSProperties => ({
  display: isSigning ? 'flex' : 'none',
  justifyContent: 'center',
  padding: '10px 16px',
  background: 'linear-gradient(135deg, #1565C0 0%, #1E88E5 100%)',
  gap: '8px',
  position: 'sticky',
  top: 0,
  zIndex: 100,
  boxShadow: '0 2px 8px rgba(21, 101, 192, 0.2)',
  fontFamily: 'system-ui, -apple-system, "PingFang SC", sans-serif',
})

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '8px 20px',
  borderRadius: '6px',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.3s ease',
  background: active ? '#FFFFFF' : 'rgba(255,255,255,0.15)',
  color: active ? '#1565C0' : 'rgba(255,255,255,0.9)',
})

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppInitializer />
      <TopNav />
      <Routes>
        <Route path="/" element={<Navigate to="/signing" replace />} />
        <Route path="/signing" element={<SignaturePad />} />
        <Route path="/reports" element={<ReportDashboard />} />
        <Route path="*" element={<Navigate to="/signing" replace />} />
      </Routes>
    </HashRouter>
  )
}

export default App
