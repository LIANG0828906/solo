import { useEffect, useState } from 'react';
import { Package, Users, TrendingUp, FileText, MessageSquare, Award } from 'lucide-react';
import { useCountUp } from '@/hooks/useCountUp';
import { useTradeStore, PlatformStats, UserStats } from '../store';
import { useAuthStore } from '../../auth/store';

export default function DashboardCards() {
  const { platformStats, userStats, loadPlatformStats, loadUserStats } = useTradeStore();
  const { currentUser } = useAuthStore();
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    loadPlatformStats();
    if (currentUser) {
      loadUserStats(currentUser.id);
    }
  }, [loadPlatformStats, loadUserStats, currentUser]);

  useEffect(() => {
    const t = setTimeout(() => setAnimate(true), 100);
    return () => clearTimeout(t);
  }, []);

  const totalItems = useCountUp(platformStats.totalItems, 1000, animate);
  const totalUsers = useCountUp(platformStats.totalUsers, 1000, animate);
  const todayTrades = useCountUp(platformStats.todayTrades, 1000, animate);
  const myItems = useCountUp(userStats.myItems, 1000, animate);
  const pending = useCountUp(userStats.pendingOffers, 1000, animate);
  const completed = useCountUp(userStats.completedTrades, 1000, animate);

  return (
    <div className="grid sm:grid-cols-2 gap-4 sm:gap-6 mb-8 fade-in">
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: '#E67E22' }}
          >
            <TrendingUp size={18} />
          </div>
          <h3 className="font-semibold text-secondary">平台数据总览</h3>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatCard
            icon={<Package size={20} />}
            iconBg="#2ECC7115"
            iconColor="#2ECC71"
            label="总物品"
            value={totalItems}
          />
          <StatCard
            icon={<Users size={20} />}
            iconBg="#3498DB15"
            iconColor="#3498DB"
            label="总用户"
            value={totalUsers}
          />
          <StatCard
            icon={<Award size={20} />}
            iconBg="#9B59B615"
            iconColor="#9B59B6"
            label="今日成交"
            value={todayTrades}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-card">
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center text-white"
            style={{ backgroundColor: '#2C3E50' }}
          >
            <Users size={18} />
          </div>
          <h3 className="font-semibold text-secondary">
            {currentUser ? `我的数据` : '欢迎使用'}
          </h3>
        </div>

        {currentUser ? (
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={<FileText size={20} />}
              iconBg="#E67E2215"
              iconColor="#E67E22"
              label="我发布"
              value={myItems}
            />
            <StatCard
              icon={<MessageSquare size={20} />}
              iconBg="#F39C1215"
              iconColor="#F39C12"
              label="待处理"
              value={pending}
            />
            <StatCard
              icon={<Award size={20} />}
              iconBg="#2ECC7115"
              iconColor="#2ECC71"
              label="已完成"
              value={completed}
            />
          </div>
        ) : (
          <p className="text-sm text-secondary/60 text-center py-6">
            登录后可查看您的交易数据
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number;
}) {
  return (
    <div className="bg-bg rounded-xl p-3 text-center">
      <div
        className="w-9 h-9 mx-auto rounded-lg flex items-center justify-center mb-2"
        style={{ backgroundColor: iconBg, color: iconColor }}
      >
        {icon}
      </div>
      <div
        className="text-xl sm:text-2xl font-bold text-secondary tabular-nums"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {value}
      </div>
      <div className="text-[11px] text-secondary/50 mt-0.5">{label}</div>
    </div>
  );
}
