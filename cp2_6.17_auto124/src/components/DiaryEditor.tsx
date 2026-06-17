import React, { useState, useEffect, useCallback } from 'react'
import { Save } from 'lucide-react'
import { useDiaryApi } from '../hooks/useDiaryApi'
import { useDiaryStore } from '../store/diaryStore'
import { ALL_TAGS, POSITIVE_TAGS, NEGATIVE_TAGS } from '../types'

export const DiaryEditor: React.FC = () => {
  const { currentDate, currentDiary, setCurrentDiary } = useDiaryStore()
  const { saveDiary, getDiary, calculateScore } = useDiaryApi()
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    loadDiary()
  }, [currentDate])

  const loadDiary = async () => {
    const diary = await getDiary(currentDate)
    if (diary) {
      setContent(diary.content)
      setSelectedTags(diary.tags)
      setCurrentDiary(diary)
    } else {
      setContent('')
      setSelectedTags([])
      setCurrentDiary(null)
    }
  }

  const toggleTag = (tagName: string) => {
    setSelectedTags(prev => {
      if (prev.includes(tagName)) {
        return prev.filter(t => t !== tagName)
      } else {
        return [...prev, tagName]
      }
    })
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const diary = await saveDiary(currentDate, content, selectedTags)
      setCurrentDiary(diary)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setIsSaving(false)
    }
  }

  const currentScore = calculateScore(selectedTags)

  const formatDisplayDate = useCallback((dateStr: string): string => {
    const date = new Date(dateStr)
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const month = date.getMonth() + 1
    const day = date.getDate()
    const weekday = weekdays[date.getDay()]
    return `${date.getFullYear()}年${month}月${day}日 ${weekday}`
  }, [])

  return (
    <div className="diary-editor">
      <div className="diary-date">{formatDisplayDate(currentDate)}</div>

      <textarea
        className="diary-textarea"
        placeholder="今天发生了什么？写下你的心情吧..."
        value={content}
        onChange={e => setContent(e.target.value)}
      />

      <div className="tags-section">
        <div className="tags-title">
          情感标签
          {selectedTags.length > 0 && (
            <span className={`score-badge ${currentScore > 0 ? 'positive' : currentScore < 0 ? 'negative' : 'neutral'}`}>
              {currentScore > 0 ? '+' : ''}{currentScore}分
            </span>
          )}
        </div>

        <div className="tags-group">
          <div className="tags-group-label">正面</div>
          <div className="tags-list">
            {POSITIVE_TAGS.map(tag => (
              <button
                key={tag.name}
                className={`tag-btn ${selectedTags.includes(tag.name) ? 'selected positive' : ''}`}
                onClick={() => toggleTag(tag.name)}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>

        <div className="tags-group">
          <div className="tags-group-label">负面</div>
          <div className="tags-list">
            {NEGATIVE_TAGS.map(tag => (
              <button
                key={tag.name}
                className={`tag-btn ${selectedTags.includes(tag.name) ? 'selected negative' : ''}`}
                onClick={() => toggleTag(tag.name)}
              >
                #{tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="editor-footer">
        <span className={`save-status ${saved ? 'visible' : ''}`}>已保存</span>
        <button
          className="save-btn"
          onClick={handleSave}
          disabled={isSaving}
        >
          <Save size={18} />
          {isSaving ? '保存中...' : '保存日记'}
        </button>
      </div>
    </div>
  )
}
