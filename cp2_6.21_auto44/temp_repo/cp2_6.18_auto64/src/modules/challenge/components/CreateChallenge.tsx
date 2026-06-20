import React, { useState } from 'react'
import { useChallengeStore } from '../../../store/challengeStore'

interface MemberTag {
  email: string
  name: string
}

const CreateChallenge: React.FC = () => {
  const createChallenge = useChallengeStore(s => s.createChallenge)

  const [name, setName] = useState('')
  const [durationDays, setDurationDays] = useState(30)
  const [dailyGoal, setDailyGoal] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [members, setMembers] = useState<MemberTag[]>([])

  const handleAddMember = () => {
    const email = emailInput.trim()
    if (!email) return
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      alert('请输入有效的邮箱地址')
      return
    }
    if (members.some(m => m.email === email)) {
      alert('该邮箱已添加')
      return
    }
    setMembers([...members, { email, name: email.split('@')[0] }])
    setEmailInput('')
  }

  const handleRemoveMember = (email: string) => {
    setMembers(members.filter(m => m.email !== email))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddMember()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('请输入挑战名称')
      return
    }
    if (members.length === 0) {
      alert('至少添加一位成员')
      return
    }

    createChallenge(name.trim(), durationDays, dailyGoal.trim(), members)
  }

  return (
    <div className="fade-in" style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1
          style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '8px',
          }}
        >
          🏋️ FitPact
        </h1>
        <p style={{ color: '#94A3B8', fontSize: '16px' }}>
          创建挑战，和朋友一起坚持锻炼
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#1E293B',
          borderRadius: '24px',
          padding: '32px',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.25)',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              color: '#fff',
              fontWeight: '600',
              marginBottom: '10px',
              fontSize: '14px',
            }}
          >
            挑战名称
            <span style={{ color: '#64748B', fontWeight: '400', marginLeft: '8px' }}>
              （最多20字）
            </span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            placeholder="例如：30天俯卧撑挑战"
            style={{
              width: '100%',
              background: '#334155',
              color: '#fff',
              borderRadius: '12px',
              padding: '14px 16px',
              fontSize: '15px',
              border: 'none',
            }}
          />
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
            {name.length}/20
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              color: '#fff',
              fontWeight: '600',
              marginBottom: '10px',
              fontSize: '14px',
            }}
          >
            持续天数
            <span style={{ color: '#3B82F6', fontWeight: '600', marginLeft: '8px' }}>
              {durationDays} 天
            </span>
          </label>
          <input
            type="range"
            min="7"
            max="60"
            value={durationDays}
            onChange={(e) => setDurationDays(Number(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#334155',
              appearance: 'none',
              WebkitAppearance: 'none',
              cursor: 'pointer',
              accentColor: '#3B82F6',
            }}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#64748B',
              marginTop: '6px',
            }}
          >
            <span>7天</span>
            <span>60天</span>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label
            style={{
              display: 'block',
              color: '#fff',
              fontWeight: '600',
              marginBottom: '10px',
              fontSize: '14px',
            }}
          >
            每日目标描述
            <span style={{ color: '#64748B', fontWeight: '400', marginLeft: '8px' }}>
              （最多200字）
            </span>
          </label>
          <textarea
            value={dailyGoal}
            onChange={(e) => setDailyGoal(e.target.value.slice(0, 200))}
            placeholder="例如：每天完成100个俯卧撑，可以分组完成"
            rows={3}
            style={{
              width: '100%',
              background: '#334155',
              color: '#fff',
              borderRadius: '12px',
              padding: '14px 16px',
              fontSize: '15px',
              border: 'none',
              resize: 'vertical',
              minHeight: '80px',
            }}
          />
          <div style={{ textAlign: 'right', fontSize: '12px', color: '#64748B', marginTop: '6px' }}>
            {dailyGoal.length}/200
          </div>
        </div>

        <div style={{ marginBottom: '32px' }}>
          <label
            style={{
              display: 'block',
              color: '#fff',
              fontWeight: '600',
              marginBottom: '10px',
              fontSize: '14px',
            }}
          >
            邀请成员
          </label>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
            <input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="输入邮箱地址，按回车添加"
              style={{
                flex: 1,
                background: '#334155',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '14px',
                border: 'none',
              }}
            />
            <button
              type="button"
              onClick={handleAddMember}
              style={{
                background: '#3B82F6',
                color: '#fff',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              添加
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {members.map((member) => (
              <div
                key={member.email}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: '#3B82F6',
                  color: '#fff',
                  padding: '6px 10px 6px 12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                }}
              >
                <span>{member.email}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveMember(member.email)}
                  style={{
                    background: 'transparent',
                    color: '#fff',
                    fontSize: '16px',
                    padding: '0 2px',
                    lineHeight: 1,
                    opacity: 0.8,
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {members.length === 0 && (
            <p style={{ color: '#64748B', fontSize: '13px', marginTop: '8px' }}>
              还没有添加成员，至少添加一位吧
            </p>
          )}
        </div>

        <button
          type="submit"
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            color: '#fff',
            borderRadius: '12px',
            padding: '16px',
            fontSize: '16px',
            fontWeight: '600',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
          }}
        >
          创建挑战
        </button>
      </form>
    </div>
  )
}

export default CreateChallenge
