import { useState, useRef } from 'react'
import type { Bookmark } from '../server'

interface BookmarkFormProps {
  onSaved: (bookmark: Bookmark) => void
}

const CATEGORIES: Record<string, { label: string; color: string }> = {
  design: { label: '设计', color: '#e57373' },
  programming: { label: '编程', color: '#64b5f6' },
  writing: { label: '写作', color: '#81c784' },
  life: { label: '生活', color: '#ffb74d' }
}

const TYPES: Array<{ value: 'text' | 'image' | 'note'; label: string; color: string }> = [
  { value: 'text', label: '文本', color: '#90a4ae' },
  { value: 'image', label: '图片', color: '#ba68c8' },
  { value: 'note', label: '笔记', color: '#4db6ac' }
]

function BookmarkForm({ onSaved }: BookmarkFormProps) {
  const [type, setType] = useState<'text' | 'image' | 'note'>('text')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('design')
  const [note, setNote] = useState('')
  const [shaking, setShaking] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      return
    }

    try {
      const res = await fetch('/api/bookmarks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          content: content.trim(),
          category,
          note: note.trim(),
          timestamp: new Date().toISOString()
        })
      })

      if (res.ok) {
        const bookmark = await res.json()
        onSaved(bookmark)
        setContent('')
        setNote('')
        setShaking(true)
        setTimeout(() => setShaking(false), 500)
      }
    } catch (err) {
      console.error('Failed to save bookmark:', err)
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className={shaking ? 'shake' : ''}
      style={{
        background: 'white',
        borderRadius: 16,
        padding: 24,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}
    >
      <div>
        <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8, fontWeight: 500 }}>
          类型
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TYPES.map(t => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              style={{
                padding: '8px 16px',
                borderRadius: 999,
                border: `2px solid ${type === t.value ? t.color : '#e0e0e0'}`,
                background: type === t.value ? `${t.color}15` : 'white',
                color: type === t.value ? t.color : '#666',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: t.color,
                  display: 'inline-block'
                }}
              />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8, fontWeight: 500 }}>
          {type === 'image' ? '图片URL' : type === 'note' ? '笔记内容' : '文本内容'}
        </label>
        {type === 'image' ? (
          <input
            type="url"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="https://example.com/image.jpg"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #e0e0e0',
              fontSize: 14,
              outline: 'none',
              transition: 'border-color 200ms',
              color: '#333'
            }}
            onFocus={(e) => (e.target.style.borderColor = '#999')}
            onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
          />
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={type === 'note' ? '记录你的灵感...' : '输入要保存的文本...'}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 10,
              border: '1px solid #e0e0e0',
              fontSize: 14,
              outline: 'none',
              resize: 'vertical',
              minHeight: 60,
              transition: 'border-color 200ms',
              color: '#333',
              fontFamily: 'inherit'
            }}
            onFocus={(e) => (e.target.style.borderColor = '#999')}
            onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
          />
        )}
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8, fontWeight: 500 }}>
          分类
        </label>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {Object.entries(CATEGORIES).map(([key, { label, color }]) => (
            <label
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
                fontSize: 14,
                color: '#555'
              }}
            >
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  background: category === key ? color : 'transparent',
                  border: `2px solid ${color}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 200ms'
                }}
              >
                {category === key && (
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} />
                )}
              </span>
              <input
                type="radio"
                name="category"
                value={key}
                checked={category === key}
                onChange={() => setCategory(key)}
                style={{ display: 'none' }}
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, color: '#666', marginBottom: 8, fontWeight: 500 }}>
          备注（可选）
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="添加一些备注..."
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: 10,
            border: '1px solid #e0e0e0',
            fontSize: 14,
            outline: 'none',
            transition: 'border-color 200ms',
            color: '#333'
          }}
          onFocus={(e) => (e.target.style.borderColor = '#999')}
          onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
        />
      </div>

      <button
        type="submit"
        style={{
          alignSelf: 'flex-end',
          padding: '10px 28px',
          borderRadius: 999,
          border: 'none',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontSize: 14,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)'
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(102, 126, 234, 0.3)'
        }}
      >
        💾 保存灵感
      </button>
    </form>
  )
}

export default BookmarkForm
