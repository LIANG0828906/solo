import React, { useState, useCallback } from 'react'
import axios from 'axios'
import StepOneForm from './components/StepOneForm'
import StepTwoTemplates from './components/StepTwoTemplates'
import ResumePreview from './components/ResumePreview'

export interface FormData {
  name: string
  phone: string
  email: string
  targetPosition: string
}

export interface SectionItem {
  field: string
  value: string
  style?: Record<string, string>
}

export interface ResumeSection {
  title: string
  items: SectionItem[]
  style: Record<string, string>
}

export interface StructuredResumeData {
  metadata: {
    templateId: string
  }
  sections: ResumeSection[]
}

export interface TemplateConfig {
  key: string
  label: string
  titleColor: string
  font: string
  description: string
}

export const TEMPLATES: TemplateConfig[] = [
  { key: 'business', label: '简约商务', titleColor: '#1E293B', font: '"Noto Serif SC", serif', description: '专业沉稳的商务风格' },
  { key: 'creative', label: '创意视觉', titleColor: '#BE123C', font: '"ZCOOL XiaoWei", serif', description: '大胆醒目的创意风格' },
  { key: 'tech', label: '技术极简', titleColor: '#059669', font: '"JetBrains Mono", monospace', description: '简洁高效的技术风格' },
]

export interface PolishSuggestion {
  original: string
  recommended: string
  category: 'education' | 'work' | 'skills' | 'general'
  fieldPath: string
}

interface UndoStep {
  structuredData: StructuredResumeData
  suggestions: PolishSuggestion[]
}

const initialFormData: FormData = {
  name: '',
  phone: '',
  email: '',
  targetPosition: '',
}

function setNestedValue(obj: StructuredResumeData, path: string, oldValue: string, newValue: string): StructuredResumeData {
  const clone = JSON.parse(JSON.stringify(obj)) as StructuredResumeData
  const parts = path.split('.')
  let current: unknown = clone
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i]
    if (Array.isArray(current)) {
      current = current[Number(key)]
    } else if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[key]
    }
  }
  const lastKey = parts[parts.length - 1]
  if (Array.isArray(current)) {
    const val = current[Number(lastKey)]
    if (typeof val === 'string') {
      current[Number(lastKey)] = val.replace(oldValue, newValue)
    }
  } else if (current && typeof current === 'object') {
    const val = (current as Record<string, unknown>)[lastKey]
    if (typeof val === 'string') {
      (current as Record<string, unknown>)[lastKey] = (val as string).replace(oldValue, newValue)
    }
  }
  return clone
}

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('business')
  const [structuredData, setStructuredData] = useState<StructuredResumeData | null>(null)
  const [suggestions, setSuggestions] = useState<PolishSuggestion[]>([])
  const [undoHistory, setUndoHistory] = useState<UndoStep[]>([])
  const [loading, setLoading] = useState(false)

  const pushUndo = useCallback(() => {
    if (!structuredData) return
    setUndoHistory(prev => {
      const step: UndoStep = {
        structuredData: JSON.parse(JSON.stringify(structuredData)),
        suggestions: [...suggestions],
      }
      const next = [...prev, step]
      if (next.length > 5) next.shift()
      return next
    })
  }, [structuredData, suggestions])

  const handleUndo = useCallback(() => {
    setUndoHistory(prev => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setStructuredData(last.structuredData)
      setSuggestions(last.suggestions)
      return prev.slice(0, -1)
    })
  }, [])

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleNextStep = useCallback(async () => {
    setLoading(true)
    try {
      const res = await axios.post<StructuredResumeData>('/api/generate', {
        ...formData,
        templateId: selectedTemplate,
      })
      setStructuredData(res.data)
      setCurrentStep(2)
    } catch {
      alert('生成简历数据失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [formData, selectedTemplate])

  const handlePrevStep = useCallback(() => {
    setCurrentStep(1)
    setSuggestions([])
    setUndoHistory([])
  }, [])

  const handleTemplateChange = useCallback(async (key: string) => {
    setSelectedTemplate(key)
    if (formData.targetPosition) {
      try {
        const res = await axios.post<StructuredResumeData>('/api/generate', {
          ...formData,
          templateId: key,
        })
        setStructuredData(res.data)
      } catch {
        // keep existing data on failure
      }
    }
  }, [formData])

  const handleAcceptSuggestion = useCallback((index: number) => {
    if (!structuredData) return
    pushUndo()
    const suggestion = suggestions[index]
    const updated = setNestedValue(structuredData, suggestion.fieldPath, suggestion.original, suggestion.recommended)
    setStructuredData(updated)
    setSuggestions(prev => prev.filter((_, i) => i !== index))
  }, [structuredData, suggestions, pushUndo])

  const handleRejectSuggestion = useCallback((index: number) => {
    setSuggestions(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handlePolish = useCallback(async () => {
    if (!structuredData) return
    try {
      const res = await axios.post<{ suggestions: PolishSuggestion[] }>('/api/polish', structuredData)
      setSuggestions(res.data.suggestions || [])
    } catch {
      alert('润色请求失败，请稍后重试')
    }
  }, [structuredData])

  const handleExport = useCallback(async (format: 'pdf' | 'txt') => {
    if (!structuredData) return
    try {
      const res = await axios.post('/api/export', {
        resumeData: structuredData,
        templateId: selectedTemplate,
        name: formData.name,
        targetPosition: formData.targetPosition,
        format,
      }, { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      const ext = format === 'pdf' ? 'pdf' : 'txt'
      a.download = `${formData.name}_${formData.targetPosition}_简历.${ext}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch {
      alert('导出失败，请稍后重试')
    }
  }, [structuredData, selectedTemplate, formData])

  const currentTemplate = TEMPLATES.find(t => t.key === selectedTemplate) || TEMPLATES[0]

  return (
    <div style={styles.appContainer}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>追光简历生成器</h1>
      </div>

      <div style={styles.stepIndicator}>
        <div style={{ ...styles.stepDot, ...(currentStep >= 1 ? styles.stepDotActive : {}) }}>1</div>
        <div style={{ ...styles.stepLine, ...(currentStep >= 2 ? styles.stepLineActive : {}) }} />
        <div style={{ ...styles.stepDot, ...(currentStep >= 2 ? styles.stepDotActive : {}) }}>2</div>
      </div>

      <div style={styles.mainContent}>
        <div style={styles.leftPanel}>
          {currentStep === 1 ? (
            <StepOneForm
              formData={formData}
              onChange={handleInputChange}
              onNext={handleNextStep}
              loading={loading}
            />
          ) : (
            <StepTwoTemplates
              selectedTemplate={selectedTemplate}
              onTemplateChange={handleTemplateChange}
              suggestions={suggestions}
              onAccept={handleAcceptSuggestion}
              onReject={handleRejectSuggestion}
              onUndo={handleUndo}
              canUndo={undoHistory.length > 0}
              onPolish={handlePolish}
              onExport={handleExport}
              onPrev={handlePrevStep}
            />
          )}
        </div>
        <div style={styles.rightPanel}>
          <ResumePreview
            formData={formData}
            structuredData={structuredData}
            template={currentTemplate}
            step={currentStep}
          />
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    minHeight: '100vh',
    background: '#F0F4F8',
  },
  header: {
    textAlign: 'center',
    padding: '20px 0 0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 700,
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    display: 'inline-block',
  },
  stepIndicator: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px 0 10px',
    gap: 0,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: '50%',
    background: '#D1D5DB',
    color: '#FFF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: 14,
    transition: 'background 0.3s',
  },
  stepDotActive: {
    background: 'linear-gradient(135deg, #3B82F6, #6366F1)',
  },
  stepLine: {
    width: 80,
    height: 3,
    background: '#D1D5DB',
    transition: 'background 0.3s',
  },
  stepLineActive: {
    background: 'linear-gradient(90deg, #3B82F6, #6366F1)',
  },
  mainContent: {
    display: 'flex',
    gap: 24,
    padding: '10px 24px 24px',
    maxWidth: 960,
    margin: '0 auto',
  },
  leftPanel: {
    flex: 1,
    minWidth: 0,
  },
  rightPanel: {
    flexShrink: 0,
  },
}

export default App
