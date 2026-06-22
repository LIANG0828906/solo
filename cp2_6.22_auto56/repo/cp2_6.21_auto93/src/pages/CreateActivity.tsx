import React, { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useActivityStore } from '../store/activityStore'

interface FormData {
  name: string
  participantCount: number
  teamSize: number
  strategy: 'balanced' | 'random'
}

const COLOR_PALETTE = [
  '#667eea',
  '#764ba2',
  '#f093fb',
  '#f5576c',
  '#4facfe',
  '#43e97b',
  '#fa709a',
  '#fee140',
  '#30cfd0',
  '#ff9a9e',
  '#a18cd1',
  '#ffecd2',
]

const getColor = (seed: string | number) => {
  const str = String(seed)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length]
}

const CreateActivity: React.FC = () => {
  const navigate = useNavigate()
  const setActivity = useActivityStore((s) => s.setActivity)
  const setParticipants = useActivityStore((s) => s.setParticipants)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState<FormData>({
    name: '',
    participantCount: 30,
    teamSize: 6,
    strategy: 'balanced',
  })
  const [useCustomList, setUseCustomList] = useState(false)
  const [nameText, setNameText] = useState('')
  const [importedNames, setImportedNames] = useState<string[]>([])
  const [invalidNames, setInvalidNames] = useState<string[]>([])
  const [duplicatesCount, setDuplicatesCount] = useState(0)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const INVALID_NAME_PATTERN = /[0-9!@#$%^&*()_+=\[\]{}|\\:;"'<>,.?/`~·！￥……（）——【】｛｝、；：""''《》，。？、\/]/

  const validateNames = (text: string): { valid: string[]; invalid: string[]; duplicates: number } => {
    const lines = text
      .split(/[\n,，;；\t]/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0)

    const seen = new Set<string>()
    const validNames: string[] = []
    const invalidNames: string[] = []
    let duplicateCount = 0

    for (const name of lines) {
      if (INVALID_NAME_PATTERN.test(name)) {
        invalidNames.push(name)
        continue
      }
      if (seen.has(name)) {
        duplicateCount++
        continue
      }
      seen.add(name)
      validNames.push(name)
    }

    return { valid: validNames, invalid: invalidNames, duplicates: duplicateCount }
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setNameText(text)
    const result = validateNames(text)
    setImportedNames(result.valid)
    setInvalidNames(result.invalid)
    setDuplicatesCount(result.duplicates)
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = String(event.target?.result ?? '')
      setNameText(content)
      const result = validateNames(content)
      setImportedNames(result.valid)
      setInvalidNames(result.invalid)
      setDuplicatesCount(result.duplicates)
    }
    reader.readAsText(file, 'UTF-8')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleClearNames = () => {
    setNameText('')
    setImportedNames([])
    setInvalidNames([])
    setDuplicatesCount(0)
  }

  const handleToggleCustomList = () => {
    const newValue = !useCustomList
    setUseCustomList(newValue)
    if (!newValue) {
      setNameText('')
      setImportedNames([])
      setInvalidNames([])
      setDuplicatesCount(0)
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) {
      newErrors.name = '请输入活动名称'
    }
    if (!useCustomList) {
      if (formData.participantCount < 20 || formData.participantCount > 100) {
        newErrors.participantCount = '参与人数必须在20-100之间'
      }
    } else {
      if (importedNames.length < 20 || importedNames.length > 100) {
        newErrors.participants = `已导入${importedNames.length}人，有效参与人数必须在20-100之间`
      }
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
      const payload: Record<string, any> = {
        name: formData.name,
        participant_count: useCustomList ? importedNames.length : formData.participantCount,
        team_size: formData.teamSize,
        strategy: formData.strategy,
      }
      if (useCustomList && importedNames.length > 0) {
        payload.participants = importedNames.map((name) => ({ name }))
      }

      const res = await fetch('/api/activities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.detail || '创建失败')
      }
      const data = await res.json()
      setActivity(data.id, data.name, data.strategy)
      setParticipants(data.participants)
      navigate(`/room/${data.id}`)
    } catch (err: any) {
      console.error(err)
      setErrors({ name: err.message || '创建活动失败，请重试' })
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
            <label
              onClick={handleToggleCustomList}
              style={{ ...styles.label, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  border: `2px solid ${useCustomList ? '#667eea' : '#ccc'}`,
                  borderRadius: 4,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: useCustomList ? '#667eea' : 'transparent',
                  color: '#fff',
                  fontSize: 12,
                  transition: 'all 0.2s',
                }}
              >
                {useCustomList ? '✓' : ''}
              </span>
              导入自定义参与者名单
            </label>
          </div>

          {!useCustomList ? (
            <div style={styles.formGroup}>
              <label style={styles.label}>
                参与者人数：<span style={styles.highlight}>{formData.participantCount}</span> 人
                <span style={styles.labelHint}>（系统将自动生成随机姓名）</span>
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
          ) : (
            <div style={{ ...styles.formGroup, ...styles.importSection }}>
              <div style={styles.importHeader}>
                <label style={styles.label}>参与者名单</label>
                <div style={styles.importActions}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={styles.secondaryBtn}
                  >
                    📁 上传文件
                  </button>
                  <button
                    type="button"
                    onClick={handleClearNames}
                    style={styles.clearBtn}
                    disabled={!importedNames.length}
                  >
                    清空
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.csv"
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <textarea
                value={nameText}
                onChange={handleTextChange}
                placeholder="每行输入一个姓名，或使用逗号、分号、Tab分隔&#10;示例：&#10;张三&#10;李四&#10;王五"
                style={{
                  ...styles.textarea,
                  minHeight: 100,
                }}
              />
              <div style={styles.importMetaRow}>
                <span
                  style={{
                    ...(importedNames.length >= 20 && importedNames.length <= 100
                      ? styles.metaOk
                      : styles.metaBad),
                  }}
                >
                  有效姓名：{importedNames.length} 人
                </span>
                {duplicatesCount > 0 && (
                  <span style={styles.metaWarn}>已去重：{duplicatesCount} 条</span>
                )}
                {invalidNames.length > 0 && (
                  <span style={styles.metaError}>
                    非法姓名：{invalidNames.length} 条（已自动过滤）
                  </span>
                )}
                <span style={styles.metaHint}>支持 .txt / .csv 文件</span>
              </div>

              {importedNames.length > 0 && (
                <div style={styles.previewBox}>
                  <div style={styles.previewTitle}>
                    <span>名单预览</span>
                    <span style={styles.previewScrollHint}>可滚动查看</span>
                  </div>
                  <div style={styles.previewList}>
                    {importedNames.map((name, idx) => (
                      <div key={`${name}-${idx}`} style={styles.previewPill} className="slide-in">
                        <div
                          style={{
                            ...styles.previewAvatar,
                            background: getColor(name),
                          }}
                        >
                          {name.charAt(0)}
                        </div>
                        <span style={styles.previewName}>{name}</span>
                        <span style={styles.previewIndex}>#{idx + 1}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {errors.participants && <span style={styles.errorText}>{errors.participants}</span>}
            </div>
          )}

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
    maxWidth: '560px',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    padding: '36px 40px',
    maxHeight: '95vh',
    overflowY: 'auto',
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px',
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
    gap: '22px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  importSection: {
    background: 'linear-gradient(135deg, rgba(102,126,234,0.04), rgba(118,75,162,0.04))',
    padding: '16px',
    borderRadius: '12px',
    border: '1px solid rgba(102,126,234,0.15)',
  },
  label: {
    fontSize: '14px',
    fontWeight: 500,
    color: '#333',
  },
  labelHint: {
    fontSize: 12,
    color: '#999',
    fontWeight: 400,
    marginLeft: 6,
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
    background: '#fff',
  },
  inputError: {
    borderColor: '#ff6b6b',
  },
  textarea: {
    padding: '12px 16px',
    border: '2px solid #e0e0e0',
    borderRadius: '10px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#fff',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: 1.6,
  },
  importHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  importActions: {
    display: 'flex',
    gap: 8,
  },
  secondaryBtn: {
    padding: '6px 14px',
    border: '1.5px solid #667eea',
    background: '#fff',
    color: '#667eea',
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  clearBtn: {
    padding: '6px 14px',
    border: '1.5px solid #ddd',
    background: '#fff',
    color: '#888',
    borderRadius: 8,
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  importMetaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
    marginTop: 4,
  },
  metaOk: {
    fontSize: 13,
    color: '#22c55e',
    fontWeight: 600,
  },
  metaBad: {
    fontSize: 13,
    color: '#f5576c',
    fontWeight: 600,
  },
  metaWarn: {
    fontSize: 12,
    color: '#f59e0b',
  },
  metaError: {
    fontSize: 12,
    color: '#ef4444',
  },
  metaHint: {
    fontSize: 12,
    color: '#999',
    marginLeft: 'auto',
  },
  previewBox: {
    marginTop: 12,
    background: '#fff',
    borderRadius: 10,
    border: '1px solid #eee',
    overflow: 'hidden',
  },
  previewTitle: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 14px',
    background: '#fafafa',
    borderBottom: '1px solid #eee',
    fontSize: 13,
    color: '#666',
    fontWeight: 500,
  },
  previewScrollHint: {
    fontSize: 11,
    color: '#aaa',
    fontWeight: 400,
  },
  previewList: {
    maxHeight: 300,
    overflowY: 'auto',
    padding: 10,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
  },
  previewPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px 4px 4px',
    background: 'linear-gradient(135deg, #f8f9ff, #f5f0ff)',
    borderRadius: 999,
    border: '1px solid rgba(102,126,234,0.12)',
    animationFillMode: 'both',
  },
  previewAvatar: {
    width: 26,
    height: 26,
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontSize: 11,
    fontWeight: 600,
    boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
  },
  previewName: {
    fontSize: 12,
    color: '#333',
    fontWeight: 500,
  },
  previewIndex: {
    fontSize: 10,
    color: '#bbb',
    fontWeight: 500,
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
    textAlign: 'center',
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
    marginTop: '4px',
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
