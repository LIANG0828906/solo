import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ControlPanel } from './chart/ControlPanel';
import { TrendChart } from './chart/TrendChart';
import { SnapshotPanel } from './chart/SnapshotPanel';
import { policyEngine } from './engine/PolicyEngine';
import { subscribe, SimulationState } from './store';

const App: React.FC = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [, forceUpdate] = useState<SimulationState | null>(null);

  useEffect(() => {
    void policyEngine;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    const unsubscribe = subscribe((state) => {
      forceUpdate({ ...state });
    });

    return () => {
      window.removeEventListener('resize', checkMobile);
      unsubscribe();
    };
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1A1A2E',
        padding: isMobile ? '16px' : '24px',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            textAlign: 'center',
            marginBottom: isMobile ? '20px' : '32px',
          }}
        >
          <h1
            style={{
              color: '#FFC107',
              fontSize: isMobile ? '24px' : '32px',
              fontWeight: 700,
              margin: 0,
              marginBottom: '8px',
            }}
          >
            民生政策模拟与碳排放影响推演系统
          </h1>
          <p style={{ color: '#8B9CBF', margin: 0, fontSize: isMobile ? '13px' : '14px' }}>
            选择政策组合，模拟推演未来6个月的民生指标与碳排放变化趋势
          </p>
        </motion.div>

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '20px' : '24px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              width: isMobile ? '100%' : '320px',
              flexShrink: 0,
              background: '#16213E',
              borderRadius: '12px',
              padding: '20px',
              boxSizing: 'border-box',
            }}
          >
            <ControlPanel />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: isMobile ? 0 : 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <h2
              style={{
                color: '#fff',
                fontSize: '20px',
                fontWeight: 600,
                margin: 0,
              }}
            >
              推演结果
            </h2>
            <TrendChart />
            <SnapshotPanel />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default App;
