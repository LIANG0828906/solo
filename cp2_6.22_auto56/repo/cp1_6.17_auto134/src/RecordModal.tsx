import React, { useState, useRef } from 'react'
import { getSolarTerms, type SolarTerm } from './DataProvider'
import { useRecordStore } from './RecordStore'
import { getSeasonColor } from './utils'

interface RecordModalProps {
  isOpen: boolean
  onClose: () => void
  defaultSolarTerm?: SolarTerm | null
}

const RecordModal: React.FC<RecordModalProps> = ({ isOpen, onClose, defaultSolarTerm }) => {
  const solarTerms = getSolarTerms()
  const addRecord = useRecordStore(state => state.addRecord)

  const [solarTermName, setSolarTermName] = useState(defaultSolarTerm?.name || solarTerms[0].name)
  const [city, setCity] = useState('')
  const [description, setDescription] = useState('')
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>(undefined)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    if (defaultSolarTerm) {
      setSolarTermName(defaultSolarTerm.name)
    }
  }, [defaultSolarTerm, isOpen])

  React.useEffect(() => {
    if (isOpen) {
      setError('')
    }
  }, [isOpen])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('图片大小不能超过5MB')
      return
    }

    const reader = new FileReader()
    reader.onload = (ev) => {
      setImageDataUrl(ev.target?.result as string)
      setError('')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!city.trim()) {
      setError('请输入城市名称')
      return
    }

    if (!description.trim()) {
      setError('请输入物候描述')
      return
    }

    if (description.length > 140) {
      setError('物候描述不能超过140字')
      return
    }

    addRecord({
      solarTermName,
      city: city.trim(),
      description: description.trim(),
      imageDataUrl
    })

    setCity('')
    setDescription('')
    setImageDataUrl(undefined)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  const currentSolarTerm = solarTerms.find(st => st.name === solarTermName)
  const accentColor = currentSolarTerm ? getSeasonColor(currentSolarTerm.season) : '#2C3E50'

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="modal-pop-in"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: '#ffffff',
          borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.125)',
          padding: '32px 28px',
          width: 440,
          maxWidth: '90vw',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
      >
        <div
          className="kaiti"
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: accentColor,
            marginBottom: 24,
            textAlign: 'center',
            letterSpacing: 2
          }}
        >
          记录物候观察
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                color: '#666',
                marginBottom: 6,
                fontWeight: 500
              }}
            >
              选择节气
            </label>
            <select
              value={solarTermName}
              onChange={(e) => setSolarTermName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #E0D8C8',
                fontSize: 14,
                color: '#444',
                background: '#FFFBF5',
                cursor: 'pointer'
              }}
            >
              {solarTerms.map(st => (
                <option key={st.id} value={st.name}>{st.name}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                color: '#666',
                marginBottom: 6,
                fontWeight: 500
              }}
            >
              所在城市
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="例如：杭州"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #E0D8C8',
                fontSize: 14,
                color: '#444',
                background: '#FFFBF5'
              }}
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                color: '#666',
                marginBottom: 6,
                fontWeight: 500
              }}
            >
              物候描述
              <span style={{ color: '#999', fontWeight: 400, marginLeft: 8 }}>
                {description.length}/140
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 140))}
              placeholder="描述你观察到的物候现象，如：小区里的玉兰花都开了，花瓣飘落满地..."
              rows={4}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #E0D8C8',
                fontSize: 14,
                color: '#444',
                background: '#FFFBF5',
                resize: 'vertical',
                minHeight: 90,
                lineHeight: 1.6
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                fontSize: 14,
                color: '#666',
                marginBottom: 6,
                fontWeight: 500
              }}
            >
              上传图片（可选，≤5MB）
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {imageDataUrl ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={imageDataUrl}
                  alt="预览"
                  style={{
                    width: 120,
                    height: 120,
                    objectFit: 'cover',
                    borderRadius: 8,
                    border: '2px solid #E0D8C8'
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageDataUrl(undefined)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }}
                  style={{
                    position: 'absolute',
                    top: -8,
                    right: -8,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    background: '#E74C3C',
                    color: '#fff',
                    fontSize: 14,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: 120,
                  height: 120,
                  borderRadius: 8,
                  border: '2px dashed #C8BFA8',
                  background: '#FFFBF5',
                  color: '#999',
                  fontSize: 13,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: 24 }}>+</span>
                <span>点击上传</span>
              </button>
            )}
          </div>

          {error && (
            <div
              style={{
                color: '#E74C3C',
                fontSize: 13,
                marginBottom: 16,
                padding: '8px 12px',
                background: '#FDEDEC',
                borderRadius: 6
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: '12px 20px',
                background: '#E8E0D0',
                color: '#555',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500
              }}
            >
              取消
            </button>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: '12px 20px',
                background: accentColor,
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 500
              }}
            >
              提交记录
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RecordModal
