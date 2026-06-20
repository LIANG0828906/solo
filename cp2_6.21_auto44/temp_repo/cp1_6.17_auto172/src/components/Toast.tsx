import React from 'react';
import { useAppStore } from '../store';

const Toast: React.FC = () => {
  const toast = useAppStore((state) => state.toast);

  if (!toast?.visible) return null;

  return (
    <div className="toast">
      {toast.message}
    </div>
  );
};

export default Toast;
