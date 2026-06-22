import React, { useEffect, useState, useCallback, createContext, useContext } from 'react'
import { Routes, Route, Navigate, NavLink, useLocation } from 'react-router-dom'
import { FileText, BarChart3, CheckCircle, Receipt, X } from 'lucide-react'
import { useInvoiceStore } from '@/store/invoiceStore'
import InvoiceList from '@/pages/InvoiceList'
import InvoiceDetail from '@/pages/InvoiceDetail'
import Statistics from '@/pages/Statistics'

interface ToastItem {
  id: string
  message: string
  visible: boolean
}

interface ToastContextType {
  showToast: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within ToastProvider')
  }
  return context
}

function App() {
  const location = useLocation()
  const { loadInvoices, storageError, setStorageError } = useInvoiceStore()
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    loadInvoices()
  }, [loadInvoices])

  const showToast = useCallback((message: string) => {
    const id = Math.random().toString(36).substring(2, 11)
    setToasts((prev) => [...prev, { id, message, visible: true }])

    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, visible: false } : t))
      )
    }, 2000)

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <aside className="sidebar">
          <div className="sidebar-logo">
            <Receipt size={22} />
            <span>InvoiceHub</span>
          </div>
          <nav className="sidebar-nav">
            <NavLink
              to="/invoices"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <FileText className="sidebar-icon" />
              <span>发票管理</span>
            </NavLink>
            <NavLink
              to="/statistics"
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <BarChart3 className="sidebar-icon" />
              <span>统计分析</span>
            </NavLink>
          </nav>
        </aside>

        <main className="main-content">
          <div key={location.key} className="page-enter">
            <Routes location={location}>
              <Route path="/" element={<Navigate to="/invoices" replace />} />
              <Route path="/invoices" element={<InvoiceList />} />
              <Route path="/invoices/new" element={<InvoiceDetail />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/statistics" element={<Statistics />} />
            </Routes>
          </div>
        </main>

        {storageError && (
          <div className="storage-alert">
            <span>数据存储异常，请检查浏览器设置</span>
            <button onClick={() => setStorageError(false)}>
              <X size={16} />
            </button>
          </div>
        )}

        <div className="toast-container">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast ${toast.visible ? 'show' : 'hide'}`}
            >
              <CheckCircle size={16} />
              <span>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  )
}

export default App
