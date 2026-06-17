import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaList, FaChartBar, FaEdit, FaTrash, FaPlus, FaSignOutAlt, FaArrowLeft, FaImage } from 'react-icons/fa'
import { useStore } from '../../data/store'
import type { Activity } from '../../data/db'
import { v4 as uuidv4 } from 'uuid'

const ADMIN_PASSWORD = 'admin123'

interface FormData {
  title: string
  description: string
  date: string
  time: string
  location: string
  poster: string
  maxParticipants: number
}

const emptyForm: FormData = {
  title: '',
  description: '',
  date: '',
  time: '',
  location: '',
  poster: '',
  maxParticipants: 20,
}

function AdminDashboard() {
  const navigate = useNavigate()
  const activities = useStore((state) => state.activities)
  const registrations = useStore((state) => state.registrations)
  const isAdmin = useStore((state) => state.isAdmin)
  const setIsAdmin = useStore((state) => state.setIsAdmin)
  const addActivity = useStore((state) => state.addActivity)
  const updateActivity = useStore((state) => state.updateActivity)
  const removeActivity = useStore((state) => state.removeActivity)

  const [showLogin, setShowLogin] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [activeMenu, setActiveMenu] = useState<'list' | 'stats'>('list')
  const [showCreatePanel, setShowCreatePanel] = useState(false)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
  const [formData, setFormData] = useState<FormData>(emptyForm)
  const [sidebarExpanded, setSidebarExpanded] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true)
      setShowLogin(false)
      setPassword('')
      setLoginError('')
    } else {
      setLoginError('密码错误，请重试')
    }
  }

  const handleLogout = () => {
    setIsAdmin(false)
    setActiveMenu('list')
  }

  const openCreatePanel = () => {
    setFormData(emptyForm)
    setEditingActivity(null)
    setShowCreatePanel(true)
  }

  const openEditPanel = (activity: Activity) => {
    setFormData({
      title: activity.title,
      description: activity.description,
      date: activity.date,
      time: activity.time,
      location: activity.location,
      poster: activity.poster || '',
      maxParticipants: activity.maxParticipants,
    })
    setEditingActivity(activity)
    setShowCreatePanel(true)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, poster: reader.result as string }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title || !formData.date || !formData.time || !formData.location || !formData.description) {
      return
    }

    if (editingActivity) {
      await updateActivity(editingActivity.id, formData)
    } else {
      const newActivity: Activity = {
        id: uuidv4(),
        ...formData,
      }
      await addActivity(newActivity)
    }
    setShowCreatePanel(false)
    setFormData(emptyForm)
    setEditingActivity(null)
  }

  const handleDelete = async (id: string) => {
    await removeActivity(id)
    setDeleteConfirm(null)
  }

  const getRegistrationCount = (activityId: string) => {
    return registrations.filter((r) => r.activityId === activityId).length
  }

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#16162A' }}>
        {showLogin && (
          <div className="modal-overlay" onClick={() => setShowLogin(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-title">管理员登录</div>
              <form onSubmit={handleLogin}>
                <div className="form-group">
                  <label className="input-label">管理员密码</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setLoginError('')
                    }}
                    placeholder="请输入管理员密码"
                    className="input-field"
                    autoFocus
                  />
                  {loginError && (
                    <p style={{ color: '#FF3366', fontSize: 12, marginTop: 6 }}>{loginError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  className="modal-button"
                  style={{ marginTop: 8 }}
                >
                  登录
                </button>
              </form>
            </div>
          </div>
        )}

        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 48,
          }}
        >
          <button
            onClick={() => navigate('/')}
            style={{
              position: 'absolute',
              top: 24,
              left: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              backgroundColor: 'transparent',
              color: '#B0B0C3',
              fontSize: 14,
              transition: 'all 0.3s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#ffffff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#B0B0C3'
            }}
          >
            <FaArrowLeft size={14} />
            返回首页
          </button>

          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 20,
              background: 'linear-gradient(135deg, #6C63FF 0%, #E94560 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <FaList size={32} color="#ffffff" />
          </div>

          <h1 style={{ color: '#ffffff', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
            管理员控制台
          </h1>
          <p style={{ color: '#B0B0C3', fontSize: 14, marginBottom: 32, textAlign: 'center', maxWidth: 400 }}>
            登录后可以管理社团活动、查看报名数据和统计信息
          </p>

          <button
            onClick={() => setShowLogin(true)}
            style={{
              padding: '14px 48px',
              backgroundColor: '#6C63FF',
              color: '#ffffff',
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
              transition: 'all 0.3s ease-out',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#5A52D8'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#6C63FF'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            管理员登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#16162A' }}>
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-title">确认删除</div>
            <div className="modal-text">
              确定要删除这个活动吗？此操作将同时删除所有相关报名记录，且无法恢复。
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setDeleteConfirm(null)}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#3A3A5C',
                  color: '#ffffff',
                  borderRadius: 8,
                  fontSize: 14,
                  transition: 'all 0.3s ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#4A4A6C'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#3A3A5C'
                }}
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                style={{
                  flex: 1,
                  height: 44,
                  backgroundColor: '#E94560',
                  color: '#ffffff',
                  borderRadius: 8,
                  fontSize: 14,
                  fontWeight: 500,
                  transition: 'all 0.3s ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#D03654'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#E94560'
                }}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreatePanel && (
        <>
          <div
            onClick={() => setShowCreatePanel(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              width: 400,
              height: '100vh',
              backgroundColor: '#1E1E2E',
              zIndex: 1000,
              boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.3)',
              animation: 'slideInRight 0.3s ease-out',
              overflowY: 'auto',
              padding: 32,
            }}
          >
            <h3 style={{ color: '#ffffff', fontSize: 20, fontWeight: 600, marginBottom: 24 }}>
              {editingActivity ? '编辑活动' : '创建新活动'}
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="input-label">活动标题 *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="请输入活动标题"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="input-label">活动描述 *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="请输入活动描述"
                  style={{
                    width: '100%',
                    minHeight: 100,
                    padding: 12,
                    backgroundColor: '#16162A',
                    border: '1px solid #3A3A5C',
                    borderRadius: 8,
                    color: '#ffffff',
                    fontSize: 14,
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    outline: 'none',
                    transition: 'border-color 0.3s ease-out',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#6C63FF'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#3A3A5C'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="input-label">活动日期 *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label className="input-label">活动时间 *</label>
                  <input
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData((prev) => ({ ...prev, time: e.target.value }))}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="input-label">活动地点 *</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="请输入活动地点"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="input-label">最大参与人数</label>
                <input
                  type="number"
                  min={1}
                  value={formData.maxParticipants}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, maxParticipants: parseInt(e.target.value) || 20 }))
                  }
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label className="input-label">活动海报</label>
                <div
                  style={{
                    border: '1px dashed #3A3A5C',
                    borderRadius: 8,
                    padding: 16,
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease-out',
                    backgroundColor: '#16162A',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#6C63FF'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#3A3A5C'
                  }}
                >
                  {formData.poster ? (
                    <div>
                      <img
                        src={formData.poster}
                        alt="预览"
                        style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 4, marginBottom: 8 }}
                      />
                      <p style={{ color: '#B0B0C3', fontSize: 12 }}>点击更换图片</p>
                    </div>
                  ) : (
                    <div>
                      <FaImage size={24} color="#6C63FF" style={{ marginBottom: 8 }} />
                      <p style={{ color: '#B0B0C3', fontSize: 12 }}>点击上传海报图片</p>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="poster-upload"
                  />
                </div>
                <label
                  htmlFor="poster-upload"
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    top: 0,
                    left: 0,
                    cursor: 'pointer',
                    opacity: 0,
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  type="button"
                  onClick={() => setShowCreatePanel(false)}
                  style={{
                    flex: 1,
                    height: 44,
                    backgroundColor: '#3A3A5C',
                    color: '#ffffff',
                    borderRadius: 8,
                    fontSize: 14,
                    transition: 'all 0.3s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#4A4A6C'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#3A3A5C'
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{
                    flex: 1,
                    height: 44,
                    backgroundColor: '#6C63FF',
                    color: '#ffffff',
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    transition: 'all 0.3s ease-out',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#5A52D8'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#6C63FF'
                  }}
                >
                  {editingActivity ? '保存修改' : '创建活动'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      <nav
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        style={{
          width: sidebarExpanded ? 240 : 64,
          backgroundColor: '#16162A',
          borderRight: '0.5px solid #3A3A5C',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s ease-out',
          position: 'sticky',
          top: 0,
          height: '100vh',
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            padding: sidebarExpanded ? '24px 20px' : '24px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarExpanded ? 'flex-start' : 'center',
            gap: 12,
            borderBottom: '0.5px solid #3A3A5C',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #6C63FF 0%, #E94560 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <FaList size={16} color="#ffffff" />
          </div>
          {sidebarExpanded && (
            <span style={{ color: '#ffffff', fontSize: 16, fontWeight: 600, whiteSpace: 'nowrap' }}>
              管理后台
            </span>
          )}
        </div>

        <div style={{ padding: '16px 0', flex: 1 }}>
          <MenuItem
            icon={<FaList size={18} />}
            label="活动概览"
            active={activeMenu === 'list'}
            expanded={sidebarExpanded}
            onClick={() => setActiveMenu('list')}
          />
          <MenuItem
            icon={<FaChartBar size={18} />}
            label="参与统计"
            active={activeMenu === 'stats'}
            expanded={sidebarExpanded}
            onClick={() => navigate('/admin/statistics')}
          />
        </div>

        <div style={{ padding: '16px 0', borderTop: '0.5px solid #3A3A5C' }}>
          <MenuItem
            icon={<FaSignOutAlt size={18} />}
            label="退出登录"
            active={false}
            expanded={sidebarExpanded}
            onClick={handleLogout}
          />
        </div>
      </nav>

      <div style={{ flex: 1, minWidth: 0 }}>
        <header
          style={{
            padding: '24px 48px',
            backgroundColor: '#1E1E2E',
            borderBottom: '0.5px solid #3A3A5C',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1 style={{ color: '#ffffff', fontSize: 22, fontWeight: 700 }}>
              {activeMenu === 'list' ? '活动概览' : '参与统计'}
            </h1>
            <p style={{ color: '#808095', fontSize: 13, marginTop: 4 }}>
              共 {activities.length} 个活动，{registrations.length} 条报名记录
            </p>
          </div>
          {activeMenu === 'list' && (
            <button
              onClick={openCreatePanel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 24px',
                backgroundColor: '#6C63FF',
                color: '#ffffff',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 500,
                transition: 'all 0.3s ease-out',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#5A52D8'
                e.currentTarget.style.transform = 'translateY(-2px)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#6C63FF'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              <FaPlus size={14} />
              创建活动
            </button>
          )}
        </header>

        <main style={{ padding: 48 }}>
          {activeMenu === 'list' && (
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  borderRadius: 8,
                  overflow: 'hidden',
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: '#3A3A5C' }}>
                    <th
                      style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      活动名称
                    </th>
                    <th
                      style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      日期
                    </th>
                    <th
                      style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      时间
                    </th>
                    <th
                      style={{
                        padding: '16px 20px',
                        textAlign: 'left',
                        color: '#ffffff',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      地点
                    </th>
                    <th
                      style={{
                        padding: '16px 20px',
                        textAlign: 'center',
                        color: '#ffffff',
                        fontSize: 1