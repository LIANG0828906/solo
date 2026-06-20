import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  DashboardOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  BellOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useInventoryStore } from '@/stores/inventoryStore'
import dayjs from 'dayjs'

const navItems = [
  { path: '/', icon: DashboardOutlined, label: '仪表盘' },
  { path: '/inventory', icon: UnorderedListOutlined, label: '库存管理' },
  { path: '/reports', icon: BarChartOutlined, label: '报告' },
]

export default function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const alerts = useInventoryStore((state) => state.alerts)
  const alertCount = useInventoryStore((state) => state.alertCount)
  const markAlertAsRead = useInventoryStore((state) => state.markAlertAsRead)
  const navigate = useNavigate()

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleAlertClick = (alertId: string, consumableId: string) => {
    markAlertAsRead(alertId)
    setShowNotifications(false)
    useInventoryStore.getState().setSelectedConsumableId(consumableId)
    navigate('/inventory', { state: { openDetail: consumableId } })
  }

  const Sidebar = () => (
    <aside
      style={{
        width: isMobile && !mobileMenuOpen ? 0 : 240,
        backgroundColor: '#001529',
        minHeight: '100vh',
        transition: 'width 0.3s ease',
        overflow: 'hidden',
        position: isMobile ? 'fixed' : 'relative',
        zIndex: 100,
      }}
    >
      <div style={{ padding: '24px 20px', color: 'white', borderBottom: '1px solid #002140' }}>
        <h1 style={{ fontSize: 18, fontWeight: 600, whiteSpace: 'nowrap' }}>🧪 耗材管理系统</h1>
      </div>
      <nav style={{ padding: '16px 12px' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                marginBottom: 4,
                borderRadius: 8,
                color: isActive ? '#0050b3' : '#8c8c8c',
                backgroundColor: isActive ? '#e6f7ff' : 'transparent',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                whiteSpace: 'nowrap',
                fontSize: 14,
                fontWeight: isActive ? 600 : 400,
              })}
            >
              <Icon style={{ fontSize: 18 }} />
              {(!isMobile || mobileMenuOpen) && <span>{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />

      {isMobile && (
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          style={{
            position: 'fixed',
            top: 16,
            left: 16,
            zIndex: 200,
            width: 40,
            height: 40,
            borderRadius: 8,
            backgroundColor: '#001529',
            color: 'white',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mobileMenuOpen ? <CloseOutlined /> : <MenuOutlined />}
        </button>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            backgroundColor: 'white',
            padding: '16px 32px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 50,
          }}
        >
          <div style={{ marginLeft: isMobile ? 56 : 0 }}>
            <h2 style={{ fontSize: 16, fontWeight: 500, color: '#595959' }}>
              实验室管理员
            </h2>
          </div>

          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{
                position: 'relative',
                width: 40,
                height: 40,
                borderRadius: 8,
                border: 'none',
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <BellOutlined style={{ fontSize: 18, color: '#595959' }} />
              {alertCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    minWidth: 20,
                    height: 20,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #ff4d4f 0%, #f5222d 100%)',
                    color: 'white',
                    fontSize: 11,
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 5px',
                    animation: alertCount > 0 ? 'bounce 0.5s ease' : 'none',
                  }}
                >
                  {alertCount > 99 ? '99+' : alertCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                className="fade-in"
                style={{
                  position: 'absolute',
                  top: 52,
                  right: 0,
                  width: 360,
                  maxHeight: 400,
                  overflowY: 'auto',
                  backgroundColor: 'white',
                  borderRadius: 12,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                  border: '1px solid #f0f0f0',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #f0f0f0',
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  预警通知
                </div>
                {alerts.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#8c8c8c' }}>
                    暂无预警通知
                  </div>
                ) : (
                  <div>
                    {alerts.slice(0, 10).map((alert) => (
                      <div
                        key={alert.id}
                        onClick={() => handleAlertClick(alert.id, alert.consumableId)}
                        style={{
                          padding: '12px 20px',
                          borderBottom: '1px solid #f5f5f5',
                          cursor: 'pointer',
                          backgroundColor: alert.read ? 'white' : '#fff1f0',
                          transition: 'background-color 0.2s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontWeight: 500, fontSize: 14 }}>{alert.consumableName}</span>
                          <span style={{ fontSize: 12, color: '#8c8c8c' }}>
                            {dayjs(alert.timestamp).format('MM-DD HH:mm')}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: '#595959' }}>
                          当前库存: <span style={{ color: '#f5222d', fontWeight: 500 }}>{alert.currentStock}</span>
                          {' / '}安全阈值: {alert.safetyThreshold}
                        </div>
                        <div style={{ fontSize: 12, color: '#faad14', marginTop: 4 }}>
                          推荐补货: {alert.safetyThreshold - alert.currentStock} 件
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <main style={{ flex: 1, padding: '32px', paddingLeft: isMobile ? '72px' : '32px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <Outlet />
          </div>
        </main>
      </div>

      {isMobile && mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 99,
          }}
        />
      )}
    </div>
  )
}
