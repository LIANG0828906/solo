import { useMemo, useState, useCallback } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePetStore } from '@/stores/petStore';
import { cn } from '@/lib/utils';
import type { DietRecord, DietType } from '@/types';

interface DietChartProps {
  petId: string;
}

interface DailyData {
  date: string;
  dateLabel: string;
  dry: number;
  wet: number;
  snack: number;
  records: DietRecord[];
}

const COLORS: Record<DietType, string> = {
  dry: '#FFD54F',
  wet: '#81C784',
  snack: '#FF8A65',
};

const TYPE_LABELS: Record<DietType, string> = {
  dry: '干粮',
  wet: '湿粮',
  snack: '零食',
};

const RANGE_OPTIONS = [
  { value: 7, label: '近7天' },
  { value: 14, label: '近14天' },
  { value: 30, label: '近30天' },
];

function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

export default function DietChart({ petId }: DietChartProps) {
  const getPetDietRecords = usePetStore((state) => state.getPetDietRecords);
  const addDietRecord = usePetStore((state) => state.addDietRecord);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [rangeDays, setRangeDays] = useState(7);
  const [offsetDays, setOffsetDays] = useState(0);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newType, setNewType] = useState<DietType>('dry');
  const [newBrand, setNewBrand] = useState('');
  const [newGrams, setNewGrams] = useState(50);

  const records = useMemo(() => getPetDietRecords(petId), [getPetDietRecords, petId]);

  const dailyData = useMemo<DailyData[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setDate(today.getDate() - offsetDays);

    const days: DailyData[] = [];
    for (let i = rangeDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateKey = formatDateKey(date);
      days.push({
        date: dateKey,
        dateLabel: formatDateLabel(date),
        dry: 0,
        wet: 0,
        snack: 0,
        records: [],
      });
    }

    const dateMap = new Map(days.map((d) => [d.date, d]));

    for (const record of records) {
      const recordDate = new Date(record.timestamp);
      const dateKey = formatDateKey(recordDate);
      const dayData = dateMap.get(dateKey);
      if (dayData) {
        dayData[record.type] += record.grams;
        dayData.records.push(record);
      }
    }

    return days;
  }, [records, rangeDays, offsetDays]);

  const chartData = useMemo(
    () =>
      dailyData.map((d) => ({
        date: d.dateLabel,
        dateKey: d.date,
        dry: d.dry,
        wet: d.wet,
        snack: d.snack,
      })),
    [dailyData]
  );

  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    return dailyData.find((d) => d.date === selectedDate) || null;
  }, [selectedDate, dailyData]);

  const handleBarClick = useCallback((data: { data?: { dateKey?: string } }) => {
    if (data.data?.dateKey) {
      setSelectedDate((prev) => (prev === data.data!.dateKey ? null : data.data!.dateKey));
    }
  }, []);

  const handlePrevRange = useCallback(() => {
    setOffsetDays((prev) => prev + rangeDays);
    setSelectedDate(null);
  }, [rangeDays]);

  const handleNextRange = useCallback(() => {
    setOffsetDays((prev) => Math.max(0, prev - rangeDays));
    setSelectedDate(null);
  }, [rangeDays]);

  const handleAddRecord = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    addDietRecord({
      petId,
      type: newType,
      brand: newBrand.trim() || '默认品牌',
      grams: newGrams,
      timestamp: new Date().toISOString(),
    });
    setNewBrand('');
    setNewGrams(50);
    setShowAddForm(false);
  }, [petId, addDietRecord, newType, newBrand, newGrams]);

  const totalGrams = useMemo(() => {
    return dailyData.reduce(
      (sum, d) => sum + d.dry + d.wet + d.snack,
      0
    );
  }, [dailyData]);

  return (
    <div className="w-full space-y-4">
      <div className="rounded-2xl bg-white p-6 shadow-sm border border-pet-border">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-pet-text">
              进食统计
            </h3>
            <span className="text-sm text-pet-textLight">
              共 {totalGrams}g
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl bg-pet-bg p-1">
              {RANGE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setRangeDays(opt.value);
                    setOffsetDays(0);
                    setSelectedDate(null);
                  }}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    rangeDays === opt.value
                      ? 'bg-white text-pet-text shadow-sm'
                      : 'text-pet-textLight hover:text-pet-text'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <button
              onClick={handlePrevRange}
              disabled={offsetDays >= 365}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-pet-bg text-pet-textLight hover:bg-pet-border/50 hover:text-pet-text transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextRange}
              disabled={offsetDays === 0}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-pet-bg text-pet-textLight hover:bg-pet-border/50 hover:text-pet-text transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowAddForm((prev) => !prev)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all',
                showAddForm
                  ? 'bg-gray-100 text-gray-700'
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-md shadow-amber-500/30'
              )}
            >
              {showAddForm ? '取消' : '+ 记录喂食'}
            </button>
          </div>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddRecord} className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">类型</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as DietType)}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                >
                  <option value="dry">干粮</option>
                  <option value="wet">湿粮</option>
                  <option value="snack">零食</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">品牌</label>
                <input
                  type="text"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  placeholder="可选"
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-amber-900 placeholder:text-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-amber-800 mb-1">分量(g)</label>
                <input
                  type="number"
                  min="1"
                  value={newGrams}
                  onChange={(e) => setNewGrams(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-400/50"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
                >
                  添加记录
                </button>
              </div>
            </div>
          </form>
        )}

        <div className="h-64 w-full">
          <ResponsiveBar
            data={chartData}
            keys={['dry', 'wet', 'snack']}
            indexBy="date"
            margin={{ top: 20, right: 20, bottom: 40, left: 50 }}
            padding={0.3}
            groupMode="stacked"
            valueScale={{ type: 'linear' }}
            indexScale={{ type: 'band', round: true }}
            colors={({ id }) => COLORS[id as DietType]}
            borderColor={{
              from: 'color',
              modifiers: [['darker', 1.6]],
            }}
            axisTop={null}
            axisRight={null}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: '日期',
              legendPosition: 'middle',
              legendOffset: 32,
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: '克 (g)',
              legendPosition: 'middle',
              legendOffset: -40,
            }}
            labelSkipWidth={12}
            labelSkipHeight={12}
            labelTextColor={{
              from: 'color',
              modifiers: [['darker', 1.6]],
            }}
            legends={[
              {
                dataFrom: 'keys',
                anchor: 'top-right',
                direction: 'row',
                justify: false,
                translateX: 0,
                translateY: -20,
                itemsSpacing: 12,
                itemWidth: 60,
                itemHeight: 20,
                itemDirection: 'left-to-right',
                itemOpacity: 0.85,
                symbolSize: 12,
                effects: [
                  {
                    on: 'hover',
                    style: {
                      itemOpacity: 1,
                    },
                  },
                ],
              },
            ]}
            role="application"
            ariaLabel="进食统计柱状图"
            onClick={handleBarClick}
            tooltip={({ id, value, indexValue }) => (
              <div className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg">
                <div className="font-medium">{TYPE_LABELS[id as DietType]}</div>
                <div className="text-gray-300">
                  {indexValue}: {value}g
                </div>
              </div>
            )}
          />
        </div>
      </div>

      {selectedDayData && (
        <div
          className={cn(
            'rounded-2xl bg-white p-6 shadow-sm border border-pet-border overflow-hidden',
            'transition-all duration-300 ease-in-out'
          )}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-pet-text">
              {selectedDayData.date} 喂食详情
            </h3>
            <div className="flex gap-2">
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: COLORS.dry + '30', color: '#B8860B' }}
              >
                干粮 {selectedDayData.dry}g
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: COLORS.wet + '30', color: '#2E7D32' }}
              >
                湿粮 {selectedDayData.wet}g
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ backgroundColor: COLORS.snack + '30', color: '#D84315' }}
              >
                零食 {selectedDayData.snack}g
              </span>
            </div>
          </div>

          {selectedDayData.records.length === 0 ? (
            <p className="py-6 text-center text-pet-textLight">
              当天暂无喂食记录，点击上方"记录喂食"添加
            </p>
          ) : (
            <div className="space-y-2">
              {selectedDayData.records
                .sort(
                  (a, b) =>
                    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                )
                .map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between rounded-xl bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-white text-lg"
                        style={{ backgroundColor: COLORS[record.type] }}
                      >
                        {record.type === 'dry' ? '🥣' : record.type === 'wet' ? '🥫' : '🍖'}
                      </div>
                      <div>
                        <div className="font-medium text-pet-text">
                          {record.brand}
                        </div>
                        <div className="text-sm text-pet-textLight">
                          {TYPE_LABELS[record.type]} ·{' '}
                          {new Date(record.timestamp).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-pet-text">
                        {record.grams}g
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
