import React, { useState, useEffect } from 'react';
import { CoffeeBean, getBeans, getOrigins, addLoadingListener } from '../api';
import BeanCard from '../components/BeanCard';

const Dashboard: React.FC = () => {
  const [beans, setBeans] = useState<CoffeeBean[]>([]);
  const [origins, setOrigins] = useState<string[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');
  const [selectedRoast, setSelectedRoast] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const removeListener = addLoadingListener(setLoading);
    return removeListener;
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [beansData, originsData] = await Promise.all([getBeans(), getOrigins()]);
      setBeans(beansData);
      setOrigins(originsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  const filteredBeans = beans.filter((bean) => {
    const originMatch = selectedOrigin === 'all' || bean.origin === selectedOrigin;
    const roastMatch = selectedRoast === 'all' || bean.roastLevel === selectedRoast;
    return originMatch && roastMatch;
  });

  const CoffeeSpinner = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '12px 0',
      }}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        style={{
          animation: 'spin 1s linear infinite',
        }}
      >
        <path
          d="M2 8h14v6c0 3.314-2.686 6-6 6s-6-2.686-6-6V8zm0 0V6c0-1.105.895-2 2-2h10"
          stroke="#8B4513"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M16 10h2c1.105 0 2 .895 2 2v0c0 1.105-.895 2-2 2h-2"
          stroke="#8B4513"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span style={{ marginLeft: '8px', fontSize: '14px', color: '#8B4513' }}>加载中...</span>
    </div>
  );

  const roastOptions = [
    { value: 'all', label: '全部' },
    { value: 'light', label: '浅焙' },
    { value: 'medium', label: '中焙' },
    { value: 'dark', label: '深焙' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <nav
        style={{
          height: '56px',
          backgroundColor: '#3E2723',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#FFFFFF',
          }}
        >
          豆语档案
        </h1>
        <div
          style={{
            position: 'absolute',
            right: '24px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            backgroundColor: '#BDBDBD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          用
        </div>
      </nav>

      <div
        style={{
          minHeight: '64px',
          backgroundColor: '#FFFFFF',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          flexDirection: isMobile ? 'column' : 'row',
          gap: isMobile ? '12px' : '24px',
          paddingTop: isMobile ? '12px' : 0,
          paddingBottom: isMobile ? '12px' : 0,
          flexShrink: 0,
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
          <label style={{ fontSize: '14px', color: '#3E2723', fontWeight: 600 }}>产地：</label>
          <select
            value={selectedOrigin}
            onChange={(e) => setSelectedOrigin(e.target.value)}
            style={{
              padding: '6px 12px',
              border: '1px solid #BDBDBD',
              borderRadius: '6px',
              fontSize: '14px',
              fontFamily: "'Roboto Slab', serif",
              backgroundColor: '#FFFFFF',
              color: '#3E2723',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease-out',
              flex: isMobile ? 1 : 'none',
            }}
          >
            <option value="all">全部产地</option>
            {origins.map((origin) => (
              <option key={origin} value={origin}>
                {origin}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '14px', color: '#3E2723', fontWeight: 600 }}>烘焙度：</label>
          <div style={{ display: 'flex', gap: '4px' }}>
            {roastOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedRoast(option.value)}
                style={{
                  padding: '6px 14px',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontFamily: "'Roboto Slab', serif",
                  cursor: 'pointer',
                  transition: 'all 0.3s ease-out',
                  backgroundColor: selectedRoast === option.value ? '#8B4513' : '#E0E0E0',
                  color: selectedRoast === option.value ? '#FFFFFF' : '#3E2723',
                  fontWeight: selectedRoast === option.value ? 600 : 400,
                }}
                onMouseEnter={(e) => {
                  if (selectedRoast !== option.value) {
                    e.currentTarget.style.backgroundColor = '#D0D0D0';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedRoast !== option.value) {
                    e.currentTarget.style.backgroundColor = '#E0E0E0';
                  }
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && <CoffeeSpinner />}

      <main
        style={{
          flex: 1,
          padding: '24px',
          maxWidth: '1200px',
          margin: '0 auto',
          width: '100%',
        }}
      >
        {filteredBeans.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#757575',
              fontSize: '16px',
            }}
          >
            暂无匹配的咖啡豆
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, 280px)',
              gap: '16px',
              justifyContent: isMobile ? 'center' : 'flex-start',
            }}
          >
            {filteredBeans.map((bean) => (
              <BeanCard key={bean.id} bean={bean} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
