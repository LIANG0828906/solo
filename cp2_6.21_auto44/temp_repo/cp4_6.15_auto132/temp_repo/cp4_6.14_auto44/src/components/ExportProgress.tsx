import React, { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export const ExportProgress: React.FC = () => {
  const showProgress = useStore((state) => state.showExportProgress);
  const exportProgress = useStore((state) => state.exportProgress);
  const theme = useStore((state) => state.theme);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (exportProgress >= 100) {
      const timer = setTimeout(() => setFadeOut(true), 500);
      return () => clearTimeout(timer);
    }
    if (showProgress) {
      setFadeOut(false);
    }
  }, [exportProgress, showProgress]);

  if (!showProgress) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '300px',
        backgroundColor: theme.colors.cardBg,
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        zIndex: 1000,
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.5s ease',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          fontWeight: 600,
          color: theme.colors.text,
          marginBottom: '12px',
          textAlign: 'center',
        }}
      >
        导出中... {exportProgress}%
      </div>
      <div
        style={{
          width: '100%',
          height: '8px',
          backgroundColor: theme.colors.secondary,
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            backgroundColor: theme.colors.primary,
            width: `${exportProgress}%`,
            transition: 'width 1.2s ease-out',
            borderRadius: '4px',
          }}
        />
      </div>
    </div>
  );
};
