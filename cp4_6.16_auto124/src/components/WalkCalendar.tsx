import { useMemo, useState, useCallback } from 'react';
import { ResponsiveCalendar } from '@nivo/calendar';
import type { Datum } from '@nivo/calendar';
import { Clock, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { usePetStore } from '@/stores/petStore';
import { cn } from '@/lib/utils';
import type { WalkRecord } from '@/types';

interface WalkCalendarProps {
  petId: string;
}

export default function WalkCalendar({ petId }: WalkCalendarProps) {
  const getPetWalkRecords = usePetStore((state) => state.getPetWalkRecords);
  const walkRecords = getPetWalkRecords(petId);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const { from, to } = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setFullYear(end.getFullYear() - 1);
    return {
      from: start.toISOString().split('T')[0],
      to: end.toISOString().split('T')[0],
    };
  }, []);

  const calendarData = useMemo(() => {
    const dailyCount: Record<string, number> = {};
    walkRecords.forEach((record) => {
      const date = record.timestamp.split('T')[0];
      dailyCount[date] = (dailyCount[date] || 0) + 1;
    });
    return Object.entries(dailyCount).map(([day, value]) => ({ day, value }));
  }, [walkRecords]);

  const selectedDayRecords = useMemo(() => {
    if (!selectedDate) return [];
    return walkRecords
      .filter((r) => r.timestamp.split('T')[0] === selectedDate)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedDate, walkRecords]);

  const totalDuration = useMemo(() => {
    return selectedDayRecords.reduce((sum, r) => sum + r.duration, 0);
  }, [selectedDayRecords]);

  const handleDayClick = useCallback((datum: Datum | Omit<Datum, 'data' | 'value'>) => {
    if ('day' in datum) {
      setSelectedDate(datum.day);
    }
  }, []);

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-pet-border">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-pet-text flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-green-600" />
            遛狗日历
          </h3>
          <div className="text-sm text-pet-textLight">
            最近一年
          </div>
        </div>

        <div className="h-48">
          <ResponsiveCalendar
            data={calendarData}
            from={from}
            to={to}
            emptyColor="#f5f5f5"
            colors={['#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32']}
            minValue={0}
            maxValue={14}
            margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
            monthBorderColor="#ffffff"
            dayBorderWidth={2}
            dayBorderColor="#ffffff"
            onClick={handleDayClick}
            tooltip={({ day, value }) => (
              <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-gray-200 text-sm">
                <div className="font-medium text-gray-800">{day}</div>
                <div className="text-gray-600">{value} 次遛狗</div>
              </div>
            )}
            legends={[
              {
                anchor: 'bottom-right',
                direction: 'row',
                translateY: 36,
                itemCount: 4,
                itemWidth: 42,
                itemHeight: 12,
                itemsSpacing: 3,
                itemDirection: 'right-to-left',
              },
            ]}
          />
        </div>
      </div>

      {selectedDate && (
        <div className="rounded-2xl bg-white p-6 shadow-sm border border-pet-border">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-pet-text flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-600" />
              {selectedDate} 的遛狗记录
            </h3>
            <div className="text-sm font-medium text-green-600 bg-green-50 px-3 py-1 rounded-full">
              共 {selectedDayRecords.length} 次 · {formatDuration(totalDuration)}
            </div>
          </div>

          {selectedDayRecords.length === 0 ? (
            <div className="py-8 text-center text-pet-textLight">
              当天没有遛狗记录
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDayRecords.map((record, index) => (
                <WalkRecordItem key={record.id} record={record} index={index} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface WalkRecordItemProps {
  record: WalkRecord;
  index: number;
}

function WalkRecordItem({ record, index }: WalkRecordItemProps) {
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className={cn(
      'flex items-start gap-4 p-4 rounded-xl bg-gray-50 border border-gray-100',
      'hover:bg-green-50 hover:border-green-200 transition-colors'
    )}>
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-sm font-medium text-pet-text">
            {formatTime(record.timestamp)}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
            {formatDuration(record.duration)}
          </span>
        </div>
        <div className="flex items-start gap-2 text-sm text-pet-textLight">
          <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">起</span>
              <span className="truncate">
                {record.startLocation.lat.toFixed(4)}, {record.startLocation.lng.toFixed(4)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-green-200 px-1.5 py-0.5 rounded">终</span>
              <span className="truncate">
                {record.endLocation.lat.toFixed(4)}, {record.endLocation.lng.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
        {record.notes && (
          <div className="mt-2 text-sm text-pet-textLight bg-white px-3 py-2 rounded-lg border border-gray-200">
            {record.notes}
          </div>
        )}
      </div>
    </div>
  );
}
