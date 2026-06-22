import { useEffect, useRef } from 'react';
import { X, Droplets, Leaf, Scissors, Sun } from 'lucide-react';
import type { CareLog, DateRecordModalData, Plant } from '@/types';
import { CARE_TYPE_LABELS, CARE_TYPE_COLORS, formatDateTime } from '@/utils/date';

interface DateRecordsModalProps {
  data: DateRecordModalData | null;
  onClose: () => void;
  logs: CareLog[];
  plants: Plant[];
}

const typeIcons: Record<string, typeof Droplets> = {
  water: Droplets,
  fertilize: Leaf,
  prune: Scissors,
  sunlight: Sun,
};

export default function DateRecordsModal({ data, onClose, logs, plants }: DateRecordsModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!data) return;
    const handler = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 50);
    return () => document.removeEventListener('mousedown', handler);
  }, [data, onClose]);

  if (!data) return null;

  const plantMap = new Map(plants.map((p) => [p.id, p]));

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const modalWidth = 360;
  const modalHeight = Math.min(500, logs.length * 110 + 120);

  let left = data.x - modalWidth / 2;
  let top = data.y + 16;

  if (left < 16) left = 16;
  if (left + modalWidth > viewportWidth - 16) left = viewportWidth - modalWidth - 16;
  if (top + modalHeight > viewportHeight - 16) top = data.y - modalHeight - 16;

  const originStyle: React.CSSProperties = {
    transformOrigin: `${data.originX - left}px ${data.originY - top}px`,
    left: `${left}px`,
    top: `${top}px`,
    width: `${modalWidth}px`,
  };

  return (
    <div className="fixed inset-0 z-50 pointer-events-none">
      <div
        ref={modalRef}
        className="absolute pointer-events-auto bg-white rounded-2xl shadow-2xl overflow-hidden border border-primary/10"
        style={{
          ...originStyle,
          animation: 'modalExpand 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        }}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
          <div>
            <h3 className="font-serif font-semibold text-base">{data.date}</h3>
            <p className="text-xs text-app-text-light mt-0.5">共 {logs.length} 条记录</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-app-bg transition-colors text-app-text-light"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className="max-h-96 overflow-y-auto p-3 space-y-2"
          style={{ maxHeight: `calc(${modalHeight}px - 70px)` }}
        >
          {logs.length === 0 ? (
            <div className="py-8 text-center text-app-text-light text-sm">
              当天暂无养护记录
            </div>
          ) : (
            logs.map((log, idx) => {
              const Icon = typeIcons[log.type] || Leaf;
              const plant = plantMap.get(log.plantId);
              return (
                <div
                  key={log.id}
                  className="p-3 rounded-xl bg-app-bg/60 hover:bg-app-bg transition-colors"
                  style={{
                    animation: `slideInLeft 0.3s ease-out ${idx * 0.05}s both`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: CARE_TYPE_COLORS[log.type] + '25' }}
                    >
                      <Icon
                        className="w-4.5 h-4.5"
                        style={{ color: CARE_TYPE_COLORS[log.type] }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-sm truncate">
                          {plant?.name || '未知植物'}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full shrink-0 font-medium"
                          style={{
                            backgroundColor: CARE_TYPE_COLORS[log.type] + '20',
                            color: CARE_TYPE_COLORS[log.type],
                          }}
                        >
                          {CARE_TYPE_LABELS[log.type]}
                        </span>
                      </div>
                      <p className="text-xs text-app-text-light mt-0.5">
                        {formatDateTime(log.date)}
                      </p>
                      {log.note && (
                        <p className="text-sm text-app-text mt-2 line-clamp-2">{log.note}</p>
                      )}
                      {log.image && (
                        <img
                          src={log.image}
                          alt="记录"
                          className="mt-2 w-full h-24 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
