import { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useStore } from '@/store/useStore';

export default function RenewalBanner() {
  const members = useStore(s => s.members);
  const dismissedRenewalIds = useStore(s => s.dismissedRenewalIds);
  const dismissRenewal = useStore(s => s.dismissRenewal);

  const [expiringMembers, setExpiringMembers] = useState<typeof members>([]);

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

  const visible = expiringMembers.filter(m => !dismissedRenewalIds.includes(m.id));

  if (visible.length === 0) return null;

  const names = visible.map(m => m.name).join('、');

  return (
    <div className="relative h-[60px] bg-amber-100 text-amber-800 rounded-lg p-4 flex items-center gap-2 mb-4">
      <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
      <span className="text-sm font-medium truncate">
        以下会员即将到期：{names}，请及时提醒续费！
      </span>
      <button
        onClick={() => visible.forEach(m => dismissRenewal(m.id))}
        className="absolute bottom-2 right-3 p-1 hover:bg-amber-200 rounded transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
