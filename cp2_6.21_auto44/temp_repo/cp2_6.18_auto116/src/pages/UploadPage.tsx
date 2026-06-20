import { useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react'
import { useAppStore } from '../store/appStore'

const UploadPage = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { setImageAndResults } = useAppStore()

  const handleFile = useCallback((file: File) => {
    if (!file.type.includes('image/jpeg') && !file.type.includes('image/png')) {
      alert('请上传JPEG或PNG格式的图片')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('图片大小不能超过5MB')
      return
    }

    setIsLoading(true)
    const reader = new FileReader()
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string
      setTimeout(() => {
        setImageAndResults(imageUrl)
        setIsLoading(false)
      }, 1500)
    }
    reader.readAsDataURL(file)
  }, [setImageAndResults])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  if (isLoading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingPot}>🍳</div>
        <p style={styles.loadingText}>正在识别食材...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titleIcon}>🍳</span> SnapChef
        </h1>
        <p style={styles.subtitle}>上传食材照片，AI为你推荐今晚的菜谱</p>
      </div>

      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          ...styles.uploadArea,
          ...(isDragging ? styles.uploadAreaDragging : {}),
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleChange}
          style={{ display: 'none' }}
        />
        <div style={styles.uploadIcon}>📸</div>
        <p style={styles.uploadText}>
          {isDragging ? '松开以上传图片' : '点击或拖拽图片到此处上传'}
        </p>
        <p style={styles.uploadHint}>支持 JPEG / PNG 格式，最大 5MB</p>
      </div>

      <button onClick={handleClick} style={styles.uploadButton}>
        选择图片
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '48px',
  },
  title: {
    fontSize: '48px',
    fontWeight: 700,
    color: '#1E293B',
    marginBottom: '12px',
  },
  titleIcon: {
    color: '#F97316',
  },
  subtitle: {
    fontSize: '18px',
    color: '#64748B',
  },
  uploadArea: {
    width: '100%',
    maxWidth: '500px',
    height: '280px',
    border: '2px dashed #F97316',
    borderRadius: '16px',
    backgroundColor: 'rgba(249, 115, 22, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '24px',
  },
  uploadAreaDragging: {
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    borderStyle: 'solid',
  },
  uploadIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  uploadText: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1E293B',
    marginBottom: '8px',
  },
  uploadHint: {
    fontSize: '14px',
    color: '#94A3B8',
  },
  uploadButton: {
    padding: '14px 40px',
    backgroundColor: '#F97316',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingPot: {
    fontSize: '80px',
    animation: 'spin 0.5s linear infinite',
  },
  loadingText: {
    marginTop: '24px',
    fontSize: '18px',
    color: '#64748B',
    fontWeight: 500,
  },
}

const styleSheet = document.createElement('style')
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`
document.head.appendChild(styleSheet)

export default UploadPage
