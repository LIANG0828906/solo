import { useMemo, useState } from 'react';
import { ResponsiveBar } from '@nivo/bar';
import { X } from 'lucide-react';
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const records = useMemo(() => getPetDietRecords(petId), [getPetDietRecords, petId]);

  const dailyData = useMemo<DailyData[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: DailyData[] = [];
    for (let i = 6; i >= 0; i--) {
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
  }, [records]);

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

  const handleBarClick = (data: { data?: { dateKey?: string } }) => {
    if (data.data?.dateKey) {
      setSelectedDate(data.data.dateKey);
    }
  };

  const closeModal = () => {
    setSelectedDate(null);
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-gray-800">
        <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
          近7天进食统计
        </h3>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeModal}
        >
          <div
            className={cn(
              'w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800',
              'max-h-[80vh] overflow-y-auto'
            )}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedDayData.date} 喂食详情
              </h3>
              <button
                onClick={closeModal}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {selectedDayData.records.length === 0 ? (
              <p className="py-8 text-center text-gray-500 dark:text-gray-400">
                当天暂无喂食记录
              </p>
            ) : (
              <div className="space-y-3">
                {selectedDayData.records
                  .sort(
                    (a, b) =>
                      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                  )
                  .map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center justify-between rounded-xl bg-gray-50 p-4 dark:bg-gray-700"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full"
                          style={{ backgroundColor: COLORS[record.type] }}
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-gray-100">
                            {record.brand}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {TYPE_LABELS[record.type]} ·{' '}
                            {new Date(record.timestamp).toLocaleTimeString('zh-CN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-gray-100">
                          {record.grams}g
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-700">
                <div
                  className="mb-1 text-sm font-medium"
                  style={{ color: COLORS.dry }}
                >
                  干粮
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selectedDayData.dry}g
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-700">
                <div
                  className="mb-1 text-sm font-medium"
                  style={{ color: COLORS.wet }}
                >
                  湿粮
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selectedDayData.wet}g
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-3 text-center dark:bg-gray-700">
                <div
                  className="mb-1 text-sm font-medium"
                  style={{ color: COLORS.snack }}
                >
                  零食
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {selectedDayData.snack}g
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
