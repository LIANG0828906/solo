import React from 'react';
import { CheckCircle } from 'lucide-react';
import useVaultStore from '@/store/VaultStore';

const Notification: React.FC = () => {
  const notification = useVaultStore((s) => s.notification);

  if (!notification) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gradient-to-r from-[#38bdf8] to-[#818cf8] text-white px-5 py-2.5 rounded-xl text-sm font-medium shadow-lg flex items-center gap-2 animate-fade-in">
      <CheckCircle className="w-4 h-4" />
      {notification}
    </div>
  );
};

export default Notification;
