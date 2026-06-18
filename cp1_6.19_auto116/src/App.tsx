import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ThemeStoreProvider, useThemeStore } from './themeStore.tsx';
import InspirationInput from './InspirationInput';
import OrganizeArea from './OrganizeArea';

const ProgressBar: React.FC = () => {
  const { state } = useThemeStore();

  const progress = useMemo(() => {
    const total = state.notes.length;
    if (total === 0) return 0;
    const organized = state.notes.filter(n => n.themeId).length;
    return Math.round((organized / total) * 100);
  }, [state.notes]);

  const organizedCount = state.notes.filter(n => n.themeId).length;
  const totalCount = state.notes.length;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
      }}
    >
      <div
        style={{
          height: 6,
          width: '100%',
          backgroundColor: 'rgba(223, 230, 233, 0.5)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            background: 'linear-gradient(90deg, #00B894 0%, #00CEC9 100%)',
          }}
        />
      </div>
      <div
        style={{
          position: 'absolute',
          right: 32,
          top: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: '#2D3436',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {organizedCount}
        </div>
        <span
          style={{
            fontSize: 13,
            color: '#636E72',
          }}
        >
          / {totalCount}
        </span>
        <span
          style={{
            fontSize: 13,
            color: '#636E72',
            marginLeft: 4,
          }}
        >
          已整理
        </span>
      </div>
    </div>
  );
};

const AppContent: React.FC = () => {
  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#F5F6FA',
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        color: '#2D3436',
      }}
    >
      <ProgressBar />
      <div style={{ paddingTop: 60 }}>
        <OrganizeArea />
      </div>
      <InspirationInput />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeStoreProvider>
      <AppContent />
    </ThemeStoreProvider>
  );
};

export default App;
