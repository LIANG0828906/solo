import React, { useEffect, useRef, useState } from 'react'
import { useSignStore } from '@/stores/signStore'
import { renderReceiptToCanvas, downloadReceipt } from '@/utils/receipt'
import type { SignRecord } from '@/types'
import './ReceiptDisplay.css'

interface ReceiptDisplayProps {
  recordId: string
  onBack?: () => void
  showBackButton?: boolean
}

const ReceiptDisplay: React.FC<ReceiptDisplayProps> = ({ recordId, onBack, showBackButton = true }) => {
  const [record, setRecord] = useState<SignRecord | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const records = useSignStore((s) => s.records)

  useEffect(() => {
    const found = records.find((r) => r.id === recordId)
    setRecord(found || null)
  }, [recordId, records])

  useEffect(() => {
    if (record && canvasRef.current) {
      const start = performance.now()
      renderReceiptToCanvas(record, canvasRef.current)
        .then(() => {
          const elapsed = performance.now() - start
          console.debug(`[SignFlow] 凭证渲染耗时: ${elapsed.toFixed(1)}ms`)
        })
        .catch((err) => {
          console.error('渲染凭证失败:', err)
        })
    }
  }, [record])

  const handleDownload = async () => {
    if (!record) return
    setIsDownloading(true)
    try {
      const start = performance.now()
      await downloadReceipt(record)
      const elapsed = performance.now() - start
      console.debug(`[SignFlow] 凭证下载生成耗时: ${elapsed.toFixed(1)}ms`)
    } catch (err) {
      console.error('下载凭证失败:', err)
      alert('下载失败，请重试')
    } finally {
      setTimeout(() => setIsDownloading(false), 300)
    }
  }

  if (!record) {
    return (
      <div className="receipt-page">
        <div className="receipt-container">
          <div className="loading">加载中...</div>
        </div>
      </div>
    )
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }

  return (
    <div className="receipt-page">
      <div className="receipt-container">
        <h2 className="receipt-title">签收成功 · 电子凭证</h2>

        <div className="receipt-card-wrapper">
          <div className="receipt-card">
            <div className="receipt-header">
              <div className="logo-placeholder">S</div>
              <div>
                <div className="company-name">SignFlow 物流</div>
                <div className="receipt-label">电子签收凭证</div>
              </div>
            </div>

            <div className="receipt-body" style={{ gap: '12px' }}>
              <div className="receipt-field">
                <span className="field-label">运单号</span>
                <span className="field-value field-value-tracking">{record.trackingNumber}</span>
              </div>
              <div className="receipt-field">
                <span className="field-label">收件人</span>
                <span className="field-value">{record.recipient}</span>
              </div>
              <div className="receipt-field">
                <span className="field-label">签收时间</span>
                <span className="field-value">{formatTime(record.timestamp)}</span>
              </div>

              <div className="signature-section">
                <span className="field-label">收件人签名</span>
                <div className="signature-box">
                  {record.signatureBase64 ? (
                    <img src={record.signatureBase64} alt="签名" className="signature-img" />
                  ) : (
                    <span className="empty-text">无签名</span>
                  )}
                </div>
              </div>

              <div className="photo-section">
                <span className="field-label">货物照片</span>
                <div className="photo-circular">
                  {record.photoBase64 ? (
                    <img src={record.photoBase64} alt="货物照片" className="photo-img" />
                  ) : (
                    <span className="empty-text small">无照片</span>
                  )}
                </div>
              </div>
            </div>

            <div className="receipt-footer">
              <div className="courier-line">快递员：{record.courier}</div>
              <div className="contact-line">SignFlow 物流 · 客服热线：400-888-8888</div>
            </div>
          </div>
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="receipt-actions">
          <button className="btn btn-download" onClick={handleDownload} disabled={isDownloading}>
            {isDownloading ? '生成中...' : '下载凭证 (PNG)'}
          </button>
          {showBackButton && onBack && (
            <button className="btn btn-back" onClick={onBack}>
              继续签收
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReceiptDisplay
