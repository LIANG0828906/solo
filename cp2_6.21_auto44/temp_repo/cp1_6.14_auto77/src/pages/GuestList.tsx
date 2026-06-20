import React, { useState, useMemo } from 'react'
import { useApp } from '@context/AppContext'
import type { Guest } from '@types'

type RsvpFilter = 'all' | 'pending' | 'confirmed' | 'declined'

interface FormErrors {
  name?: string
  phone?: string
}

const emptyForm: Omit<Guest, 'id' | 'createdAt' | 'addedBy' | 'addedByName'> = {
  name: '',
  phone: '',
  companions: 0,
  rsvp: 'pending',
  tableNumber: undefined,
  seatNumber: undefined,
}

export default function GuestList() {
  const { guests, addGuest, updateGuest, deleteGuest, currentUser } = useApp()
  const [activeFilter, setActiveFilter] = useState<RsvpFilter>('all')
  const [filterIndicator, setFilterIndicator] = useState({ left: 0, width: 0 })
  const filterBarRef = React.useRef<HTMLDivElement>(null)
  const filterBtnRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})
  const [searchText, setSearchText] = useState('')
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({ ...emptyForm })
  const [errors, setErrors] = useState<FormErrors>({})
  const [shakingFields, setShakingFields] = useState<Set<string>>(new Set())
  const [seatAnimKey, setSeatAnimKey] = useState(0)

  const stats = useMemo(() => {
    let totalWithCompanions = 0
    let confirmed = 0
    let pending = 0
    let declined = 0

    guests.forEach((g) => {
      const count = 1 + (g.companions || 0)
      totalWithCompanions += count
      if (g.rsvp === 'confirmed') confirmed += count
      else if (g.rsvp === 'pending') pending += count
      else if (g.rsvp === 'declined') declined += count
    })

    return { totalWithCompanions, confirmed, pending, declined, totalGuests: guests.length }
  }, [guests])

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      if (activeFilter !== 'all' && g.rsvp !== activeFilter) return false
      if (searchText) {
        const keyword = searchText.toLowerCase()
        return (
          g.name.toLowerCase().includes(keyword) ||
          g.phone.includes(keyword)
        )
      }
      return true
    })
  }, [guests, activeFilter, searchText])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    const newShaking = new Set<string>()

    if (!formData.name.trim()) {
      newErrors.name = '请输入宾客姓名'
      newShaking.add('name')
    }

    if (!/^\d{11}$/.test(formData.phone)) {
      newErrors.phone = '请输入11位有效手机号'
      newShaking.add('phone')
    }

    setErrors(newErrors)
    setShakingFields(newShaking)

    if (newShaking.size > 0) {
      setTimeout(() => setShakingFields(new Set()), 500)
      return false
    }
    return true
  }

  const handleOpenAdd = () => {
    setFormData({ ...emptyForm })
    setErrors({})
    setShowAddForm(true)
    setEditingGuest(null)
    setSeatAnimKey((k) => k + 1)
  }

  const handleOpenEdit = (guest: Guest) => {
    setFormData({
      name: guest.name,
      phone: guest.phone,
      companions: guest.companions,
      rsvp: guest.rsvp,
      tableNumber: guest.tableNumber,
      seatNumber: guest.seatNumber,
    })
    setErrors({})
    setEditingGuest(guest)
    setShowAddForm(false)
    setSeatAnimKey((k) => k + 1)
  }

  const handleClosePanel = () => {
    setEditingGuest(null)
    setShowAddForm(false)
    setFormData({ ...emptyForm })
    setErrors({})
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    if (editingGuest) {
      await updateGuest(editingGuest.id, {
        name: formData.name.trim(),
        phone: formData.phone,
        companions: formData.companions,
        rsvp: formData.rsvp,
        tableNumber: formData.tableNumber,
        seatNumber: formData.seatNumber,
      })
    } else {
      await addGuest({
        name: formData.name.trim(),
        phone: formData.phone,
        companions: formData.companions,
        rsvp: formData.rsvp,
        tableNumber: formData.tableNumber,
        seatNumber: formData.seatNumber,
        addedBy: currentUser.id,
        addedByName: currentUser.name,
      })
    }

    handleClosePanel()
  }

  const handleDelete = async (id: string) => {
    if (editingGuest?.id === id) handleClosePanel()
    await deleteGuest(id)
  }

  const isPanelOpen = showAddForm || editingGuest !== null

  const rsvpBadge = (rsvp: Guest['rsvp']) => {
    const map = {
      pending: { label: '待确认', className: 'badge badge-pending' },
      confirmed: { label: '已确认', className: 'badge badge-confirmed' },
      declined: { label: '婉拒', className: 'badge badge-declined' },
    }
    const cfg = map[rsvp]
    return <span className={cfg.className}>{cfg.label}</span>
  }

  const filters: { key: RsvpFilter; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: guests.length },
    { key: 'pending', label: '待确认', count: guests.filter((g) => g.rsvp === 'pending').length },
    { key: 'confirmed', label: '已确认', count: guests.filter((g) => g.rsvp === 'confirmed').length },
    { key: 'declined', label: '婉拒', count: guests.filter((g) => g.rsvp === 'declined').length },
  ]

  const tableBgColor = (table?: number) => {
    if (!table) return '#f5f5f5'
    const hue = (table * 37) % 360
    return `hsl(${hue}, 60%, 92%)`
  }

  const tableOptions = Array.from({ length: 20 }, (_, i) => i + 1)
  const seatOptions = Array.from({ length: 10 }, (_, i) => i + 1)

  return (
    <div style={{ padding: '24px 32px', position: 'relative', minHeight: '100vh' }}>
      <div style={{ animation: 'fadeIn 0.5s ease' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: '#6B5B55', marginBottom: 4 }}>
              👥 宾客管理
            </h2>
            <p style={{ fontSize: 14, color: '#9B8B85' }}>
              管理宾客名单、分配座位、追踪RSVP状态
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ animation: 'pulse 2s ease-in-out infinite' }}
          >
            <span style={{ fontSize: 18 }}>+</span>
            <span>添加宾客</span>
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            {
              label: '总人数（含随行）',
              value: stats.totalWithCompanions,
              icon: '👥',
              gradient: 'linear-gradient(135deg, #FADADD, #F7E7CE)',
              color: '#E8A8B8',
            },
            {
              label: '已确认',
              value: stats.confirmed,
              icon: '✅',
              gradient: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)',
              color: '#065F46',
            },
            {
              label: '待确认',
              value: stats.pending,
              icon: '⏳',
              gradient: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
              color: '#92400E',
            },
            {
              label: '婉拒',
              value: stats.declined,
              icon: '💔',
              gradient: 'linear-gradient(135deg, #FEE2E2, #FECACA)',
              color: '#991B1B',
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="card"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: 20,
                animation: `floatUp 0.5s ease ${idx * 0.08}s both`,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: item.gradient,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 26,
                  flexShrink: 0,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                }}
              >
                {item.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: item.color, lineHeight: 1.2 }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 12, color: '#9B8B85', marginTop: 4 }}>
                  {item.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="card"
          style={{ marginBottom: 20, padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={`tab ${activeFilter === f.key ? 'active' : ''}`}
                style={{
                  padding: '10px 22px',
                  fontSize: 14,
                  borderRadius: 10,
                  background: activeFilter === f.key ? 'rgba(250, 218, 221, 0.3)' : 'transparent',
                }}
              >
                {f.label}
                <span
                  style={{
                    marginLeft: 6,
                    padding: '2px 8px',
                    borderRadius: 10,
                    fontSize: 11,
                    fontWeight: 600,
                    background: activeFilter === f.key ? '#E8A8B8' : '#D4C9C0',
                    color: '#fff',
                    transition: 'all 0.3s ease',
                  }}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
          <div style={{ position: 'relative', width: 260 }}>
            <input
              type="text"
              placeholder="搜索姓名或电话..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input"
              style={{ paddingLeft: 40 }}
            />
            <span
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 16,
                opacity: 0.5,
              }}
            >
              🔍
            </span>
          </div>
        </div>

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    background: 'linear-gradient(135deg, #FADADD, #F7E7CE)',
                  }}
                >
                  {['姓名', '电话', '随行人数', 'RSVP状态', '座位号', '操作'].map((th) => (
                    <th
                      key={th}
                      style={{
                        padding: '14px 20px',
                        textAlign: 'left',
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#6B5B55',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {th}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredGuests.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <div className="icon">💐</div>
                        <h3>暂无宾客数据</h3>
                        <p>点击上方"添加宾客"按钮开始邀请您的亲友</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGuests.map((guest, idx) => (
                    <tr
                      key={guest.id}
                      onClick={() => handleOpenEdit(guest)}
                      style={{
                        cursor: 'pointer',
                        borderBottom: '1px solid rgba(212, 201, 192, 0.2)',
                        animation: `floatUp 0.3s ease ${idx * 0.03}s both`,
                        transition: 'background 0.25s ease',
                        background: editingGuest?.id === guest.id ? 'rgba(250, 218, 221, 0.15)' : 'transparent',
                      }}
                      onMouseEnter={(e) => {
                        if (editingGuest?.id !== guest.id) {
                          (e.currentTarget as HTMLTableRowElement).style.background = 'rgba(250, 218, 221, 0.08)'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (editingGuest?.id !== guest.id) {
                          (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'
                        }
                      }}
                    >
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: '50%',
                              background: `linear-gradient(135deg, ${tableBgColor(guest.tableNumber)}, #F7E7CE)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 14,
                              fontWeight: 600,
                              color: '#6B5B55',
                            }}
                          >
                            {guest.name.charAt(0)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#6B5B55', fontSize: 14 }}>
                              {guest.name}
                            </div>
                            <div style={{ fontSize: 11, color: '#9B8B85' }}>
                              添加人：{guest.addedByName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: 14, color: '#6B5B55' }}>
                        {guest.phone}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: 30,
                            height: 30,
                            padding: '0 10px',
                            borderRadius: 15,
                            background: guest.companions > 0 ? 'rgba(232, 168, 184, 0.2)' : 'rgba(212, 201, 192, 0.3)',
                            color: guest.companions > 0 ? '#E8A8B8' : '#9B8B85',
                            fontSize: 13,
                            fontWeight: 600,
                          }}
                        >
                          +{guest.companions}
                        </span>
                        {guest.companions > 0 && (
                          <span style={{ fontSize: 12, color: '#9B8B85', marginLeft: 6 }}>
                            共 {1 + guest.companions} 人
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px' }}>{rsvpBadge(guest.rsvp)}</td>
                      <td style={{ padding: '14px 20px' }}>
                        {guest.tableNumber && guest.seatNumber ? (
                          <div
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '6px 12px',
                              borderRadius: 10,
                              background: tableBgColor(guest.tableNumber),
                              fontSize: 13,
                              fontWeight: 600,
                              color: '#6B5B55',
                            }}
                          >
                            <span>🍽️ {guest.tableNumber}桌</span>
                            <span style={{ opacity: 0.4 }}>|</span>
                            <span>💺 {guest.seatNumber}座</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 13, color: '#D4C9C0', fontStyle: 'italic' }}>
                            未分配
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px' }}>
                        <div style={{ display: 'flex', gap: 8 }} onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenEdit(guest)}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 8,
                              border: '1px solid #E8A8B8',
                              background: '#fff',
                              color: '#E8A8B8',
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.25s ease',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = '#FADADD'
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = '#fff'
                            }}
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`确定要删除宾客"${guest.name}"吗？`)) {
                                handleDelete(guest.id)
                              }
                            }}
                            style={{
                              padding: '6px 14px',
                              borderRadius: 8,
                              border: '1px solid #FECACA',
                              background: '#fff',
                              color: '#DC2626',
                              fontSize: 12,
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.25s ease',
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = '#FEE2E2'
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.background = '#fff'
                            }}
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {isPanelOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            top: 92,
            background: 'rgba(107, 91, 85, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 45,
            animation: 'fadeIn 0.3s ease',
          }}
          onClick={handleClosePanel}
        />
      )}

      <div
        style={{
          position: 'fixed',
          right: 0,
          top: 92,
          width: 380,
          height: 'calc(100vh - 92px)',
          background: '#fff',
          boxShadow: '-8px 0 32px rgba(107, 91, 85, 0.15)',
          zIndex: 46,
          transform: isPanelOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(212, 201, 192, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #FADADD 0%, #F7E7CE 100%)',
          }}
        >
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: '#6B5B55' }}>
              {editingGuest ? '✏️ 编辑宾客' : '🎉 添加宾客'}
            </h3>
            <p style={{ fontSize: 12, color: '#9B8B85', marginTop: 2 }}>
              {editingGuest ? '修改宾客信息与座位分配' : '填写新宾客的详细信息'}
            </p>
          </div>
          <button
            onClick={handleClosePanel}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: 18,
              color: '#6B5B55',
              transition: 'all 0.25s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = '#fff'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'rotate(90deg)'
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.7)'
              ;(e.currentTarget as HTMLButtonElement).style.transform = 'rotate(0deg)'
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          <div style={{ marginBottom: 20 }}>
            <label className="label">宾客姓名 *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value })
                if (errors.name) setErrors({ ...errors, name: undefined })
              }}
              className={`input ${errors.name ? 'error' : ''}`}
              style={{
                animation: shakingFields.has('name') ? 'shake 0.4s ease-in-out' : undefined,
              }}
              placeholder="请输入宾客姓名"
            />
            {errors.name && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{errors.name}</p>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">联系电话 *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) })
                if (errors.phone) setErrors({ ...errors, phone: undefined })
              }}
              className={`input ${errors.phone ? 'error' : ''}`}
              style={{
                animation: shakingFields.has('phone') ? 'shake 0.4s ease-in-out' : undefined,
              }}
              placeholder="请输入11位手机号"
              maxLength={11}
            />
            {errors.phone && (
              <p style={{ fontSize: 12, color: '#ef4444', marginTop: 6 }}>{errors.phone}</p>
            )}
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">随行人数</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, companions: Math.max(0, formData.companions - 1) })}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: '2px solid #D4C9C0',
                  background: '#fff',
                  fontSize: 20,
                  color: '#6B5B55',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8A8B8'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4C9C0'
                }}
              >
                −
              </button>
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  padding: '10px 0',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#E8A8B8',
                  background: 'rgba(250, 218, 221, 0.3)',
                  borderRadius: 10,
                }}
              >
                {formData.companions} 人
              </div>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, companions: Math.min(20, formData.companions + 1) })}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  border: '2px solid #D4C9C0',
                  background: '#fff',
                  fontSize: 20,
                  color: '#6B5B55',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#E8A8B8'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4C9C0'
                }}
              >
                +
              </button>
            </div>
            <p style={{ fontSize: 11, color: '#9B8B85', marginTop: 6, textAlign: 'center' }}>
              含本人共 <strong style={{ color: '#E8A8B8' }}>{1 + formData.companions}</strong> 人出席
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="label">RSVP 状态</label>
