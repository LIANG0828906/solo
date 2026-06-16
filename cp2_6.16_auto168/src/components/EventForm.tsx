import { useState, useRef } from 'react'
import type { EventType } from '@/types'
import { eventConfig, compressImage } from '@/utils/eventUtils'
import { usePlantStore } from '@/store/plantStore'
import { EventIcon } from './EventIcon'

interface EventFormProps {
  plantId: string
  onClose: () => void
}

const eventTypes: EventType[] = ['sowing', 'germination', 'watering', 'fertilizing', 'pruning', 'harvest', 'pests']

export function EventForm({ plantId, onClose }: EventFormProps) {
  const [selectedType, setSelectedType] = useState<EventType | null>(null)
  const [description, setDescription] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addEvent = usePlantStore((state) => state.addEvent)

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const remainingSlots = 3 - photos.length
    const filesToProcess = files.slice(0, remainingSlots)

    try {
      const compressedPhotos = await Promise.all(
        filesToProcess.map((file) => compressImage(file))
      )
      setPhotos((prev) => [...prev, ...compressedPhotos])
    } catch (error) {
      console.error('照片处理失败:', error)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const removePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedType || isSubmitting) return

    setIsSubmitting(true)
    try {
      addEvent(plantId, {
        type: selectedType,
        description,
        photos
      })
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="event-form-overlay" onClick={onClose}>
      <div className="event-form-container" onClick={(e) => e.stopPropagation()}>
        <div className="event-form-header">
          <h3>记录生长事件</h3>
          <button className="event-form-close" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 L6 18" />
              <path d="M6 6 L18 18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="event-form-section">
            <label className="event-form-label">选择事件类型</label>
            <div className="event-type-grid">
              {eventTypes.map((type) => {
                const { label, color } = eventConfig[type]
                const isSelected = selectedType === type
                return (
                  <button
                    key={type}
                    type="button"
                    className={`event-type-btn ${isSelected ? 'selected' : ''}`}
                    style={{
                      borderColor: isSelected ? color : 'transparent',
                      backgroundColor: isSelected ? `${color}15` : '#F9F6F0'
                    }}
                    onClick={() => setSelectedType(type)}
                  >
                    <EventIcon type={type} size={24} />
                    <span className="event-type-label">{label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="event-form-section">
            <label className="event-form-label" htmlFor="description">
              事件描述
            </label>
            <textarea
              id="description"
              className="event-form-textarea"
              placeholder="记录一下这次事件的详细情况..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          <div className="event-form-section">
            <label className="event-form-label">
              添加照片（最多3张）
            </label>
            <div className="event-form-photos">
              {photos.map((photo, index) => (
                <div key={index} className="event-form-photo-preview">
                  <img src={photo} alt={`预览 ${index + 1}`} />
                  <button
                    type="button"
                    className="event-form-photo-remove"
                    onClick={() => removePhoto(index)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 L6 18" />
                      <path d="M6 6 L18 18" />
                    </svg>
                  </button>
                </div>
              ))}
              {photos.length < 3 && (
                <button
                  type="button"
                  className="event-form-photo-add"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B8C5A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 5v14" />
                    <path d="M5 12h14" />
                  </svg>
                  <span>添加照片</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="event-form-file-input"
              onChange={handlePhotoUpload}
            />
          </div>

          <div className="event-form-actions">
            <button
              type="button"
              className="event-form-cancel"
              onClick={onClose}
            >
              取消
            </button>
            <button
              type="submit"
              className="event-form-submit"
              disabled={!selectedType || isSubmitting}
            >
              {isSubmitting ? '保存中...' : '保存记录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
