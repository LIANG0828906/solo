import React from 'react';

export const LoadingSpinner: React.FC = () => (
  <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
    <div className="spinner" />
  </div>
);

export const ErrorBanner: React.FC<{ message: string; onClose: () => void }> = ({ message, onClose }) => {
  React.useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div className="error-banner">
      <span>{message}</span>
      <button onClick={onClose}>×</button>
    </div>
  );
};
