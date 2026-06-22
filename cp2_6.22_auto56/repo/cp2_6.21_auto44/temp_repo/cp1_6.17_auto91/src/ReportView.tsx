import React, { useState } from 'react'
import { useAppStore } from './store'

const ReportView: React.FC = () => {
  const { reportContent, showReport, currentProjectId, projects } = useAppStore()
  const [copied, setCopied] = useState(false)
  const [showBillSuccess, setShowBillSuccess] = useState(false)

  const currentProject = projects.find((p) => p.id === currentProjectId)
  const totalMinutes = currentProject?.entries.reduce((sum, e) => sum + e.duration, 0) || 0
  const totalHours = totalMinutes / 60
  const canSendBill = totalHours > 10

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportContent)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch (e) {
      console.error('Failed to copy:', e)
    }
  }

  const handleSendBill = () => {
    if (!canSendBill) return
    setShowBillSuccess(true)
    setTimeout(() => setShowBillSuccess(false), 2000)
  }

  const containerStyle: React.CSSProperties = {
    marginTop: '24px',
    overflow: 'hidden',
    transition: 'max-height 0.3s ease',
    maxHeight: showReport ? '800px' : '0',
    opacity: showReport ? 1 : 0,
  }

  const previewStyle: React.CSSProperties = {
    backgroundColor: '#F1F5F9',
    borderRadius: '8px',
    padding: '16px',
    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#1E293B',
    whiteSpace: 'pre-wrap',
    wordWrap: 'break-word',
    maxHeight: '500px',
    overflowY: 'auto',
    marginBottom: '16px',
  }

  const buttonContainerStyle: React.CSSProperties = {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
  }

  const copyButtonStyle: React.CSSProperties = {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    transition: 'background-color 0.2s ease-out',
    position: 'relative',
  }

  const billButtonStyle: React.CSSProperties = {
    padding: '8px 20px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: canSendBill ? 'pointer' : 'not-allowed',
    backgroundColor: canSendBill ? '#10B981' : '#94A3B8',
    color: '#FFFFFF',
    transition: 'background-color 0.2s ease-out',
    opacity: canSendBill ? 1 : 0.6,
  }

  const toastStyle: React.CSSProperties = {
    position: 'fixed',
    top: '20px',
    right: '20px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 200,
  }

  if (!showReport) return null

  return (
    <>
      <div style={containerStyle} className="fade-in">
        <div style={previewStyle}>{reportContent}</div>
        <div style={buttonContainerStyle}>
          <button
            style={copyButtonStyle}
            onClick={handleCopy}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2563EB'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3B82F6'
            }}
          >
            {copied ? '已复制' : '复制到剪贴板'}
          </button>
          <button
            style={billButtonStyle}
            onClick={handleSendBill}
            disabled={!canSendBill}
            onMouseEnter={(e) => {
              if (canSendBill) {
                e.currentTarget.style.backgroundColor = '#059669'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = canSendBill ? '#10B981' : '#94A3B8'
            }}
          >
            发送账单
          </button>
        </div>
      </div>

      {showBillSuccess && (
        <div style={toastStyle} className="fade-in">
          账单发送成功！
        </div>
      )}
    </>
  )
}

export default ReportView
