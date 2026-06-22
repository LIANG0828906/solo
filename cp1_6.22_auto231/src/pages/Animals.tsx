import { useState, useEffect } from 'react'
import { api, Animal } from '../services/api'

const statusColors: Record<string, string> = {
  available: '#10B981',
  adopted: '#3B82F6',
  quarantine: '#F59E0B'
}

const statusLabels: Record<string, string> = {
  available: '待领养',
  adopted: '已领养',
  quarantine: '隔离中'
}

export default function Animals() {
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAnimal, setSelectedAnimal] = useState<Animal | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    loadAnimals()
  }, [])

  async function loadAnimals() {
    try {
      setLoading(true)
      const data = await api.getAnimals()
      setAnimals(data)
    } catch (err) {
      console.error('Failed to load animals:', err)
    } finally {
      setLoading(false)
    }
  }

  function handleCardClick(animal: Animal) {
    setSelectedAnimal(animal)
    setShowModal(true)
  }

  function handleCloseModal() {
    setShowModal(false)
    setSelectedAnimal(null)
  }

  async function handleAddAnimal(data: Partial<Animal>) {
    try {
      await api.createAnimal(data)
      setShowAddForm(false)
      loadAnimals()
    } catch (err) {
      console.error('Failed to add animal:', err)
    }
  }

  const filteredAnimals = filter === 'all'
    ? animals
    : animals.filter(a => a.status === filter)

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={pageTitleStyle}>动物档案</h1>
          <p style={subtitleStyle}>管理收容所所有动物信息</p>
        </div>
        <button style={addBtnStyle} onClick={() => setShowAddForm(true)}>
          + 添加动物
        </button>
      </div>

      <div style={filterBarStyle}>
        {[
          { key: 'all', label: '全部' },
          { key: 'available', label: '待领养' },
          { key: 'adopted', label: '已领养' },
          { key: 'quarantine', label: '隔离中' }
        ].map(item => (
          <button
            key={item.key}
            style={{
              ...filterBtnStyle,
              ...(filter === item.key ? filterBtnActiveStyle : {})
            }}
            onClick={() => setFilter(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={loadingStyle}>加载中...</div>
      ) : (
        <div style={cardGridStyle}>
          {filteredAnimals.map(animal => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              onClick={() => handleCardClick(animal)}
            />
          ))}
        </div>
      )}

      {showModal && selectedAnimal && (
        <AnimalDetailModal
          animal={selectedAnimal}
          onClose={handleCloseModal}
          onUpdated={() => {
            loadAnimals()
            handleCloseModal()
          }}
        />
      )}

      {showAddForm && (
        <AnimalFormModal
          onClose={() => setShowAddForm(false)}
          onSubmit={handleAddAnimal}
        />
      )}
    </div>
  )
}

function AnimalCard({ animal, onClick }: { animal: Animal; onClick: () => void }) {
  const statusColor = statusColors[animal.status]

  return (
    <div
      style={{
        ...cardStyle,
        borderTop: `4px solid ${statusColor}`
      }}
      onClick={onClick}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-4px)'
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)'
      }}
    >
      <div style={cardPhotoStyle}>
        <span style={{ fontSize: '48px' }}>
          {animal.breed.includes('猫') ? '🐱' : '🐶'}
        </span>
      </div>

      <div style={cardBodyStyle}>
        <div style={cardHeaderStyle}>
          <h3 style={cardNameStyle}>{animal.name}</h3>
          <span style={{
            ...statusBadgeStyle,
            backgroundColor: `${statusColor}20`,
            color: statusColor
          }}>
            {statusLabels[animal.status]}
          </span>
        </div>

        <p style={cardBreedStyle}>{animal.breed} · {animal.age}岁 · {animal.gender === 'male' ? '♂' : '♀'}</p>

        <div style={cardTagsStyle}>
          {animal.vaccinated && <span style={tagStyle}>已疫苗</span>}
          {animal.neutered && <span style={tagStyle}>已绝育</span>}
        </div>
      </div>
    </div>
  )
}

function AnimalDetailModal({
  animal, onClose, onUpdated
}: {
  animal: Animal
  onClose: () => void
  onUpdated: () => void
}) {
  const [followups, setFollowups] = useState<any[]>([])
  const [showFollowupForm, setShowFollowupForm] = useState(false)

  useEffect(() => {
    loadFollowups()
  }, [animal.id])

  async function loadFollowups() {
    try {
      const data = await api.getFollowups(animal.id)
      setFollowups(data.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ))
    } catch (err) {
      console.error('Failed to load followups:', err)
    }
  }

  async function handleAddFollowup(data: any) {
    try {
      await api.createFollowup({ ...data, animalId: animal.id })
      setShowFollowupForm(false)
      loadFollowups()
    } catch (err) {
      console.error('Failed to add followup:', err)
    }
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalStyle} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>{animal.name} 的档案</h2>
          <button style={closeBtnStyle} onClick={onClose}>×</button>
        </div>

        <div style={modalBodyStyle}>
          <div style={photoSectionStyle}>
            <div style={largePhotoStyle}>
              <span style={{ fontSize: '80px' }}>
                {animal.breed.includes('猫') ? '🐱' : '🐶'}
              </span>
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '24px' }}>{animal.name}</h2>
              <p style={{ color: '#64748B', marginTop: '4px' }}>
                {animal.breed} · {animal.age}岁 · {animal.gender === 'male' ? '公' : '母'}
              </p>
              <span style={{
                ...statusBadgeStyle,
                backgroundColor: `${statusColors[animal.status]}20`,
                color: statusColors[animal.status],
                display: 'inline-block',
                marginTop: '8px'
              }}>
                {statusLabels[animal.status]}
              </span>
            </div>
          </div>

          <div style={infoGridStyle}>
            <InfoItem label="体重" value={`${animal.weight} kg`} />
            <InfoItem label="毛色" value={animal.color || '未记录'} />
            <InfoItem label="疫苗接种" value={animal.vaccinated ? '已完成' : '未完成'} />
            <InfoItem label="绝育状态" value={animal.neutered ? '已绝育' : '未绝育'} />
            <InfoItem label="入所日期" value={animal.intakeDate} />
          </div>

          <div style={descSectionStyle}>
            <h3 style={sectionTitleStyle}>描述</h3>
            <p style={descTextStyle}>{animal.description || '暂无描述'}</p>
          </div>

          <div style={followupSectionStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={sectionTitleStyle}>回访记录</h3>
              {animal.status === 'adopted' && (
                <button
                  style={smallBtnStyle}
                  onClick={() => setShowFollowupForm(true)}
                >
                  + 添加回访
                </button>
              )}
            </div>

            {followups.length === 0 ? (
              <p style={emptyTextStyle}>暂无回访记录</p>
            ) : (
              <div style={timelineStyle}>
                {followups.map((f, index) => (
                  <div key={f.id} style={timelineItemStyle}>
                    <div style={{
                      ...timelineDotStyle,
                      backgroundColor: f.status === 'healthy' ? '#10B981' :
                        f.status === 'attention' ? '#F59E0B' : '#EF4444'
                    }} />
                    {index < followups.length - 1 && <div style={timelineLineStyle} />}
                    <div style={timelineContentStyle}>
                      <div style={timelineHeaderStyle}>
                        <span style={timelineDateStyle}>{f.date}</span>
                        <span style={{
                          ...timelineStatusStyle,
                          color: f.status === 'healthy' ? '#10B981' :
                            f.status === 'attention' ? '#F59E0B' : '#EF4444'
                        }}>
                          {f.status === 'healthy' ? '健康' :
                            f.status === 'attention' ? '需关注' : '需复查'}
                        </span>
                      </div>
                      <p style={timelineNotesStyle}>{f.notes}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {showFollowupForm && (
          <FollowupFormModal
            onClose={() => setShowFollowupForm(false)}
            onSubmit={handleAddFollowup}
          />
        )}
      </div>
    </div>
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={infoItemStyle}>
      <span style={infoLabelStyle}>{label}</span>
      <span style={infoValueStyle}>{value}</span>
    </div>
  )
}

function AnimalFormModal({
  onClose, onSubmit
}: {
  onClose: () => void
  onSubmit: (data: Partial<Animal>) => void
}) {
  const [form, setForm] = useState({
    name: '',
    breed: '',
    age: '',
    gender: 'male' as 'male' | 'female',
    weight: '',
    color: '',
    vaccinated: false,
    neutered: false,
    intakeDate: new Date().toISOString().split('T')[0],
    description: '',
    status: 'available' as 'available' | 'adopted' | 'quarantine'
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSubmit({
      ...form,
      age: Number(form.age),
      weight: Number(form.weight)
    })
  }

  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={{ ...modalStyle, maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>添加动物档案</h2>
          <button style={closeBtnStyle} onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <div style={formGridStyle}>
            <FormField label="名称" required>
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={inputStyle}
                required
              />
            </FormField>
            <FormField label="品种" required>
              <input
                type="text"
                value={form.breed}
                onChange={e => setForm({ ...form, breed: e.target.value })}
                style={inputStyle}
                required
              />
            </FormField>
            <FormField label="年龄">
              <input
                type="number"
                value={form.age}
                onChange={e => setForm({ ...form, age: e.target.value })}
                style={inputStyle}
              />
            </FormField>
            <FormField label="性别">
              <select
                value={form.gender}
                onChange={e => setForm({ ...form, gender: e.target.value as any })}
                style={inputStyle}
              >
                <option value="male">公</option>
                <option value="female">母</option>
              </select>
            </FormField>
            <FormField label="体重(kg)">
              <input
                type="number"
                step="0.1"
                value={form.weight}
                onChange={e => setForm({ ...form, weight: e.target.value })}
                style={inputStyle}
              />
            </FormField>
            <FormField label="毛色">
              <input
                type="text"
                value={form.color}
                onChange={e => setForm({ ...form, color: e.target.value })}
                style={inputStyle}
              />
            </FormField>
            <FormField label="状态">
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value as any })}
                style={inputStyle}
              >
                <option value="available">待领养</option>
                <option value="adopted">已领养</option>
                <option value="quarantine">隔离中</option>
              </select>
            </FormField>
            <FormField label="入所日期">
              <input
                type="date"
                value={form.intakeDate}
                onChange={e => setForm({ ...form, intakeDate: e.target.value })}
                style={inputStyle}
              />
            </FormField>
          </div>

          <div style={checkboxRowStyle}>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={form.vaccinated}
                onChange={e => setForm({ ...form, vaccinated: e.target.checked })}
              />
              已接种疫苗
            </label>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={form.neutered}
                onChange={e => setForm({ ...form, neutered: e.target.checked })}
              />
              已绝育
            </label>
          </div>

          <FormField label="描述">
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{ ...inputStyle, height: '80px', resize: 'vertical' }}
              rows={3}
            />
          </FormField>

          <div style={formActionsStyle}>
            <button type="button" style={cancelBtnStyle} onClick={onClose}>
              取消
            </button>
            <button type="submit" style={submitBtnStyle}>
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function FollowupFormModal({
  onClose, onSubmit
}: {
  onClose: () => void
  onSubmit: (data: any) => void
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
      <div style={{ ...modalStyle, maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
        <div style={modalHeaderStyle}>
          <h2 style={modalTitleStyle}>添加回访记录</h2>
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

          <FormField label="状态" required>
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
              style={{ ...inputStyle, height: '100px', resize: 'vertical' }}
              rows={4}
              placeholder="记录回访详情..."
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
  padding: '32px'
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

const filterBarStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px',
  marginBottom: '24px',
  flexWrap: 'wrap'
}

const filterBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '20px',
  fontSize: '13px',
  color: '#64748B',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}

const filterBtnActiveStyle: React.CSSProperties = {
  backgroundColor: '#3B82F6',
  borderColor: '#3B82F6',
  color: '#FFFFFF'
}

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px',
  color: '#64748B'
}

const cardGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, 280px)',
  gap: '20px',
  justifyContent: 'flex-start'
}

const cardStyle: React.CSSProperties = {
  width: '280px',
  backgroundColor: '#F0F4F8',
  border: '1px solid #CBD5E1',
  borderRadius: '12px',
  overflow: 'hidden',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
  display: 'flex',
  flexDirection: 'column'
}

const cardPhotoStyle: React.CSSProperties = {
  height: '140px',
  backgroundColor: '#E2E8F0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#FFFFFF'
}

const cardBodyStyle: React.CSSProperties = {
  padding: '16px'
}

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '8px'
}

const cardNameStyle: React.CSSProperties = {
  fontSize: '18px',
  fontWeight: 600,
  color: '#1E293B',
  margin: 0
}

const statusBadgeStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500
}

const cardBreedStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748B',
  margin: 0,
  marginBottom: '12px'
}

const cardTagsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '6px',
  flexWrap: 'wrap'
}

const tagStyle: React.CSSProperties = {
  padding: '3px 8px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #CBD5E1',
  borderRadius: '8px',
  fontSize: '11px',
  color: '#475569'
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
  maxWidth: '600px',
  maxHeight: '90vh',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column'
}

const modalHeaderStyle: React.CSSProperties = {
  padding: '20px 24px',
  borderBottom: '1px solid #E2E8F0',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
}

const modalTitleStyle: React.CSSProperties = {
  fontSize: '20px',
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
  borderRadius: '8px',
  transition: 'background-color 0.2s'
}

const modalBodyStyle: React.CSSProperties = {
  padding: '24px',
  overflowY: 'auto'
}

const photoSectionStyle: React.CSSProperties = {
  display: 'flex',
  gap: '20px',
  alignItems: 'center',
  marginBottom: '24px'
}

const largePhotoStyle: React.CSSProperties = {
  width: '120px',
  height: '120px',
  backgroundColor: '#F1F5F9',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const infoGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
  gap: '16px',
  marginBottom: '24px',
  padding: '16px',
  backgroundColor: '#F8FAFC',
  borderRadius: '12px'
}

const infoItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
}

const infoLabelStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#94A3B8'
}

const infoValueStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#334155',
  fontWeight: 500
}

const descSectionStyle: React.CSSProperties = {
  marginBottom: '24px'
}

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#1E293B',
  margin: 0,
  marginBottom: '12px'
}

const descTextStyle: React.CSSProperties = {
  fontSize: '14px',
  color: '#475569',
  lineHeight: 1.6,
  margin: 0
}

const followupSectionStyle: React.CSSProperties = {
  paddingTop: '16px',
  borderTop: '1px solid #E2E8F0'
}

const smallBtnStyle: React.CSSProperties = {
  padding: '6px 14px',
  backgroundColor: '#3B82F6',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '6px',
  fontSize: '13px',
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}

const emptyTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#94A3B8',
  textAlign: 'center',
  padding: '20px'
}

const timelineStyle: React.CSSProperties = {
  position: 'relative'
}

const timelineItemStyle: React.CSSProperties = {
  position: 'relative',
  paddingLeft: '28px',
  paddingBottom: '20px',
  minHeight: '60px'
}

const timelineDotStyle: React.CSSProperties = {
  position: 'absolute',
  left: '0',
  top: '4px',
  width: '12px',
  height: '12px',
  borderRadius: '50%',
  zIndex: 1
}

const timelineLineStyle: React.CSSProperties = {
  position: 'absolute',
  left: '5px',
  top: '18px',
  bottom: '0',
  width: '2px',
  background: 'linear-gradient(to bottom, #CBD5E1, #E2E8F0)'
}

const timelineContentStyle: React.CSSProperties = {
  backgroundColor: '#F8FAFC',
  padding: '12px 16px',
  borderRadius: '8px'
}

const timelineHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '6px'
}

const timelineDateStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#334155'
}

const timelineStatusStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 500
}

const timelineNotesStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748B',
  margin: 0,
  lineHeight: 1.5
}

const formStyle: React.CSSProperties = {
  padding: '24px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

const formGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(2, 1fr)',
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

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '24px'
}

const checkboxStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '14px',
  color: '#475569',
  cursor: 'pointer'
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
