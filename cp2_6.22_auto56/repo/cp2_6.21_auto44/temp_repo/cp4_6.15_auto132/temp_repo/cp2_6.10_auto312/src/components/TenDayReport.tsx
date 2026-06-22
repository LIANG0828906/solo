import React, { memo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { X, Star, Trophy, Flame, Target, Zap, Crown, Award } from 'lucide-react';
import { TenDayReport as TenDayReportType } from '@/types';
import { cn } from '@/lib/utils';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface TenDayReportProps {
  report: TenDayReportType;
  onClose: () => void;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const ACHIEVEMENT_DATA: Record<string, Achievement> = {
  first_light: {
    id: 'first_light',
    name: '初见星光',
    description: '完成第一个灵感任务',
    icon: <Star className="w-8 h-8" />,
  },
  ten_stars: {
    id: 'ten_stars',
    name: '星光璀璨',
    description: '累计点亮10个星座',
    icon: <Trophy className="w-8 h-8" />,
  },
  perfect_day: {
    id: 'perfect_day',
    name: '完美之日',
    description: '单日完成全部5个任务',
    icon: <Flame className="w-8 h-8" />,
  },
  speed_demon: {
    id: 'speed_demon',
    name: '闪电创意',
    description: '30秒内完成一个任务',
    icon: <Zap className="w-8 h-8" />,
  },
  goal_master: {
    id: 'goal_master',
    name: '目标达人',
    description: '完成率达到80%以上',
    icon: <Target className="w-8 h-8" />,
  },
  legend: {
    id: 'legend',
    name: '星际传奇',
    description: '总灵感值达到1000',
    icon: <Crown className="w-8 h-8" />,
  },
};

const TenDayReport: React.FC<TenDayReportProps> = ({ report, onClose }) => {
  const completionRate = report.totalTasks > 0
    ? Math.round((report.completedTasks / report.totalTasks) * 100)
    : 0;

  const chartData = {
    labels: report.dailyBreakdown.map((d) => d.date.slice(5)),
    datasets: [
      {
        label: '完成任务',
        data: report.dailyBreakdown.map((d) => d.tasksCompleted),
        backgroundColor: 'rgba(155, 89, 182, 0.8)',
        borderColor: 'rgba(155, 89, 182, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: '灵感值',
        data: report.dailyBreakdown.map((d) => d.pointsEarned),
        backgroundColor: 'rgba(241, 196, 15, 0.8)',
        borderColor: 'rgba(241, 196, 15, 1)',
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: {
          color: 'rgba(255, 255, 255, 0.7)',
          font: {
            family: 'Noto Sans SC',
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  const renderAchievement = (achievementId: string, unlocked: boolean) => {
    const achievement = ACHIEVEMENT_DATA[achievementId];
    if (!achievement) return null;

    return (
      <div
        key={achievement.id}
        className={cn(
          'flex flex-col items-center p-3 rounded-xl transition-all duration-300',
          unlocked
            ? 'bg-white/10 border-2 border-stardust-gold shadow-[0_0_20px_rgba(241,196,15,0.3)]'
            : 'bg-white/5 border-2 border-white/10 opacity-50'
        )}
      >
        <div
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center mb-2',
            unlocked
              ? 'bg-gradient-to-br from-stardust-gold/30 to-stardust-purple/30 text-stardust-gold'
              : 'bg-white/10 text-white/30'
          )}
        >
          {achievement.icon}
        </div>
        <span
          className={cn(
            'text-sm font-medium',
            unlocked ? 'text-white' : 'text-white/40'
          )}
        >
          {achievement.name}
        </span>
        <span className="text-xs text-white/40 text-center mt-1">
          {achievement.description}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <h2 className="font-display text-3xl text-center text-stardust-gold text-glow mb-6">
          灵感星际报告
        </h2>

        <p className="text-center text-white/60 mb-6">
          {report.periodStart} ~ {report.periodEnd}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-stardust-purple mb-1">
              {report.completedTasks} / {report.totalTasks}
            </div>
            <div className="text-white/60 text-sm">完成任务</div>
            <div className="text-stardust-gold text-lg font-display mt-1">
              {completionRate}%
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-stardust-gold mb-1">
              {report.totalPoints}
            </div>
            <div className="text-white/60 text-sm">总灵感值</div>
            <Award className="w-6 h-6 text-stardust-gold mx-auto mt-1" />
          </div>
          <div className="bg-white/10 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-stardust-blue mb-1">
              {report.achievements.length}
            </div>
            <div className="text-white/60 text-sm">点亮星座</div>
            <Star className="w-6 h-6 text-stardust-blue mx-auto mt-1" />
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-4 mb-8">
          <h3 className="text-white font-medium mb-4">十日数据概览</h3>
          <div className="h-64">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        <div>
          <h3 className="text-white font-medium mb-4">成就徽章</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(ACHIEVEMENT_DATA).map((id) =>
              renderAchievement(id, report.achievements.includes(id))
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 w-full py-3 bg-gradient-to-r from-stardust-purple to-stardust-blue text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
        >
          继续探索
        </button>
      </div>
    </div>
  );
};

export default memo(TenDayReport);
