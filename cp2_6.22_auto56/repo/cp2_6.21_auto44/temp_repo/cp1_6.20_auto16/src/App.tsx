import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import Login from '@/components/Login'
import Register from '@/components/Register'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Lobby from '@/pages/Lobby'
import Room from '@/pages/Room'
import Result from '@/pages/Result'

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={<Navigate to="/lobby" replace />} />
          
          <Route element={<Layout />}>
            <Route
              path="/lobby"
              element={
                <ProtectedRoute>
                  <Lobby />
                </ProtectedRoute>
              }
            />
            <Route
              path="/room/:roomId"
              element={
                <ProtectedRoute>
                  <Room />
                </ProtectedRoute>
              }
            />
            <Route
              path="/result/:roomId"
              element={
                <ProtectedRoute>
                  <Result />
                </ProtectedRoute>
              }
            />
          </Route>
          
          <Route path="*" element={<Navigate to="/lobby" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}
