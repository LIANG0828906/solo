import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './pages/HomePage'
import ItemDetail from './pages/ItemDetail'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import PublishPage from './pages/PublishPage'
import ProfilePage from './pages/ProfilePage'
import ExchangeRequestsPage from './pages/ExchangeRequestsPage'
import { useAuth } from './context/AuthContext'

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}>
        <div className="spinner spinner-primary" style={{ width: 40, height: 40 }} />
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/login" replace />
}

const App: React.FC = () => {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/publish"
            element={
              <PrivateRoute>
                <PublishPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/exchange-requests"
            element={
              <PrivateRoute>
                <ExchangeRequestsPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

export default App
