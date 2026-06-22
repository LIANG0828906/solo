import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function RenewalBanner() {
  const members = useStore(s => s.members);
  const dismissedRenewalIds = useStore(s => s.dismissedRenewalIds);
  const dismissRenewal = useStore(s => s.dismissRenewal);
  const fetchMembers = useStore(s => s.fetchMembers);

  const [expiringMembers, setExpiringMembers] = useState<typeof members>([]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const threeDaysLater = new Date(now);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);

    const expiring = members.filter(m => {
      if (m.status === '已过期') return false;
      const expiry = new Date(m.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      return expiry <= threeDaysLater && expiry >= now;
    });
    setExpiringMembers(expiring);
  }, [members]);

  const visibleMembers = expiringMembers.filter(m => !dismissedRenewalIds.includes(m.id));

  if (visibleMembers.length === 0) return null;

  const names = visibleMembers.map(m => m.name).join('、');

  const handleClose = () => {
    visibleMembers.forEach(m => dismissRenewal(m.id));
  };

  return (
    <div
      className="relative flex items-center gap-2 mb-4"
      style={{
        height: '60px',
        backgroundColor: '#fef3c7',
        color: '#92400e',
        borderRadius: '8px',
        padding: '16px',
      }}
    >
      <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#d97706' }} />
      <span className="text-sm font-medium truncate">
        以下会员即将到期：{names}，请及时提醒续费！
      </span>
      <button
        onClick={handleClose}
        className="absolute p-1 rounded transition-colors hover:bg-amber-200"
        style={{ bottom: '8px', right: '12px' }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
