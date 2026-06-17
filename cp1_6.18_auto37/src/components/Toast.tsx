import { useEffect, useState } from 'react';
import { usePartyStore } from '@/stores/partyStore';

export default function Toast() {
  const toastMessage = usePartyStore((s) => s.toastMessage);
  const toastType = usePartyStore((s) => s.toastType);
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (toastMessage) {
      setVisible(true);
      setLeaving(false);
    } else if (visible) {
      setLeaving(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setLeaving(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [toastMessage, visible]);

  if (!visible) return null;

  const bg = toastType === 'error' ? 'bg-red-500/90' : 'bg-green-500/90';

  return (
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] ${bg} text-white rounded-lg px-6 py-3 font-body shadow-lg ${
        leaving ? 'animate-toast-out' : 'animate-toast-in'
      }`}
    >
      {toastMessage}
    </div>
  );
}
