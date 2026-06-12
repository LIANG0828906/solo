import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { X } from 'lucide-react'
import Navbar from '@/components/Navbar'
import FrontPage from '@/pages/FrontPage'
import OrdersPage from '@/pages/OrdersPage'
import GlazesPage from '@/pages/GlazesPage'
import KilnPage from '@/pages/KilnPage'
import InventoryPage from '@/pages/InventoryPage'
import { useAppStore } from '@/stores/useAppStore'

function WarningBanners() {
  const { warnings, dismissWarning, isWarningDismissed } = useAppStore()
  const visibleWarnings = warnings.filter((w) => !isWarningDismissed(w.id))

  if (visibleWarnings.length === 0) return null

  return (
    <div className="fixed top-16 left-0 right-0 z-40 space-y-2 p-4 animate-fade-in">
      {visibleWarnings.map((warning) => (
        <div
          key={warning.id}
          className="max-w-5xl mx-auto bg-warn-red text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between"
        >
          <span className="text-sm font-medium">
            {warning.materialName}库存不足（剩余 {warning.currentStock}g，阈值 {warning.minThreshold}g），请及时采购。
          </span>
          <button
            onClick={() => dismissWarning(warning.id)}
            className="p-1 hover:bg-white/20 rounded transition-colors"
            aria-label="关闭警告"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function App() {
  const loadAllData = useAppStore((s) => s.loadAllData)

  useEffect(() => {
    loadAllData()
  }, [loadAllData])

  return (
    <Router>
      <div className="min-h-screen bg-rice-white">
        <Navbar />
        <WarningBanners />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Navigate to="/orders" replace />} />
            <Route path="/front" element={<FrontPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/glazes" element={<GlazesPage />} />
            <Route path="/kiln" element={<KilnPage />} />
            <Route path="/inventory" element={<InventoryPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}
