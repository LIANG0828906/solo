import { useEffect, useState } from 'react'
import { Dropdown, message, Spin } from 'antd'
import type { MenuProps } from 'antd'
import CityCard from '@/components/CityCard'
import TrendPanel from '@/components/TrendPanel'
import { useAirStore } from '@/stores/airStore'
import { airApi } from '@/api/airApi'

function ParticleIcon() {
  return (
    <div
      style={{
        position: 'relative',
        width: 28,
        height: 28,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
          animation: 'particlePulse 2s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 4,
          height: 4,
          borderRadius: '50%',
          background: '#00b4d8',
          top: 2,
          left: 2,
          animation: 'particleFloat 3s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 3,
          height: 3,
          borderRadius: '50%',
          background: '#64e8ff',
          bottom: 4,
          right: 2,
          animation: 'particleFloat 2.5s ease-in-out infinite 0.5s',
        }}
      />
      <div
        style={{
          position: 'absolute',
          width: 2,
          height: 2,
          borderRadius: '50%',
          background: '#ffffff',
          top: 6,
          right: 4,
          animation: 'particleFloat 2s ease-in-out infinite 1s',
        }}
      />
    </div>
  )
}

export default function Dashboard() {
  const cities = useAirStore((s) => s.cities)
  const currentData = useAirStore((s) => s.currentData)
  const selectedCities = useAirStore((s) => s.selectedCities)
  const loading = useAirStore((s) => s.loading)
  const setCities = useAirStore((s) => s.setCities)
  const setCurrentData = useAirStore((s) => s.setCurrentData)
  const toggleCitySelection = useAirStore((s) => s.toggleCitySelection)
  const setLoading = useAirStore((s) => s.setLoading)

  const [panelOpen, setPanelOpen] = useState(false)
  const [messageApi, messageContextHolder] = message.useMessage()

  const fetchAllData = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    try {
      const [citiesRes, currentRes] = await Promise.all([
        airApi.getCities(),
        airApi.getAllCurrent(),
      ])
      setCities(citiesRes.cities)
      setCurrentData(currentRes.data)
    } catch (err) {
      if (showLoading) {
        messageApi.error('数据加载失败，请检查后端服务是否启动')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
    const interval = setInterval(() => {
      fetchAllData(false)
    }, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const handleCitySelect = (cityId: string) => {
    const el = document.getElementById(`city-card-${cityId}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleCompareClick = () => {
    if (selectedCities.length !== 2) {
      messageApi.warning('请先选择两个城市进行对比')
      return
    }
    setPanelOpen(true)
  }

  const menuItems: MenuProps['items'] = cities.map((city) => ({
    key: city.id,
    icon: <span style={{ fontSize: 16, marginRight: 4 }}>{city.icon}</span>,
    label: city.name,
    onClick: () => handleCitySelect(city.id),
  }))

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a1628 0%, #1a2a4a 100%)',
        backgroundAttachment: 'fixed',
      }}
    >
      {messageContextHolder}

      <nav
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 32px',
          background: 'rgba(10, 22, 40, 0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(100, 180, 255, 0.3)',
          boxShadow: '0 1px 20px rgba(100, 180, 255, 0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ParticleIcon />
          <h1
            style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 700,
              color: '#ffffff',
              letterSpacing: 1,
              background: 'linear-gradient(90deg, #ffffff, #64e8ff)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            空气质量在线监测
          </h1>
        </div>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight" trigger={['click']}>
          <button
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(0, 180, 216, 0.15)'
              e.currentTarget.style.borderColor = 'rgba(0, 180, 216, 0.4)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
            }}
          >
            <span>🏙️</span>
            <span>选择城市</span>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>▼</span>
          </button>
        </Dropdown>
      </nav>

      <main
        style={{
          padding: '100px 32px 120px',
          maxWidth: 1400,
          margin: '0 auto',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: 48,
            animation: 'fadeInUp 0.8s ease-out',
          }}
        >
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.5)',
              fontSize: 14,
              marginBottom: 8,
              letterSpacing: 2,
            }}
          >
            REAL-TIME AIR QUALITY MONITORING
          </p>
          <h2
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
              letterSpacing: 1,
            }}
          >
            全国主要城市空气质量
          </h2>
          <p
            style={{
              color: 'rgba(255, 255, 255, 0.4)',
              fontSize: 13,
              marginTop: 12,
            }}
          >
            点击卡片选择城市，最多选择两个进行趋势对比 · 每5分钟自动刷新
          </p>
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: 100,
            }}
          >
            <Spin size="large" />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 24,
            }}
          >
            {cities.map((city, index) => (
              <CityCard
                key={city.id}
                city={city}
                data={currentData[city.id]}
                selected={selectedCities.includes(city.id)}
                onToggle={() => toggleCitySelection(city.id)}
                index={index}
              />
            ))}
          </div>
        )}
      </main>

      <button
        onClick={handleCompareClick}
        style={{
          position: 'fixed',
          left: 32,
          bottom: 32,
          width: 64,
          height: 64,
          borderRadius: '50%',
          border: 'none',
          background: 'linear-gradient(135deg, #00b4d8, #0077b6)',
          color: '#ffffff',
          fontSize: 24,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease',
          animation: 'floatShadow 3s ease-in-out infinite',
          opacity: selectedCities.length === 2 ? 1 : 0.5,
          zIndex: 90,
        }}
        onMouseEnter={(e) => {
          if (selectedCities.length === 2) {
            e.currentTarget.style.transform = 'scale(1.1)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        📊
        {selectedCities.length > 0 && (
          <span
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 22,
              height: 22,
              padding: '0 6px',
              borderRadius: 11,
              background: '#ff6b6b',
              fontSize: 11,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {selectedCities.length}
          </span>
        )}
      </button>

      <TrendPanel open={panelOpen} onClose={() => setPanelOpen(false)} />
    </div>
  )
}
