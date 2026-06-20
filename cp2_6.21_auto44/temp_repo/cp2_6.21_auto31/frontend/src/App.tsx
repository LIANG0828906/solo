import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './modules/auth/AuthContext'
import Header from './components/Header'
import HomePage from './pages/HomePage'
import TeacherDetailPage from './pages/TeacherDetailPage'
import MyBookingsPage from './pages/MyBookingsPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import TeacherSlotsPage from './pages/TeacherSlotsPage'
import TeacherReviewsPage from './pages/TeacherReviewsPage'

function PrivateRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { isAuthenticated, user } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />
  }
  
  return <>{children}</>
}

function App() {
  return (
    <div className="app">
      <Header />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/teachers/:id" element={<TeacherDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/my-bookings"
            element={
              <PrivateRoute>
                <MyBookingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/slots"
            element={
              <PrivateRoute requiredRole="teacher">
                <TeacherSlotsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher/reviews"
            element={
              <PrivateRoute requiredRole="teacher">
                <TeacherReviewsPage />
              </PrivateRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
