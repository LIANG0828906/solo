import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { useDrop } from 'react-dnd'
import { Memory } from '../data/sampleData'

interface MemoryGridProps {
  memories: Memory[]
  selectedYear: number
  onAddMemory: (memory: Omit<Memory, 'id'>) => void
  onUpdateMemory: (id: string, updates: Partial<Memory>) => void
  onDeleteMemory: (id: string) => void
  newMemoryId?: string | null
}

interface FormData {
  date: string
  title: string
  description: string
  imageUrl: string
}

const initialFormData: FormData = {
  date: '',
  title: '',
  description: '',
  imageUrl: ''
}

const LazyImage = ({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <div ref={imgRef} className={`lazy-image-container ${className}`}>
      {!isLoaded && (
        <div className="image-placeholder">
          <div className="placeholder-shimmer" />
        </div>
      )}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          className={`card-image ${isLoaded ? 'loaded' : ''}`}
          onLoad={() => setIsLoaded(true)}
        />
      )}
    </div>
  )
}

function MemoryGrid({ memories, selectedYear, onAddMemory, onUpdateMemory, onDeleteMemory, newMemoryId }: MemoryGridProps) {
  const [flippedCard, setFlippedCard] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addButtonRef = useRef<HTMLButtonElement>(null)

  const [, drop] = useDrop(() => ({
    accept: 'image/*',
    drop: (item: { files: File[] }) => {
      handleFileDrop(item.files)
    },
    collect: (monitor) => ({
      isOver: monitor.isOver()
    })
  }))

  const handleFileDrop = useCallback(async (files: File[]) => {
    const file = files[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setFormData(prev => ({ ...prev, imageUrl: result }))
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => {
        const result = ev.target?.result as string
        setFormData(prev => ({ ...prev, imageUrl: result }))
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingOver(false)
    const files = Array.from(e.dataTransfer.files)
    handleFileDrop(files)
  }, [handleFileDrop])

  const handleOpenAddModal = useCallback(() => {
    if (addButtonRef.current) {
      setButtonRect(addButtonRef.current.getBoundingClientRect())
    }
    setEditingMemory(null)
    setFormData({
      ...initialFormData,
      date: `${selectedYear}-01-01`
    })
    setShowModal(true)
  }, [selectedYear])

  const handleOpenEditModal = useCallback((memory: Memory) => {
    setEditingMemory(memory)
    setFormData({
      date: memory.date,
      title: memory.title,
      description: memory.description,
      imageUrl: memory.imageUrl
    })
    setFlippedCard(null)
    setShowModal(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setShowModal(false)
    setEditingMemory(null)
    setFormData(initialFormData)
  }, [])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    const dateObj = new Date(formData.date)
    const year = dateObj.getFullYear()
    const month = dateObj.getMonth() + 1

    if (editingMemory) {
      onUpdateMemory(editingMemory.id, {
        ...formData,
        year,
        month
      })
    } else {
      onAddMemory({
        ...formData,
        year,
        month
      })
    }
    
    handleCloseModal()
  }, [formData, editingMemory, onAddMemory, onUpdateMemory, handleCloseModal])

  const handleCardClick = useCallback((id: string) => {
    setFlippedCard(prev => prev === id ? null : id)
  }, [])

  const handleDelete = useCallback((id: string) => {
    if (confirm('确定要删除这段记忆吗？')) {
      onDeleteMemory(id)
      setFlippedCard(null)
    }
  }, [onDeleteMemory])

  const removeImage = useCallback(() => {
    setFormData(prev => ({ ...prev, imageUrl: '' }))
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1
      }
    }
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 260,
        damping: 22,
        mass: 0.9
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
  }

  const modalVariants = {
    hidden: (rect: DOMRect | null) => ({
      opacity: 0,
      scale: 0.3,
      x: rect ? rect.left + rect.width / 2 - window.innerWidth / 2 : 0,
      y: rect ? rect.top + rect.height / 2 - window.innerHeight / 2 : -100,
    }),
    show: {
      opacity: 1,
      scale: 1,
      x: 0,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 28,
        mass: 0.8
      }
    },
    exit: (rect: DOMRect | null) => ({
      opacity: 0,
      scale: 0.3,
      x: rect ? rect.left + rect.width / 2 - window.innerWidth / 2 : 0,
      y: rect ? rect.top + rect.height / 2 - window.innerHeight / 2 : -100,
      transition: { duration: 0.25, ease: 'easeIn' }
    })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="section-header"
      >
        <h2 className="year-display">
          <span className="year-number">{selectedYear}</span>
          年的记忆
        </h2>
        <motion.button
          ref={addButtonRef}
          className="add-memory-btn"
          onClick={handleOpenAddModal}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          添加记忆
        </motion.button>
      </motion.div>

      <LayoutGroup>
        <AnimatePresence mode="wait">
          {memories.length > 0 ? (
            <motion.div
              key="grid"
              className="memory-grid"
              variants={containerVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              layout
            >
              {memories.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  className="memory-card-wrapper"
                  variants={cardVariants}
                  custom={index}
                  layout
                  initial={newMemoryId === memory.id ? 
                    { opacity: 0, scale: 0.5, y: -50 } : 
                    undefined
                  }
                  animate={newMemoryId === memory.id ?
                    { opacity: 1, scale: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 25, mass: 0.8 } } :
                    undefined
                  }
                >
                  <motion.div
                    className="memory-card"
                    onClick={() => handleCardClick(memory.id)}
                    style={{ perspective: 1000 }}
                    whileHover={{ 
                      y: -6,
                      transition: { duration: 0.3, ease: 'easeOut' }
                    }}
                  >
                    <motion.div
                      className="card-inner"
                      animate={{ 
                        rotateY: flippedCard === memory.id ? 180 : 0,
                        boxShadow: flippedCard === memory.id 
                          ? '0 20px 40px rgba(92, 64, 51, 0.3)'
                          : '0 4px 12px rgba(92, 64, 51, 0.15)'
                      }}
                      transition={{ 
                        duration: 0.6,
                        ease: [0.4, 0, 0.2, 1]
                      }}
                      style={{ 
                        transformStyle: 'preserve-3d',
                        position: 'relative',
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      <div className="card-front">
                        <LazyImage
                          src={memory.imageUrl}
                          alt={memory.title}
                          className="card-image-wrapper"
                        />
                        <div className="card-content">
                          <div className="card-date">{memory.date}</div>
                          <h3 className="card-title">{memory.title}</h3>
                          <p className="card-description">{memory.description}</p>
                        </div>
                      </div>
                      
                      <div className="card-back">
                        <h3>{memory.title}</h3>
                        <p className="card-back-date">{memory.date}</p>
                        <p className="card-back-description">{memory.description}</p>
                        <div className="card-actions">
                          <motion.button
                            className="action-btn edit"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenEditModal(memory)
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ✏️ 编辑
                          </motion.button>
                          <motion.button
                            className="action-btn delete"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(memory.id)
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            🗑️ 删除
                          </motion.button>
                        </div>
                        <p className="card-back-hint">
                          点击卡片返回
                        </p>
                      </div>
                    </motion.div>
                  </motion.div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              className="empty-state"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="empty-state-icon">📷</div>
              <p className="empty-state-text">{selectedYear} 年还没有记忆</p>
              <p className="empty-state-hint">点击右上角按钮添加你的第一段记忆</p>
            </motion.div>
          )}
        </AnimatePresence>
      </LayoutGroup>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <motion.div
              className="modal-content"
              custom={buttonRect}
              variants={modalVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3 className="modal-title">
                  {editingMemory ? '编辑记忆' : '添加新记忆'}
                </h3>
                <button
                  className="modal-close"
                  onClick={handleCloseModal}
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">日期</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">标题</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="给这段记忆起个名字"
                    required
                    maxLength={50}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">描述</label>
                  <textarea
                    className="form-textarea"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="记录下这段美好的回忆..."
                    required
                    maxLength={500}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">图片</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileInput}
                  />
                  
                  {formData.imageUrl ? (
                    <div className="upload-preview">
                      <img src={formData.imageUrl} alt="预览" />
                      <button
                        type="button"
                        className="upload-preview-remove"
                        onClick={removeImage}
                      >
                        ×
                      </button>
                    </div>
                  ) : (
                    <div
                      ref={drop}
                      className={`upload-area ${isDraggingOver ? 'dragging' : ''}`}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <div className="upload-icon">📸</div>
                      <p className="upload-text">点击或拖拽图片到此处上传</p>
                      <p className="upload-hint">支持 JPG、PNG、GIF 格式</p>
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <motion.button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    取消
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="btn btn-primary"
                    disabled={!formData.date || !formData.title || !formData.description || !formData.imageUrl}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {editingMemory ? '保存修改' : '添加记忆'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default MemoryGrid
