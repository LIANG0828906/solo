import { useState, useEffect, useCallback } from 'react';
import { Item, Stats, getItems, getStats } from '@/api';
import StatsCards from '@/components/StatsCards';
import InventoryList from '@/components/InventoryList';

type FilterType = 'all' | 'healthy' | 'warning' | 'expired' | 'today';

const HomePage = () => {
  const [items, setItems] = useState<Item[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    expiringSoon: 0,
    expired: 0,
    todayAdded: 0,
  });
  const [filter, setFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [itemsData, statsData] = await Promise.all([
        getItems(),
        getStats(),
      ]);
      setItems(itemsData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterOptions: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'healthy', label: '🟢 新鲜' },
    { key: 'warning', label: '🟡 即将过期' },
    { key: 'expired', label: '🔴 已过期' },
    { key: 'today', label: '✨ 今日新加' },
  ];

  if (loading) {
    return (
      <div className="skeleton-container">
        <div className="skeleton-header" />
        <div className="skeleton-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <StatsCards
        stats={stats}
        activeFilter={filter}
        onFilterChange={setFilter}
      />

      <div className="filter-bar">
        <div className="filter-tags">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              className={`filter-tag ${filter === option.key ? 'active' : ''}`}
              onClick={() => setFilter(option.key)}
            >
              {option.label}
            </button>
          ))}
        </div>
        <div className="list-section-title">
          📋 食材列表
        </div>
      </div>

      <InventoryList items={items} filter={filter} />
    </div>
  );
};

export default HomePage;
