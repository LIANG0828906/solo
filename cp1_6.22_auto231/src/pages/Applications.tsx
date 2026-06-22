import { useState, useEffect } from 'react'
import { api, Application } from '../services/api'

const statusLabels: Record<string, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝'
}

const statusColors: Record<string, string> = {
  pending: '#F59E0B',
  approved: '#10B981',
  rejected: '#EF4444'
}

export default function Applications() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [notification, setNotification] = useState<string | null>(null)

  useEffect(() => {
    loadApplications()
  }, [])

  async function loadApplications() {
    try {
      setLoading(true)
      const data = await api.getApplications()
      setApplications(data.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ))
    } catch (err) {
      console.error('Failed to load applications:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleApprove(id: string) {
    try {
      await api.updateApplicationStatus(id, 'approved')
      setNotification('✅ 申请已通过，通知邮件已发送！')
      setTimeout(() => setNotification(null), 3000)
      loadApplications()
      console.log('[邮件通知] 恭喜！您的领养申请已通过审核。')
    } catch (err) {
      console.error('Failed to approve application:', err)
    }
  }

  async function handleReject(id: string) {
    try {
      await api.updateApplicationStatus(id, 'rejected')
      setNotification('❌ 申请已拒绝')
      setTimeout(() => setNotification(null), 3000)
      loadApplications()
    } catch (err) {
      console.error('Failed to reject application:', err)
    }
  }

  const filteredApplications = filter === 'all'
    ? applications
    : applications.filter(a => a.status === filter)

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <div>
          <h1 style={pageTitleStyle}>申请审核</h1>
          <p style={subtitleStyle}>审核和处理领养申请</p>
        </div>
      </div>

      {notification && (
        <div style={notificationStyle}>
          {notification}
        </div>
      )}

      <div style={filterBarStyle}>
        {[
          { key: 'all', label: '全部' },
          { key: 'pending', label: '待审核' },
          { key: 'approved', label: '已通过' },
          { key: 'rejected', label: '已拒绝' }
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
            {item.key !== 'all' && (
              <span style={filterCountStyle}>
                {applications.filter(a => a.status === item.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={loadingStyle}>加载中...</div>
      ) : filteredApplications.length === 0 ? (
        <div style={emptyStyle}>
          <span style={{ fontSize: '48px', marginBottom: '16px' }}>📝</span>
          <p style={{ color: '#64748B' }}>暂无申请记录</p>
        </div>
      ) : (
        <div style={listStyle}>
          {filteredApplications.map(app => (
            <ApplicationCard
              key={app.id}
              application={app}
              onApprove={() => handleApprove(app.id)}
              onReject={() => handleReject(app.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ApplicationCard({
  application, onApprove, onReject
}: {
  application: Application
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <div
      style={cardStyle}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.1)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.06)'
      }}
    >
      <div style={cardHeaderStyle}>
        <div style={applicantInfoStyle}>
          <div style={avatarStyle}>
            {application.applicantName.charAt(0)}
          </div>
          <div>
            <h3 style={applicantNameStyle}>{application.applicantName}</h3>
            <p style={animalNameStyle}>申请领养: {application.animalName}</p>
          </div>
        </div>
        <span style={{
          ...statusBadgeStyle,
          backgroundColor: `${statusColors[application.status]}20`,
          color: statusColors[application.status]
        }}>
          {statusLabels[application.status]}
        </span>
      </div>

      <div style={detailGridStyle}>
        <DetailItem icon="📞" label="联系方式" value={application.contact} />
        <DetailItem icon="🏠" label="居住情况" value={application.housing === 'own' ? '自有房' : '租房'} />
        <DetailItem icon="🐾" label="其他宠物" value={application.hasOtherPets ? '有' : '无'} />
      </div>

      <div style={reasonSectionStyle}>
        <h4 style={reasonLabelStyle}>申请理由</h4>
        <p style={reasonTextStyle}>{application.reason}</p>
      </div>

      {application.status === 'pending' && (
        <div style={actionsStyle}>
          <button style={rejectBtnStyle} onClick={onReject}>
            拒绝
          </button>
          <button style={approveBtnStyle} onClick={onApprove}>
            通过
          </button>
        </div>
      )}

      <div style={footerStyle}>
        <span style={dateStyle}>
          提交时间: {new Date(application.createdAt).toLocaleString('zh-CN')}
        </span>
      </div>
    </div>
  )
}

function DetailItem({ icon, label, value }: {
  icon: string
  label: string
  value: string
}) {
  return (
    <div style={detailItemStyle}>
      <span style={{ fontSize: '16px' }}>{icon}</span>
      <div>
        <span style={detailLabelStyle}>{label}</span>
        <span style={detailValueStyle}>{value}</span>
      </div>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  padding: '32px'
}

const headerStyle: React.CSSProperties = {
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

const notificationStyle: React.CSSProperties = {
  padding: '14px 20px',
  backgroundColor: '#ECFDF5',
  border: '1px solid #10B981',
  borderRadius: '8px',
  color: '#065F46',
  marginBottom: '20px',
  fontWeight: 500,
  animation: 'slideDown 0.3s ease'
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
  transition: 'all 0.2s ease',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const filterBtnActiveStyle: React.CSSProperties = {
  backgroundColor: '#3B82F6',
  borderColor: '#3B82F6',
  color: '#FFFFFF'
}

const filterCountStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0,0,0,0.1)',
  padding: '2px 8px',
  borderRadius: '10px',
  fontSize: '11px'
}

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '60px',
  color: '#64748B'
}

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '60px',
  color: '#64748B'
}

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

const cardStyle: React.CSSProperties = {
  backgroundColor: '#FFFFFF',
  border: '1px solid #E2E8F0',
  borderRadius: '12px',
  padding: '20px',
  transition: 'all 0.3s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.06)'
}

const cardHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '16px'
}

const applicantInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}

const avatarStyle: React.CSSProperties = {
  width: '44px',
  height: '44px',
  backgroundColor: '#3B82F6',
  color: '#FFFFFF',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '16px',
  fontWeight: 600
}

const applicantNameStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 600,
  color: '#1E293B',
  margin: 0,
  marginBottom: '2px'
}

const animalNameStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748B',
  margin: 0
}

const statusBadgeStyle: React.CSSProperties = {
  padding: '6px 12px',
  borderRadius: '12px',
  fontSize: '12px',
  fontWeight: 500
}

const detailGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
  gap: '12px',
  marginBottom: '16px',
  padding: '12px',
  backgroundColor: '#F8FAFC',
  borderRadius: '8px'
}

const detailItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const detailLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px',
  color: '#94A3B8'
}

const detailValueStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '13px',
  fontWeight: 500,
  color: '#334155'
}

const reasonSectionStyle: React.CSSProperties = {
  marginBottom: '16px'
}

const reasonLabelStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: '#334155',
  margin: 0,
  marginBottom: '6px'
}

const reasonTextStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#64748B',
  margin: 0,
  lineHeight: 1.6,
  padding: '10px 12px',
  backgroundColor: '#F8FAFC',
  borderRadius: '6px'
}

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '10px',
  marginBottom: '12px'
}

const rejectBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  backgroundColor: '#FFFFFF',
  border: '1px solid #EF4444',
  color: '#EF4444',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}

const approveBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  backgroundColor: '#10B981',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '8px',
  fontSize: '13px',
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
}

const footerStyle: React.CSSProperties = {
  paddingTop: '12px',
  borderTop: '1px solid #F1F5F9'
}

const dateStyle: React.CSSProperties = {
  fontSize: '12px',
  color: '#94A3B8'
}
