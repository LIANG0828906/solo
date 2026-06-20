import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Detail from './pages/Detail'
import Goal from './pages/Goal'
import './styles.css'
import '@fortawesome/fontawesome-free/css/all.min.css'
import { useUserStore } from './store/userStore'
import { useEffect } from 'react'

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loadFromStorage } = useUserStore()

  useEffect(() => {
    loadFromStorage()
  }, [loadFromStorage])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Auth />} />
      <Route path="/" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/detail/:type" element={
        <ProtectedRoute>
          <Detail />
        </ProtectedRoute>
      } />
      <Route path="/goal" element={
        <ProtectedRoute>
          <Goal />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
)
