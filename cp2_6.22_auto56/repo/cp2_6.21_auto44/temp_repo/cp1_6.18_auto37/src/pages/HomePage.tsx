import { useState } from 'react';
import { Search, Plus, Menu, X } from 'lucide-react';
import type { Category } from '@/types';
import { usePartyStore } from '@/stores/partyStore';
import PartyCard from '@/components/PartyCard';
import Sidebar from '@/components/Sidebar';
import CreatePartyModal from '@/components/CreatePartyModal';
import EmptyState from '@/components/EmptyState';

const CATEGORIES: ('全部' | Category)[] = ['全部', '编织', '陶艺', '绘画', '木工'];

export default function HomePage() {
  const { activities, isLoading } = usePartyStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'全部' | Category>('全部');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const filteredActivities = activities.filter((a) => {
    const matchName = a.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = categoryFilter === '全部' || a.category === categoryFilter;
    return matchName && matchCategory;
  });

  const hotActivity = activities[0];

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-purple-darker">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-amber-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-purple-darker font-body text-white">
      {hotActivity && (
        <div className="relative mb-6 h-40 w-full overflow-hidden rounded-xl bg-gradient-to-r from-purple-deep to-purple-card">
          <div className="flex h-full flex-col justify-center px-8">
            <span className="mb-1 text-sm font-semibold text-amber-primary">🔥 本月热门</span>
            <h2 className="font-display text-3xl font-bold text-white">{hotActivity.name}</h2>
            <p className="mt-1 text-sm text-gray-300">
              {hotActivity.date} · {hotActivity.location}
            </p>
          </div>
          <a
            href={`/party/${hotActivity.id}`}
            className="absolute bottom-4 right-6 text-sm font-medium text-amber-primary hover:underline"
          >
            查看详情 →
          </a>
          <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-amber-primary to-amber-dark" />
        </div>
      )}

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索活动..."
            className="w-full rounded-lg border border-purple-border bg-purple-card py-2.5 pl-10 pr-4 text-white placeholder-gray-400 outline-none focus:border-amber-primary transition-colors"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as '全部' | Category)}
          className="rounded-lg border border-purple-border bg-purple-card px-4 py-2.5 text-white outline-none focus:border-amber-primary transition-colors"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c} className="bg-purple-card">
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center justify-center rounded-lg border border-purple-border bg-purple-card p-2.5 text-white md:hidden"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-xl font-bold">活动列表</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-primary to-amber-dark px-4 py-2 font-medium text-white active:animate-btn-bounce hover:opacity-90 transition-opacity"
            >
              <Plus className="h-4 w-4" />
              发起
            </button>
          </div>

          {filteredActivities.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredActivities.map((activity, i) => (
                <PartyCard key={activity.id} activity={activity} index={i} />
              ))}
            </div>
          ) : (
            <EmptyState />
          )}
        </div>

        <div className="hidden md:block">
          <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        </div>

        {mobileMenuOpen && (
          <div className="fixed right-0 top-0 z-50 h-full w-72 animate-fade-in bg-purple-sidebar shadow-xl md:hidden">
            <Sidebar collapsed={false} onToggle={() => setMobileMenuOpen(false)} />
          </div>
        )}
      </div>

      <CreatePartyModal open={showCreateModal} onClose={() => setShowCreateModal(false)} />
    </div>
  );
}
