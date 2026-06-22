import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Stats } from '../types';

function AnimatedNumber({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [value]);
  return (
    <span>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({ totalOrders: 0, avgRepairTime: 0, totalStockValue: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { title: '总工单数', value: stats.totalOrders, suffix: '单', icon: '📋' },
    { title: '平均维修时长', value: stats.avgRepairTime, suffix: '分钟', icon: '⏱️' },
    { title: '备件库存总价值', value: Math.floor(stats.totalStockValue), suffix: '元', icon: '💰' }
  ];

  return (
    <div>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>仪表盘</h2>
        <p style={{ color: '#666', fontSize: '14px' }}>系统运营数据概览</p>
      </div>

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center', color: '#999' }}>加载中...</div>
      ) : (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}
          >
            {cards.map((card) => (
              <div
                key={card.title}
                style={{
                  padding: '24px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white',
                  boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)',
                  transition: 'transform 0.2s ease'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-4px)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '12px'
                  }}
                >
                  <span style={{ fontSize: '12px', fontWeight: 'bold', opacity: 0.9 }}>{card.title}</span>
                  <span style={{ fontSize: '28px' }}>{card.icon}</span>
                </div>
                <div style={{ fontSize: '32px', fontWeight: 'bold', animation: 'countUp 0.5s ease' }}>
                  <AnimatedNumber value={card.value} suffix={card.suffix} />
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '20px'
            }}
          >
            <div
              style={{
                padding: '24px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #f0f0f0'
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>工单状态分布</h3>
              <StatusLegend />
            </div>
            <div
              style={{
                padding: '24px',
                backgroundColor: 'white',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '1px solid #f0f0f0'
              }}
            >
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px' }}>快速操作</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => navigate('/')}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: '#333',
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#eef2ff';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  📋 查看所有工单
                </button>
                <button
                  onClick={() => navigate('/parts')}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '14px',
                    color: '#333',
                    transition: 'all 0.2s ease',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#eef2ff';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  📦 管理备件库存
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatusLegend() {
  const statuses = [
    { label: '待处理', color: '#fff3e0', textColor: '#ff9800' },
    { label: '维修中', color: '#e3f2fd', textColor: '#2196f3' },
    { label: '已完成', color: '#e8f5e9', textColor: '#4caf50' }
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {statuses.map((s) => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              backgroundColor: s.color,
              border: `2px solid ${s.textColor}`
            }}
          />
          <span style={{ fontSize: '14px', color: '#666' }}>{s.label}</span>
        </div>
      ))}
    </div>
  );
}
