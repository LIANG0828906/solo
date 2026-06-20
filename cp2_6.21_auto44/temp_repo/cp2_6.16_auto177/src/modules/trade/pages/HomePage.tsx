import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Package, Search as SearchIcon, Frown } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import Navbar from '@/components/Navbar';
import DashboardCards from '../components/DashboardCards';
import ItemCard from '../components/ItemCard';
import { useTradeStore } from '../store';
import { useAuthStore } from '../../auth/store';
import { useToast } from '@/components/Toast';

export default function HomePage() {
  const { currentUser } = useAuthStore();
  const { items, loading, fetchItems, searchItems, clearError } = useTradeStore();
  const [keyword, setKeyword] = useState('');
  const debouncedKeyword = useDebounce(keyword, 300);
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    clearError();
    if (debouncedKeyword.trim()) {
      searchItems(debouncedKeyword, !!currentUser);
    } else {
      fetchItems(!!currentUser);
    }
  }, [debouncedKeyword, currentUser, fetchItems, searchItems, clearError]);

  if (!currentUser) {
    showToast('请先登录后浏览物品', 'info');
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen">
      <Navbar searchValue={keyword} onSearchChange={setKeyword} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <DashboardCards />

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
            <Package size={20} className="text-primary" />
            {debouncedKeyword.trim() ? '搜索结果' : '全部物品'}
            <span className="text-sm font-normal text-secondary/50">
              ({items.length}件)
            </span>
          </h2>
        </div>

        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden shadow-card bg-white">
                <div className="aspect-square skeleton" />
                <div className="p-3.5 space-y-2">
                  <div className="h-4 w-3/4 skeleton rounded" />
                  <div className="h-5 w-1/2 skeleton rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card py-16 px-4 text-center fade-in">
            <div className="w-20 h-20 mx-auto rounded-full bg-bg flex items-center justify-center mb-4">
              {debouncedKeyword.trim() ? (
                <SearchIcon size={36} className="text-secondary/30" />
              ) : (
                <Frown size={36} className="text-secondary/30" />
              )}
            </div>
            <h3 className="font-semibold text-secondary mb-1.5">
              {debouncedKeyword.trim() ? '没有找到相关物品' : '暂时还没有物品'}
            </h3>
            <p className="text-sm text-secondary/50 mb-5">
              {debouncedKeyword.trim()
                ? `试试其它关键词，或`
                : '成为第一个发布物品的人吧'}
            </p>
            {debouncedKeyword.trim() && (
              <button
                onClick={() => setKeyword('')}
                className="px-5 py-2 rounded-full text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 transition-colors"
              >
                清除搜索
              </button>
            )}
            {!debouncedKeyword.trim() && (
              <button
                onClick={() => navigate('/create')}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white transition-all hover:brightness-110"
                style={{ backgroundColor: '#E67E22' }}
              >
                发布我的第一件物品
              </button>
            )}
          </div>
        ) : (
          <div
            className="grid gap-4 sm:gap-5"
            style={{
              gridTemplateColumns:
                'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
            }}
          >
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
