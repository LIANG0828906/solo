import { useState, useEffect, useCallback } from 'react';
import { FileText, Filter, Calendar, TrendingUp } from 'lucide-react';
import BarChart from '@/components/BarChart';
import { getSummary } from '@/api/taskApi';
import { getClients } from '@/api/clientApi';
import { getSettings } from '@/api/settingsApi';
import { exportToPdf } from '@/utils/pdfExport';
import { getWeekStart, getMonthStart, getTodayEnd, formatDate } from '@/utils/timeUtils';
import type { SummaryResponse, Client, Settings, Task } from '../../shared/types';

type DateRangeType = 'week' | 'month' | 'custom';

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState<DateRangeType>('week');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [summaryData, setSummaryData] = useState<SummaryResponse | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [tasksForInvoice, setTasksForInvoice] = useState<Task[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      let startDate: string, endDate: string;
      
      if (dateRange === 'week') {
        startDate = getWeekStart().toISOString();
        endDate = getTodayEnd().toISOString();
      } else if (dateRange === 'month') {
        startDate = getMonthStart().toISOString();
        endDate = getTodayEnd().toISOString();
      } else {
        startDate = customStart ? new Date(customStart).toISOString() : getWeekStart().toISOString();
        endDate = customEnd ? new Date(customEnd + 'T23:59:59').toISOString() : getTodayEnd().toISOString();
      }

      const [summaryData, clientsData, settingsData] = await Promise.all([
        getSummary({
          startDate,
          endDate,
          clientId: selectedClientId || undefined,
        }),
        getClients(),
        getSettings(),
      ]);

      setSummaryData(summaryData);
      setClients(clientsData);
      setSettings(settingsData);
    } catch (e) {
      console.error('加载数据失败:', e);
    } finally {
      setLoading(false);
    }
  }, [dateRange, customStart, customEnd, selectedClientId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerateInvoice = async () => {
    if (!selectedClientId || !summaryData || !settings) {
      alert('请先选择一个客户');
      return;
    }

    const client = clients.find(c => c.id === selectedClientId);
    if (!client) return;

    let startDate: string, endDate: string;
    if (dateRange === 'week') {
      startDate = getWeekStart().toISOString();
      endDate = getTodayEnd().toISOString();
    } else if (dateRange === 'month') {
      startDate = getMonthStart().toISOString();
      endDate = getTodayEnd().toISOString();
    } else {
      startDate = customStart ? new Date(customStart).toISOString() : getWeekStart().toISOString();
      endDate = customEnd ? new Date(customEnd + 'T23:59:59').toISOString() : getTodayEnd().toISOString();
    }

    const { getTasks } = await import('@/api/taskApi');
    const tasks = await getTasks(selectedClientId, 100, 0);

    exportToPdf({
      client,
      tasks,
      settings,
      startDate,
      endDate,
    });
  };

  const selectedClient = clients.find(c => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">统计分析</h1>
          <p className="text-gray-500 mt-1">查看你的工时统计和趋势</p>
        </div>
        <button
          onClick={handleGenerateInvoice}
          disabled={!selectedClientId}
          style={{ backgroundColor: selectedClientId ? '#6366F1' : '#CBD5E1' }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium
                   transition-all hover:opacity-90 active:scale-[0.95]
                   disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FileText className="w-4 h-4" />
          生成发票
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-600" />
            </div>
            <span className="text-gray-500 text-sm">总工时</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {summaryData ? summaryData.totalHours.toFixed(2) : '0.00'}
            <span className="text-base font-normal text-gray-500 ml-1">小时</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] animate-fade-in" style={{ animationDelay: '50ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-gray-500 text-sm">任务数量</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            {summaryData ? summaryData.taskGroups.length : 0}
            <span className="text-base font-normal text-gray-500 ml-1">个</span>
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-[0_4px_16px_rgba(0,0,0,0.05)] animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-gray-500 text-sm">预计金额</span>
          </div>
          <p className="text-3xl font-bold text-gray-800">
            ¥{summaryData && settings ? (summaryData.totalHours * settings.hourlyRate).toFixed(2) : '0.00'}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)] animate-fade-in">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <h3 className="font-semibold text-gray-800">每日工时</h3>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[
                { key: 'week', label: '本周' },
                { key: 'month', label: '本月' },
                { key: 'custom', label: '自定义' },
              ].map((item) => (
                <button
                  key={item.key}
                  onClick={() => setDateRange(item.key as DateRangeType)}
                  className={`
                    px-4 py-1.5 rounded-md text-sm font-medium transition-all
                    ${dateRange === item.key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {dateRange === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20
                           focus:border-primary-500"
                />
                <span className="text-gray-400">至</span>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-primary-500/20
                           focus:border-primary-500"
                />
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <div className="animate-pulse text-gray-400">加载中...</div>
          </div>
        ) : (
          <BarChart data={summaryData?.dailySummary || []} />
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-[0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden animate-fade-in">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">任务明细</h3>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedClientId || ''}
              onChange={(e) => setSelectedClientId(e.target.value || null)}
              className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-primary-500/20
                       focus:border-primary-500 bg-white"
            >
              <option value="">全部客户</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400">加载中...</div>
        ) : summaryData?.taskGroups.length === 0 ? (
          <div className="p-12 text-center text-gray-400">暂无数据</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {summaryData?.taskGroups.map((group, index) => (
              <div 
                key={`${group.taskName}-${group.clientId}`}
                className="px-6 py-4 hover:bg-gray-50/50 transition-colors animate-slide-up"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">{group.taskName}</h4>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {group.clientName || '未分配客户'} · {group.count} 条记录
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-primary-600 text-lg">
                      {(group.totalDuration / 3600).toFixed(2)} h
                    </p>
                    {settings && (
                      <p className="text-sm text-gray-500">
                        ¥{((group.totalDuration / 3600) * settings.hourlyRate).toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
