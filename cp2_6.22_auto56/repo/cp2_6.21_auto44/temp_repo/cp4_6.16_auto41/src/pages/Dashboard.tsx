import { useNavigate } from 'react-router-dom';
import { Plus, RefreshCw, Lightbulb, ChevronRight } from 'lucide-react';
import { useCarbonStore } from '@/store/carbonStore';
import MetricCard from '@/components/Dashboard/MetricCard';
import TrendChart from '@/components/Dashboard/TrendChart';
import SuggestionCard from '@/components/Dashboard/SuggestionCard';
import ActivityForm from '@/components/Activities/ActivityForm';
import { useState } from 'react';
import type { Activity } from '@/types';

const Dashboard = () => {
  const navigate = useNavigate();
  const {
    todayEmission,
    monthEmission,
    targetProgress,
    userSettings,
    dailyTrend,
    currentSuggestions,
    addActivity,
    updateActivity,
    dismissSuggestion,
    adoptSuggestion,
    isLoading,
    loadMockData,
  } = useCarbonStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Activity | null>(null);

  const handleSubmit = async (
    values: Omit<Activity, 'id' | 'emission' | 'createdAt' | 'updatedAt'>,
  ) => {
    if (editData) {
      const res = await updateActivity(
        editData.id,
        values.type,
        values.subtype,
        values.value,
        values.date,
      );
      return !!res;
    }
    const res = await addActivity(values.type, values.subtype, values.value, values.date);
    return !!res;
  };

  const openAdd = () => {
    setEditData(null);
    setFormOpen(true);
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            碳排放仪表盘
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            监测您的碳足迹，践行绿色低碳生活
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isLoading && (
            <button
              onClick={() => loadMockData()}
              className="btn-secondary text-sm flex items-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              加载示例数据
            </button>
          )}
          <button
            onClick={openAdd}
            className="btn-primary flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            添加记录
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        <MetricCard
          type="today"
          value={todayEmission}
          label="今日排放"
          unit="kg"
          suffix="CO₂ 当量"
        />
        <MetricCard
          type="month"
          value={monthEmission}
          label="本月累计排放"
          unit="kg"
          suffix="CO₂ 当量"
        />
        <MetricCard
          type="progress"
          value={targetProgress}
          target={userSettings.monthlyTarget}
          label="减排目标进度"
          unit="kg"
        />
      </div>

      <TrendChart data={dailyTrend} />

      <div>
        <div className="flex items-end justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-accent-200/60 flex items-center justify-center">
              <Lightbulb className="w-5 h-5 text-accent-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800">智能减排建议</h3>
              <p className="text-xs text-gray-500">
                基于您近 7 天的活动记录生成
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/activities')}
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary-700 hover:text-primary-800 transition-colors"
          >
            管理全部活动
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {currentSuggestions.length > 0 ? (
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-2 sm:mx-0 px-2 sm:px-0">
            {currentSuggestions.map((s, idx) => (
              <SuggestionCard
                key={s.id}
                suggestion={s}
                index={idx}
                onDismiss={dismissSuggestion}
                onAdopt={adoptSuggestion}
              />
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <div className="text-5xl mb-4">🎉</div>
            <h4 className="text-lg font-semibold text-gray-700 mb-2">
              您已经采纳了全部建议！
            </h4>
            <p className="text-sm text-gray-500 mb-4">
              继续保持，您的减排目标即将达成
            </p>
            <button onClick={openAdd} className="btn-primary">
              继续记录活动
            </button>
          </div>
        )}
      </div>

      <ActivityForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditData(null);
        }}
        onSubmit={handleSubmit}
        editData={editData}
      />
    </div>
  );
};

export default Dashboard;
