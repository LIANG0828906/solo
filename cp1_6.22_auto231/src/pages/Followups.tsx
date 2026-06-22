import { useState, useEffect } from 'react'
import { api, Animal, Followup } from '../services/api'

const statusLabels: Record<string, string> = {
  healthy: '健康',
  attention: '需关注',
  recheck: '需复查'
}

const statusColors: Record<string, string> = {
  healthy: '#10B981',
  attention: '#F59E0B',
  recheck: '#EF4444'
}

export default function Followups() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null)
  const [followups, setFollowups] = useState<Followup[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    loadAnimals()
  }, [])

  useEffect(() => {
    if (selectedAnimalId) {
      loadFollowups(selectedAnimalId)
    }
  }, [selectedAnimalId])

  async function loadAnimals() {
    try {
      setLoading(true)
      const data = await api.getAnimals()
      const adopted = data.filter(a => a.status === 'adopted')
      setAnimals(adopted)
      if (adopted.length > 0 && !selectedAnimalId) {
        setSelectedAnimalId(adopted[0].id)
      }
    } catch (err) {
      console.error('Failed to load animals:', err)
    } finally {
      setLoading(false)
    }
  }

  async function loadFollowups(animalId: string) {
    try {
      const data = await api.getFollowups(animalId)
      setFollowups(data.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ))
    } catch (err) {
      console.error('Failed to load followups:', err)
    }
  }

  async function handleAddFollowup(data: Partial<Followup>) {
    if (!selectedAnimalId) return
    try {
      await api.createFollowup({ ...data, animalId: selectedAnimalId })
      setShowAddForm(false)
      loadFollowups(selectedAnimalId)
    } catch (err) {
      console.error('Failed to add followup:', err)
    }
  }

  const selectedAnimal = animals.find(a => a.id === selectedAnimalId)

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={pageTitleStyle}>回访记录</h1>
          <p style={subtitleStyle}>跟踪已领养动物的健康状况</p>
        </div>
        <button
          style={addBtnStyle}
          onClick={() => setShowAddForm(true)}
          disabled={!selectedAnimalId}
        >
          + 添加回访
        </button>
      </div>

      <div style={layoutStyle}>
        <div style={sidebarStyle}>
          <h3 style={sidebarTitleStyle}>已领养动物</h3>
          {loading ? (
            <p style={loadingTextStyle}>加载中...</p>
          ) : animals.length === 0 ? (
            <p style={emptyTextStyle}>暂无已领养动物</p>
          ) : (
            <div style={animalListStyle}>
              {animals.map(animal => (
                <button
                  key={animal.id}
                  style={{
                    ...animalItemStyle,
                    ...(selectedAnimalId === animal.id ? animalItemActiveStyle : {})
                  }}
                  onClick={() => setSelectedAnimalId(animal.id)}
                >
                  <span style={animalEmojiStyle}>
                    {animal.breed.includes('猫') ? '🐱' : '🐶'}
                  </span>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <span style={animalNameStyle}>{animal.name}</span>
                    <span style={animalBreedStyle}>{animal.breed}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={mainContentStyle}>
          {selectedAnimal ? (
            <>
              <div style={animalHeaderStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={largeAvatarStyle}>
                    {selectedAnimal.breed.includes('猫') ? '🐱' : '🐶'}
                  </div>
                  <div>
                    <h2 style={animalTitleStyle}>{selectedAnimal.name}</h2>
                    <p style={animalSubtitleStyle}>
                      {selectedAnimal.breed} · {selectedAnimal.age}岁 · {selectedAnimal.gender === 'male' ? '公' : '母'}
                    </p>
                  </div>
                </div>
                <div style={statsRowStyle}>
                  <div style={statBoxStyle}>
                    <span style={statNumStyle}>{followups.length}</span>
                    <span style={statLabelStyle}>回访次数</span>
                  </div>
                  <div style={statBoxStyle}>
                    <span style={statNumStyle}>
                      {followups.filter(f => f.status === 'healthy').length}
                    </span>
                    <span style={statLabelStyle}>健康记录</span>
                  </div>
                </div>
              </div>

              {followups.length === 0 ? (
                <div style={emptyTimelineStyle}>
                  <span style={{ fontSize: '48px', marginBottom: '16px' }}>💬</span>
                  <p style={{ color: '#64748B' }}>暂无回访记录</p>
                  <p style={{ fontSize: '13px', color: '#94A3B8', marginTop: '4px' }}>
                    点击"添加回访"开始记录
                  </p>
                </div>
              ) : (
                <div style={timelineStyle}>
                  {followups.map((followup, index) => (
                    <div key={followup.id} style={timelineItemStyle}>
                      <div style={timelineLeftStyle}>
                        <div style={{
                          ...timelineDotStyle,
                          backgroundColor: statusColors[followup.status]
                        }} />
                        {index < followups.length - 1 && <div style={timelineLineStyle} />}
                      </div>
                      <div style={timelineContentStyle}>
                        <div style={timelineHeaderStyle}>
                          <span style={timelineDateStyle}>{followup.date}</span>
                          <span style={{
                            ...timelineStatusStyle,
                            backgroundColor: `${statusColors[followup.status]}20`,
                            color: statusColors[followup.status]
                          }}>
                            {statusLabels[followup.status]}
                          </span>
                        </div>
                        <p style={timelineNotesStyle}>{followup.notes}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={emptyMainStyle}>
              <span style={{ fontSize: '48px', marginBottom: '16px' }}>🐾</span>
              <p style={{ color: '#64748B' }}>请选择一只已领养的动物</p>
            </div>
          )}
        </div>
      </div>

      {showAddForm && selectedAnimal && (
        <FollowupFormModal
          animalName={selectedAnimal.name}
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddFollowup}
        />
      )}
    </div>
  )
}

function FollowupFormModal({
  animalName, onClose, onSubmit
}: {
  animalName: string
  onClose: () => void
  onSubmit: (data: Partial<Followup>) => void
}) {
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    status: 'healthy' as 'healthy' | 'attention' | 'recheck',
    notes: ''
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>添加回访记录 - {animalName}</h2>
          <button style={closeBtnStyle} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <FormField label="回访日期" required>
            <input
              type="date"
              value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              style={inputStyle}
              required
            />
          </FormField>

          <FormField label="动物状态" required>
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as any })}
              style={inputStyle}
            >
              <option value="healthy">健康</option>
              <option value="attention">需关注</option>
              <option value="recheck">需复查</option>
            </select>
          </FormField>

          <FormField label="备注">
            <textarea
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              style={{ ...inputStyle, height: '120px', resize: 'vertical' }}
              rows={5}
              placeholder="记录本次回访的详细情况..."
            />
          </FormField>

          <div style={formActionsStyle}>
            <button type="button" style={cancelBtnStyle} onClick={onClose}>
              取消
            </button>
            <button type="submit" style={submitBtnStyle}>
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FormField({ label, required, children }: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div style={formFieldStyle}>
      <label style={formLabelStyle}>
        {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
      </label>
      {children}
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  padding: '32px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column'
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '24px'
}

const pageTitleStyle: React.CSSProperties = {
  fontSize: '28px',
  fontWeight: 700,
  color: '#1E293B',
  margin: 0,
  marginBottom: '8px'
}

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#64748B',
  margin: 0
}

const addBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#3B82F6',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}

const layoutStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px',
  flex: 1,
  minHeight: 0
}

const sidebarStyle: React.CSSProperties = {
  width: '240px',
  flexShrink: 0,
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column'
}

const sidebarTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#334155',
  margin: 0,
  marginBottom: '12px'
}

const loadingTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#94A3B8',
  textAlign: 'center',
  padding: '20px'
}

const emptyTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#94A3B8',
  textAlign: 'center',
  padding: '20px'
}

const animalListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  overflowY: 'auto'
}

const animalItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: '8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  textAlign: 'left'
}

const animalItemActiveStyle: React.CSSProperties = {
  backgroundColor: '#EFF6FF',
  border: '1px solid #BFDBFE'
}

const animalEmojiStyle: React.CSSProperties = {
  fontSize: '24px'
}

const animalNameStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '14px',
  fontWeight: 500,
  color: '#1E293B'
}

const animalBreedStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: '#94A3B8'
}

const mainContentStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  padding: '24px',
  overflowY: 'auto',
  minWidth: 0
}

const animalHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingBottom: '20px',
  borderBottom: '1px solid #F1F5F9',
  marginBottom: '24px',
  flexWrap: 'wrap',
  gap: '16px'
}

const largeAvatarStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  backgroundColor: '#F1F5F9',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '32px'
}

const animalTitleStyle: React.CSSProperties = {
  fontSize: '22px',
  fontWeight: 700,
  color: '#1E293B',
  margin: 0,
  marginBottom: '4px'
}

const animalSubtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#64748B',
  margin: 0
}

const statsRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px'
}

const statBoxStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '12px 20px',
  backgroundColor: '#F8FAFC',
  borderRadius: '10px',
  minWidth: '80px'
}

const statNumStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 700,
  color: '#3B82F6'
}

const statLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#64748B',
  marginTop: '2px'
}

const emptyTimelineStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px 20px',
  textAlign: 'center'
}

const emptyMainStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  height: '100%',
  minHeight: '300px'
}

const timelineStyle: React.CSSProperties = {
  position: 'relative'
}

const timelineItemStyle: React.CSSProperties = {
  display: 'flex',
  gap: '16px',
  paddingBottom: '24px',
  position: 'relative'
}

const timelineLeftStyle: React.CSSProperties = {
  width: '20px',
  flexShrink: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  position: 'relative'
}

const timelineDotStyle: React.CSSProperties = {
  width: '14px',
  height: '14px',
  borderRadius: '50%',
  zIndex: 1,
  marginTop: '4px'
}

const timelineLineStyle: React.CSSProperties = {
  position: 'absolute',
  top: '22px',
  bottom: '-24px',
  width: '2px',
  background: 'linear-gradient(to bottom, #CBD5E1, #E2E8F0)'
}

const timelineContentStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: '#F8FAFC',
  padding: '14px 18px',
  borderRadius: '10px',
  border: '1px solid #F1F5F9'
}

const timelineHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
}

const timelineDateStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: '#1E293B'
}

const timelineStatusStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500
}

const timelineNotesStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748B',
  margin: 0,
  lineHeight: 1.6
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px'
}

const modalStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '480px',
  overflow: 'hidden'
}

const modalHeaderStyle: React.CSSProperties = {
  padding: '18px 24px',
  borderBottom: '1px solid #E2E8F0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const modalTitleStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#1E293B',
  margin: 0
}

const closeBtnStyle: React.CSSProperties = {
  width: '32px',
  height: '32px',
  border: 'none',
  backgroundColor: 'transparent',
  fontSize: '24px',
  color: '#64748B',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px'
}

const formStyle: React.CSSProperties = {
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

const formFieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '6px'
}

const formLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#334155'
}

const inputStyle: React.CSSProperties = {
  padding: '10px 12px',
  border: '1px solid #CBD5E1',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#1E293B',
  transition: 'border-color 0.2s',
  backgroundColor: '#FFFFFF',
  boxSizing: 'border-box',
  width: '100%'
}

const formActionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '12px',
  marginTop: '8px'
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #CBD5E1',
  borderRadius: '8px',
  fontSize: '14px',
  color: '#64748B',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}

const submitBtnStyle: React.CSSProperties = {
  padding: '10px 20px',
  backgroundColor: '#3B82F6',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontSize: '14px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}
