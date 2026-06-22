import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNutritionStore } from '@/store/useNutritionStore';
import DietLog from '@/components/DietLog';
import NutritionChart from '@/components/NutritionChart';
import ProgressBar from '@/components/ProgressBar';
import RecommendationCard from '@/components/RecommendationCard';
import { Plus, Settings as SettingsIcon, BarChart3, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    fetchTodayLogs,
    fetchGoals,
    fetchProfile,
    checkAndShowNotification,
    fetchRecentLogs,
    computeDailyTotals,
    goals,
  } = useNutritionStore();

  useEffect(() => {
    const init = async () => {
      await Promise.all([
        fetchTodayLogs(),
        fetchGoals(),
        fetchProfile(),
        fetchRecentLogs(),
      ]);
      checkAndShowNotification();
    };
    init();
  }, [
    fetchTodayLogs,
    fetchGoals,
    fetchProfile,
    fetchRecentLogs,
    checkAndShowNotification,
  ]);

  const totals = computeDailyTotals();

  const showHeroProgress = goals && goals.calories > 0;

  const quickActions = [
    {
      label: '添加食物',
      icon: Plus,
      onClick: () => navigate('/search'),
      color:
        'from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700',
    },
    {
      label: '设置',
      icon: SettingsIcon,
      onClick: () => navigate('/settings'),
      color:
        'from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
    },
    {
      label: '查看报告',
      icon: BarChart3,
      onClick: () => navigate('/report'),
      color: 'from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700',
    },
  ];

  return (
    <div className="space-y-5">
      {showHeroProgress && (
        <div className="bg-surface-card rounded-2xl shadow-card p-5">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-gray-800">今日热量进度</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                保持均衡摄入，离目标更近一步
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-gray-800 tabular-nums">
                  {totals.calories.toFixed(0)}
                </span>
                <span className="text-sm text-gray-400">
                  / {goals!.calories.toFixed(0)} kcal
                </span>
              </div>
              <span
                className={cn(
                  'text-xs font-bold tabular-nums',
                  (totals.calories / goals!.calories) * 100 >= 100
                    ? 'text-red-500'
                    : (totals.calories / goals!.calories) * 100 >= 80
                      ? 'text-accent-600'
                      : 'text-primary-600',
                )}
              >
                {((totals.calories / goals!.calories) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          <ProgressBar
            current={totals.calories}
            goal={goals!.calories}
            label=""
            showLabel={false}
            size="lg"
          />
        </div>
      )}

      {!goals && (
        <div className="bg-surface-card rounded-2xl shadow-card p-5 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary-500" />
          <span className="text-sm text-gray-500">加载中...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[40%_35%_25%] gap-5">
        <div className="min-h-[500px]">
          <DietLog />
        </div>

        <div className="space-y-5">
          <NutritionChart />
          {goals && (
            <div className="bg-surface-card rounded-2xl shadow-card p-5 space-y-4">
              <h3 className="text-base font-bold text-gray-800">营养目标</h3>
              <ProgressBar
                current={totals.protein}
                goal={goals.protein}
                label="蛋白质"
                unit="g"
              />
              <ProgressBar
                current={totals.fat}
                goal={goals.fat}
                label="脂肪"
                unit="g"
              />
              <ProgressBar
                current={totals.carbs}
                goal={goals.carbs}
                label="碳水化合物"
                unit="g"
              />
            </div>
          )}
        </div>

        <div className="space-y-5">
          <RecommendationCard />
          <div className="bg-surface-card rounded-2xl shadow-card p-5">
            <h3 className="text-base font-bold text-gray-800 mb-4">快捷操作</h3>
            <div className="space-y-2.5">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.label}
                    onClick={action.onClick}
                    className={cn(
                      'w-full py-3 px-4 rounded-xl font-semibold text-white btn-ripple',
                      'bg-gradient-to-r transition-all duration-200 active:scale-[0.98]',
                      'flex items-center justify-center gap-2',
                      action.color,
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
