import { useState, KeyboardEvent } from 'react'
import { X, Asterisk, Sparkles, ChevronDown } from 'lucide-react'

export type SkillPriority = 'required' | 'bonus'

export interface SkillWithPriority {
  name: string
  priority: SkillPriority
}

interface SkillTagInputProps {
  title: string
  skills: SkillWithPriority[]
  onChange: (skills: SkillWithPriority[]) => void
  placeholder?: string
  defaultPriority?: SkillPriority
  requiredCount?: number
}

export default function SkillTagInput({
  title,
  skills,
  onChange,
  placeholder = '输入技能后按回车添加...',
  defaultPriority = 'required',
  requiredCount = 2,
}: SkillTagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [currentPriority, setCurrentPriority] = useState<SkillPriority>(defaultPriority)
  const [showPriorityDropdown, setShowPriorityDropdown] = useState(false)

  const requiredSkills = skills.filter(s => s.priority === 'required')
  const bonusSkills = skills.filter(s => s.priority === 'bonus')

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const newSkill = inputValue.trim()
      if (!skills.some(s => s.name.toLowerCase() === newSkill.toLowerCase())) {
        onChange([...skills, { name: newSkill, priority: currentPriority }])
      }
      setInputValue('')
    } else if (e.key === 'Backspace' && !inputValue && skills.length > 0) {
      onChange(skills.slice(0, -1))
    }
  }

  const removeSkill = (index: number) => {
    onChange(skills.filter((_, i) => i !== index))
  }

  const togglePriority = (index: number) => {
    const newSkills = [...skills]
    newSkills[index] = {
      ...newSkills[index],
      priority: newSkills[index].priority === 'required' ? 'bonus' : 'required'
    }
    onChange(newSkills)
  }

  const getTagStyle = (priority: SkillPriority, index: number) => {
    if (priority === 'required') {
      return {
        background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(245, 158, 11, 0.12) 100%)',
        border: '1px solid rgba(251, 191, 36, 0.35)',
        color: '#fbbf24',
        animationDelay: `${index * 50}ms`,
      }
    }
    return {
      background: 'linear-gradient(135deg, rgba(74, 237, 196, 0.1) 0%, rgba(45, 212, 168, 0.06) 100%)',
      border: '1px solid rgba(74, 237, 196, 0.15)',
      color: 'rgba(74, 237, 196, 0.85)',
      animationDelay: `${index * 50}ms`,
    }
  }

  const getPriorityBadge = (priority: SkillPriority) => {
    if (priority === 'required') {
      return (
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold"
          style={{
            background: 'rgba(251, 191, 36, 0.15)',
            color: '#fbbf24',
            border: '1px solid rgba(251, 191, 36, 0.25)',
          }}
        >
          <Asterisk size={9} />
          必需
        </span>
      )
    }
    return (
      <span
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium"
        style={{
          background: 'rgba(74, 237, 196, 0.08)',
          color: 'rgba(74, 237, 196, 0.7)',
          border: '1px solid rgba(74, 237, 196, 0.15)',
        }}
      >
        <Sparkles size={9} />
        加分
      </span>
    )
  }

  const needsMoreRequired = requiredSkills.length < requiredCount

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
        <span className="flex items-center gap-1.5 flex-wrap">
          {title}
          <span className="inline-flex items-center gap-1">
            <span className="text-xs" style={{ color: needsMoreRequired ? '#fbbf24' : 'var(--text-muted)' }}>
              ({requiredSkills.length} 必需 / {bonusSkills.length} 加分)
            </span>
          </span>
        </span>
      </label>

      <div
        className="flex flex-col gap-3 p-3 rounded-xl min-h-[52px] transition-all"
        style={{
          background: 'rgba(10, 22, 40, 0.4)',
          border: '1px solid rgba(74, 237, 196, 0.1)',
        }}
      >
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={`${skill.name}-${index}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium animate-fadeInUp"
                style={getTagStyle(skill.priority, index)}
              >
                <button
                  type="button"
                  onClick={() => togglePriority(index)}
                  className="hover:scale-110 transition-transform"
                  title={`切换为${skill.priority === 'required' ? '加分' : '必需'}技能`}
                >
                  {getPriorityBadge(skill.priority)}
                </button>
                {skill.name}
                <button
                  type="button"
                  onClick={() => removeSkill(index)}
                  className="ml-1 p-0.5 rounded-full hover:bg-white/10 transition-colors"
                >
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPriorityDropdown(!showPriorityDropdown)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/5"
              style={{
                background: currentPriority === 'required'
                  ? 'rgba(251, 191, 36, 0.12)'
                  : 'rgba(74, 237, 196, 0.08)',
                color: currentPriority === 'required' ? '#fbbf24' : 'rgba(74, 237, 196, 0.85)',
                border: `1px solid ${currentPriority === 'required'
                  ? 'rgba(251, 191, 36, 0.25)'
                  : 'rgba(74, 237, 196, 0.15)'}`,
              }}
            >
              {currentPriority === 'required' ? <Asterisk size={12} /> : <Sparkles size={12} />}
              {currentPriority === 'required' ? '必需' : '加分'}
              <ChevronDown size={12} className={`transition-transform ${showPriorityDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showPriorityDropdown && (
              <div
                className="absolute top-full left-0 mt-1.5 rounded-xl overflow-hidden z-30"
                style={{
                  background: 'rgba(10, 22, 40, 0.95)',
                  border: '1px solid rgba(74, 237, 196, 0.15)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                }}
              >
                <button
                  type="button"
                  onClick={() => { setCurrentPriority('required'); setShowPriorityDropdown(false) }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-xs font-medium transition-colors hover:bg-white/5"
                  style={{ color: currentPriority === 'required' ? '#fbbf24' : 'var(--text-secondary)' }}
                >
                  <Asterisk size={12} style={{ color: '#fbbf24' }} />
                  必需技能
                </button>
                <button
                  type="button"
                  onClick={() => { setCurrentPriority('bonus'); setShowPriorityDropdown(false) }}
                  className="w-full px-3 py-2 flex items-center gap-2 text-xs font-medium transition-colors hover:bg-white/5"
                  style={{ color: currentPriority === 'bonus' ? 'rgba(74, 237, 196, 0.85)' : 'var(--text-secondary)' }}
                >
                  <Sparkles size={12} style={{ color: 'rgba(74, 237, 196, 0.85)' }} />
                  加分技能
                </button>
              </div>
            )}
          </div>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowPriorityDropdown(false), 150)}
            placeholder={skills.length === 0 ? placeholder : ''}
            className="flex-1 min-w-[120px] bg-transparent text-sm outline-none border-none"
            style={{
              color: 'var(--text-primary)',
              fontWeight: currentPriority === 'required' ? 500 : 400,
            }}
          />
        </div>
      </div>

      {needsMoreRequired && (
        <p className="text-xs" style={{ color: 'rgba(251, 191, 36, 0.7)' }}>
          ⚠ 至少需要 {requiredCount} 个必需技能才能生成推荐 (当前 {requiredSkills.length}/{requiredCount})
        </p>
      )}

      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
        💡 点击标签左侧的徽章可切换技能优先级
      </p>
    </div>
  )
}
