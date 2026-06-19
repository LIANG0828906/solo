import { useState } from 'react'
import { motion } from 'framer-motion'
import { useBookStore } from './store'

function DonateForm() {
  const { addBook, toggleDonateForm } = useBookStore()
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [description, setDescription] = useState('')
  const [donor, setDonor] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const MAX_DESC_LENGTH = 200

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}
    if (!title.trim()) {
      newErrors.title = '请输入书名'
    }
    if (!author.trim()) {
      newErrors.author = '请输入作者'
    }
    if (!donor.trim()) {
      newErrors.donor = '请输入您的昵称'
    }
    if (description.length > MAX_DESC_LENGTH) {
      newErrors.description = `简介不能超过${MAX_DESC_LENGTH}字`
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      addBook({
        title: title.trim(),
        author: author.trim(),
        coverUrl: coverUrl.trim() || `https://picsum.photos/seed/${Date.now()}/300/450`,
        description: description.trim() || '暂无简介',
        donor: donor.trim(),
      })
    }
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      toggleDonateForm()
    }
  }

  const handleCancel = () => {
    toggleDonateForm()
  }

  return (
    <motion.div
      className="modal-overlay"
      onClick={handleOverlayClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="modal-content donate-form-modal"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-btn"
          onClick={handleCancel}
          aria-label="关闭"
        >
          ×
        </button>

        <h2 className="donate-form-title">捐赠书籍</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">书名 *</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="请输入书名"
            />
            {errors.title && (
              <div style={{ color: '#E53935', fontSize: '12px', marginTop: '4px' }}>
                {errors.title}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">作者 *</label>
            <input
              type="text"
              className="form-input"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="请输入作者"
            />
            {errors.author && (
              <div style={{ color: '#E53935', fontSize: '12px', marginTop: '4px' }}>
                {errors.author}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">封面图片URL</label>
            <input
              type="url"
              className="form-input"
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="选填，将使用随机封面"
            />
          </div>

          <div className="form-group">
            <label className="form-label">您的昵称 *</label>
            <input
              type="text"
              className="form-input"
              value={donor}
              onChange={(e) => setDonor(e.target.value)}
              placeholder="请输入您的昵称"
            />
            {errors.donor && (
              <div style={{ color: '#E53935', fontSize: '12px', marginTop: '4px' }}>
                {errors.donor}
              </div>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">书籍简介</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="选填，简单介绍一下这本书"
              maxLength={MAX_DESC_LENGTH}
            />
            <div className="char-count">
              {description.length}/{MAX_DESC_LENGTH}
            </div>
            {errors.description && (
              <div style={{ color: '#E53935', fontSize: '12px', marginTop: '4px' }}>
                {errors.description}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleCancel}>
              取消
            </button>
            <button type="submit" className="btn-submit">
              捐赠
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

export default DonateForm
