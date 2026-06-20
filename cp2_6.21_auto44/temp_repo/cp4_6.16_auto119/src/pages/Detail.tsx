import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMoodStore, createMoodRecord } from '../store'
import { MOOD_MAP, MOOD_CONFIGS } from '../types'
import type { MoodType } from '../types'
import './Detail.css'

function Detail() {
  const { date } = useParams<{ date: string }>()
  const navigate = useNavigate()
  const { addRecord, deleteRecord, getRecordByDate } = useMoodStore()
  
  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null)
  const [moodText, setMoodText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const record = date ? getRecordByDate(date) : undefined

  useEffect(() => {
    if (record) {
      setSelectedMood(record.moodType)
      setMoodText(record.text)
    }
  }, [record])

  const handleBack = () => {
    navigate('/')
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancel = () => {
    if (record) {
      setSelectedMood(record.moodType)
      setMoodText(record.text)
    }
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!selectedMood || !date || isSaving) return
    
    setIsSaving(true)
    const newRecord = createMoodRecord(date, selectedMood, moodText.trim())
    await addRecord(newRecord)
    setIsSaving(false)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (!record) return
    await deleteRecord(record.id)
    navigate('/')
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
  }

  const moodConfig = selectedMood ? MOOD_MAP[selectedMood] : null

  return (
    <div className="detail-page">
      <div className="detail-header">
        <button className="back-btn" onClick={handleBack}>
          ← 返回
        </button>
        <h1 className="detail-date">{date ? formatDate(date) : ''}</h1>
        <div className="header-actions">
          {record && !isEditing && (
            <>
              <button className="edit-btn" onClick={handleEdit}>
                编辑
              </button>
              <button 
                className="delete-btn"
                onClick={() => setShowDeleteConfirm(true)}
              >
                删除
              </button>
            </>
          )}
        </div>
      </div>

      <div 
        className="detail-content"
        style={{
          '--mood-color': moodConfig?.color || '#f0f0f0',
        } as React.CSSProperties}
      >
        {record || isEditing ? (
          <>
            <div className="mood-display">
              {isEditing ? (
                <div className="mood-selector">
                  <h3>选择情绪</h3>
                  <div className="mood-options">
                    {MOOD_CONFIGS.map((config) => (
                      <button
                        key={config.type}
                        className={`mood-option ${selectedMood === config.type ? 'selected' : ''}`}
                        style={{ backgroundColor: config.color }}
                        onClick={() => setSelectedMood(config.type)}
                      >
                        <span className="option-emoji">{config.emoji}</span>
                        <span className="option-label">{config.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mood-showcase">
                  <div className="mood-circle" style={{ backgroundColor: moodConfig?.color }}>
                    <span className="mood-emoji">{moodConfig?.emoji}</span>
                  </div>
                  <div className="mood-name">{moodConfig?.label}</div>
                </div>
              )}
            </div>

            <div className="text-section">
              <h3>心情记录</h3>
              {isEditing ? (
                <div className="text-edit">
                  <textarea
                    className="mood-textarea"
                    value={moodText}
                    onChange={(e) => {
                      if (e.target.value.length <= 140) {
                        setMoodText(e.target.value)
                      }
                    }}
                    maxLength={140}
                    placeholder="记录一下今天的心情吧..."
                    rows={6}
                    autoFocus
                  />
                  <div className="textarea-actions">
                    <span className="char-count">{moodText.length}/140</span>
                    <div className="action-buttons">
                      <button className="cancel-btn" onClick={handleCancel}>
                        取消
                      </button>
                      <button 
                        className="save-btn"
                        onClick={handleSave}
                        disabled={!selectedMood || isSaving}
                      >
                        {isSaving ? '保存中...' : '保存'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-show">
                  {record?.text ? (
                    <p className="mood-text">{record.text}</p>
                  ) : (
                    <p className="no-text">暂无文字记录</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="no-record">
            <div className="no-record-icon">📝</div>
            <h3>还没有记录</h3>
            <p>为这一天添加一个心情记录吧</p>
            <button className="add-record-btn" onClick={handleEdit}>
              添加记录
            </button>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="delete-modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="delete-modal" onClick={(e) => e.stopPropagation()}>
            <h3>确认删除</h3>
            <p>确定要删除这条心情记录吗？此操作无法撤销。</p>
            <div className="modal-actions">
              <button 
                className="modal-cancel"
                onClick={() => setShowDeleteConfirm(false)}
              >
                取消
              </button>
              <button 
                className="modal-delete"
                onClick={handleDelete}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Detail
