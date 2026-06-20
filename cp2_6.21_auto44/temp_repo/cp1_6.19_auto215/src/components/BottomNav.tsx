import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';

const navItems = [
  { key: 'exchange' as const, label: '交换大厅', icon: '🏠' },
  { key: 'eco' as const, label: '环保积分', icon: '🌱' },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useStore();

  return (
    <motion.nav
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 50,
        background: 'rgba(26, 38, 52, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 80,
        zIndex: 50,
        borderTop: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {navItems.map((item) => (
        <motion.button
          key={item.key}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab(item.key)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            color: activeTab === item.key ? '#4A90D9' : '#95A5A6',
            fontSize: 11,
            position: 'relative',
            padding: '4px 8px',
          }}
        >
          <span style={{ fontSize: 20 }}>{item.icon}</span>
          <span>{item.label}</span>
          {activeTab === item.key && (
            <motion.div
              layoutId="navIndicator"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.3 }}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 24,
                height: 2,
                borderRadius: 1,
                background: '#4A90D9',
              }}
            />
          )}
        </motion.button>
      ))}
    </motion.nav>
  );
}
