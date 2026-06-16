import { useMemo, useState, useCallback, useEffect } from 'react';
import { ResponsiveCalendar } from '@nivo/calendar';
import type { Datum } from '@nivo/calendar';
import { Clock, MapPin, Calendar as CalendarIcon, Play, Square, Loader2, AlertCircle } from 'lucide-react';
import { usePetStore } from '@/stores/petStore';
import { cn } from '@/lib/utils';
import { getCurrentPosition } from '@/utils/geo';
import type { WalkRecord, GeoLocation } from '@/types';

interface WalkCalendarProps {
  petId: string;
}

export default function WalkCalendar({ petId }: WalkCalendarProps) {
  const getPetWalkRecords = usePetStore((state) => state.getPetWalkRecords);
  const addWalkRecord = usePetStore((state) => state.addWalkRecord);
  const walkRecords = getPetWalkRecords(petId);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [isWalking, setIsWalking] = useState(false);
  const [walkStartTime, setWalkStartTime] = useState<number | null>(null);
  const [startLocation, setStartLocation] = useState<GeoLocation | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [walkNotes, setWalkNotes] = useState('');

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

  const formatDuration = useCallback((minutes: number) => {
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours} 小时 ${mins} 分钟` : `${hours} 小时`;
  }, []);

  const formatTime = useCallback((timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const formatElapsedTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const handleStartWalk = useCallback(async () => {
    setLocationError(null);
    setIsLoadingLocation(true);
    try {
      const location = await getCurrentPosition();
      setStartLocation(location);
      setWalkStartTime(Date.now());
      setIsWalking(true);
      setElapsedTime(0);
    } catch (error) {
      setLocationError('无法获取位置信息，请检查浏览器定位权限');
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  const handleEndWalk = useCallback(async () => {
    if (!walkStartTime || !startLocation) return;

    setIsLoadingLocation(true);
    setLocationError(null);

    try {
      let endLocation: GeoLocation;
      try {
        endLocation = await getCurrentPosition();
      } catch {
        endLocation = startLocation;
      }

      const durationMinutes = Math.max(1, Math.round((Date.now() - walkStartTime) / 60000));

      addWalkRecord({
        petId,
        startLocation,
        endLocation,
        duration: durationMinutes,
        notes: walkNotes.trim(),
        timestamp: new Date().toISOString(),
      });

      setIsWalking(false);
      setWalkStartTime(null);
      setStartLocation(null);
      setElapsedTime(0);
      setWalkNotes('');
    } catch (error) {
      setLocationError('结束打卡失败，请重试');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [walkStartTime, startLocation, walkNotes, petId, addWalkRecord]);

  useEffect(() => {
    if (!isWalking || !walkStartTime) return;
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - walkStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isWalking, walkStartTime]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-pet-border">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-pet-text flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-green-600" />
            遛狗日历
          </h3>
          <div className="flex items-center gap-3">
            {isWalking ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-100 text-green-700">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                  </span>
                  <span className="font-mono text-lg font-bold">{formatElapsedTime(elapsedTime)}</span>
                </div>
                <button
                  onClick={handleEndWalk}
                  disabled={isLoadingLocation}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                    'bg-red-500 text-white hover:bg-red-600',
                    'shadow-lg shadow-red-500/30 active:scale-95',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isLoadingLocation ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  结束打卡
                </button>
              </div>
            ) : (
              <button
                onClick={handleStartWalk}
                disabled={isLoadingLocation}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all',
                  'bg-gradient-to-r from-green-500 to-emerald-500 text-white',
                  'hover:from-green-600 hover:to-emerald-600',
                  'shadow-lg shadow-green-500/30 active:scale-95',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                {isLoadingLocation ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                开始遛狗
              </button>
            )}
          </div>
        </div>

        {locationError && (
          <div className="mb-4 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {locationError}
          </div>
        )}

        {isWalking && (
          <div className="mb-4 p-4 rounded-xl bg-green-50 border border-green-200">
            <div className="mb-3">
              <label className="block text-sm font-medium text-green-800 mb-1">
                遛狗备注（可选）
              </label>
              <textarea
                value={walkNotes}
                onChange={(e) => setWalkNotes(e.target.value)}
                placeholder="记录一下今天的表现..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-green-300 bg-white text-green-900 placeholder:text-green-500 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400 resize-none text-sm"
              />
            </div>
            {startLocation && (
              <div className="flex items-center gap-2 text-sm text-green-700">
                <MapPin className="w-4 h-4" />
                <span>起点位置已记录: {startLocation.lat.toFixed(4)}, {startLocation.lng.toFixed(4)}</span>
              </div>
            )}
          </div>
        )}

        <div className="text-sm text-pet-textLight mb-2">最近一年</div>

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
                <WalkRecordItem key={record.id} record={record} index={index} formatTime={formatTime} formatDuration={formatDuration} />
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
  formatTime: (timestamp: string) => string;
  formatDuration: (minutes: number) => string;
}

function WalkRecordItem({ record, index, formatTime, formatDuration }: WalkRecordItemProps) {
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
