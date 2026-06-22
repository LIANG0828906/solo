import { usePlantStore } from '@/store/plantStore';
import { CareLogItem } from './CareLogItem';
import { Plus, Droplets } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';

interface CareTimelineProps {
  plantId: string;
  onAddLog: () => void;
}

export default function CareTimeline({ plantId, onAddLog }: CareTimelineProps) {
  const logs = usePlantStore(
    useShallow((state) =>
      state.careLogs
        .filter((l) => l.plantId === plantId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    )
  );
  const deleteCareLog = usePlantStore((state) => state.deleteCareLog);

  return (
    <div className="bg-white rounded-2xl shadow-card border border-primary/5 p-5 sm:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-serif font-semibold text-app-text">养护时间线</h3>
          <p className="text-sm text-app-text-light mt-1">共 {logs.length} 条记录</p>
        </div>
        <button
          onClick={onAddLog}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-full font-medium text-sm shadow-md hover:shadow-lg hover:bg-primary-dark transition-all duration-200 hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden xs:inline">添加记录</span>
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Droplets className="w-8 h-8 text-primary/60" />
          </div>
          <h4 className="font-medium text-app-text mb-1">还没有养护记录</h4>
          <p className="text-sm text-app-text-light mb-4 max-w-xs">
            开始记录这株植物的第一次养护吧
          </p>
          <button
            onClick={onAddLog}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-full font-medium text-sm hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            添加第一条记录
          </button>
        </div>
      ) : (
        <div className="pt-2">
          {logs.map((log, idx) => (
            <CareLogItem
              key={log.id}
              log={log}
              index={idx}
              onDelete={deleteCareLog}
              isLast={idx === logs.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
