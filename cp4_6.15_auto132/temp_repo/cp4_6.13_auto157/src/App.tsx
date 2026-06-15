import React, { useState, useCallback } from 'react'
import UploadPanel, { ParsedTransaction } from './components/UploadPanel'
import Dashboard from './components/Dashboard'

function App() {
  const [importSuccess, setImportSuccess] = useState(false)
  const [dashboardKey, setDashboardKey] = useState(0)
  const [toastMsg, setToastMsg] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(null), 3000)
  }, [])

  const handleImport = useCallback(async (data: ParsedTransaction[]) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      const result = await res.json()
      if (result.success) {
        setImportSuccess(true)
        setDashboardKey(k => k + 1)
        showToast(`成功导入 ${result.count} 条数据`)
      } else {
        showToast(`导入失败：${result.error || '未知错误'}`)
      }
    } catch (e) {
      console.error(e)
      showToast('导入失败：网络错误，请检查后端服务是否启动')
    }
  }, [showToast])

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>💰 个人财务数据分析</h1>
            <p style={styles.subtitle}>上传银行流水，多维度洞察消费结构与趋势</p>
          </div>
          {importSuccess && (
            <div style={styles.successBadge}>
              <span style={{ marginRight: 6 }}>✓</span>数据已导入
            </div>
          )}
        </header>

        <div style={styles.mainContent}>
          <UploadPanel onImport={handleImport} />
        </div>

        <Dashboard key={dashboardKey} />
      </div>

      {toastMsg && (
        <div style={styles.toast}>
          {toastMsg}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes toastSlide {
          0% { opacity: 0; transform: translate(-50%, -20px); }
          100% { opacity: 1; transform: translate(-50%, 0); }
        }
        body {
          margin: 0;
          background: #f9f9f9;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
            'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
          color: #333;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }
        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f9f9f9',
    padding: '24px 0 48px'
  } as React.CSSProperties,
  container: {
    maxWidth: 1440,
    minWidth: 1024,
    margin: '0 auto',
    padding: '0 24px',
    animation: 'fadeIn 0.3s ease-in'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
    padding: '8px 0'
  },
  title: {
    fontSize: 26,
    fontWeight: 700,
    color: '#2c3e50',
    margin: 0,
    marginBottom: 6,
    letterSpacing: '-0.3px'
  },
  subtitle: {
    fontSize: 14,
    color: '#888',
    margin: 0
  },
  successBadge: {
    display: 'flex',
    alignItems: 'center',
    background: 'rgba(46, 204, 113, 0.1)',
    color: '#27ae60',
    padding: '8px 18px',
    borderRadius: 20,
    fontSize: 13,
    fontWeight: 500,
    border: '1px solid rgba(46, 204, 113, 0.25)',
    animation: 'fadeIn 0.3s ease-in'
  },
  mainContent: {
    background: '#fff',
    borderRadius: 12,
    border: '2px solid #e8e8e8',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    padding: 28,
    display: 'flex',
    gap: 24,
    animation: 'fadeIn 0.3s ease-in'
  },
  toast: {
    position: 'fixed',
    top: 24,
    left: '50%',
    transform: 'translateX(-50%)',
    background: '#2c3e50',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: 8,
    fontSize: 14,
    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
    zIndex: 1000,
    animation: 'toastSlide 0.3s ease-out'
  }
}

export default App
