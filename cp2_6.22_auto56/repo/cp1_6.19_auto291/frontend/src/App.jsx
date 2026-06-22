import React, { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import useCabinetStore from './store/useCabinetStore';
import MapGrid from './components/MapGrid';
import CabinetDetail from './components/CabinetDetail';
import NotificationBar from './components/NotificationBar';

export default function App() {
  const { cabinets, fetchCabinets, selectedCompartment } = useCabinetStore();

  useEffect(() => {
    fetchCabinets();
    const interval = setInterval(() => {
      useCabinetStore.getState().checkOverdue();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const availableCount = cabinets.reduce(
    (sum, c) => sum + c.compartments.filter((s) => s.status === 'available').length, 0
  );
  const occupiedCount = cabinets.reduce(
    (sum, c) => sum + c.compartments.filter((s) => s.status === 'occupied').length, 0
  );
  const overdueCount = cabinets.reduce(
    (sum, c) => sum + c.compartments.filter((s) => s.status === 'overdue').length, 0
  );

  return (
    <div style={{ minHeight: '100vh', background: '#F5F5F5', paddingBottom: 80 }}>
      <header style={{
        background: 'linear-gradient(135deg, #3498DB, #2980B9)',
        color: '#fff',
        padding: '16px 24px',
        boxShadow: '0 2px 8px rgba(52,152,219,0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>
            城市骑手临时储物柜
          </h1>
          <span style={{ fontSize: 14, opacity: 0.85 }}>互助调度平台</span>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: '储物柜总数', value: cabinets.length, color: '#3498DB' },
            { label: '空闲格口', value: availableCount, color: '#27AE60' },
            { label: '占用格口', value: occupiedCount, color: '#95A5A6' },
            { label: '超时格口', value: overdueCount, color: '#E74C3C' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: '#fff',
              borderRadius: 12,
              padding: '20px 24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              borderTop: `3px solid ${stat.color}`,
            }}>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: selectedCompartment ? '1fr 380px' : '1fr',
          gap: 24,
          transition: 'all 0.3s',
        }}>
          <MapGrid cabinets={cabinets} />
          <AnimatePresence>
            {selectedCompartment && <CabinetDetail />}
          </AnimatePresence>
        </div>
      </main>

      <NotificationBar />
    </div>
  );
}
