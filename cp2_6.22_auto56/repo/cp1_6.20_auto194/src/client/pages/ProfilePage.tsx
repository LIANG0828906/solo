import { useState, useEffect } from 'react';
import { Heart, ShoppingBag, Clock, LogOut, User } from 'lucide-react';
import type { ShoppingListHistory } from '../../shared/types';
import { apiService } from '../services/apiService';

export const ProfilePage = () => {
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [history, setHistory] = useState<ShoppingListHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await apiService.getUserStats();
        setFavoriteCount(stats.favoriteCount);
        setHistory(stats.shoppingListHistory);
      } catch (error) {
        console.error('Failed to load user stats:', error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleLogout = () => {
    alert('已退出登录');
  };

  return (
    <div className="min-h-screen pt-20 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-8" style={{ color: 'var(--text)' }}>
          个人中心
        </h1>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <div className="card p-6 text-center">
              <div
                className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
              >
                <User size={40} className="text-white" />
              </div>
              <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                美食爱好者
              </h2>
              <p className="text-sm mb-6" style={{ color: 'var(--text-light)' }}>
                享受烹饪的乐趣
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
                  <div className="flex items-center gap-3">
                    <Heart size={20} fill="#e74c3c" color="#e74c3c" />
                    <span>收藏食谱</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: 'var(--secondary)' }}>
                    {loading ? '-' : favoriteCount}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--background)' }}>
                  <div className="flex items-center gap-3">
                    <ShoppingBag size={20} style={{ color: 'var(--secondary)' }} />
                    <span>生成清单</span>
                  </div>
                  <span className="text-2xl font-bold" style={{ color: 'var(--secondary)' }}>
                    {loading ? '-' : history.length}
                  </span>
                </div>
              </div>

              <button
                className="btn w-full mt-6"
                onClick={handleLogout}
                style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
              >
                <LogOut size={18} className="mr-2" />
                退出登录
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <div className="card p-6">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text)' }}>
                <Clock size={24} style={{ color: 'var(--secondary)' }} />
                最近购物清单
              </h3>

              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--text-light)' }}>
                  <ShoppingBag size={48} className="mx-auto mb-4" style={{ color: 'var(--primary)' }} />
                  <p className="text-lg mb-2">还没有生成过购物清单</p>
                  <p>选择食谱，生成您的第一份购物清单吧</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {history.map((item, index) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border-l-4 hover:shadow-md transition-shadow"
                      style={{
                        backgroundColor: 'var(--background)',
                        borderLeftColor: 'var(--primary)',
                        boxShadow: 'var(--card-shadow)',
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="font-medium" style={{ color: 'var(--text)' }}>
                          购物清单 #{history.length - index}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--text-light)' }}>
                          {formatDate(item.created