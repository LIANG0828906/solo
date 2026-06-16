import React, { useRef, useState, useEffect } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { useSignStore } from '@/stores/signStore'
import ReceiptDisplay from './ReceiptDisplay'
import './SignaturePad.css'

const SignaturePad: React.FC = () => {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [recipient, setRecipient] = useState('')
  const [courier, setCourier] = useState('')
  const [signatureBase64, setSignatureBase64] = useState<string>('')
  const [photoBase64, setPhotoBase64] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [submittedRecordId, setSubmittedRecordId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSigning, setIsSigning] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const sigCanvasRef = useRef<SignatureCanvas>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const addRecord = useSignStore((s) => s.addRecord)

  useEffect(() => {
    if (!trackingNumber) {
      setTrackingNumber(`SF${Date.now().toString().slice(-10)}`)
    }
  }, [trackingNumber])

  const handleSignBegin = () => {
    setIsSigning(true)
    setHasSignature(true)
  }

  const clearSignature = () => {
    sigCanvasRef.current?.clear()
    setSignatureBase64('')
    setIsSigning(false)
    setHasSignature(false)
  }

  const confirmSignature = () => {
    if (sigCanvasRef.current?.isEmpty()) {
      setError('请先完成签名')
      return
    }
    const data = sigCanvasRef.current?.getTrimmedCanvas().toDataURL('image/png') || ''
    setSignatureBase64(data)
    setError('')
  }

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError('仅支持JPEG或PNG格式的照片')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('照片大小不能超过5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setPhotoBase64(ev.target?.result as string)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = () => {
    setError('')

    if (!trackingNumber.trim()) {
      setError('请输入运单号')
      return
    }
    if (!recipient.trim()) {
      setError('请输入收件人姓名')
      return
    }
    if (!courier.trim()) {
      setError('请输入快递员姓名')
      return
    }
    if (!signatureBase64) {
      setError('请确认电子签名')
      return
    }
    if (!photoBase64) {
      setError('请上传货物照片')
      return
    }

    setIsSubmitting(true)

    const startTime = performance.now()
    const record = addRecord({
      trackingNumber: trackingNumber.trim(),
      recipient: recipient.trim(),
      courier: courier.trim(),
      signatureBase64,
      photoBase64,
    })
    const elapsed = performance.now() - startTime
    console.debug(`[SignFlow] 签收记录写入耗时: ${elapsed.toFixed(1)}ms`)

    setTimeout(() => {
      setSubmittedRecordId(record.id)
      setIsSubmitting(false)
    }, Math.max(0, 100 - elapsed))
  }

  const resetForm = () => {
    setTrackingNumber(`SF${Date.now().toString().slice(-10)}`)
    setRecipient('')
    setCourier('')
    setSignatureBase64('')
    setPhotoBase64('')
    setSubmittedRecordId(null)
    setError('')
    sigCanvasRef.current?.clear()
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  if (submittedRecordId) {
    return <ReceiptDisplay recordId={submittedRecordId} onBack={resetForm} />
  }

  return (
    <div className="signing-page">
      <div className="signing-container">
        <h1 className="app-title">SignFlow 电子签收</h1>

        <div className="tracking-header">
          <span className="tracking-label">运单号</span>
          <span className="tracking-number">{trackingNumber}</span>
        </div>

        <div className="form-section">
          <div className="form-group">
            <label className="form-label">收件人姓名</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入收件人姓名"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">快递员姓名</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入快递员姓名"
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
            />
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">收件人电子签名</h3>
          <div className="signature-wrapper-dotted">
            {!hasSignature && (
              <span className="signature-hint">请在此处签名</span>
            )}
            <SignatureCanvas
              ref={sigCanvasRef}
              penColor="#1A237E"
              backgroundColor="#FAF5F0"
              onBegin={handleSignBegin}
              canvasProps={{
                width: 320,
                height: 160,
                className: 'signature-canvas',
              }}
            />
          </div>
          {(hasSignature || signatureBase64) && (
            <div className="signature-actions">
              {signatureBase64 ? (
                <span className="preview-badge">✓ 已确认签名</span>
              ) : (
                <span className="sign-status-badge">已绘制签名，请确认</span>
              )}
              <button className="btn btn-clear-small" onClick={clearSignature}>
                清除重签
              </button>
            </div>
          )}
          <div className="button-row">
            <button className="btn btn-secondary" onClick={clearSignature}>
              清除
            </button>
            <button className="btn btn-primary" onClick={confirmSignature}>
              确认签名
            </button>
          </div>
        </div>

        <div className="section">
          <h3 className="section-title">货物照片上传</h3>
          {photoBase64 ? (
            <div className="photo-preview-section">
              <div className="photo-preview-wrapper">
                <img src={photoBase64} alt="货物照片预览" className="photo-preview-large" />
                <div className="photo-info">
                  <span className="photo-status-badge">✓ 已选择照片</span>
                </div>
              </div>
              <button
                className="btn btn-retake"
                onClick={() => fileInputRef.current?.click()}
              >
                📷 重新拍照
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden-input"
              />
            </div>
          ) : (
            <div className="photo-upload-area" onClick={() => fileInputRef.current?.click()}>
              <div className="photo-placeholder">
                <span className="photo-icon">📷</span>
                <span className="photo-text">点击拍照或从相册选择</span>
                <span className="photo-hint">支持JPEG/PNG，不超过5MB</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png"
                capture="environment"
                onChange={handlePhotoSelect}
                className="hidden-input"
              />
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        <button className="btn btn-submit btn-full" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? '提交中...' : '提交签收'}
        </button>
      </div>
    </div>
  )
}

export default SignaturePad
