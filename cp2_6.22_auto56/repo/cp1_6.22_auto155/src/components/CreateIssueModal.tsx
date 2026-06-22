import React, { useState } from 'react'

interface CreateIssueModalProps {
  onClose: () => void
  onSubmit: (data: {
    title: string
    description: string
    options: { name: string; emoji: string }[]
    deadline: number
  }) => void
}

const EMOJI_OPTIONS = ['📊', '🎯', '💡', '🔥', '⭐', '✅', '🚀', '🎨', '💻', '📱', '🎮', '📚', '🍀', '🌈', '⚡', '🎁']

const CreateIssueModal: React.FC<CreateIssueModalProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [options, setOptions] = useState<{ name: string; emoji: string }[]>([
    { name: '', emoji: '✅' },
    { name: '', emoji: '⭐' }
  ])
  const [deadlineDate, setDeadlineDate] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return d.toISOString().slice(0, 16)
  })

  const handleAddOption = () => {
    if (options.length < 4) {
      setOptions([...options, { name: '', emoji: EMOJI_OPTIONS[options.length % EMOJI_OPTIONS.length] }])
    }
  }

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index))
    }
  }

  const handleOptionChange = (index: number, field: 'name' | 'emoji', value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setOptions(newOptions)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      alert('请填写标题和描述')
      return
    }
    if (options.some(o => !o.name.trim())) {
      alert('请填写所有选项名称')
      return
    }
    const deadline = new Date(deadlineDate).getTime()
    if (isNaN(deadline)) {
      alert('请选择有效的截止时间')
      return
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      options: options.map(o => ({ name: o.name.trim(), emoji: o.emoji })),
      deadline
    })
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>创建新议题</h2>
          <button style={styles.closeBtn} onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>议题标题</label>
            <input
              style={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="请输入议题标题"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>详细描述</label>
            <textarea
              style={styles.textarea}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="请详细描述议题背景和需要决策的内容..."
              rows={4}
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>投票选项 (2-4个)</label>
            <div style={styles.optionsContainer}>
              {options.map((option, index) => (
                <div key={index} style={styles.optionRow}>
                  <select
                    style={styles.emojiSelect}
                    value={option.emoji}
                    onChange={e => handleOptionChange(index, 'emoji', e.target.value)}
                  >
                    {EMOJI_OPTIONS.map(emoji => (
                      <option key={emoji} value={emoji}>{emoji}</option>
                    ))}
                  </select>
                  <input
                    style={styles.optionInput}
                    value={option.name}
                    onChange={e => handleOptionChange(index, 'name', e.target.value)}
                    placeholder={`选项 ${index + 1}`}
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      style={styles.removeBtn}
                      onClick={() => handleRemoveOption(index)}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            {options.length < 4 && (
              <button
                type="button"
                style={styles.addBtn}
                onClick={handleAddOption}
              >
                + 添加选项
              </button>
            )}
          </div>
          <div style={styles.field}>
            <label style={styles.label}>截止时间</label>
            <input
              type="datetime-local"
              style={styles.input}
              value={deadlineDate}
              onChange={e => setDeadlineDate(e.target.value)}
            />
          </div>
          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              取消
            </button>
            <button type="submit" style={styles.submitBtn}>
              创建议题
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
  },
  modal: {
    background: '#FFFFFF',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    animation: 'fadeIn 0.3s ease',
  },
  header: {
    padding: '20px 24px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '18px',
    fontWeight: 600,
    color: '#1F2937',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: '#9CA3AF',
    cursor: 'pointer',
    padding: '4px',
    lineHeight: 1,
  },
  form: {
    padding: '20px 24px',
    overflowY: 'auto',
    flex: 1,
  },
  field: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: 600,
    color: '#374151',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    background: '#FFFFFF',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    outline: 'none',
    transition: 'border-color 0.2s ease',
    background: '#FFFFFF',
    boxSizing: 'border-box',
    lineHeight: 1.5,
  },
  optionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '12px',
  },
  optionRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  emojiSelect: {
    padding: '10px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '18px',
    background: '#FFFFFF',
    cursor: 'pointer',
    outline: 'none',
    width: '56px',
    textAlign: 'center',
  },
  optionInput: {
    flex: 1,
    padding: '10px 14px',
    border: '1px solid #E5E7EB',
    borderRadius: '10px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    background: '#FFFFFF',
    boxSizing: 'border-box',
  },
  removeBtn: {
    width: '36px',
    height: '36px',
    border: '1px solid #E5E7EB',
    background: '#F9FAFB',
    borderRadius: '10px',
    color: '#9CA3AF',
    cursor: 'pointer',
    fontSize: '14px',
  },
  addBtn: {
    padding: '8px 16px',
    border: '1px dashed #D1D5DB',
    background: 'transparent',
    borderRadius: '10px',
    color: '#6B7280',
    fontSize: '13px',
    cursor: 'pointer',
    fontWeight: 500,
  },
  actions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '8px',
    paddingTop: '20px',
    borderTop: '1px solid #E5E7EB',
  },
  cancelBtn: {
    padding: '10px 20px',
    border: '1px solid #E5E7EB',
    background: '#FFFFFF',
    color: '#6B7280',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
  submitBtn: {
    padding: '10px 24px',
    background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '10px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
  },
}

export default CreateIssueModal
