import { useState, useEffect } from 'react'

interface CreateBoardModalProps {
  open: boolean
  onClose: () => void
  onCreate: (title: string, description: string) => void
}

function CreateBoardModal({ open, onClose, onCreate }: CreateBoardModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    if (open) {
      setTitle('')
      setDescription('')
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim()) {
      onCreate(title.trim(), description.trim())
    }
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">创建新灵感板</h3>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>标题</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="给你的灵感板起个名字"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>描述（可选）</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="简单描述一下这个灵感板的用途..."
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="btn-primary" disabled={!title.trim()}>
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateBoardModal
