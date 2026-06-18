import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDrop } from 'react-dnd'
import { Memory } from '../data/sampleData'

interface MemoryGridProps {
  memories: Memory[]
  selectedYear: number
  onAddMemory: (memory: Omit<Memory, 'id'>) => void
  onUpdateMemory: (id: string, updates: Partial<Memory>) => void
  onDeleteMemory: (id: string) => void
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

function MemoryGrid({ memories, selectedYear, onAddMemory, onUpdateMemory, onDeleteMemory }: MemoryGridProps) {
  const [flippedCard, setFlippedCard] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [isDraggingOver, setIsDraggingOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    show: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 25,
        mass: 0.8
      }
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 }
    }
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

      <AnimatePresence mode="wait">
        {memories.length > 0 ? (
          <motion.div
            key="grid"
            className="memory-grid"
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {memories.map((memory, index) => (
              <motion.div
                key={memory.id}
                className={`memory-card ${flippedCard === memory.id ? 'flipped' : ''}`}
                variants={cardVariants}
                custom={index}
                onClick={() => handleCardClick(memory.id)}
                layout
              >
                <div className="card-inner">
                  <div className="card-front">
                    <img
                      src={memory.imageUrl}
                      alt={memory.title}
                      className="card-image"
                      loading="lazy"
                    />
                    <div className="card-content">
                      <div className="card-date">{memory.date}</div>
                      <h3 className="card-title">{memory.title}</h3>
                      <p className="card-description">{memory.description}</p>
                    </div>
                  </div>
                  
                  <div className="card-back">
                    <h3>{memory.title}</h3>
                    <p>{memory.description}</p>
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
                    <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '16px' }}>
                      点击卡片返回
                    </p>
                  </div>
                </div>
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
