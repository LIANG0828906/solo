import { memo } from 'react';
import { Droplets, Leaf, Scissors, Sun, Trash2 } from 'lucide-react';
import type { CareLog } from '@/types';
import { CARE_TYPE_LABELS, CARE_TYPE_COLORS, formatDateTime } from '@/utils/date';

interface CareLogItemProps {
  log: CareLog;
  index: number;
  onDelete: (id: string) => void;
  isLast: boolean;
}

const typeIcons: Record<string, typeof Droplets> = {
  water: Droplets,
  fertilize: Leaf,
  prune: Scissors,
  sunlight: Sun,
};

function CareLogItemImpl({ log, index, onDelete, isLast }: CareLogItemProps) {
  const Icon = typeIcons[log.type] || Leaf;
  const color = CARE_TYPE_COLORS[log.type];

  return (
    <div
      className="relative pl-14 pr-2 pb-6"
      style={{
        animation: `slideInLeft 0.4s ease-out ${index * 0.04}s both`,
      }}
    >
      {!isLast && (
        <div
          className="absolute left-[15px] top-11 bottom-0 w-px"
          style={{
            backgroundImage:
              'linear-gradient(to bottom, rgba(91, 140, 90, 0.4) 50%, transparent 50%)',
            backgroundSize: '1px 8px',
          }}
        />
      )}

      <div
        className="absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md border-2 border-white z-10"
        style={{ backgroundColor: color }}
      >
        <Icon className="w-4 h-4 text-white" />
      </div>

      <div className="group bg-white rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 border border-primary/5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs px-2.5 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: color + '18', color }}
            >
              {CARE_TYPE_LABELS[log.type]}
            </span>
            <span className="text-xs text-app-text-light">{formatDateTime(log.date)}</span>
            {log.height && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                📏 {log.height}cm
              </span>
            )}
          </div>
          <button
            onClick={() => onDelete(log.id)}
            className="p-1.5 rounded-lg text-app-text-light opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {log.note && (
          <p className="text-sm text-app-text leading-relaxed whitespace-pre-wrap mb-3">
            {log.note}
          </p>
        )}

        {log.image && (
          <div className="rounded-lg overflow-hidden mt-2 max-w-xs">
            <img
              src={log.image}
              alt="养护记录"
              className="w-full h-40 object-cover hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const CareLogItem = memo(CareLogItemImpl);
