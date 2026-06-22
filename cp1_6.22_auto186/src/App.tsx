import { useState, useMemo, useEffect } from 'react';
import CardGrid from './CardGrid';
import AddModal from './AddModal';
import SearchBar from './SearchBar';
import { initialFoods } from './data';
import type { FoodItem, SortOption } from './types';

function getRemainingDays(purchaseDate: string, shelfLifeDays: number): number {
  const purchase = new Date(purchaseDate);
  const expiry = new Date(purchase);
  expiry.setDate(expiry.getDate() + shelfLifeDays);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  const diff = expiry.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function App() {
  const [foods, setFoods] = useState<FoodItem[]>(initialFoods);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('expiry-asc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editFood, setEditFood] = useState<FoodItem | null>(null);
  const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const ids = new Set(initialFoods.map((f) => f.id));
    setVisibleIds(ids);
  }, []);

  const filteredAndSortedFoods = useMemo(() => {
    let result = [...foods];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((food) =>
        food.name.toLowerCase().includes(query)
      );
    }

    switch (sortOption) {
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        break;
      case 'expiry-asc':
        result.sort((a, b) => {
          const daysA = getRemainingDays(a.purchaseDate, a.shelfLifeDays);
          const daysB = getRemainingDays(b.purchaseDate, b.shelfLifeDays);
          return daysA - daysB;
        });
        break;
      case 'added-desc':
        result.sort((a, b) => Number(b.id) - Number(a.id));
        break;
    }

    return result;
  }, [foods, searchQuery, sortOption]);

  useEffect(() => {
    const ids = new Set(filteredAndSortedFoods.map((f) => f.id));
    setVisibleIds(ids);
  }, [filteredAndSortedFoods]);

  const nearestExpiryDays = useMemo(() => {
    if (foods.length === 0) return null;
    let minDays = Infinity;
    for (const food of foods) {
      const days = getRemainingDays(food.purchaseDate, food.shelfLifeDays);
      if (days < minDays) {
        minDays = days;
      }
    }
    return minDays;
  }, [foods]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSortChange = (sort: SortOption) => {
    setSortOption(sort);
  };

  const handleAddClick = () => {
    setEditFood(null);
    setIsModalOpen(true);
  };

  const handleEdit = (food: FoodItem) => {
    setEditFood(food);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    const newVisibleIds = new Set(visibleIds);
    newVisibleIds.delete(id);
    setVisibleIds(newVisibleIds);

    setTimeout(() => {
      setFoods((prev) => prev.filter((f) => f.id !== id));
    }, 300);
  };

  const handleSubmit = (foodData: Omit<FoodItem, 'id'> & { id?: string }) => {
    if (foodData.id) {
      setFoods((prev) =>
        prev.map((f) =>
          f.id === foodData.id ? { ...f, ...foodData, id: foodData.id! } : f
        )
      );
    } else {
      const newId = String(Date.now());
      const newFood: FoodItem = {
        ...foodData,
        id: newId,
      } as FoodItem;

      setFoods((prev) => [newFood, ...prev]);

      setTimeout(() => {
        setVisibleIds((prev) => new Set(prev).add(newId));
      }, 10);
    }
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <span style={styles.logoIcon}>🥗</span>
            <h1 style={styles.title}>食材管家</h1>
          </div>
          {nearestExpiryDays !== null && (
            <div style={styles.badgeContainer}>
              <span style={styles.badgeLabel}>距离最近过期还有</span>
              <div style={styles.badge}>
                <span style={styles.badgeText}>{nearestExpiryDays > 0 ? nearestExpiryDays : 0}</span>
                <span style={styles.badgeUnit}>天</span>
              </div>
            </div>
          )}
        </div>
      </header>

      <main style={styles.main}>
        <SearchBar
          onSearch={handleSearch}
          onSortChange={handleSortChange}
          sortOption={sortOption}
        />
        <CardGrid
          foods={filteredAndSortedFoods}
          visibleIds={visibleIds}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
        {filteredAndSortedFoods.length === 0 && (
          <div style={styles.emptyState}>
            <span style={styles.emptyIcon}>🍽️</span>
            <p style={styles.emptyText}>暂无食材，点击右下角按钮添加</p>
          </div>
        )}
      </main>

      <button
        onClick={handleAddClick}
        style={styles.fab}
        onMouseDown={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.95)';
        }}
        onMouseUp={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>

      <AddModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        editFood={editFood}
      />
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    background: 'white',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '16px',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '32px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 700,
    color: '#1f2937',
  },
  badgeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  badgeLabel: {
    fontSize: '14px',
    color: '#6b7280',
  },
  badge: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '2px',
    background: '#EF4444',
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    minWidth: '52px',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: '16px',
    fontWeight: 700,
  },
  badgeUnit: {
    fontSize: '12px',
  },
  main: {
    flex: 1,
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
    padding: '24px',
    boxSizing: 'border-box',
  },
  fab: {
    position: 'fixed',
    right: '32px',
    bottom: '32px',
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'transform 0.1s ease, box-shadow 0.2s ease',
    zIndex: 50,
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
  },
  emptyIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    color: '#9ca3af',
  },
};

export default App;
