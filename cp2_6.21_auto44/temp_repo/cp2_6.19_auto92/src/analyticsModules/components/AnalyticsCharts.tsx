import { useState } from 'react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { cn } from '@/shared/utils'

interface WateringDataItem {
  week: string
  count: number
}

interface FertilizingDataItem {
  month: string
  count: number
}

interface LightDataItem {
  name: string
  value: number
  color: string
}

interface AnalyticsChartsProps {
  wateringData: WateringDataItem[]
  fertilizingData: FertilizingDataItem[]
  lightData: LightDataItem[]
}

type TabType = 'watering' | 'fertilizing' | 'light'

const TAB_LABELS: Record<TabType, string> = {
  watering: '浇水频率',
  fertilizing: '施肥趋势',
  light: '光照分布',
}

const GREEN_COLORS = {
  primary: '#22c55e',
  secondary: '#16a34a',
  dark: '#15803d',
  light: '#86efac',
  grid: '#dcfce7',
  text: '#166534',
}

export default function AnalyticsCharts({
  wateringData,
  fertilizingData,
  lightData,
}: AnalyticsChartsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('watering')

  const tabs: TabType[] = ['watering', 'fertilizing', 'light']

  return (
    <div className="w-full">
      <div className="flex mb-4 gap-1 p-1 bg-green-50/50 dark:bg-green-900/20 rounded-lg">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 px-3 text-sm font-medium rounded-md transition-all duration-300',
              activeTab === tab
                ? 'bg-green-500 text-white shadow-sm'
                : 'text-green-700 dark:text-green-300 hover:bg-green-100/50 dark:hover:bg-green-800/30'
            )}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div
        className={cn(
          'relative w-full h-80 rounded-xl backdrop-blur-md bg-white/60 dark:bg-gray-800/60 border border-green-100/50 dark:border-green-900/30 shadow-sm overflow-hidden'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            activeTab === 'watering' ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wateringData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GREEN_COLORS.grid} />
              <XAxis
                dataKey="week"
                tick={{ fill: GREEN_COLORS.text, fontSize: 12 }}
                axisLine={{ stroke: GREEN_COLORS.light }}
                tickLine={{ stroke: GREEN_COLORS.light }}
              />
              <YAxis
                tick={{ fill: GREEN_COLORS.text, fontSize: 12 }}
                axisLine={{ stroke: GREEN_COLORS.light }}
                tickLine={{ stroke: GREEN_COLORS.light }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  color: GREEN_COLORS.text,
                }}
                cursor={{ fill: 'rgba(34, 197, 94, 0.1)' }}
              />
              <Bar
                dataKey="count"
                fill={GREEN_COLORS.primary}
                radius={[4, 4, 0, 0]}
                name="浇水次数"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            activeTab === 'fertilizing' ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={fertilizingData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GREEN_COLORS.grid} />
              <XAxis
                dataKey="month"
                tick={{ fill: GREEN_COLORS.text, fontSize: 12 }}
                axisLine={{ stroke: GREEN_COLORS.light }}
                tickLine={{ stroke: GREEN_COLORS.light }}
              />
              <YAxis
                tick={{ fill: GREEN_COLORS.text, fontSize: 12 }}
                axisLine={{ stroke: GREEN_COLORS.light }}
                tickLine={{ stroke: GREEN_COLORS.light }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  color: GREEN_COLORS.text,
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke={GREEN_COLORS.primary}
                strokeWidth={2}
                dot={{ fill: GREEN_COLORS.secondary, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, fill: GREEN_COLORS.dark }}
                name="施肥次数"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div
          className={cn(
            'absolute inset-0 transition-opacity duration-300',
            activeTab === 'light' ? 'opacity-100 z-10' : 'opacity-0 z-0'
          )}
        >
          {lightData.every((item) => item.value === 0) ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <span className="text-3xl">☀️</span>
              </div>
              <p className="text-sm font-medium text-gray-700 mb-1">暂无光照记录</p>
              <p className="text-xs text-gray-500 max-w-[240px]">
                在养护操作中记录光照情况后，这里将显示实际光照分布统计
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={lightData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: GREEN_COLORS.dark }}
                >
                  {lightData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    color: GREEN_COLORS.text,
                  }}
                  formatter={(value: number) => [`${value}%`, '占比']}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value) => (
                    <span style={{ color: GREEN_COLORS.text }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
