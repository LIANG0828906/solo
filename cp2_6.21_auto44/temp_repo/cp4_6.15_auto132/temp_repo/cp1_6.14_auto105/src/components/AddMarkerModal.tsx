import { useState, useEffect, useRef } from 'react'
import type { TravelMarker, MoodType, MarkerFormData } from '@/types'
import { MOOD_EMOJIS, MOOD_LABELS } from '@/types'
import { reverseGeocode } from '@/services/api'
import { compressImage } from '@/utils/image'

interface AddMarkerModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MarkerFormData) => void
  initialData?: TravelMarker
  position?: { lat: number; lng: number }
}

function getTodayDate(): string {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const moods: MoodType[] = ['happy', 'calm', 'excited', 'tired']

export default function AddMarkerModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  position,
}: AddMarkerModalProps) {
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('')
  const [continent, setContinent] = useState('')
  const [date, setDate] = useState(getTodayDate())
  const [mood, setMood] = useState<MoodType>('happy')
  const [photo, setPhoto] = useState<string | undefined>(undefined)
  const [isLoadingCity, setIsLoadingCity] = useState(false)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isEditMode = !!initialData
  const title = isEditMode ? '编辑旅行记录' : '添加旅行标记'

  useEffect(() => {
    if (isOpen) {
      setPhotoError(null)
      if (initialData) {
        setCity(initialData.city)
        setCountry(initialData.country)
        setContinent(initialData.continent)
        setDate(initialData.date)
        setMood(initialData.mood)
        setPhoto(initialData.photo)
      } else {
        setCity('')
        setCountry('')
        setContinent('')
        setDate(getTodayDate())
        setMood('happy')
        setPhoto(undefined)

        if (position) {
          fetchReverseGeocode(position.lat, position.lng)
        }
      }
    }
  }, [isOpen, initialData, position])

  async function fetchReverseGeocode(lat: number, lng: number) {
    setIsLoadingCity(true)
    try {
      const result = await reverseGeocode(lat, lng)
      setCity(result.city)
      setCountry(result.country)
      setContinent(result.continent)
    } catch (error) {
      console.error('反向地理编码失败:', error)
    } finally {
      setIsLoadingCity(false)
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError(null)

    if (file.size > 2 * 1024 * 1024) {
      setPhotoError('图片大小不能超过2MB，请选择更小的图片')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    if (!file.type.startsWith('image/')) {
      setPhotoError('请选择图片文件')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    compressImage(file, 800, 0.8)
      .then((dataUrl) => {
        setPhoto(dataUrl)
        setPhotoError(null)
      })
      .catch((error) => {
        setPhotoError(error.message || '图片处理失败')
      })
  }

  function handleRemovePhoto() {
    setPhoto(undefined)
    setPhotoError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const lat = initialData ? initialData.lat : position?.lat ?? 0
    const lng = initialData ? initialData.lng : position?.lng ?? 0

    onSubmit({
      city,
      country,
      continent,
      date,
      mood,
      photo,
      lat,
      lng,
    })
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <h2 className="modal-title">{title}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">城市名称</label>
            <input
              type="text"
              className="form-input"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={isLoadingCity ? '正在获取城市名称...' : '请输入城市名称'}
              disabled={isLoadingCity}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">国家</label>
            <input
              type="text"
              className="form-input"
              value={country}
              readOnly
              style={{ background: '#f5f0e8', cursor: 'not-allowed' }}
            />
          </div>

          <div className="form-group">
            <label className="form-label">日期</label>
            <input
              type="date"
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">心情</label>
            <div className="mood-selector">
              {moods.map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`mood-option${mood === m ? ' selected' : ''}`}
                  onClick={() => setMood(m)}
                >
                  <div className="mood-emoji">{MOOD_EMOJIS[m]}</div>
                  <div className="mood-label">{MOOD_LABELS[m]}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">照片</label>
            {photo ? (
              <div className="photo-preview">
                <img src={photo} alt="预览" />
                <button
                  type="button"
                  className="photo-preview-remove"
                  onClick={handleRemovePhoto}
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="photo-upload">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handlePhotoChange}
                />
                <div className="photo-upload-icon">📷</div>
                <div className="photo-upload-text">点击上传照片（最大2MB）</div>
              </label>
            )}
            {photoError && (
              <div style={{ color: '#E74C3C', fontSize: '0.8rem', marginTop: '4px' }}>
                {photoError}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              取消
            </button>
            <button type="submit" className="btn btn-primary">
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
