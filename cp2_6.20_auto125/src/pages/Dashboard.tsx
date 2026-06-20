import { useEffect } from 'react';
import { Layout, Dropdown, Button, Spin, ConfigProvider, theme } from 'antd';
import { DownOutlined, BarChartOutlined } from '@ant-design/icons';
import CityCard from '@/components/CityCard';
import TrendPanel from '@/components/TrendPanel';
import { useAirStore } from '@/stores/airStore';

const { Header, Content } = Layout;

function ParticleIcon() {
  return (
    <div style={{
      position: 'relative',
      width: 28,
      height: 28,
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #00b4d8 0%, #0077b6 100%)',
        boxShadow: '0 0 12px #00b4d8, 0 0 24px #00b4d880',
        animation: 'pulse 2s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: '#fff',
        top: 4,
        left: 18,
        animation: 'float1 3s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: 3,
        height: 3,
        borderRadius: '50%',
        background: '#00b4d8',
        top: 20,
        left: 6,
        animation: 'float2 2.5s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
        }
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0); opacity: 0.8; }
          50% { transform: translate(-4px, 4px); opacity: 1; }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0); opacity: 0.6; }
          50% { transform: translate(4px, -4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default function Dashboard() {
  const {
    cities,
    currentData,
    selectedCities,
    compareVisible,
    loading,
    fetchCities,
    fetchAllCurrent,
    setCompareVisible,
    startAutoRefresh,
  } = useAirStore();

  useEffect(() => {
    fetchCities();
    fetchAllCurrent();
    const cleanup = startAutoRefresh();
    return cleanup;
  }, [fetchCities, fetchAllCurrent, startAutoRefresh]);

  const handleCitySelect = (cityId: string) => {
    const el = document.getElementById(`city-${cityId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const dropdownItems = cities.map((c) => ({
    key: c.id,
    label: (
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>{c.icon}</span>
        {c.name}
      </span>
    ),
  }));

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00b4d8',
          colorBgBase: '#0a1628',
          colorTextBase: '#ffffff',
          borderRadius: 8,
        },
      }}
    >
      <Layout style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a1628 0%, #1a2a4a 100%)',
      }}>
        <Header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 100,
            background: 'rgba(10,22,40,0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderBottom: '1px solid rgba(100,180,255,0.3)',
            boxShadow: '0 1px 0 rgba(100,180,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            height: 64,
          }}
        >
          <div style={{ width: 200 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ParticleIcon />
            <span style={{
              color: '#fff',
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: 1,
              background: 'linear-gradient(90deg, #00b4d8 0%, #90e0ef 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              城市空气质量监测
            </span>
          </div>
          <Dropdown
            menu={{
              items: dropdownItems,
              onClick: ({ key }) => handleCitySelect(key),
            }}
            placement="bottomRight"
          >
            <Button
              type="text"
              style={{
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 8,
                height: 36,
                padding: '0 16px',
              }}
            >
              快速跳转 <DownOutlined style={{ fontSize: 10, marginLeft: 4 }} />
            </Button>
          </Dropdown>
        </Header>

        <Content style={{ padding: '32px' }}>
          {loading && Object.keys(currentData).length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
              <Spin size="large" style={{ color: '#00b4d8' }} />
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
              gap: 24,
              maxWidth: 1400,
              margin: '0 auto',
            }}>
              {cities.map((city) => (
                <CityCard key={city.id} city={city} data={currentData[city.id]} />
              ))}
            </div>
          )}

          {selectedCities.length > 0 && (
            <div style={{
              position: 'fixed',
              left: 24,
              bottom: 24,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              background: 'rgba(10,22,40,0.9)',
              padding: '10px 16px',
              borderRadius: 32,
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
            }}>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                已选择 {selectedCities.length}/2 个城市
              </span>
              <span style={{ display: 'flex', gap: 4 }}>
                {selectedCities.map((id) => {
                  const c = cities.find((x) => x.id === id);
                  return c ? <span key={id} style={{ fontSize: 18 }}>{c.icon}</span> : null;
                })}
              </span>
              <Button
                type="primary"
                icon={<BarChartOutlined />}
                onClick={() => setCompareVisible(true)}
                disabled={selectedCities.length < 2}
                style={{
                  borderRadius: 32,
                  height: 48,
                  width: 48,
                  padding: 0,
                  minWidth: 48,
                  background: selectedCities.length >= 2
                    ? 'linear-gradient(135deg, #00b4d8 0%, #0077b6 100%)'
                    : undefined,
                  border: 'none',
                  boxShadow: selectedCities.length >= 2
                    ? '0 4px 16px rgba(0,180,216,0.4)'
                    : undefined,
                  transition: 'all 0.3s ease',
                }}
                onMouseEnter={(e) => {
                  if (selectedCities.length >= 2) {
                    (e.currentTarget as HTMLElement).style.transform = 'scale(1.1)';
                  }
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
                }}
              />
            </div>
          )}
        </Content>

        <TrendPanel />
      </Layout>
    </ConfigProvider>
  );
}
