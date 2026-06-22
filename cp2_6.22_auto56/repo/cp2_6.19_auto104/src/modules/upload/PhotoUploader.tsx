import React, { useState, useRef, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import exifr from 'exifr'
import { format } from 'date-fns'
import { Photo, PendingPhoto } from '@/types'

interface PhotoUploaderProps {
  photos: Photo[]
  onPhotosAdded: (photos: Photo[]) => void
}

interface ManualModalState {
  pending: PendingPhoto
  latitude: number
  longitude: number
}

const MapPinIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
  </svg>
)

const getDominantColor = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = 8
      canvas.height = 8
      if (ctx) {
        ctx.drawImage(img, 0, 0, 8, 8)
        const pixelData = ctx.getImageData(0, 0, 8, 8).data
        let r = 0,
          g = 0,
          b = 0
        const count = 8 * 8
        for (let i = 0; i < pixelData.length; i += 4) {
          r += pixelData[i]
          g += pixelData[i + 1]
          b += pixelData[i + 2]
        }
        r = Math.round(r / count)
        g = Math.round(g / count)
        b = Math.round(b / count)
        resolve(`rgb(${r}, ${g}, ${b})`)
      } else {
        resolve('#d4a373')
      }
    }
    img.onerror = () => resolve('#d4a373')
    img.src = dataUrl
  })
}

const createThumbnail = (dataUrl: string, maxSize = 200): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(maxSize / img.width, maxSize / img.height, 1)
      const w = Math.round(img.width * scale)
      const h = Math.round(img.height * scale)
      const canvas = document.createElement('canvas')
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', 0.8))
      } else {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const PhotoThumb: React.FC<{ photo: Photo; loaded: boolean; onLoad: () => void; onVisible: () => void }> = ({
  photo,
  loaded,
  onLoad,
  onVisible
}) => {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            onVisible()
            observer.disconnect()
          }
        })
      },
      { rootMargin: '100px' }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [onVisible])

  return (
    <div ref={ref} className="photo-thumb">
      {loaded ? (
        <img src={photo.thumbnailUrl} alt={photo.fileName} onLoad={onLoad} loading="lazy" />
      ) : (
        <div style={{ width: '100%', height: '100%', background: photo.dominantColor }} />
      )}
      <div className="photo-located-badge">
        <MapPinIcon />
      </div>
    </div>
  )
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({ photos, onPhotosAdded }) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [manualModal, setManualModal] = useState<ManualModalState | null>(null)
  const [visiblePhotos, setVisiblePhotos] = useState<Set<string>>(new Set())
  const [loadedPhotos, setLoadedPhotos] = useState<Set<string>>(new Set())

  useEffect(() => {
    const initialSet = new Set(photos.slice(0, 10).map((p) => p.id))
    setVisiblePhotos(initialSet)
  }, [photos])

  const handleUploadClick = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const processFiles = useCallback(
    async (files: FileList) => {
      const validFiles = Array.from(files).filter((f) =>
        /\.(jpe?g|png)$/i.test(f.name) || f.type.startsWith('image/')
      )

      for (const file of validFiles) {
        try {
          const dataUrl = await fileToDataUrl(file)
          const [thumbnailUrl, dominantColor] = await Promise.all([
            createThumbnail(dataUrl),
            getDominantColor(dataUrl)
          ])

          let gps: { latitude: number; longitude: number } | null = null
          let takenAt: Date = new Date()
          let cameraModel = ''

          try {
            const exif = (await exifr.parse(file)) as unknown as {
              latitude?: number
              longitude?: number
              DateTimeOriginal?: string | Date
              CreateDate?: string | Date
              Model?: string
              Make?: string
            }
            if (exif?.latitude && exif?.longitude) {
              gps = { latitude: exif.latitude, longitude: exif.longitude }
            }
            if (exif?.DateTimeOriginal) {
              takenAt = new Date(exif.DateTimeOriginal)
            } else if (exif?.CreateDate) {
              takenAt = new Date(exif.CreateDate)
            }
            if (exif?.Model) {
              cameraModel = String(exif.Model)
            } else if (exif?.Make) {
              cameraModel = String(exif.Make)
            }
          } catch (e) {
            // EXIF parse failed, continue
          }

          if (gps) {
            const photo: Photo = {
              id: uuidv4(),
              fileName: file.name,
              dataUrl,
              thumbnailUrl,
              dominantColor,
              latitude: gps.latitude,
              longitude: gps.longitude,
              takenAt,
              cameraModel,
              isManual: false
            }
            onPhotosAdded([photo])
          } else {
            const pending: PendingPhoto = {
              id: uuidv4(),
              fileName: file.name,
              dataUrl,
              thumbnailUrl,
              dominantColor,
              takenAt,
              cameraModel
            }
            setManualModal({
              pending,
              latitude: 39.9042,
              longitude: 116.4074
            })
          }
        } catch (err) {
          console.error('Failed to process file:', file.name, err)
        }
      }
    },
    [onPhotosAdded]
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        processFiles(e.target.files)
      }
      e.target.value = ''
    },
    [processFiles]
  )

  const confirmManualLocation = useCallback(() => {
    if (!manualModal) return
    const photo: Photo = {
      id: manualModal.pending.id,
      fileName: manualModal.pending.fileName,
      dataUrl: manualModal.pending.dataUrl,
      thumbnailUrl: manualModal.pending.thumbnailUrl,
      dominantColor: manualModal.pending.dominantColor,
      latitude: manualModal.latitude,
      longitude: manualModal.longitude,
      takenAt: manualModal.pending.takenAt,
      cameraModel: manualModal.pending.cameraModel,
      isManual: true
    }
    onPhotosAdded([photo])
    setManualModal(null)
  }, [manualModal, onPhotosAdded])

  const cancelManualLocation = useCallback(() => {
    setManualModal(null)
  }, [])

  return (
    <>
      <div className="left-panel">
        <div className="panel-header">照片相册</div>
        <div className="upload-area">
          <button className="upload-btn" onClick={handleUploadClick}>
            上传照片
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>
        <div className="photo-grid">
          {photos.length === 0 ? (
            <div className="empty-state">暂无照片，点击上方按钮上传</div>
          ) : (
            photos.map((photo) => (
              <PhotoThumb
                key={photo.id}
                photo={photo}
                loaded={loadedPhotos.has(photo.id)}
                onLoad={() =>
                  setLoadedPhotos((prev) => new Set(prev).add(photo.id))
                }
                onVisible={() =>
                  setVisiblePhotos((prev) => new Set(prev).add(photo.id))
                }
              />
            ))
          )}
        </div>
      </div>

      {manualModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-title">手动标记位置</div>
            <div className="modal-desc">
              无法解析照片 &quot;{manualModal.pending.fileName}&quot; 的 GPS
              信息，请输入坐标：
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="control-label" style={{ marginBottom: 4 }}>
                  纬度
                </label>
                <input
                  className="modal-input"
                  type="number"
                  step="0.0001"
                  value={manualModal.latitude}
                  onChange={(e) =>
                    setManualModal({
                      ...manualModal,
                      latitude: parseFloat(e.target.value) || 0
                    })
                  }
                />
              </div>
              <div style={{ flex: 1 }}>
                <label className="control-label" style={{ marginBottom: 4 }}>
                  经度
                </label>
                <input
                  className="modal-input"
                  type="number"
                  step="0.0001"
                  value={manualModal.longitude}
                  onChange={(e) =>
                    setManualModal({
                      ...manualModal,
                      longitude: parseFloat(e.target.value) || 0
                    })
                  }
                />
              </div>
            </div>
            <div className="modal-desc" style={{ marginTop: 4 }}>
              拍摄时间：{format(new Date(manualModal.pending.takenAt), 'yyyy-MM-dd HH:mm:ss')}
            </div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-secondary" onClick={cancelManualLocation}>
                跳过
              </button>
              <button className="modal-btn modal-btn-primary" onClick={confirmManualLocation}>
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default PhotoUploader
