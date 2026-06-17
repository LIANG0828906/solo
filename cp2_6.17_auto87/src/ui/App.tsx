import React, { lazy, Suspense, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useStore } from '../data/store'

const ActivityList = lazy(() => import('./pages/ActivityList'))
const ActivityDetail = lazy(() => import('./pages/ActivityDetail'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const AdminStatistics = lazy(() => import('./pages/AdminStatistics'))

function LoadingFallback() {
  return (
    <div className="loading-container">
      <div className="loading-spinner" />
    </div>
  )
}

function App() {
  const initData = useStore((state) => state.initData)

  useEffect(() => {
    initData()
  }, [initData])

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<ActivityList />} />
          <Route path="/activity/:id" element={<ActivityDetail />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/statistics" element={<AdminStatistics />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
