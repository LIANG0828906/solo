import { useState, KeyboardEvent } from 'react'
import { X, Asterisk, Sparkles } from 'lucide-react'

interface SkillTagInputProps {
  title: string
  skills: string[]
  onChange: (skills: string[]) => void
  placeholder?: string
  priority?: 'required' | 'bonus'
}

export default function SkillTagInput({
  title,
  skills,
  onChange,
  placeholder = '输入技能后按回车添加...',
  priority,
}: SkillTagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const newSkill = inputValue.trim()
      if (!skills.includes(newSkill)) {
        onChange([...skills, newSkill])
      }
      setInputValue('')
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      onChange(skills.slice(0, -1))
    }
  }

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index))
  }

  const getContainerStyle = () => {
    if (priority === 'required') {
      return {
        background: 'rgba(40, 26, 10, 0.4)',
        border: '1px solid rgba(251, 191, 36, 0.2)',
      }
    }
    if (priority === 'bonus') {
      return {
        background: 'rgba(10, 30, 25, 0.3)',
        border: '1px solid rgba(74, 237, 196, 0.08)',
      }
    }
    return {
      background: 'rgba(10, 22, 40, 0.4)',
      border: '1px solid rgba(74, 237, 196, 0.1)',
    }
  }

  const getTagStyle = (index: number) => {
    if (priority === 'required') {
      return {
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.12) 100%)',
        border: '1px solid rgba(251, 191, 36, 0.35)',
        color: '#fbbf24',
        animationDelay: `${index * 50}ms`,
      }
    }
    if (priority === 'bonus') {
      return {
        background: 'linear-gradient(135deg, rgba(74, 237, 196, 0.1) 0%, rgba(45, 212, 168, 0.06) 100%)',
        border: '1px solid rgba(74, 237, 196, 0.15)',
        color: 'rgba(74, 237, 196, 0.75)',
        animationDelay: `${index * 50}ms`,
      }
    }
    return {
      background: 'linear-gradient(135deg, rgba(74, 237, 196, 0.15) 0%, rgba(45, 212, 168, 0.1) 100%)',
      border: '1px solid rgba(74, 237, 196, 0.25)',
      color: 'var(--mint)',
      animationDelay: `${index * 50}ms`,
    }
  }

  const getTitleColor = () => {
    if (priority === 'required') return '#fbbf24'
    if (priority === 'bonus') return 'rgba(74, 237, 196, 0.85)'
    return 'var(--text-secondary)'
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold" style={{ color: getTitleColor() }}>
        <span className="flex items-center gap-1.5">
          {title}
          {priority === 'required' && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{
                background: 'rgba(251, 191, 36, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.25)',
              }}
            >
              <Asterisk size={9} />
              必需
            </span>
          )}
          {priority === 'bonus' && (
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                background: 'rgba(74, 237, 196, 0.08)',
                color: 'rgba(74, 237, 196, 0.7)',
                border: '1px solid rgba(74, 237, 196, 0.15)',
              }}
            >
              <Sparkles size={9} />
              加分
            </span>
          )}
          <span className="ml-1 text-xs" style={{ color: 'var(--text-muted)' }}>
            ({skills.length} 项)
          </span>
        </span>
      </label>
      <div
        className="flex flex-wrap gap-2 p-3 rounded-xl min-h-[52px] transition-all"
        style={getContainerStyle()}
      >
        {skills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium animate-fadeInUp"
            style={getTagStyle(index)}
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(index)}
              className="ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={14} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={skills.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] bg-transparent text-sm outline-none border-none"
          style={{
            color: 'var(--text-primary)',
            fontWeight: priority === 'required' ? 500 : 400,
          }}
        />
      </div>
      {priority === 'required' && skills.length === 0 && (
        <p className="text-xs" style={{ color: 'rgba(251, 191, 36, 0.7)' }}>
          ⚠ 至少需要 2 个必需技能才能生成推荐
        </p>
      )}
    </div>
  )
}
