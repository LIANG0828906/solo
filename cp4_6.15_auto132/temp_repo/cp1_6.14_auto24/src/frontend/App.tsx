import React, { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import MapPage from './pages/MapPage'
import ChatPage from './pages/ChatPage'
import UploadPage from './pages/UploadPage'
import BookDetailPage from './pages/BookDetailPage'
import LoginPage from './pages/LoginPage'

const App: React.FC = () => {
  const { checkAuth, loading } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-cream">
        <div className="text-brown font-serif text-xl">加载中...</div>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<MapPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/upload" element={<UploadPage />} />
      <Route path="/book/:id" element={<BookDetailPage />} />
      <Route path="/chat/:id" element={<ChatPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
