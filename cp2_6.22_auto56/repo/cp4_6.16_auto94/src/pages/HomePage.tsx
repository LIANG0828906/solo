import { useState, useEffect } from 'react';
import { useCapsuleStore } from '../store';
import type { Capsule, CapsuleStatus } from '../types';
import CapsuleCard from '../components/CapsuleCard';
import CapsuleForm from '../components/CapsuleForm';
import CapsuleDetail from '../components/CapsuleDetail';
import './HomePage.css';

type FilterTab = 'all' | 'locked' | 'unlocked' | 'opened' | 'archived';

const FILTER_TABS: { key: FilterTab; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: '📜' },
  { key: 'locked', label: '未解锁', icon: '🔒' },
  { key: 'unlocked', label: '已解锁', icon: '✉️' },
  { key: 'opened', label: '已打开', icon: '📖' },
  { key: 'archived', label: '归档', icon: '📦' },
];

export default function HomePage() {
  const {
    fetchCapsules,
    getFilteredCapsules,
    getCounts,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    isLoading,
    archiveCapsule,
    deleteCapsule,
    openCapsule,
    checkExpiredCapsules,
  } = useCapsuleStore();

  const [showForm, setShowForm] = useState(false);
  const [selectedCapsule, setSelectedCapsule] = useState<Capsule | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [unlockNotification, setUnlockNotification] = useState<Capsule[]>([]);

  useEffect(() => {
    const init = async () => {
      await fetchCapsules();
      const expired = await checkExpiredCapsules();
      if (expired.length > 0) {
        setUnlockNotification(expired);
      }
    };
    init();
  }, []);

  const capsules = getFilteredCapsules();
  const counts = getCounts();

  const handleOpenCapsule = (capsule: Capsule) => {
    if (capsule.status === 'unlocked') {
      openCapsule(capsule.id);
    }
    setSelectedCapsule(capsule);
    setShowDetail(true);
  };

  const handleDeleteCapsule = async (id: string) => {
    const capsule = capsules.find((c) => c.id === id);
    if (capsule?.status === 'archived') {
      await deleteCapsule(id);
    } else {
      await archiveCapsule(id);
    }
  };

  const getTabCount = (key: FilterTab) => {
    if (key === 'all') return counts.total;
    return counts[key as CapsuleStatus] || 0;
  };

  const closeUnlockNotification = () => {
    setUnlockNotification([]);
  };

  return (
    <div className="home-page">
      <header className="app-header">
        <div className="header-content">
          <h1 className="app-title">
            <span className="title-icon">⏳</span>
            TimeCapsule
          </h1>
          <p className="app-subtitle">封存时光 · 致未来的自己</p>
        </div>
      </header>

      <main className="main-content">
        <div className="toolbar">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索胶囊标题或内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sort-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'createdAt' | 'openDate')}
              className="sort-select"
            >
              <option value="createdAt">按创建时间</option>
              <option value="openDate">按开箱时间</option>
            </select>
            <button
              className="sort-order-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={sortOrder === 'asc' ? '升序' : '降序'}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>

        <div className="filter-tabs">
          {FILTER_TABS.map((tab) => {
            const isActive = filterStatus === tab.key;
            return (
              <button
                key={tab.key}
                className={`filter-tab ${isActive ? 'active' : ''}`}
                onClick={() => setFilterStatus(tab.key)}
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
                <span className="tab-count">{getTabCount(tab.key)}</span>
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner">⏳</div>
            <p>加载中...</p>
          </div>
        ) : capsules.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>还没有胶囊</h3>
            <p>
              {searchQuery
                ? '没有找到匹配的胶囊，换个关键词试试？'
                : filterStatus === 'all'
                ? '点击右下角按钮，创建你的第一颗时空胶囊吧！'
                : '这个分类下还没有胶囊'}
            </p>
          </div>
        ) : (
          <div className="capsules-grid">
            {capsules.map((capsule) => (
              <CapsuleCard
                key={capsule.id}
                capsule={capsule}
                onOpen={handleOpenCapsule}
                onDelete={handleDeleteCapsule}
              />
            ))}
          </div>
        )}
      </main>

      <button
        className="fab-create"
        onClick={() => setShowForm(true)}
        title="创建新胶囊"
      >
        <span className="fab-icon">+</span>
      </button>

      <CapsuleForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
      />

      <CapsuleDetail
        capsule={selectedCapsule}
        isOpen={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedCapsule(null);
        }}
        onOpenCapsule={openCapsule}
      />

      {unlockNotification.length > 0 && (
        <div className="unlock-notification">
          <div className="notification-content">
            <div className="notification-icon">🎉</div>
            <div className="notification-text">
              <h4>有 {unlockNotification.length} 颗胶囊已解锁！</h4>
              <p>快去打开看看来自过去的讯息吧</p>
            </div>
            <button className="notification-close" onClick={closeUnlockNotification}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
