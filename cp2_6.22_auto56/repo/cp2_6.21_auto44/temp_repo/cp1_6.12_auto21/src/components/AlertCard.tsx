import type { MisplaceAlert } from '@/types';

interface AlertCardProps {
  alert: MisplaceAlert;
  onAcknowledge: (alertId: string) => void;
}

export default function AlertCard({ alert, onAcknowledge }: AlertCardProps) {
  return (
    <div className="glass-panel p-3 max-w-xs animate-slide-in-right">
      <p className="text-sm font-medium text-red-600">错架提醒</p>
      <p className="text-xs text-wood-600 mt-1">《{alert.book.title}》位置异常</p>
      <button
        className="btn-press mt-2 text-xs text-gold-dark hover:underline"
        onClick={() => onAcknowledge(alert.id)}
      >
        确认
      </button>
    </div>
  );
}
