import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePhotoStore } from '../store/photoStore'
import { processImageFile, processImageUrl } from '../utils/imageProcessor'

export const UploadModal = () => {
  const { isUploadOpen, closeUpload, addPhoto } = usePhotoStore()

  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file')
  const [urlInput, setUrlInput] = useState('')
  const [progress, setProgress] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) {
        setError('请选择图片文件')
        return
      }

      setIsProcessing(true)
      setError('')
      setProgress(0)

      try {
        const photo = await processImageFile(file, (p) => {
          setProgress(p)
        })
        addPhoto(photo)
        setTimeout(() => {
          closeUpload()
          setIsProcessing(false)
          setProgress(0)
        }, 500)
      } catch (err) {
        setError('图片处理失败，请重试')
        setIsProcessing(false)
      }
    },
    [addPhoto, closeUpload]
  )

  const handleUrlSubmit = useCallback(async () => {
    if (!urlInput.trim()) {
      setError('请输入图片URL')
      return
    }

    setIsProcessing(true)
    setError('')
    setProgress(0)

    try {
      const photo = await processImageUrl(urlInput.trim(), (p) => {
        setProgress(p)
      })
      addPhoto(photo)
      setTimeout(() => {
        closeUpload()
        setIsProcessing(false)
        setProgress(0)
        setUrlInput('')
      }, 500)
    } catch (err) {
      setError('图片加载失败，请检查URL是否正确')
      setIsProcessing(false)
    }
  }, [urlInput, addPhoto, closeUpload])

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile()
          if (file) {
            handleFileSelect(file)
            return
          }
        }
      }

      const text = e.clipboardData.getData('text')
      if (text && /^https?:\/\//.test(text)) {
        setUrlInput(text)
        setUploadMode('url')
      }
    },
    [handleFileSelect]
  )

  if (!isUploadOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(74, 55, 40, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px',
        }}
        onClick={closeUpload}
        onPaste={handlePaste}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '480px',
            maxWidth: '100%',
            backgroundColor: '#fff',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 20px 60px rgba(74, 55, 40, 0.4)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: '#4A3728',
              }}
            >
              上传照片
            </h2>
            <button
              onClick={closeUpload}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#8D6E63',
                fontSize: '18px',
                lineHeight: 1,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F5F0E8'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              ×
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            <motion.button
              onClick={() => setUploadMode('file')}
              whileHover={{ backgroundColor: '#F5F0E8' }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: uploadMode === 'file' ? '#4A3728' : '#FAF7F2',
                color: uploadMode === 'file' ? '#EAE0C8' : '#4A3728',
                border: '1px solid #D7CCC8',
                fontSize: '13px',
                fontWeight: uploadMode === 'file' ? 500 : 400,
              }}
            >
              本地文件
            </motion.button>
            <motion.button
              onClick={() => setUploadMode('url')}
              whileHover={{ backgroundColor: '#F5F0E8' }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.2 }}
              style={{
                flex: 1,
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: uploadMode === 'url' ? '#4A3728' : '#FAF7F2',
                color: uploadMode === 'url' ? '#EAE0C8' : '#4A3728',
                border: '1px solid #D7CCC8',
                fontSize: '13px',
                fontWeight: uploadMode === 'url' ? 500 : 400,
              }}
            >
              图片URL
            </motion.button>
          </div>

          {isProcessing && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                marginBottom: '20px',
              }}
            >
              <div
                style={{
                  width: '100%',
                  height: '4px',
                  backgroundColor: '#D7CCC8',
                  borderRadius: '2px',
                  overflow: 'hidden',
                }}
              >
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{
                    height: '100%',
                    background: 'linear-gradient(90deg, #FFD54F 0%, #FF7043 100%)',
                    borderRadius: '2px',
                  }}
                />
              </div>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '12px',
                  color: '#8D6E63',
                  marginTop: '8px',
                }}
              >
                正在处理图片... {progress}%
              </div>
            </motion.div>
          )}

          {uploadMode === 'file' ? (
            <motion.div
              onClick={() => fileInputRef.current?.click()}
              whileHover={{ borderColor: '#4A3728', backgroundColor: '#FAF7F2' }}
              whileTap={{ scale: 0.99 }}
              style={{
                border: '2px dashed #D7CCC8',
                borderRadius: '12px',
                padding: '48px 24px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  fontSize: '40px',
                  marginBottom: '12px',
                }}
              >
                📷
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: '#4A3728',
                  marginBottom: '4px',
                  fontWeight: 500,
                }}
              >
                点击选择图片
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: '#8D6E63',
                }}
              >
                或直接粘贴图片到窗口
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileSelect(file)
                  e.target.value = ''
                }}
              />
            </motion.div>
          ) : (
            <div>
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="请输入图片URL..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #D7CCC8',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  color: '#4A3728',
                  backgroundColor: '#FAF7F2',
                  outline: 'none',
                  transition: 'border-color 0.2s ease',
                  marginBottom: '16px',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#4A3728'
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#D7CCC8'
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !isProcessing) {
                    handleUrlSubmit()
                  }
                }}
              />
              <motion.button
                onClick={handleUrlSubmit}
                disabled={isProcessing}
                whileHover={!isProcessing ? { backgroundColor: '#3A2718' } : {}}
                whileTap={!isProcessing ? { scale: 0.98 } : {}}
                transition={{ duration: 0.2 }}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  backgroundColor: '#4A3728',
                  color: '#EAE0C8',
                  fontSize: '14px',
                  fontWeight: 500,
                  opacity: isProcessing ? 0.6 : 1,
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                }}
              >
                上传图片
              </motion.button>
            </div>
          )}

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{
                  marginTop: '16px',
                  padding: '10px 14px',
                  backgroundColor: '#FFEBEE',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#C62828',
                  textAlign: 'center',
                }}
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <div
            style={{
              marginTop: '16px',
              fontSize: '11px',
              color: '#8D6E63',
              textAlign: 'center',
            }}
          >
            图片将自动缩放至最大宽度800px并转成JPEG格式
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
