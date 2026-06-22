import React from 'react';
import { useGalleryStore } from '../store/galleryStore';
import './Toast.css';

const Toast: React.FC = () => {
  const toast = useGalleryStore((state) => state.toast);

  if (!toast) return null;

  return (
    <div className={`toast toast-${toast.type}`}>
      {toast.type === 'success' && '✅ '}
      {toast.type === 'error' && '❌ '}
      {toast.type === 'info' && 'ℹ️ '}
      {toast.message}
    </div>
  );
};

export default Toast;
