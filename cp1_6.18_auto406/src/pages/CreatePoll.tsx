import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePollStore } from '../store/usePollStore'

function CreatePoll() {
  const navigate = useNavigate()
  const setPollData = usePollStore((state) => state.setPollData)
  const reset = usePollStore((state) => state.reset)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [optionNames, setOptionNames] = useState<string[]>(['', ''])

  const handleAddOption = () => {
    setOptionNames([...optionNames, ''])
  }

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...optionNames]
    newOptions[index] = value
    setOptionNames(newOptions)
  }

  const handleRemoveOption = (index: number) => {
    if (optionNames.length <= 2) return
    const newOptions = optionNames.filter((_, i) => i !== index)
    setOptionNames(newOptions)
  }

  const handleCreate = () => {
    const validOptions = optionNames.filter((name) => name.trim() !== '')
    if (!title.trim() || validOptions.length < 2) return

    reset()
    const pollId = Math.random().toString(36).substring(2, 8).toUpperCase()
    setPollData({
      currentPollId: pollId,
      pollTitle: title,
      pollDescription: description,
      options: validOptions.map((name, idx) => ({
        id: `opt-${idx}`,
        name,
        votes: 0,
      })),
      isEnded: false,
      hasVoted: false,
    })
    navigate(`/poll/${pollId}`)
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.heading}>创建投票</h2>
      <div style={styles.form}>
        <input
          type="text"
          placeholder="投票标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />
        <textarea
          placeholder="投票描述（可选）"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={styles.textarea}
        />
        <div style={styles.optionsLabel}>选项</div>
        {optionNames.map((name, index) => (
          <div key={index} style={styles.optionRow}>
            <input
              type="text"
              placeholder={`选项 ${index + 1}`}
              value={name}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              style={styles.optionInput}
            />
            {optionNames.length > 2 && (
              <button onClick={() => handleRemoveOption(index)} style={styles.removeBtn}>
                ×
              </button>
            )}
          </div>
        ))}
        <button onClick={handleAddOption} style={styles.addBtn}>
          + 添加选项
        </button>
        <button onClick={handleCreate} style={styles.createBtn}>
          创建投票
        </button>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '24px',
  },
  heading: {
    color: '#E0E0E0',
    marginBottom: '20px',
    fontSize: '24px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    maxWidth: '500px',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #2E2E4A',
    background: '#1E1E2E',
    color: '#E0E0E0',
    fontSize: '14px',
    outline: 'none',
  },
  textarea: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #2E2E4A',
    background: '#1E1E2E',
    color: '#E0E0E0',
    fontSize: '14px',
    outline: 'none',
    minHeight: '80px',
    resize: 'vertical',
    fontFamily: 'inherit',
  },
  optionsLabel: {
    color: '#E0E0E0',
    fontWeight: '600',
    marginTop: '8px',
  },
  optionRow: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  optionInput: {
    flex: 1,
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #2E2E4A',
    background: '#1E1E2E',
    color: '#E0E0E0',
    fontSize: '14px',
    outline: 'none',
  },
  removeBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    border: 'none',
    background: '#2E2E4A',
    color: '#E0E0E0',
    fontSize: '20px',
    cursor: 'pointer',
  },
  addBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px dashed #7C3AED',
    background: 'transparent',
    color: '#7C3AED',
    fontSize: '14px',
    cursor: 'pointer',
  },
  createBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    background: '#7C3AED',
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
  },
}

export default CreatePoll
