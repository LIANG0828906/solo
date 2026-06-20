import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RefreshCw, Package, Users, ArrowRightLeft, Clock } from 'lucide-react';
import { StatsCard } from '@/components/StatsCard';
import { useSwapStore } from '@/store/swapStore';
import { CommunityStats, SwapEvent } from '@/types';
import { formatDate, generateAvatar } from '@/utils/helpers';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [latestSwaps, setLatestSwaps] = useState<SwapEvent[]>([]);
  const getStats = useSwapStore(state => state.getStats);
  const getLatestSwaps = useSwapStore(state => state.getLatestSwaps);
  const items = useSwapStore(state => state.items);
  const swapEvents = useSwapStore(state => state.swapEvents);
  const members = useSwapStore(state => state.members);
  const isLoading = useSwapStore(state => state.isLoading);

  useEffect(() => {
    const loadData = async () => {
      const [statsData, swaps] = await Promise.all([
        getStats(),
        getLatestSwaps(5),
      ]);
      setStats(statsData);
      setLatestSwaps(swaps);
    };
    loadData();
  }, [items, swapEvents, members]);

  if (isLoading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw size={32} className="text-[#E8A87C]" />
        </motion.div>
      </div>
    );
  }

  const barColors = ['#E8A87C', '#E8B89C', '#F0C4A8', '#C8E6C9', '#A5D6A7', '#81C784'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white px-4 py-2 rounded-lg shadow-lg border border-gray-100">
          <p className="text-sm text-gray-600">{label}</p>
          <p className="text-sm font-bold text-[#E8A87C]">{payload[0].value} 次交换</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-gray-800 mb-2">社区概览</h1>
        <p className="text-gray-600">追踪闲置物品流转，共建可持续消费社区</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatsCard
          title="总交换次数"
          value={stats.totalSwaps}
          icon={ArrowRightLeft}
          gradient="linear-gradient(135deg, #E8A87C 0%, #D6966A 100%)"
          delay={0.1}
        />
        <StatsCard
          title="活跃物品数"
          value={stats.activeItems}
          icon={Package}
          gradient="linear-gradient(135deg, #41B3A3 0%, #36998A 100%)"
          delay={0.2}
        />
        <StatsCard
          title="参与人数"
          value={stats.participants}
          icon={Users}
          gradient="linear-gradient(135deg, #C38D9E 0%, #A87486 100%)"
          delay={0.3}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl p-6 border border-gray-100"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-6">月度交换趋势</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(232, 168, 124, 0.1)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={1000} animationEasing="ease-out">
                  {stats.monthlyTrend.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-2xl p-6 border border-gray-100"
        >
          <div className="flex items-center gap-2 mb-6">
            <Clock size={20} className="text-[#E8A87C]" />
            <h2 className="text-lg font-semibold text-gray-800">最新交换动态</h2>
          </div>
          <div className="space-y-4">
            {latestSwaps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无交换记录</div>
            ) : (
              latestSwaps.map((swap, index) => (
                <motion.div
                  key={swap.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <img
                      src={swap.fromAvatar || generateAvatar(swap.fromHolder)}
                      alt={swap.fromHolder}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-700">{swap.fromHolder}</span>
                  </div>
                  <ArrowRightLeft size={14} className="text-[#E8A87C] flex-shrink-0" />
                  <div className="flex items-center gap-1 flex-1">
                    <img
                      src={swap.toAvatar || generateAvatar(swap.toHolder)}
                      alt={swap.toHolder}
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-sm font-medium text-gray-700">{swap.toHolder}</span>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(swap.swapDate)}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
