import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivityStore } from '../store/activityStore'

interface FormData {
  name: string
  participantCount: number
  teamSize: number
  strategy: 'balanced' | 'random'
}

const CreateActivity: React.FC = () => {
  const navigate = useNavigate()
  const setActivity = useActivityStore((s) => s.setActivity)
  const setParticipants = useActivityStore((s) => s.setParticipants)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    participantCount: 30,
    teamSize: 6,
    strategy: 'balanced',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = '请输入活动名称'
    }
    if (formData.participantCount < 20 || formData.participantCount > 100) {
      newErrors.participantCount = '参与人数必须在20-100之间'
    }
    if (formData.teamSize < 5 || formData.teamSize > 10) {
      newErrors.teamSize = '每组人数必须在5-10之间'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          participant_count: formData.participantCount,
          team_size: formData.teamSize,
          strategy: formData.strategy,
        }),
      })
      if (!res.ok) throw new Error('创建失败')
      const data = await res.json()
      setActivity(data.id, data.name, data.strategy)
      setParticipants(data.participants)
      navigate(`/room/${data.id}`)
    } catch (err) {
      console.error(err)
      setErrors({ name: '创建活动失败，请重试' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="create-page" style={styles.page}>
      <div className="create-card fade-in" style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>创建活动</h1>
          <p style={styles.subtitle}>智能分组，高效协作</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.formGroup}>
            <label style={styles.label}>活动名称</label>
            <input
              type="text"
              style={{
                ...styles.input,
                ...(errors.name ? styles.inputError : {}),
              }}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="请输入活动名称"
            />
            {errors.name && <span style={styles.errorText}>{errors.name}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              参与者人数：<span style={styles.highlight}>{formData.participantCount}</span> 人
            </label>
            <input
              type="range"
              min={20}
              max={100}
              value={formData.participantCount}
              onChange={(e) =>
                setFormData({ ...formData, participantCount: Number(e.target.value) })
              }
              style={styles.range}
            />
            <div style={styles.rangeLabels}>
              <span>20</span>
              <span>100</span>
            </div>
            {errors.participantCount && (
              <span style={styles.errorText}>{errors.participantCount}</span>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>
              每组人数上限：<span style={styles.highlight}>{formData.teamSize}</span> 人
            </label>
            <input
              type="range"
              min={5}
              max={10}
              value={formData.teamSize}
              onChange={(e) => setFormData({ ...formData, teamSize: Number(e.target.value) })}
              style={styles.range}
            />
            <div style={styles.rangeLabels}>
              <span>5</span>
              <span>10</span>
            </div>
            {errors.teamSize && <span style={styles.errorText}>{errors.teamSize}</span>}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>分组策略</label>
            <div style={styles.radioGroup}>
              <label
                style={{
                  ...styles.radioOption,
                  ...(formData.strategy === 'balanced' ? styles.radioActive : {}),
                }}
              >
                <input
                  type="radio"
                  name="strategy"
                  value="balanced"
                  checked={formData.strategy === 'balanced'}
                  onChange={() => setFormData({ ...formData, strategy: 'balanced' })}
                  style={styles.radioInput}
                />
                <span>技能均衡</span>
                <span style={styles.radioHint}>各组能力总和相近</span>
              </label>
              <label
                style={{
                  ...styles.radioOption,
                  ...(formData.strategy === 'random' ? styles.radioActive : {}),
                }}
              >
                <input
                  type="radio"
                  name="strategy"
                  value="random"
                  checked={formData.strategy === 'random'}
                  onChange={() => setFormData({ ...formData, strategy: 'random' })}
                  style={styles.radioInput}
                />
                <span>完全随机</span>
                <span style={styles.radioHint}>打乱顺序分配</span>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              ...styles.submitBtn,
              ...(submitting ? styles.submitBtnDisabled : {}),
            }}
          >
            {submitting ? '创建中...' : '创建活动'}
          </button>
        </form>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f5f5 0%, #e8e8f0 100%)',
    padding: '20px',
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '40px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 700,
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    marginBottom: '8px',
  },
  subtitle: {
    color: '#888',
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  highlight: {
    color: '#667eea',
    fontWeight: 700,
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  range: {
    width: '100%',
    height: '8px',
    borderRadius: '4px',
    background: '#e0e0e0',
    outline: 'none',
    cursor: 'pointer',
    accentColor: '#667eea',
  },
  rangeLabels: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px',
    color: '#999',
  },
  radioGroup: {
    display: 'flex',
    gap: '12px',
  },
  radioOption: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
    padding: '16px 12px',
    border: '2px solid #e0e0e0',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
    fontSize: '14px',
    fontWeight: 500,
  },
  radioActive: {
    borderColor: '#667eea',
    background: 'linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.08))',
  },
  radioInput: {
    display: 'none',
  },
  radioHint: {
    fontSize: '11px',
    color: '#999',
    fontWeight: 400,
  },
  errorText: {
    fontSize: '12px',
    color: '#ff6b6b',
  },
  submitBtn: {
    marginTop: '8px',
    padding: '14px',
    border: 'none',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #667eea, #764ba2)',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 14px rgba(102,126,234,0.4)',
  },
  submitBtnDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
  },
}

export default CreateActivity
