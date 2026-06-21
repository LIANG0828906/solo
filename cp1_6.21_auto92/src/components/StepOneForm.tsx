import React, { useState } from 'react'
import { FormData } from '../App'

interface StepOneFormProps {
  formData: FormData
  onChange: (field: keyof FormData, value: string) => void
  onNext: () => void
  loading: boolean
}

const FIELDS: { key: keyof FormData; label: string; type?: string }[] = [
  { key: 'name', label: '姓名' },
  { key: 'phone', label: '电话', type: 'tel' },
  { key: 'email', label: '邮箱', type: 'email' },
  { key: 'targetPosition', label: '目标职位' },
]

const StepOneForm: React.FC<StepOneFormProps> = ({ formData, onChange, onNext, loading }) => {
  const [focusedField, setFocusedField] = useState<string | null>(null)

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>填写基本信息</h2>
      {FIELDS.map(({ key, label, type }) => (
        <div key={key} style={styles.fieldGroup}>
          <label style={styles.label}>{label}</label>
          <div style={{
            ...styles.inputWrapper,
            ...(focusedField === key ? styles.inputWrapperFocused : {}),
          }}>
            <input
              type={type || 'text'}
              value={formData[key]}
              onChange={e => onChange(key, e.target.value)}
              onFocus={() => setFocusedField(key)}
              onBlur={() => setFocusedField(null)}
              style={styles.input}
              placeholder={`请输入${label}`}
            />
          </div>
        </div>
      ))}

      <button
        onClick={onNext}
        disabled={loading || !formData.name || !formData.targetPosition}
        style={{
          ...styles.nextButton,
          opacity: loading || !formData.name || !formData.targetPosition ? 0.6 : 1,
          cursor: loading || !formData.name || !formData.targetPosition ? 'not-allowed' : 'pointer',
        }}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {loading ? '生成中...' : '下一步'}
      </button>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#FFFFFF',
    borderRadius: 8,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1F2937',
    marginBottom: 20,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  label: {
    display: 'block',
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 500,
    color: '#374151',
  },
  inputWrapper: {
    padding: 2,
    borderRadius: 12,
    background: '#E5E7EB',
    transition: 'background 0.25s, box-shadow 0.25s',
  },
  inputWrapperFocused: {
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    boxShadow: '0 0 0 3px rgba(99,102,241,0.15)',
  },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 10,
    border: 'none',
    outline: 'none',
    background: '#F9FAFB',
    padding: '0 14px',
    fontSize: 15,
    color: '#1F2937',
    boxSizing: 'border-box',
  },
  nextButton: {
    width: '100%',
    height: 48,
    border: 'none',
    borderRadius: 8,
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity 0.2s, transform 0.2s',
    marginTop: 8,
  },
}

export default StepOneForm
